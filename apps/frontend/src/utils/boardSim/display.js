// Time-averaged brightness of the Basys3 LEDs and the multiplexed 7-segment display.
//
// The simulation reports how many clock cycles each combination of output values lasted
// (histogram of packed keys, see basys3.js). Brightness = share of time a LED/segment was on,
// so PWM-dimmed LEDs look dimmed and the display doesn't flicker while multiplexing.
//
// The simulation runs slower than the real 100 MHz, so one multiplexing period can take
// longer than a screen frame. A digit whose anode wasn't active in the averaging window keeps
// its last segments - but only as long as the eye would see it lit on the real board
// (PERSISTENCE_S of simulated time). A design that multiplexes too slowly flickers in the
// simulation as well, just like on the board.

import { BASYS3_CLOCK_HZ, KEY_AN, KEY_LED, KEY_SEG, NUM_DIGITS, NUM_LEDS } from './basys3';

// Longest dark time of a digit that still looks steadily lit (simulated time)
export const PERSISTENCE_S = 0.05;
// Averaging window in real time at most, keeps reactions (switch -> LED) snappy
const WINDOW_MS = 100;
// A digit needs to be active this many cycles in the window to update its segments;
// avoids flashing the previous digit's pattern right after the anodes switched
const MIN_ACTIVE_CYCLES = 256;
const MAX_FRAMES = 64;

export class DisplayAverager {
  constructor(clockHz = BASYS3_CLOCK_HZ) {
    this.persistenceCycles = PERSISTENCE_S * clockHz;
    this.reset();
  }

  reset() {
    this.frames = [];
    this.digitBright = Array.from({ length: NUM_DIGITS }, () => new Array(8).fill(0));
    this.digitLastActive = new Array(NUM_DIGITS).fill(-Infinity);
  }

  /**
   * Adds one frame of simulation.
   * @param {Map<number, number>} hist - packed output key -> cycles it was present
   * @param {number} endCycle - cycle counter at the end of the frame
   * @param {number} ms - real time the frame took
   */
  addFrame(hist, endCycle, ms) {
    let cycles = 0;
    const led = new Float64Array(NUM_LEDS);
    const act = new Float64Array(NUM_DIGITS);
    const on = Array.from({ length: NUM_DIGITS }, () => new Float64Array(8));
    for (const [key, n] of hist) {
      if (n <= 0) continue;
      cycles += n;
      for (let i = 0; i < NUM_LEDS; i++) if ((key >>> (KEY_LED + i)) & 1) led[i] += n;
      for (let d = 0; d < NUM_DIGITS; d++) {
        if ((key >>> (KEY_AN + d)) & 1) continue; // anodes are active low
        act[d] += n;
        for (let s = 0; s < 8; s++) if (!((key >>> (KEY_SEG + s)) & 1)) on[d][s] += n; // segments too
      }
    }
    if (cycles === 0) return;
    this.frames.push({ cycles, ms, led, act, on, endCycle });
    if (this.frames.length > MAX_FRAMES) this.frames.shift();
  }

  /**
   * Brightness values 0..1. Without any simulated time yet (e.g. paused right after
   * loading), `currentKey` - the outputs right now - is shown.
   * @returns {{ leds: number[], digits: number[][] }}
   */
  compute(nowCycle, currentKey) {
    // Sum the most recent frames
    let cycles = 0;
    let ms = 0;
    const led = new Float64Array(NUM_LEDS);
    const act = new Float64Array(NUM_DIGITS);
    const on = Array.from({ length: NUM_DIGITS }, () => new Float64Array(8));
    for (let i = this.frames.length - 1; i >= 0; i--) {
      const f = this.frames[i];
      for (let j = 0; j < NUM_LEDS; j++) led[j] += f.led[j];
      for (let d = 0; d < NUM_DIGITS; d++) {
        act[d] += f.act[d];
        for (let s = 0; s < 8; s++) on[d][s] += f.on[d][s];
      }
      cycles += f.cycles;
      ms += f.ms;
      if (cycles >= this.persistenceCycles || ms >= WINDOW_MS) break;
    }

    if (cycles === 0) {
      return {
        leds: Array.from({ length: NUM_LEDS }, (_, i) => (currentKey >>> (KEY_LED + i)) & 1),
        digits: Array.from({ length: NUM_DIGITS }, (_, d) => Array.from({ length: 8 }, (_, s) => (
          !((currentKey >>> (KEY_AN + d)) & 1) && !((currentKey >>> (KEY_SEG + s)) & 1) ? 1 : 0
        ))),
      };
    }

    const leds = Array.from(led, n => n / cycles);
    const digits = [];
    for (let d = 0; d < NUM_DIGITS; d++) {
      if (act[d] >= MIN_ACTIVE_CYCLES || (act[d] > 0 && act[d] === cycles)) {
        this.digitBright[d] = Array.from(on[d], n => n / act[d]);
        this.digitLastActive[d] = nowCycle;
      }
      const lit = nowCycle - this.digitLastActive[d] <= this.persistenceCycles;
      digits.push(lit ? this.digitBright[d] : new Array(8).fill(0));
    }
    return { leds, digits };
  }
}
