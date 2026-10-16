// Basys3 board: maps the top module's ports to the board's I/O by name, as in Digilent's
// Basys3 master XDC (clk, sw[15:0], led[15:0], seg[6:0], dp, an[3:0], btnC/U/L/R/D).
// Names are compared case-insensitively; a few common variants are accepted as well.

export const BASYS3_CLOCK_HZ = 100_000_000;
export const NUM_SWITCHES = 16;
export const NUM_LEDS = 16;
export const NUM_DIGITS = 4;
export const BUTTONS = ['btnU', 'btnL', 'btnC', 'btnR', 'btnD'];

const ALIASES = {
  clk: ['clk', 'clk100mhz', 'clk_100mhz', 'clock', 'sysclk', 'sys_clk', 'clk_i'],
  sw: ['sw', 'sws', 'switch', 'switches', 'sw_i'],
  led: ['led', 'leds', 'led_o'],
  seg: ['seg', 'segs', 'segment', 'segments', 'seg_o'],
  dp: ['dp', 'dp_o'],
  an: ['an', 'anode', 'anodes', 'an_o'],
  btnU: ['btnu', 'btn_u', 'btnup'],
  btnL: ['btnl', 'btn_l', 'btnleft'],
  btnC: ['btnc', 'btn_c', 'btncenter'],
  btnR: ['btnr', 'btn_r', 'btnright'],
  btnD: ['btnd', 'btn_d', 'btndown'],
};

// Bit positions in the packed key of observed outputs (see compileNetlist's `observe`)
export const KEY_LED = 0; // led[0..15]
export const KEY_SEG = 16; // seg[0..6] = a..g, bit 23 = dp
export const KEY_AN = 24; // an[0..3]

function findPort(ports, role) {
  const names = Object.keys(ports);
  return names.find(n => ALIASES[role].includes(n.toLowerCase())) ?? null;
}

/**
 * Finds the board signals among the top module's ports.
 * @param {{ inputs: Object, outputs: Object }} ports - port lists of the netlist (name -> { width })
 * @returns {{ clock: string|null, inputs: Object, outputs: Object, observe: Array, unmapped: string[] }}
 *   inputs: role -> port name (sw, btnU, ...), outputs: role -> port name (led, seg, dp, an)
 */
export function mapBasys3Ports({ inputs, outputs }) {
  const mappedIn = {};
  for (const role of ['clk', 'sw', ...BUTTONS]) {
    const name = findPort(inputs, role);
    if (name) mappedIn[role] = name;
  }
  const mappedOut = {};
  for (const role of ['led', 'seg', 'dp', 'an']) {
    const name = findPort(outputs, role);
    if (name) mappedOut[role] = name;
  }

  // Active-low outputs (segments, decimal point, anodes) default to "off" = 1 when missing
  const observe = [];
  for (let i = 0; i < NUM_LEDS; i++) observe.push({ port: mappedOut.led, bit: i, dflt: 0 });
  for (let i = 0; i < 7; i++) observe.push({ port: mappedOut.seg, bit: i, dflt: 1 });
  // Some designs use an 8-bit seg with the decimal point as seg[7]
  const segWidth = mappedOut.seg ? outputs[mappedOut.seg].width : 0;
  if (mappedOut.dp) observe.push({ port: mappedOut.dp, bit: 0, dflt: 1 });
  else observe.push({ port: segWidth >= 8 ? mappedOut.seg : undefined, bit: 7, dflt: 1 });
  for (let i = 0; i < NUM_DIGITS; i++) observe.push({ port: mappedOut.an, bit: i, dflt: 1 });

  const used = new Set([...Object.values(mappedIn), ...Object.values(mappedOut)]);
  const unmapped = [...Object.keys(inputs), ...Object.keys(outputs)].filter(n => !used.has(n));

  const { clk, ...boardInputs } = mappedIn;
  return { clock: clk ?? null, inputs: boardInputs, outputs: mappedOut, observe, unmapped };
}
