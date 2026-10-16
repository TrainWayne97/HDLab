import { verifyToken } from '../config/jwt.js';
import User from '../models/User.js';

/**
 * Middleware: Validiert JWT Token aus Authorization Header
 * Speichert userId, username und roles in req für weitere Verarbeitung.
 *
 * Nutzer und Rollen kommen aus der DB, nicht aus dem Token: gelöschte Konten verlieren
 * sofort den Zugriff, Rollenänderungen wirken ohne neuen Login, und nach einem
 * Passwortwechsel (bzw. dem Verknüpfen mit GitLab) sind ältere Tokens ungültig.
 */
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const user = await User.findById(decoded.userId).select('username roles passwordChangedAt');
    const changedAt = user?.passwordChangedAt ? Math.floor(user.passwordChangedAt.getTime() / 1000) : 0;
    if (!user || decoded.iat < changedAt) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.userId = user._id;
    req.username = user.username;
    req.userRoles = user.roles || [];
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware-Factory: Lässt nur Requests von Nutzern mit einer der angegebenen
 * Rollen durch. Muss nach authenticateToken in der Route-Kette stehen.
 *
 * Beispiel: router.get('/admin/stuff', authenticateToken, requireRole('admin'), handler)
 */
export const requireRole = (...allowedRoles) => (req, res, next) => {
  const userRoles = req.userRoles || [];
  const hasAccess = allowedRoles.some((role) => userRoles.includes(role));

  if (!hasAccess) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  next();
};

export default authenticateToken;
