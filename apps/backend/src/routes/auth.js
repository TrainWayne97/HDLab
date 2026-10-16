import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import authenticateToken from '../middleware/auth.js';
import { createLimiter, rateLimit, sendTooMany } from '../middleware/rateLimit.js';
import oauthRoutes from './oauth.js';
import { signToken } from '../config/jwt.js';
import { getAppUrl } from '../config/appUrl.js';
import { isMailConfigured, sendMail } from '../services/mailer.js';

const router = Router();

// OAuth2-Login: /auth/providers, /auth/gitlab, /auth/gitlab/callback
router.use(oauthRoutes);

const MIN_PASSWORD_LENGTH = 8;
// bcrypt wertet ohnehin nur die ersten 72 Bytes aus; begrenzt außerdem die Hash-Arbeit
const MAX_PASSWORD_LENGTH = 128;
const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,32}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
// Konten mit diesen Rollen dürfen ihr Passwort nicht selbst zurücksetzen (siehe /forgot-password)
const RESET_BLOCKED_ROLES = ['admin', 'developer'];
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const RESET_REQUESTED_MESSAGE = 'If an account with this email exists, a reset link has been sent';

const MINUTE = 60 * 1000;
// Fehlgeschlagene Logins pro Benutzername (Passwort-Raten auf ein Konto) und pro IP
const loginUserFailures = createLimiter({ windowMs: 15 * MINUTE, max: 10 });
const loginIpFailures = createLimiter({ windowMs: 15 * MINUTE, max: 100 });
// Reset-Mails pro Adresse, damit niemand fremde Postfächer (und das Funktionspostfach) flutet
const resetMailsPerEmail = createLimiter({ windowMs: 60 * MINUTE, max: 3 });

// Vergleichswert, damit ein unbekannter Benutzername genauso lange braucht wie ein falsches Passwort
const DUMMY_HASH = bcrypt.hashSync('hdlab-timing-dummy', 10);

const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';
const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Email klein geschrieben und getrimmt, oder null wenn ungültig. */
function normalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(email) ? email : null;
}

/** Fehlermeldung zum Passwort oder null, wenn es den Regeln entspricht. */
function passwordProblem(password) {
  if (typeof password !== 'string') return 'Password is required';
  if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
  if (password.length > MAX_PASSWORD_LENGTH) return `Password must be at most ${MAX_PASSWORD_LENGTH} characters long`;
  return null;
}

/** Ältere Konten wurden mit beliebiger Groß-/Kleinschreibung der Email angelegt. */
const findByEmail = (email) => User.findOne({ email: new RegExp(`^${escapeRegExp(email)}$`, 'i') });

const publicUser = (user) => ({ id: user._id, username: user.username, email: user.email, roles: user.roles });

/**
 * POST /auth/register
 * Registriert einen neuen Benutzer
 */
router.post('/register', rateLimit({ windowMs: 60 * MINUTE, max: 30 }), async (req, res, next) => {
  try {
    const { username, email: rawEmail, password } = req.body || {};

    if (!isNonEmptyString(username) || !isNonEmptyString(rawEmail) || typeof password !== 'string') {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    if (!USERNAME_PATTERN.test(username)) {
      return res.status(400).json({ error: 'Username must be 3-32 characters: letters, digits, dot, dash or underscore' });
    }
    const email = normalizeEmail(rawEmail);
    if (!email) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    const problem = passwordProblem(password);
    if (problem) {
      return res.status(400).json({ error: problem });
    }

    // Prüfe ob Benutzer bereits existiert
    const existingUser = (await User.exists({ username })) || (await findByEmail(email));
    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already in use' });
    }

    const newUser = new User({
      username,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      roles: ['user'],
    });
    await newUser.save();

    res.status(201).json({
      message: 'User registered successfully',
      token: signToken(newUser),
      user: publicUser(newUser),
    });
  } catch (err) {
    // Gleichzeitige Registrierung mit demselben Namen: Unique-Index greift
    if (err?.code === 11000) return res.status(409).json({ error: 'Username or email already in use' });
    next(err);
  }
});

/**
 * POST /auth/login
 * Authentifiziert einen Benutzer
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    // Nur Strings: ein Objekt wie {"$ne": null} würde sonst als Mongo-Operator ausgewertet
    if (!isNonEmptyString(username) || typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    if (password.length > MAX_PASSWORD_LENGTH || username.length > 64) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const userKey = `user:${username.toLowerCase()}`;
    const ipKey = `ip:${req.ip}`;
    if (loginUserFailures.isLimited(userKey) || loginIpFailures.isLimited(ipKey)) {
      return sendTooMany(res, 15 * 60);
    }

    // Reine OAuth2-Konten haben kein Passwort und können sich hier nicht anmelden
    const user = await User.findOne({ username });
    const hash = user?.passwordHash || DUMMY_HASH;
    const isPasswordValid = (await bcrypt.compare(password, hash)) && !!user?.passwordHash;
    if (!isPasswordValid) {
      loginUserFailures.hit(userKey);
      loginIpFailures.hit(ipKey);
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    loginUserFailures.reset(userKey);

    res.json({
      message: 'Login successful',
      token: signToken(user),
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Legt einen Reset-Token an und verschickt den Link. Läuft nach der Antwort an den
 * Client, damit Antwortzeit und -inhalt nicht verraten, ob es die Adresse gibt.
 */
async function sendResetLink(email) {
  const user = await findByEmail(email);
  if (!user) return;
  if (user.roles.some((role) => RESET_BLOCKED_ROLES.includes(role))) {
    console.warn(`[Auth] Password reset requested for privileged account ${user.username} - ignored`);
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  user.passwordResetTokenHash = hashResetToken(token);
  user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await user.save();

  // Token im Fragment: landet nicht in Server- oder Proxy-Logs
  const link = `${getAppUrl()}/#resetToken=${token}`;
  await sendMail({
    to: user.email,
    subject: 'HDLab: Passwort zurücksetzen / Reset your password',
    text: [
      `Hallo ${user.username},`,
      '',
      'für dein HDLab-Konto wurde ein neues Passwort angefordert. Über diesen Link kannst du es',
      `innerhalb von ${RESET_TOKEN_TTL_MS / 60000} Minuten setzen:`,
      '',
      link,
      '',
      'Wenn du das nicht warst, ignoriere diese Mail - dein Passwort bleibt unverändert.',
      '',
      '---',
      '',
      `Hi ${user.username}, a new password was requested for your HDLab account. Use the link above`,
      `within ${RESET_TOKEN_TTL_MS / 60000} minutes to set it. If this wasn't you, ignore this email.`,
    ].join('\n'),
  });
  console.log(`[Auth] Password reset link sent to account ${user.username}`);
}

/**
 * POST /auth/forgot-password
 * Schickt einen Link zum Zurücksetzen an die Email des Kontos (nur wenn SMTP konfiguriert ist).
 * Antwortet immer gleich, egal ob es ein Konto mit der Adresse gibt.
 * Body: { email }
 */
router.post('/forgot-password', rateLimit({ windowMs: 15 * MINUTE, max: 20 }), (req, res) => {
  if (!isMailConfigured()) {
    return res.status(503).json({ error: 'Password reset by email is not available' });
  }
  const email = normalizeEmail(req.body?.email);
  if (!email) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  const { limited, retryAfter } = resetMailsPerEmail.hit(email);
  if (limited) return sendTooMany(res, retryAfter);

  res.json({ message: RESET_REQUESTED_MESSAGE });
  sendResetLink(email).catch((err) => console.error('[Auth] Could not send password reset link:', err));
});

/**
 * POST /auth/reset-password
 * Setzt das Passwort mit dem Token aus der Reset-Mail (einmal verwendbar, 30 Minuten gültig).
 * Meldet alle bestehenden Sitzungen des Kontos ab.
 * Body: { token, password }
 */
router.post('/reset-password', rateLimit({ windowMs: 15 * MINUTE, max: 30 }), async (req, res, next) => {
  try {
    const { token, password } = req.body || {};
    if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }
    const problem = passwordProblem(password);
    if (problem) {
      return res.status(400).json({ error: problem });
    }

    const user = await User.findOne({
      passwordResetTokenHash: hashResetToken(token),
      passwordResetExpires: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();
    await user.save();

    res.json({ message: 'Password has been reset' });
  } catch (err) {
    next(err);
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
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

export default router;
