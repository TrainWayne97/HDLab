import jwt from 'jsonwebtoken';

/**
 * Middleware: Validiert JWT Token aus Authorization Header
 * Speichert userId, username und roles in req für weitere Verarbeitung
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    req.username = decoded.username;
    // Rollen stammen aus dem Token (Stand bei Login/Register) - bei Rollenänderungen
    // wirkt das erst nach erneutem Login bzw. Ablauf des Tokens (max. 7 Tage).
    req.userRoles = decoded.roles || [];
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
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
