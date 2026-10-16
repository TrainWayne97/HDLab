import mongoose from 'mongoose';

const NetlistSchema = new mongoose.Schema({
  simulationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Simulation' },
  // Schematic of the top module
  svg: String,
  hotspots: { type: Array, default: undefined },
  // Module hierarchy for the viewer: { inst, name, key, children } (see NetlistModule)
  topKey: String,
  tree: { type: Object },
  treeTruncated: Boolean,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Netlist', NetlistSchema);
