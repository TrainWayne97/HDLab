import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  roles: [String],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', UserSchema);
