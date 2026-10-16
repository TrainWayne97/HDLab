import mongoose from 'mongoose';
import { expireSimData } from './retention.js';

// Flattened Yosys netlist for the board simulation in the browser (JSON text)
const BoardNetlistSchema = new mongoose.Schema({
  simulationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Simulation' },
  json: String,
  createdAt: { type: Date, default: Date.now },
});

expireSimData(BoardNetlistSchema);

export default mongoose.model('BoardNetlist', BoardNetlistSchema);
