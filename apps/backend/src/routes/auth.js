import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
