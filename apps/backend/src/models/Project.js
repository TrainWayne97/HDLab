import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
  filename: String,
  content: String,
  language: String,
});

const ProjectSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  files: [FileSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Project', ProjectSchema);
