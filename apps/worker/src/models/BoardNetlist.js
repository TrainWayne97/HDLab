import mongoose from 'mongoose';

// Flattened Yosys netlist for the board simulation in the browser (JSON text)
const BoardNetlistSchema = new mongoose.Schema({
  simulationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Simulation' },
  json: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('BoardNetlist', BoardNetlistSchema);
