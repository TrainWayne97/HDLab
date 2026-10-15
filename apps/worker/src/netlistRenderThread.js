// Runs netlistsvg in its own thread (see renderInThread in netlist.js): the layout
// recurses deeply on wide buses, and the thread gets a larger stack than the main one.
import { parentPort, workerData } from 'worker_threads';
import netlistsvg from 'netlistsvg';

const { skin, netlist } = workerData;

Promise.resolve()
  .then(() => netlistsvg.render(skin, netlist))
  .then(
    svg => parentPort.postMessage({ svg }),
    err => parentPort.postMessage({ error: err?.message || String(err) })
  );
