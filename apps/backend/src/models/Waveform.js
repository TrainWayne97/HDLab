import mongoose from 'mongoose';
import { expireSimData } from './retention.js';

const WaveformSchema = new mongoose.Schema({
  simulationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Simulation' },
  vcdData: Buffer, // Alternativ: GridFS für große Dateien
  createdAt: { type: Date, default: Date.now },
});

expireSimData(WaveformSchema);

export default mongoose.model('Waveform', WaveformSchema);
