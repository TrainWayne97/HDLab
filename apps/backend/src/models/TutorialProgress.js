import mongoose from 'mongoose';

const TutorialProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: Number, required: true }, // lesson_id aus Tutorial
  userCode: { type: String, default: '' }, // Der geschriebene Code des Nutzers
  solution: { type: String, default: '' }, // Die eingereichte Lösung
  isCompleted: { type: Boolean, default: false }, // War die Aufgabe erfolgreich?
  validationStatus: { type: String, enum: ['not-started', 'passed', 'failed'], default: 'not-started' },
  submissionDate: { type: Date, default: null },
  lastModified: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

// Composite index: Ein Benutzer kann pro Lektion nur einen Fortschritt haben
TutorialProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

export default mongoose.model('TutorialProgress', TutorialProgressSchema);
