// -----------------------------
// HDLab Backend – JWT-Secret
// -----------------------------
// Einzige Stelle, an der das JWT-Secret gelesen wird. Ohne gültiges Secret startet
// das Backend nicht: mit einem bekannten Standardwert könnte jeder selbst Tokens
// signieren (auch mit Rolle admin) und sich als beliebiger Nutzer ausgeben.

// Lädt .env vor dem ersten Zugriff - die Routen lesen das Secret schon beim Import,
// also bevor dotenv.config() in index.js läuft (relevant für npm run dev mit .env).
import 'dotenv/config';

const MIN_LENGTH = 32;

// Platzhalter aus Code, README und .env.example - dürfen nie als echtes Secret laufen
const PLACEHOLDERS = new Set([
  'your-secret-key',
  'your-secure-key',
  'your-super-secret-key-change-in-production',
  'your-super-secret-key-change-this-in-production-12345678',
]);

function loadJwtSecret() {
  const secret = (process.env.JWT_SECRET || '').trim();
  let problem = null;
  if (!secret) {
    problem = 'JWT_SECRET ist nicht gesetzt';
  } else if (PLACEHOLDERS.has(secret)) {
    problem = 'JWT_SECRET ist ein bekannter Platzhalterwert';
  } else if (secret.length < MIN_LENGTH) {
    problem = `JWT_SECRET ist kürzer als ${MIN_LENGTH} Zeichen`;
  }

  if (problem) {
    console.error(`[Backend] ${problem} - Start abgebrochen.`);
    console.error('[Backend] Secret in .env.secrets eintragen (z.B. JWT_SECRET=$(openssl rand -hex 32)), dann ./setup.sh und ./start.sh erneut ausführen.');
    process.exit(1);
  }
  return secret;
}

export const JWT_SECRET = loadJwtSecret();
