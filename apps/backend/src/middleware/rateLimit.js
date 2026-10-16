// -----------------------------
// HDLab Backend – Rate Limiting
// -----------------------------
// Fester Zeitfenster-Zähler im Speicher (ein Backend-Prozess, kein Redis nötig).
// Ein Neustart setzt alle Zähler zurück.
//
// Hinter einem Proxy teilen sich unter Umständen viele Nutzer eine IP (z.B. wenn vor
// nginx noch ein Reverse Proxy ohne X-Forwarded-For hängt). Die IP-Grenzen sind deshalb
// großzügig; die eigentliche Begrenzung läuft pro Konto bzw. Benutzername.

const limiters = new Set();

/**
 * @param {{windowMs: number, max: number}} opts
 * @returns {{hit: (key: string) => {limited: boolean, retryAfter: number}, reset: (key: string) => void,
 *            isLimited: (key: string) => boolean}}
 */
export function createLimiter({ windowMs, max }) {
  const entries = new Map();
  const limiter = {
    entries,
    windowMs,
    /** Zählt einen Versuch; limited = true, wenn das Limit damit überschritten ist. */
    hit(key) {
      const now = Date.now();
      let entry = entries.get(key);
      if (!entry || entry.expires <= now) {
        entry = { count: 0, expires: now + windowMs };
        entries.set(key, entry);
      }
      entry.count += 1;
      return { limited: entry.count > max, retryAfter: Math.ceil((entry.expires - now) / 1000) };
    },
    /** Ob der Schlüssel schon gesperrt ist, ohne einen Versuch zu zählen. */
    isLimited(key) {
      const entry = entries.get(key);
      return !!entry && entry.expires > Date.now() && entry.count >= max;
    },
    reset(key) {
      entries.delete(key);
    },
  };
  limiters.add(limiter);
  return limiter;
}

// Abgelaufene Einträge regelmäßig entfernen, damit viele verschiedene IPs/Namen den
// Speicher nicht füllen
setInterval(() => {
  const now = Date.now();
  for (const limiter of limiters) {
    for (const [key, entry] of limiter.entries) {
      if (entry.expires <= now) limiter.entries.delete(key);
    }
  }
}, 60 * 1000).unref();

export function sendTooMany(res, retryAfter) {
  res.setHeader('Retry-After', String(retryAfter));
  return res.status(429).json({ error: 'Too many requests, please try again later' });
}

/**
 * Express-Middleware: begrenzt Requests pro Schlüssel (Standard: Client-IP, siehe
 * 'trust proxy' in index.js). Mit `byUser` pro angemeldetem Nutzer (nach authenticateToken).
 */
export function rateLimit({ windowMs, max, byUser = false }) {
  const limiter = createLimiter({ windowMs, max });
  return (req, res, next) => {
    const key = byUser ? `user:${req.userId}` : `ip:${req.ip}`;
    const { limited, retryAfter } = limiter.hit(key);
    if (limited) return sendTooMany(res, retryAfter);
    next();
  };
}
