import mongoose from 'mongoose';

const NetlistSchema = new mongoose.Schema({
  simulationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Simulation' },
  svg: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Netlist', NetlistSchema);
