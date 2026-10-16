// Compiles a flattened Yosys JSON netlist (see the "board" flow in the sim container) into
// JavaScript source for a fast, cycle-based two-state simulation that runs in the browser.
//
// Every cell output becomes a variable (Number up to 32 bit, BigInt above), combinational
// cells are evaluated in topological order, flip-flops and memory writes update on clock
// edges. Derived clocks (e.g. `always @(posedge clk_div)`) work: after flip-flops fire,
// the logic is re-evaluated and clocks are checked again until nothing changes any more.
// X/Z are treated as 0.
//
// Expected netlist: `proc; flatten; memory -nomap -nordff; opt; dffunmap` leaves
// $dff, $adff, $aldff, $dffsr, $dlatch and $mem_v2 as the only stateful cells.
// Asynchronous resets act immediately (not only at the next clock edge), so a short
// reset pulse also resets flip-flops clocked by a slow derived clock.
//
// The generated code only contains numbers and generated identifiers - never names or
// strings from the netlist, which is user-controlled.

const MAX_CELLS = 200000;
const MAX_MEM_WORDS = 1 << 20;
const MAX_BMUX_SEL = 10;
// Statements per generated function: V8 doesn't optimize very large functions
const CHUNK = 400;
// Re-evaluations after a clock edge before the design counts as oscillating
const MAX_SETTLE = 1000;

export class NetlistError extends Error {}

// ---------------------------------------------------------------------------
// Parameters (write_json -compat-int: small ints as numbers, others as bit strings)

function paramNum(cell, name, dflt = 0) {
  const v = cell.parameters?.[name];
  if (v === undefined) return dflt;
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && /^[01xz]+$/i.test(v)) return parseInt(v.replace(/[xz]/gi, '0'), 2);
  const n = Number(v);
  return Number.isFinite(n) ? n : dflt;
}

/** Parameter as bit string, LSB first ("x"/"z" -> "0"). */
function paramBitsLsb(cell, name, width) {
  const v = cell.parameters?.[name];
  let msbFirst;
  if (typeof v === 'number') msbFirst = (v >>> 0).toString(2);
  else if (typeof v === 'string') msbFirst = v.replace(/[^01]/g, '0');
  else msbFirst = '';
  const lsb = msbFirst.split('').reverse().join('');
  return lsb.padEnd(width, '0').slice(0, width);
}

const bitsToBig = lsb => {
  let v = 0n;
  for (let i = lsb.length - 1; i >= 0; i--) v = (v << 1n) | (lsb[i] === '1' ? 1n : 0n);
  return v;
};

// ---------------------------------------------------------------------------
// Expression helpers. An expression is { code, w, big } with an unsigned value of w bits;
// big expressions (w > 32) are BigInts.

const isBig = w => w > 32;
const numMask = w => (w >= 32 ? 0xffffffff : 2 ** w - 1);
const bigLit = v => `${v}n`;

/** Truncates a Number expression (any integer, also negative) to w bits. */
function truncN(code, w) {
  if (w >= 32) return `((${code})>>>0)`;
  return `((${code})&${numMask(w)})`;
}

function zero(w) {
  return { code: isBig(w) ? '0n' : '0', w, big: isBig(w) };
}

/** Extends (zero/sign) or truncates `e` to width `to`. */
function ext(e, to, signed = false) {
  const toBig = isBig(to);
  if (e.w === 0) return zero(to);
  if (to <= e.w) {
    if (to === e.w) return e;
    if (!e.big) return { code: truncN(e.code, to), w: to, big: false };
    if (toBig) return { code: `BigInt.asUintN(${to},${e.code})`, w: to, big: true };
    return { code: `Number(BigInt.asUintN(${to},${e.code}))`, w: to, big: false };
  }
  if (!signed) {
    if (!e.big && toBig) return { code: `BigInt(${e.code})`, w: to, big: true };
    return { code: e.code, w: to, big: toBig };
  }
  if (!e.big) {
    const s = sval(e);
    if (!toBig) return { code: truncN(s, to), w: to, big: false };
    return { code: `BigInt.asUintN(${to},BigInt(${s}))`, w: to, big: true };
  }
  return { code: `BigInt.asUintN(${to},BigInt.asIntN(${e.w},${e.code}))`, w: to, big: true };
}

/** Signed interpretation of `e` (Number int32 or BigInt). */
function sval(e) {
  if (e.big) return `BigInt.asIntN(${e.w},${e.code})`;
  if (e.w >= 32) return `((${e.code})|0)`;
  const k = 32 - e.w;
  return `(((${e.code})<<${k})>>${k})`;
}

/** Result of a computation in the domain of width W, truncated/converted to w. */
function result(code, W, w) {
  if (isBig(W)) {
    if (isBig(w)) return `BigInt.asUintN(${w},${code})`;
    return `Number(BigInt.asUintN(${w},${code}))`;
  }
  const t = truncN(code, Math.min(W, w));
  return isBig(w) ? `BigInt(${t})` : t;
}

const boolTo = (cond, w) => (isBig(w) ? `((${cond})?1n:0n)` : `((${cond})?1:0)`);
const nonZero = e => (e.big ? `(${e.code}!==0n)` : `(${e.code}!==0)`);

// ---------------------------------------------------------------------------

const COMB_TYPES = new Set([
  '$not', '$pos', '$neg', '$buf',
  '$reduce_and', '$reduce_or', '$reduce_xor', '$reduce_xnor', '$reduce_bool', '$logic_not',
  '$and', '$or', '$xor', '$xnor', '$logic_and', '$logic_or',
  '$add', '$sub', '$mul', '$div', '$mod', '$divfloor', '$modfloor', '$pow',
  '$lt', '$le', '$eq', '$ne', '$eqx', '$nex', '$ge', '$gt',
  '$shl', '$shr', '$sshl', '$sshr', '$shift', '$shiftx',
  '$mux', '$pmux', '$bmux', '$demux', '$bwmux', '$tribuf',
  '$slice', '$concat', '$equiv', '$initstate', '$dlatch',
]);
// Cells without effect on the simulated logic
const IGNORED_TYPES = new Set([
  '$scopeinfo', '$print', '$check', '$assert', '$assume', '$cover', '$live', '$fair',
  '$specify2', '$specify3', '$specrule', '$meminit', '$meminit_v2',
]);
const FF_TYPES = new Set(['$dff', '$adff', '$aldff', '$dffsr']);

function topModule(netlist) {
  const entries = Object.entries(netlist?.modules || {});
  if (entries.length === 0) throw new NetlistError('Netlist enthält kein Modul.');
  const top = entries.find(([, m]) => Number(m.attributes?.top) === 1) || entries[0];
  return { name: top[0], mod: top[1] };
}

/** Ports of the netlist's top module: { inputs, outputs } as name -> { width }. */
export function netlistPorts(netlist) {
  const { mod } = topModule(netlist);
  const inputs = {};
  const outputs = {};
  for (const [name, port] of Object.entries(mod.ports || {})) {
    (port.direction === 'output' ? outputs : inputs)[name] = { width: port.bits.length };
  }
  return { inputs, outputs };
}

/**
 * @param {object} netlist - Yosys JSON
 * @param {object} opts
 * @param {string|null} opts.clock - name of the input port driven by the board clock
 * @param {Array<{port: string, bit: number, dflt: number}>} opts.observe - output bits packed
 *   into the "key" (max. 31 bits); missing ports/bits use `dflt`
 * @returns {{ source: string, memInit: Array, inputs: Object, outputs: Object, stats: Object }}
 */
export function compileNetlist(netlist, { clock = null, observe = [] } = {}) {
  const { name: topName, mod } = topModule(netlist);
  const cells = Object.entries(mod.cells || {});
  if (cells.length > MAX_CELLS) throw new NetlistError(`Design zu groß für die Board-Simulation (${cells.length} Zellen).`);
  if (observe.length > 31) throw new NetlistError('Zu viele beobachtete Ausgänge.');

  // ---- signals and drivers
  const sigs = []; // { width, init: bigint }
  const driver = new Map(); // net bit -> { sig, off }
  const addSig = (bits, owner) => {
    const id = sigs.length;
    sigs.push({ width: bits.length, init: 0n, owner });
    bits.forEach((b, off) => {
      if (typeof b !== 'number') return;
      if (driver.has(b)) throw new NetlistError(`Netz mit mehreren Treibern (Zelle ${owner}).`);
      driver.set(b, { sig: id, off });
    });
    return id;
  };

  const inputs = {};
  const outputs = {};
  for (const [name, port] of Object.entries(mod.ports || {})) {
    if (port.direction === 'input' || port.direction === 'inout') {
      inputs[name] = { index: Object.keys(inputs).length, width: port.bits.length, sig: addSig(port.bits, `Eingang ${name}`) };
    } else {
      outputs[name] = { width: port.bits.length, bits: port.bits };
    }
  }

  // ---- cells
  const unsupported = new Map();
  const comb = []; // { cell, type, out: sig }
  const dffs = []; // { cell, q: sig }
  const mems = []; // { cell, rd: [sig], ... }
  for (const [name, cell] of cells) {
    const type = cell.type;
    const conn = cell.connections || {};
    if (IGNORED_TYPES.has(type)) continue;
    if (type === '$mem_v2') {
      const width = paramNum(cell, 'WIDTH');
      const nrd = paramNum(cell, 'RD_PORTS');
      const rd = [];
      for (let i = 0; i < nrd; i++) rd.push(addSig(conn.RD_DATA.slice(i * width, (i + 1) * width), name));
      mems.push({ name, cell, rd });
    } else if (FF_TYPES.has(type)) {
      dffs.push({ name, cell, type, q: addSig(conn.Q, name) });
    } else if (COMB_TYPES.has(type)) {
      const outPort = type === '$dlatch' ? 'Q' : 'Y';
      comb.push({ name, cell, type, out: addSig(conn[outPort] || [], name) });
    } else {
      unsupported.set(type, (unsupported.get(type) || 0) + 1);
    }
  }
  if (unsupported.size > 0) {
    const list = [...unsupported].map(([t, n]) => `${t.startsWith('$') ? t : `Modul ${t}`} (${n}×)`).join(', ');
    throw new NetlistError(`Nicht unterstützte Elemente im Design: ${list}`);
  }

  // ---- initial values (init attributes on flip-flop outputs)
  for (const net of Object.values(mod.netnames || {})) {
    const init = net.attributes?.init;
    if (init === undefined) continue;
    const lsb = typeof init === 'number' ? (init >>> 0).toString(2).split('').reverse().join('') : String(init).split('').reverse().join('');
    net.bits.forEach((b, i) => {
      const d = driver.get(b);
      if (!d || lsb[i] !== '1') return;
      sigs[d.sig].init |= 1n << BigInt(d.off);
    });
  }

  // ---- gathering bits into expressions
  let undrivenBits = 0;
  const usedSigs = new Set(); // signals read by combinational code (for clock fast path)
  const drv = b => {
    if (typeof b !== 'number') return null;
    const d = driver.get(b);
    if (!d) undrivenBits++;
    return d || null;
  };

  function gather(bits, track = usedSigs) {
    const w = bits.length;
    const big = isBig(w);
    if (w === 0) return zero(0);
    const d0 = drv(bits[0]);
    if (d0 && d0.off === 0 && sigs[d0.sig].width === w
        && bits.every((b, i) => { const d = driver.get(b); return d && d.sig === d0.sig && d.off === i; })) {
      track?.add(d0.sig);
      return { code: `s${d0.sig}`, w, big };
    }
    let constVal = 0n;
    const parts = [];
    for (let i = 0; i < w;) {
      const d = i === 0 ? d0 : drv(bits[i]);
      if (!d) {
        if (bits[i] === '1') constVal |= 1n << BigInt(i);
        i++;
        continue;
      }
      let j = i + 1;
      while (j < w) {
        const e = driver.get(bits[j]);
        if (!e || e.sig !== d.sig || e.off !== d.off + (j - i)) break;
        j++;
      }
      parts.push({ sig: d.sig, off: d.off, len: j - i, pos: i });
      track?.add(d.sig);
      i = j;
    }
    const codes = parts.map(({ sig, off, len, pos }) => {
      const sw = sigs[sig].width;
      const srcBig = isBig(sw);
      let piece;
      if (!srcBig) {
        piece = off ? `(s${sig}>>>${off})` : `s${sig}`;
        if (len < sw - off) piece = `(${piece}&${numMask(len)})`;
        if (!big) return pos ? `(${piece}<<${pos})` : piece;
        return pos ? `(BigInt(${piece})<<${pos}n)` : `BigInt(${piece})`;
      }
      piece = off ? `(s${sig}>>${off}n)` : `s${sig}`;
      if (len < sw - off) piece = `(${piece}&${bigLit((1n << BigInt(len)) - 1n)})`;
      if (big) return pos ? `(${piece}<<${pos}n)` : piece;
      piece = `Number(${piece})`;
      return pos ? `(${piece}<<${pos})` : piece;
    });
    if (constVal !== 0n || codes.length === 0) codes.push(big ? bigLit(constVal) : String(Number(constVal)));
    let code = codes.length === 1 ? codes[0] : `(${codes.join('|')})`;
    if (!big && w === 32 && codes.length > 1) code = `(${code}>>>0)`;
    else if (!big && w === 32 && parts.length === 1 && parts[0].pos + parts[0].len === 32 && parts[0].pos > 0) code = `(${code}>>>0)`;
    return { code, w, big };
  }

  /** Single bit as Number 0/1. */
  function bit(b, track = usedSigs) {
    const d = drv(b);
    if (!d) return b === '1' ? '1' : '0';
    track?.add(d.sig);
    if (isBig(sigs[d.sig].width)) return `Number((s${d.sig}>>${d.off}n)&1n)`;
    if (sigs[d.sig].width === 1) return `s${d.sig}`;
    return `((s${d.sig}>>>${d.off})&1)`;
  }

  // ---- code for combinational cells
  const helpers = new Set();
  function combCode(node) {
    const { cell, type, out } = node;
    const c = cell.connections;
    const yw = sigs[out].width;
    const Y = `s${out}`;
    const as = !!paramNum(cell, 'A_SIGNED');
    const bs = !!paramNum(cell, 'B_SIGNED');
    const A = () => gather(c.A);
    const B = () => gather(c.B);
    const assign = code => `${Y}=${code};`;

    switch (type) {
      case '$buf': case '$pos': case '$equiv':
        return assign(ext(A(), yw, as).code);
      case '$not': case '$neg': {
        const a = ext(A(), yw, as);
        const op = type === '$not' ? '~' : '-';
        return assign(result(`${op}${a.code}`, yw, yw));
      }
      case '$reduce_and': {
        const a = A();
        const ones = a.big ? bigLit((1n << BigInt(a.w)) - 1n) : String(numMask(a.w) >>> 0);
        return assign(boolTo(`${a.code}===${ones}`, yw));
      }
      case '$reduce_or': case '$reduce_bool':
        return assign(boolTo(nonZero(A()), yw));
      case '$logic_not':
        return assign(boolTo(`!${nonZero(A())}`, yw));
      case '$reduce_xor': case '$reduce_xnor': {
        const a = A();
        helpers.add(a.big ? 'parB' : 'par');
        const p = `${a.big ? 'parB' : 'par'}(${a.code})`;
        return assign(boolTo(type === '$reduce_xor' ? p : `!${p}`, yw));
      }
      case '$logic_and': case '$logic_or':
        return assign(boolTo(`${nonZero(A())}${type === '$logic_and' ? '&&' : '||'}${nonZero(B())}`, yw));
      case '$and': case '$or': case '$xor': case '$xnor': case '$add': case '$sub': case '$mul': {
        const signed = as && bs;
        const a = ext(A(), yw, signed);
        const b = ext(B(), yw, signed);
        let code;
        if (type === '$mul' && !isBig(yw)) code = `Math.imul(${a.code},${b.code})`;
        else {
          const op = { $and: '&', $or: '|', $xor: '^', $xnor: '^', $add: '+', $sub: '-', $mul: '*' }[type];
          code = `(${a.code}${op}${b.code})`;
          if (type === '$xnor') code = `~${code}`;
        }
        return assign(result(code, yw, yw));
      }
      case '$div': case '$mod': case '$divfloor': case '$modfloor': {
        const signed = as && bs;
        const W = Math.max(c.A.length, c.B.length, yw);
        const a = ext(A(), W, signed);
        const b = ext(B(), W, signed);
        const big = isBig(W);
        const sa = signed ? sval(a) : a.code;
        const sb = signed ? sval(b) : b.code;
        const z = big ? '0n' : '0';
        // Division by zero is undefined (x) in Verilog; like Verilator (the regular HDLab
        // simulation) both quotient and remainder are 0
        let q;
        if (big) {
          helpers.add('fdivB');
          q = {
            $div: `(${sb}===${z}?0n:${sa}/${sb})`,
            $mod: `(${sb}===${z}?0n:${sa}%${sb})`,
            $divfloor: `(${sb}===${z}?0n:fdivB(${sa},${sb}))`,
            $modfloor: `(${sb}===${z}?0n:${sa}-${sb}*fdivB(${sa},${sb}))`,
          }[type];
        } else {
          q = {
            $div: `(${sb}===0?0:Math.trunc(${sa}/${sb}))`,
            $mod: `(${sb}===0?0:${sa}%${sb})`,
            $divfloor: `(${sb}===0?0:Math.floor(${sa}/${sb}))`,
            $modfloor: `(${sb}===0?0:${sa}-${sb}*Math.floor(${sa}/${sb}))`,
          }[type];
        }
        return assign(result(q, W, yw));
      }
      case '$pow': {
        const a = ext(A(), yw, as);
        const b = ext(B(), Math.max(c.B.length, 1), false);
        helpers.add('powB');
        const ab = a.big ? a.code : `BigInt(${a.code})`;
        const bb = b.big ? b.code : `BigInt(${b.code})`;
        return assign(result(`powB(${ab},${bb},${yw})`, 64 + yw, yw));
      }
      case '$lt': case '$le': case '$gt': case '$ge': case '$eq': case '$ne': case '$eqx': case '$nex': {
        const signed = as && bs;
        const W = Math.max(c.A.length, c.B.length, 1);
        const a = ext(A(), W, signed);
        const b = ext(B(), W, signed);
        const op = { $lt: '<', $le: '<=', $gt: '>', $ge: '>=', $eq: '===', $ne: '!==', $eqx: '===', $nex: '!==' }[type];
        // Equality doesn't depend on signedness once both sides are extended the same way
        const useSigned = signed && op !== '===' && op !== '!==';
        const l = useSigned ? sval(a) : a.code;
        const r = useSigned ? sval(b) : b.code;
        return assign(boolTo(`${l}${op}${r}`, yw));
      }
      case '$shl': case '$sshl': case '$shr': case '$sshr': case '$shift': case '$shiftx': {
        const W = Math.max(c.A.length, yw);
        const a = ext(A(), W, as);
        const bRaw = B();
        const big = isBig(W);
        // Shift amount as a Number, capped to W (larger shifts give the same result)
        const amount = e => (e.big ? `(${e.code}>${W}n?${W}:Number(${e.code}))` : e.code);
        const left = sh => (big
          ? `(${sh}>=${W}?0n:(${a.code}<<BigInt(${sh})))`
          : `(${sh}>=${W}?0:(${a.code}<<${sh}))`);
        const right = (sh, arith) => {
          if (arith) {
            const s = sval(a);
            return big
              ? `(${s}>>BigInt(${sh}>=${W}?${W}:${sh}))`
              : `(${s}>>(${sh}>=${W}?31:${sh}))`;
          }
          return big ? `(${sh}>=${W}?0n:(${a.code}>>BigInt(${sh})))` : `(${sh}>=${W}?0:(${a.code}>>>${sh}))`;
        };
        let code;
        if (type === '$shl' || type === '$sshl') code = left(amount(bRaw));
        else if (type === '$shr') code = right(amount(bRaw), false);
        else if (type === '$sshr') code = right(amount(bRaw), as);
        else if (bs) {
          // $shift/$shiftx with signed B: negative amounts shift left
          const sb = bRaw.big ? `(${sval(bRaw)})` : sval(bRaw);
          const neg = bRaw.big ? `(${sb}<0n)` : `(${sb}<0)`;
          const absAmt = bRaw.big
            ? `(-${sb}>${W}n?${W}:Number(-${sb}))`
            : `(-${sb})`;
          code = `(${neg}?${left(absAmt)}:${right(amount(bRaw), false)})`;
        } else code = right(amount(bRaw), false);
        return assign(result(code, W, yw));
      }
      case '$mux': {
        const s = bit(c.S[0]);
        return assign(`(${s}?${gather(c.B).code}:${gather(c.A).code})`);
      }
      case '$pmux': {
        const w = paramNum(cell, 'WIDTH');
        const n = c.S.length;
        // Flat ifs (no deep nesting), the lowest select bit wins
        const lines = [assign(gather(c.A).code)];
        for (let i = n - 1; i >= 0; i--) {
          lines.push(`if(${bit(c.S[i])})${Y}=${gather(c.B.slice(i * w, (i + 1) * w)).code};`);
        }
        return lines.join('\n');
      }
      case '$bmux': {
        const w = paramNum(cell, 'WIDTH');
        const sw = c.S.length;
        if (sw > MAX_BMUX_SEL) throw new NetlistError('Multiplexer mit zu vielen Eingängen ($bmux).');
        const s = gather(c.S);
        const lines = [`switch(${s.code}){`];
        for (let i = 0; i < 1 << sw; i++) lines.push(`case ${i}:${Y}=${gather(c.A.slice(i * w, (i + 1) * w)).code};break;`);
        lines.push(`default:${Y}=${zero(yw).code};}`);
        return lines.join('\n');
      }
      case '$demux': {
        const w = paramNum(cell, 'WIDTH');
        const a = ext(gather(c.A), yw, false);
        const s = gather(c.S);
        if (isBig(yw)) return assign(`(${a.code}<<BigInt(${s.code}*${w}))`);
        return assign(truncN(`${a.code}<<(${s.code}*${w})`, yw));
      }
      case '$bwmux': {
        const a = gather(c.A);
        const b = gather(c.B);
        const s = gather(c.S);
        return assign(result(`((${a.code}&~${s.code})|(${b.code}&${s.code}))`, yw, yw));
      }
      case '$tribuf':
        return assign(`(${bit(c.EN[0])}?${gather(c.A).code}:${zero(yw).code})`);
      case '$slice': {
        const off = paramNum(cell, 'OFFSET');
        return assign(gather(c.A.slice(off, off + yw)).code);
      }
      case '$concat':
        return assign(gather([...c.A, ...c.B]).code);
      case '$initstate':
        return assign(zero(yw).code);
      case '$dlatch': {
        const en = bit(c.EN[0]);
        const pol = paramNum(cell, 'EN_POLARITY', 1);
        return `if(${en}===${pol ? 1 : 0})${Y}=${gather(c.D).code};`;
      }
      default:
        throw new NetlistError(`Interner Fehler: ${type}`);
    }
  }

  // Input bits of a combinational cell (for the dependency graph)
  function combInputs(node) {
    const c = node.cell.connections;
    if (node.type === '$dlatch') return [...c.EN, ...c.D];
    return Object.entries(c)
      .filter(([port]) => (node.cell.port_directions?.[port] ?? (port === 'Y' ? 'output' : 'input')) === 'input')
      .flatMap(([, bits]) => bits);
  }

  // ---- memories: async read ports are combinational nodes, the rest happens on clock edges
  const memInit = [];
  const memReadNodes = [];
  const clockActions = []; // { clk: bit, pol, sample: [], commit: [] }
  let tmpCount = 0;
  const tmp = () => `t${tmpCount++}`;

  mems.forEach((m, mi) => {
    const { cell } = m;
    const c = cell.connections;
    const width = paramNum(cell, 'WIDTH');
    const size = paramNum(cell, 'SIZE');
    const abits = paramNum(cell, 'ABITS');
    const offset = paramNum(cell, 'OFFSET');
    if (size > MAX_MEM_WORDS) throw new NetlistError(`Speicher zu groß für die Board-Simulation (${size} Wörter).`);
    if (abits > 32) throw new NetlistError('Speicher mit mehr als 32 Adressbits wird nicht unterstützt.');
    if (paramNum(cell, 'RD_WIDE_CONTINUATION') || paramNum(cell, 'WR_WIDE_CONTINUATION')) {
      throw new NetlistError('Breite Speicherports werden nicht unterstützt.');
    }
    const initBits = paramBitsLsb(cell, 'INIT', size * width);
    const words = isBig(width) ? new Array(size) : new Uint32Array(size);
    for (let i = 0; i < size; i++) {
      const v = bitsToBig(initBits.slice(i * width, (i + 1) * width));
      words[i] = isBig(width) ? v : Number(v);
    }
    memInit.push({ words, big: isBig(width) });
    const M = `m${mi}`;
    const zeroW = zero(width).code;
    // Addresses below OFFSET wrap to huge numbers and read as 0
    const index = a => (offset ? `((${a}-${offset})>>>0)` : a);
    const read = addrCode => `(${index(addrCode)}<${size}?${M}[${index(addrCode)}]:${zeroW})`;

    const nrd = paramNum(cell, 'RD_PORTS');
    const rdClkEn = paramBitsLsb(cell, 'RD_CLK_ENABLE', nrd);
    const rdClkPol = paramBitsLsb(cell, 'RD_CLK_POLARITY', nrd);
    const srstVal = paramBitsLsb(cell, 'RD_SRST_VALUE', nrd * width);
    for (let i = 0; i < nrd; i++) {
      const sig = m.rd[i];
      const addrBits = c.RD_ADDR.slice(i * abits, (i + 1) * abits);
      if (rdClkEn[i] !== '1') {
        memReadNodes.push({ out: sig, inputs: addrBits, mem: mi, addrBits, read });
        continue;
      }
      const arst = c.RD_ARST?.[i];
      if (arst !== undefined && arst !== '0') throw new NetlistError('Speicher-Leseports mit asynchronem Reset werden nicht unterstützt.');
      const t = tmp();
      const en = bit(c.RD_EN[i], null);
      const srst = bit(c.RD_SRST[i], null);
      const rv = bitsToBig(srstVal.slice(i * width, (i + 1) * width));
      const rvCode = isBig(width) ? bigLit(rv) : String(Number(rv));
      clockActions.push({
        clk: c.RD_CLK[i],
        pol: rdClkPol[i] === '1' ? 1 : 0,
        sample: [`${t}=${srst}?${rvCode}:(${en}?${read(gather(addrBits, null).code)}:s${sig});`],
        commit: [`s${sig}=${t};`],
      });
    }

    const nwr = paramNum(cell, 'WR_PORTS');
    const wrClkEn = paramBitsLsb(cell, 'WR_CLK_ENABLE', nwr);
    const wrClkPol = paramBitsLsb(cell, 'WR_CLK_POLARITY', nwr);
    for (let i = 0; i < nwr; i++) {
      if (wrClkEn[i] !== '1') throw new NetlistError('Asynchrone Speicher-Schreibports werden nicht unterstützt.');
      const enBits = c.WR_EN.slice(i * width, (i + 1) * width);
      const addr = gather(c.WR_ADDR.slice(i * abits, (i + 1) * abits), null).code;
      const data = gather(c.WR_DATA.slice(i * width, (i + 1) * width), null).code;
      const ta = tmp();
      const td = tmp();
      const te = tmp();
      const sameEn = enBits.every(b => b === enBits[0]);
      const sample = [`${ta}=${index(addr)};`];
      const commit = [];
      if (sameEn) {
        sample.push(`${te}=${bit(enBits[0], null)};`);
        sample.push(`${td}=${data};`);
        commit.push(`if(${te}&&${ta}<${size})${M}[${ta}]=${td};`);
      } else {
        const en = gather(enBits, null).code;
        sample.push(`${te}=${en};`);
        sample.push(`${td}=${data};`);
        const merged = isBig(width)
          ? `(${M}[${ta}]&~${te})|(${td}&${te})`
          : `((${M}[${ta}]&~${te})|(${td}&${te}))>>>0`;
        commit.push(`if(${ta}<${size})${M}[${ta}]=${merged};`);
      }
      clockActions.push({ clk: c.WR_CLK[0 + i], pol: wrClkPol[i] === '1' ? 1 : 0, sample, commit });
    }
  });

  // ---- flip-flops
  // Asynchronous set/reset/load: checked after every clock edge and logic change
  const asyncActions = [];
  for (const { cell, type, q } of dffs) {
    const c = cell.connections;
    const w = sigs[q].width;
    const t = tmp();
    clockActions.push({
      clk: c.CLK[0],
      pol: paramNum(cell, 'CLK_POLARITY', 1) ? 1 : 0,
      sample: [`${t}=${gather(c.D, null).code};`],
      commit: [`s${q}=${t};`],
    });
    const Q = `s${q}`;
    if (type === '$adff') {
      const rv = bitsToBig(paramBitsLsb(cell, 'ARST_VALUE', w));
      const rvCode = isBig(w) ? bigLit(rv) : String(Number(rv));
      const active = paramNum(cell, 'ARST_POLARITY', 1) ? 1 : 0;
      asyncActions.push(`if(${bit(c.ARST[0], null)}===${active}&&${Q}!==${rvCode}){${Q}=${rvCode};ch=true;}`);
    } else if (type === '$aldff') {
      const active = paramNum(cell, 'ALOAD_POLARITY', 1) ? 1 : 0;
      asyncActions.push(`if(${bit(c.ALOAD[0], null)}===${active}){const v=${gather(c.AD, null).code};if(${Q}!==v){${Q}=v;ch=true;}}`);
    } else if (type === '$dffsr') {
      if (isBig(w)) throw new NetlistError('Flip-Flops mit Set/Reset über 32 Bit werden nicht unterstützt.');
      // Active-high masks; reset has priority over set
      const mask = (bits, polParam) => {
        const g = gather(bits, null).code;
        return paramNum(cell, polParam, 1) ? g : truncN(`~${g}`, w);
      };
      asyncActions.push(`{const v=${truncN(`(${Q}|${mask(c.SET, 'SET_POLARITY')})&~${mask(c.CLR, 'CLR_POLARITY')}`, w)};if(${Q}!==v){${Q}=v;ch=true;}}`);
    }
  }

  // ---- topological order of the combinational logic
  const nodes = [
    ...comb.map(n => ({ ...n, inputs: combInputs(n) })),
    ...memReadNodes,
  ];
  const nodeOfSig = new Map(nodes.map((n, i) => [n.out, i]));
  const indeg = new Array(nodes.length).fill(0);
  const users = nodes.map(() => []);
  nodes.forEach((n, i) => {
    const deps = new Set();
    for (const b of n.inputs) {
      const d = typeof b === 'number' ? driver.get(b) : null;
      if (!d) continue;
      const j = nodeOfSig.get(d.sig);
      if (j !== undefined && !deps.has(j)) {
        deps.add(j);
        // A latch may feed back into its own enable/data: that is state, not a loop
        if (j === i && n.type === '$dlatch') continue;
        users[j].push(i);
        indeg[i]++;
      }
    }
  });
  const order = [];
  const queue = [];
  indeg.forEach((d, i) => d === 0 && queue.push(i));
  while (queue.length) {
    const i = queue.pop();
    order.push(i);
    for (const u of users[i]) if (--indeg[u] === 0) queue.push(u);
  }
  if (order.length !== nodes.length) {
    const looped = nodes.filter((_, i) => indeg[i] > 0).map(n => n.name).filter(Boolean).slice(0, 5);
    throw new NetlistError(`Kombinatorische Schleife im Design${looped.length ? ` (u.a. ${looped.join(', ')})` : ''}. Solche Schleifen kann die Board-Simulation nicht auswerten.`);
  }

  const combStatements = order.map(i => {
    const n = nodes[i];
    if (n.mem !== undefined) return `s${n.out}=${n.read(gather(n.addrBits).code)};`;
    return combCode(n);
  });

  // ---- clocks
  const clockSig = clock && inputs[clock] ? inputs[clock].sig : null;
  const clocks = new Map(); // key -> { idx, code }
  const groups = new Map(); // `${idx}:${pol}` -> { idx, pol, sample, commit }
  for (const a of clockActions) {
    if (typeof a.clk !== 'number' || !driver.has(a.clk)) continue; // constant clock never fires
    const d = driver.get(a.clk);
    const key = `${d.sig}:${d.off}`;
    if (!clocks.has(key)) clocks.set(key, { idx: clocks.size, code: bit(a.clk, null) });
    const idx = clocks.get(key).idx;
    const gk = `${idx}:${a.pol}`;
    if (!groups.has(gk)) groups.set(gk, { idx, pol: a.pol, sample: [], commit: [] });
    groups.get(gk).sample.push(...a.sample);
    groups.get(gk).commit.push(...a.commit);
  }
  const clockList = [...clocks.values()];
  const groupList = [...groups.values()];
  const edgeVar = g => `e${g.idx}${g.pol ? 'p' : 'n'}`;

  // ---- observed outputs (packed into one Number)
  const keyParts = observe.map(({ port, bit: i, dflt }, k) => {
    const b = outputs[port]?.bits?.[i];
    const code = b === undefined ? String(dflt ? 1 : 0) : bit(b);
    return code === '0' ? null : (k ? `(${code}<<${k})` : code);
  }).filter(Boolean);
  const keyCode = keyParts.length ? keyParts.join('|') : '0';

  const clkFeedsComb = clockSig !== null && usedSigs.has(clockSig);

  // ---- assemble
  const sigDecls = sigs.map((s, i) => `s${i}=${isBig(s.width) ? bigLit(s.init) : String(Number(s.init))}`);
  const lines = [];
  lines.push('"use strict";');
  if (helpers.has('par')) lines.push('function par(x){x^=x>>>16;x^=x>>>8;x^=x>>>4;x^=x>>>2;x^=x>>>1;return (x&1)===1;}');
  if (helpers.has('parB')) lines.push('function parB(x){let p=0;while(x){p^=Number(x&1n);x>>=1n;}return p===1;}');
  if (helpers.has('fdivB')) lines.push('function fdivB(a,b){const q=a/b;return (a%b!==0n&&((a<0n)!==(b<0n)))?q-1n:q;}');
  if (helpers.has('powB')) lines.push('function powB(a,b,w){const m=(1n<<BigInt(w))-1n;let r=1n;a&=m;while(b>0n){if(b&1n)r=(r*a)&m;a=(a*a)&m;b>>=1n;}return r;}');
  lines.push(`let ${sigDecls.length ? sigDecls.join(',') : '_u=0'};`);
  lines.push(`const INIT=[${sigs.map(s => (isBig(s.width) ? bigLit(s.init) : String(Number(s.init)))).join(',')}];`);
  memInit.forEach((m, i) => lines.push(`const m${i}=MEMINIT[${i}].big?MEMINIT[${i}].words.slice():new Uint32Array(MEMINIT[${i}].words);`));
  if (clockList.length) lines.push(`let ${clockList.map(cl => `p${cl.idx}=0`).join(',')};`);
  if (tmpCount) lines.push(`let ${Array.from({ length: tmpCount }, (_, i) => `t${i}=0`).join(',')};`);
  lines.push('let cyc=0,lastT=0,lastKey=0;');

  // comb() in chunks
  const chunkNames = [];
  for (let i = 0; i < combStatements.length; i += CHUNK) {
    const nm = `c${chunkNames.length}`;
    chunkNames.push(nm);
    lines.push(`function ${nm}(){\n${combStatements.slice(i, i + CHUNK).join('\n')}\n}`);
  }
  lines.push(`function comb(){${chunkNames.map(n => `${n}();`).join('')}}`);

  // edges(): detect clock edges, sample all triggered inputs, then commit
  const edgeLines = [];
  edgeLines.push('function edges(){let ch=false;');
  if (groupList.length) {
    clockList.forEach(cl => edgeLines.push(`const c${cl.idx}=${cl.code};`));
    groupList.forEach(g => edgeLines.push(`const ${edgeVar(g)}=${g.pol ? `c${g.idx}>p${g.idx}` : `c${g.idx}<p${g.idx}`};`));
    clockList.forEach(cl => edgeLines.push(`p${cl.idx}=c${cl.idx};`));
    edgeLines.push(`if(${groupList.map(edgeVar).join('||')}){`);
    groupList.forEach(g => edgeLines.push(`if(${edgeVar(g)}){${g.sample.join('')}}`));
    groupList.forEach(g => edgeLines.push(`if(${edgeVar(g)}){${g.commit.join('')}}`));
    edgeLines.push('ch=true;}');
  }
  edgeLines.push(...asyncActions);
  edgeLines.push('return ch;}');
  lines.push(edgeLines.join('\n'));

  lines.push(`function settle(){let n=0;while(edges()){comb();if(++n>${MAX_SETTLE})throw new Error("OSCILLATION");}}`);
  lines.push(`function key(){return ${keyCode};}`);
  lines.push('function note(){const k=key();if(k!==lastKey){change(lastKey,cyc-lastT);lastKey=k;lastT=cyc;}}');

  const clkVar = clockSig !== null ? `s${clockSig}` : null;
  const half = level => (clkVar
    ? `${clkVar}=${level};${clkFeedsComb ? 'comb();' : ''}settle();`
    : '');
  lines.push(`function run(n){for(let i=0;i<n;i++){${half(1)}${half(0)}cyc++;note();}}`);

  const setCases = Object.values(inputs).map(inp => {
    // Accepts Numbers and BigInts (rarely called, so the conversion doesn't matter)
    const val = isBig(inp.width) ? `BigInt.asUintN(${inp.width},BigInt(v))` : `Number(BigInt.asUintN(${inp.width},BigInt(v)))`;
    return `case ${inp.index}:s${inp.sig}=${val};break;`;
  });
  lines.push(`function setInput(i,v){switch(i){${setCases.join('')}}comb();settle();note();}`);
  lines.push(`function reset(){[${sigs.map((_, i) => `s${i}`).join(',')}]=INIT;`
    + memInit.map((m, i) => (m.big ? `for(let j=0;j<m${i}.length;j++)m${i}[j]=MEMINIT[${i}].words[j];` : `m${i}.set(MEMINIT[${i}].words);`)).join('')
    + `comb();${clockList.map(cl => `p${cl.idx}=${cl.code};`).join('')}settle();cyc=0;lastT=0;lastKey=key();}`);
  lines.push('function flush(){const d=cyc-lastT;lastT=cyc;return d;}');
  // All output ports in the order of `outputs` (debug panel, tests)
  lines.push(`function readOutputs(){return [${Object.values(outputs).map(o => gather(o.bits, null).code).join(',')}];}`);
  lines.push('reset();');
  lines.push('return {run,setInput,reset,flush,readOutputs,key:()=>lastKey,cycles:()=>cyc};');

  return {
    source: lines.join('\n'),
    memInit,
    inputs: Object.fromEntries(Object.entries(inputs).map(([n, v]) => [n, { index: v.index, width: v.width }])),
    outputs: Object.fromEntries(Object.entries(outputs).map(([n, v]) => [n, { width: v.width }])),
    stats: {
      top: topName,
      cells: nodes.length + dffs.length + mems.length,
      flipflops: dffs.reduce((sum, d) => sum + sigs[d.q].width, 0),
      memories: mems.length,
      clocks: clockList.length,
      undrivenBits,
      clockFeedsLogic: clkFeedsComb,
    },
  };
}

/** Instantiates compiled source. `change(key, cycles)` is called whenever the observed outputs change. */
export function instantiate({ source, memInit }, change) {
  // eslint-disable-next-line no-new-func
  return new Function('MEMINIT', 'change', source)(memInit, change);
}
