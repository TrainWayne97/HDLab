// Storage of the netlist schematics: the top module is drawn with every simulation,
// all other modules when someone opens them in the viewer ("netlist-render" queue).
import Netlist from './models/Netlist.js';
import NetlistModule from './models/NetlistModule.js';
import { renderModule } from './netlist.js';

/**
 * Stores the drawn top module and the hierarchy (Netlist), plus every distinct module
 * (NetlistModule): the top one already drawn, the others drawn when opened in the viewer.
 */
export async function storeNetlist(simulationId, netlist) {
  await NetlistModule.deleteMany({ simulationId });
  if (!netlist?.svg) {
    await Netlist.deleteOne({ simulationId });
    return;
  }
  const { svg, hotspots, topKey, tree, truncated, modules } = netlist;
  await Netlist.findOneAndUpdate(
    { simulationId },
    { simulationId, svg, hotspots, topKey, tree, treeTruncated: truncated, createdAt: new Date() },
    { upsert: true, new: true }
  );
  await NetlistModule.insertMany(modules.map(m => (m.key === topKey
    ? { simulationId, key: m.key, name: m.name, cells: m.cells, status: 'done', svg, hotspots }
    : { simulationId, key: m.key, name: m.name, cells: m.cells, json: JSON.stringify(m.netlist) })));
}

/** Draws one submodule that was opened in the viewer (job from the "netlist-render" queue). */
export async function processNetlistRender(simulationId, key) {
  const doc = await NetlistModule.findOne({ simulationId, key });
  if (!doc || doc.status === 'done' || !doc.json) return;
  const t0 = Date.now();
  const result = await renderModule(JSON.parse(doc.json));
  await NetlistModule.updateOne(
    { _id: doc._id },
    result.error
      ? { status: 'error', error: result.error }
      : { status: 'done', svg: result.svg, hotspots: result.hotspots, $unset: { error: 1 } }
  );
  console.log(`[Worker] Netlist module ${doc.name} (${simulationId}/${key}) ${result.error ? `failed: ${result.error}` : 'drawn'} in ${Date.now() - t0} ms`);
}
