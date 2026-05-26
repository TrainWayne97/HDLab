import mongoose from 'mongoose';

const ModuleLibrarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moduleName: { type: String, required: true }, // z.B. "modul_nand", "modul_addierer"
  code: { type: String, required: true }, // Der Verilog-Code des Moduls
  description: { type: String, default: '' }, // Optional: Was macht das Modul?
  sourceLesson: { type: Number, default: null }, // Aus welcher Lektion stammt es? (optional)
  usedInLessons: [{ type: Number }], // Welche Lektionen benutzen dieses Modul?
  version: { type: Number, default: 1 }, // Versionierung für Updates
  isPublic: { type: Boolean, default: false }, // Sollen andere Nutzer das sehen?
  tags: [String], // z.B. ["addierer", "grundoperation", "kombinatorisch"]
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Composite index: Ein Benutzer kann pro Modul-Name nur eine Version haben
ModuleLibrarySchema.index({ userId: 1, moduleName: 1, version: 1 });

export default mongoose.model('ModuleLibrary', ModuleLibrarySchema);
