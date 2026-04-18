import mongoose from 'mongoose';

const WaveformSchema = new mongoose.Schema({
  simulationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Simulation' },
  vcdData: Buffer,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Waveform', WaveformSchema);
