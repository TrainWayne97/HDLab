import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const MIN_PASSWORD_LENGTH = 6;
// Konten mit diesen Rollen dürfen ihr Passwort nicht selbst zurücksetzen (siehe /reset-password)
const RESET_BLOCKED_ROLES = ['admin', 'developer'];

// Fehlversuche beim Zurücksetzen pro Benutzername, damit sich die Email nicht
// durchprobieren lässt. Nur im Speicher - ein Neustart setzt die Zähler zurück.
const RESET_MAX_FAILURES = 5;
const RESET_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const resetFailures = new Map();

function isResetBlocked(key) {
  const entry = resetFailures.get(key);
  if (entry && entry.expires <= Date.now()) {
    resetFailures.delete(key);
    return false;
  }
  return !!entry && entry.count >= RESET_MAX_FAILURES;
}

function noteResetFailure(key) {
  const entry = resetFailures.get(key);
  if (entry && entry.expires > Date.now()) {
    entry.count += 1;
  } else {
    resetFailures.set(key, { count: 1, expires: Date.now() + RESET_FAILURE_WINDOW_MS });
  }
}

/**
 * POST /auth/register
 * Registriert einen neuen Benutzer
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validierung
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Prüfe ob Benutzer bereits existiert
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already in use' });
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    // Neuen Benutzer erstellen
    const newUser = new User({
      username,
      email,
      passwordHash: hashedPassword,
      roles: ['user'],
    });

    await newUser.save();

    // JWT Token generieren
    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username, roles: newUser.roles },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: newUser._id, username: newUser.username, email: newUser.email, roles: newUser.roles },
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /auth/login
 * Authentifiziert einen Benutzer
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Benutzer suchen
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Passwort prüfen
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // JWT Token generieren
    const token = jwt.sign(
      { userId: user._id, username: user.username, roles: user.roles },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, username: user.username, email: user.email, roles: user.roles },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /auth/reset-password
 * Setzt ein vergessenes Passwort neu. Als Nachweis genügt, dass Benutzername
 * und Email zum selben Konto gehören - es wird keine Mail verschickt. Wer beides
 * kennt, kann das Konto also übernehmen; deshalb sind Konten mit erweiterten
 * Rechten (admin/developer) ausgenommen und müssen in der DB zurückgesetzt werden.
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if ([username, email, password].some((value) => typeof value !== 'string' || !value.trim())) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` });
    }

    const limitKey = username.trim().toLowerCase();
    if (isResetBlocked(limitKey)) {
      return res.status(429).json({ error: 'Too many attempts, please try again later' });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user || user.email.trim().toLowerCase() !== email.trim().toLowerCase()) {
      noteResetFailure(limitKey);
      return res.status(401).json({ error: 'Username and email do not match' });
    }

    if (user.roles.some((role) => RESET_BLOCKED_ROLES.includes(role))) {
      return res.status(403).json({ error: 'Password reset is not available for this account' });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();
    resetFailures.delete(limitKey);

    res.json({ message: 'Password has been reset' });
  } catch (err) {
    console.error('[Auth] Reset password error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /auth/logout
 * Logout (optional - Token wird einfach gelöscht im Frontend)
 */
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout successful' });
});

/**
 * GET /auth/me
 * Aktuelle Benutzerinfo (für Token-Validierung)
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: { id: user._id, username: user.username, email: user.email, roles: user.roles } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
