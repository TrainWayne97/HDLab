import mongoose from 'mongoose';

// Markdown-Notizen eines Nutzers (Notizen-Panel in der Topbar)
const NoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: '' }, // vom Frontend aus der ersten Zeile abgeleitet, nur für die Liste
  content: { type: String, default: '' }, // Markdown
}, { timestamps: true });

NoteSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Note', NoteSchema);
