// VCD parsing and value formatting for the waveform viewer.

const TIME_UNITS = ['fs', 'ps', 'ns', 'us', 'ms', 's'];

export function parseVcd(text) {
  const lines = text.split(/\r?\n/);
  const scopes = [];
  const signals = [];
  // VCD id code -> names already listed for it
  const namesById = new Map();
  const events = new Map();
  let time = 0;
  let maxTimestamp = 0;
  let inDefs = true;

  // "$timescale 1ps $end" may be spread over several lines.
  const timescaleMatch = text.slice(0, 4000).match(/\$timescale\s+(\d+)\s*([munpf]?s)\s+\$end/);
  const timescale = timescaleMatch
    ? { magnitude: Number(timescaleMatch[1]) || 1, unit: timescaleMatch[2] }
    : { magnitude: 1, unit: 'ns' };

  const ensureEventList = id => {
    if (!events.has(id)) events.set(id, []);
    return events.get(id);
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('$scope')) {
      const parts = line.split(/\s+/);
      if (parts[2]) scopes.push(parts[2]);
      continue;
    }

    if (line.startsWith('$upscope')) {
      scopes.pop();
      continue;
    }

    if (line.startsWith('$var')) {
      const parts = line.split(/\s+/);
      const width = Number(parts[2]) || 1;
      const id = parts[3];
      const range = parts[5] && parts[5].startsWith('[') ? parts[5] : '';
      const name = (parts[4] || id) + range;
      // The same net is declared once per hierarchy level it passes through (testbench
      // signal, DUT port, ...): list it once, under its outermost scope. Differently named
      // signals can share an id too (the dumper merges identical ones) - those stay separate.
      if (!namesById.has(id)) namesById.set(id, new Set());
      if (!namesById.get(id).has(name)) {
        namesById.get(id).add(name);
        const fullName = [...scopes, name].join('.');
        signals.push({ key: fullName, id, name: fullName, shortName: name, scope: scopes.join('.'), width });
        ensureEventList(id);
      }
      continue;
    }

    if (line.startsWith('$enddefinitions')) {
      inDefs = false;
      continue;
    }

    if (line.startsWith('#')) {
      const t = Number(line.slice(1));
      if (!Number.isNaN(t)) {
        time = t;
        if (t > maxTimestamp) maxTimestamp = t;
      }
      continue;
    }

    if (inDefs) continue;

    if (/^[01xXzZ].+/.test(line)) {
      const value = line[0].toLowerCase();
      const id = line.slice(1).trim();
      if (!namesById.has(id)) continue;
      ensureEventList(id).push({ time, value });
      continue;
    }

    const vecMatch = line.match(/^b([01xXzZ]+)\s+(\S+)$/);
    if (vecMatch) {
      const value = vecMatch[1].toLowerCase();
      const id = vecMatch[2];
      if (!namesById.has(id)) continue;
      ensureEventList(id).push({ time, value });
    }
  }

  // Declaration order: that is the order of the ports/signals in the source.
  const tracedSignals = signals
    .map(sig => ({ ...sig, events: events.get(sig.id) || [] }))
    .filter(sig => sig.events.length > 0);

  let maxTime = 0;
  for (const sig of tracedSignals) {
    const last = sig.events[sig.events.length - 1];
    if (last && last.time > maxTime) maxTime = last.time;
  }

  // Use the final VCD timestamp as timeline end so the last signal level stays visible.
  if (maxTimestamp > maxTime) {
    maxTime = maxTimestamp;
  }

  // VCD dumpers only emit a new "#<time>" marker when a value actually changes, so if
  // nothing changes after the last event, the file ends right there and the final segment
  // would render with zero width. Pad the timeline by the most recent inter-event gap so
  // the last segment gets a similar width to the one before it instead of collapsing.
  const distinctTimes = Array.from(new Set([0, ...Array.from(events.values()).flatMap(list => list.map(ev => ev.time))]))
    .sort((a, b) => a - b);
  if (distinctTimes.length >= 2 && distinctTimes[distinctTimes.length - 1] >= maxTime) {
    const lastGap = distinctTimes[distinctTimes.length - 1] - distinctTimes[distinctTimes.length - 2];
    if (lastGap > 0) maxTime += lastGap;
  }

  return {
    signals: tracedSignals,
    maxTime: Math.max(maxTime, 1),
    timescale,
  };
}

/** Index of the last event at or before `time`, or -1 if the signal has no value yet. */
export function findEventIndex(events, time) {
  let lo = 0;
  let hi = events.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (events[mid].time <= time) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

/** Formats a bus value; `radix` is 'hex' | 'dec' | 'bin'. Single bits are returned as-is. */
export function formatWaveValue(value, width, radix = 'hex') {
  if (!value) return '';
  if (width <= 1) return value;
  if (!/^[01]+$/.test(value)) return /^x+$/.test(value) ? 'x' : /^z+$/.test(value) ? 'z' : value;
  if (radix === 'bin') return `0b${value.padStart(width, '0')}`;

  try {
    const n = BigInt(`0b${value}`);
    if (radix === 'dec') return n.toString(10);
    const hexLen = Math.max(1, Math.ceil(width / 4));
    return `0x${n.toString(16).toUpperCase().padStart(hexLen, '0')}`;
  } catch {
    return value;
  }
}

/**
 * Picks a display unit for a timeline that ends at `maxTime` (in VCD ticks), so labels
 * read "35 ns" instead of "35000 ps". Returns the factor from ticks to that unit.
 */
export function pickTimeUnit(timescale, maxTime) {
  let index = Math.max(0, TIME_UNITS.indexOf(timescale.unit));
  let factor = timescale.magnitude;
  while (maxTime * factor >= 10000 && index < TIME_UNITS.length - 1) {
    factor /= 1000;
    index += 1;
  }
  return { unit: TIME_UNITS[index], factor };
}

/** Formats VCD ticks in the unit chosen by pickTimeUnit, e.g. "35.1 ns". */
export function formatTime(ticks, { unit, factor }, digits = 3) {
  const value = ticks * factor;
  return `${Number(value.toFixed(digits))} ${unit}`;
}
