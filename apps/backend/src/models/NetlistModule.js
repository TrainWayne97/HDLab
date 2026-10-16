import mongoose from 'mongoose';
import { expireSimData } from './retention.js';

// One module of a simulation's netlist (shared by all instances with the same structure).
// The top module is drawn right after the simulation, all others when someone opens them
// in the viewer ("netlist-render" queue).
const NetlistModuleSchema = new mongoose.Schema({
  simulationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Simulation', index: true },
  key: String,
  name: String,
  cells: Number,
  // Netlist with just this module, as netlistsvg gets it (JSON text)
  json: String,
  status: { type: String, enum: ['idle', 'pending', 'done', 'error'], default: 'idle' },
  requestedAt: Date,
  svg: String,
  // Clickable submodule boxes: [{ cell, x, y, w, h }] in SVG pixels
  hotspots: { type: Array, default: undefined },
  error: String,
  createdAt: { type: Date, default: Date.now },
});

expireSimData(NetlistModuleSchema);

export default mongoose.model('NetlistModule', NetlistModuleSchema);
