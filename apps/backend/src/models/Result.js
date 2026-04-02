import mongoose from 'mongoose';

const ResultSchema = new mongoose.Schema({
  simulationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Simulation' },
  logs: String,
  waveformPath: String,
  downloadLinks: [String],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Result', ResultSchema);
