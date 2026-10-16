import mongoose from 'mongoose';
import { expireSimData } from './retention.js';

const ResultSchema = new mongoose.Schema({
  simulationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Simulation' },
  logs: String,
  waveformPath: String,
  downloadLinks: [String],
  createdAt: { type: Date, default: Date.now },
});

expireSimData(ResultSchema);

export default mongoose.model('Result', ResultSchema);
