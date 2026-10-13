import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  // Fehlt bei Konten, die nur über OAuth2 (GitLab) angelegt wurden
  passwordHash: { type: String },
  // ID des verknüpften GitLab-Kontos (siehe routes/oauth.js)
  gitlabId: { type: Number, unique: true, sparse: true },
  // Group/role-based access control - e.g. 'user', 'developer', 'admin'.
  // 'developer' and 'admin' can access tutorial sample solutions without a password.
  roles: { type: [String], default: ['user'] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', UserSchema);
