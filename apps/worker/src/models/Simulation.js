import mongoose from 'mongoose';

const SimulationSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'running', 'finished', 'error'], default: 'pending' },
  language: { type: String, default: 'systemverilog' },
  testbenchType: { type: String, enum: ['systemverilog', 'python'], default: 'systemverilog' },
  settings: { type: Object },
  createdAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  finishedAt: { type: Date },
  resultRefs: { type: Object },
});

export default mongoose.model('Simulation', SimulationSchema);
