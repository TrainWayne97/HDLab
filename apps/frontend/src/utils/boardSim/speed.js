// Simulated clock of the board: free value with unit, stepping in a 1-2-5 series.
// 0 Hz stands for "Max" (as fast as the browser can).

export const MIN_HZ = 0.001;
export const MAX_HZ = 100_000_000;

export const SPEED_UNITS = [
  { id: 'MHz', factor: 1e6 },
  { id: 'kHz', factor: 1e3 },
  { id: 'Hz', factor: 1 },
  { id: 'mHz', factor: 1e-3 },
];

// 1 mHz, 2 mHz, 5 mHz, 10 mHz ... 50 MHz, 100 MHz
export const SPEED_SERIES = [];
for (let exp = -3; exp <= 8; exp++) {
  for (const mantissa of [1, 2, 5]) {
    const hz = Number((mantissa * 10 ** exp).toPrecision(3));
    if (hz <= MAX_HZ) SPEED_SERIES.push(hz);
  }
}

/** Largest unit in which `hz` is at least 1 (3 Hz -> Hz, 2500 Hz -> kHz, 0.5 Hz -> mHz). */
export function unitFor(hz) {
  return SPEED_UNITS.find(u => hz >= u.factor * 0.9999999) ?? SPEED_UNITS[SPEED_UNITS.length - 1];
}

/** Value in `unit`, rounded so floating point noise disappears (0.30000000000000004 -> 0.3). */
export function valueIn(hz, unitId) {
  const unit = SPEED_UNITS.find(u => u.id === unitId) ?? SPEED_UNITS[2];
  return Number((hz / unit.factor).toPrecision(9));
}

/**
 * Parses an entered value ("2,5" or "2.5") in the given unit.
 * @returns {number|null} Hz, clamped to MIN_HZ..MAX_HZ, or null if not a positive number
 */
export function parseSpeed(text, unitId) {
  const unit = SPEED_UNITS.find(u => u.id === unitId);
  const value = Number(String(text).trim().replace(',', '.'));
  if (!unit || !Number.isFinite(value) || value <= 0) return null;
  return Math.min(MAX_HZ, Math.max(MIN_HZ, Number((value * unit.factor).toPrecision(9))));
}

/**
 * Next value of the 1-2-5 series up (dir = 1) or down (dir = -1). Values between series
 * steps move to the neighbouring step (3 Hz -> 5 Hz / 2 Hz). Above the series comes "Max" (0).
 */
export function stepSpeed(hz, dir) {
  if (hz === 0) return dir > 0 ? 0 : SPEED_SERIES[SPEED_SERIES.length - 1];
  if (dir > 0) return SPEED_SERIES.find(v => v > hz * (1 + 1e-9)) ?? 0;
  return [...SPEED_SERIES].reverse().find(v => v < hz * (1 - 1e-9)) ?? SPEED_SERIES[0];
}
