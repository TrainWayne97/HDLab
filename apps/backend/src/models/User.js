import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  // Group/role-based access control - e.g. 'user', 'developer', 'admin'.
  // 'developer' and 'admin' can access tutorial sample solutions without a password.
  roles: { type: [String], default: ['user'] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', UserSchema);
