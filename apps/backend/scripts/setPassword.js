/**
 * CLI-Skript zum Zurücksetzen eines Passworts durch einen Admin.
 *
 * Für Konten, die "Passwort vergessen" nicht nutzen können: solange kein SMTP
 * eingerichtet ist, sowie immer für admin/developer. Erzeugt ein zufälliges Passwort,
 * gibt es einmal aus und meldet alle bestehenden Sitzungen des Kontos ab. Das neue
 * Passwort steht bewusst nicht in der Kommandozeile (Shell-History, Prozessliste).
 *
 * Verwendung (im Container oder lokal mit MONGO_URL im Environment):
 *   node scripts/setPassword.js <username>
 *
 * Beispiel:
 *   docker compose exec backend node scripts/setPassword.js max.mustermann
 */
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongo:27017/hdlab';

async function main() {
  const [username] = process.argv.slice(2);
  if (!username) {
    console.error('Verwendung: node scripts/setPassword.js <username>');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URL);
  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.error(`Benutzer '${username}' nicht gefunden.`);
      process.exitCode = 1;
      return;
    }

    // 16 Zeichen aus einem Alphabet ohne verwechselbare Zeichen (0/O, 1/l/I)
    const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const password = Array.from(crypto.randomBytes(16), (b) => alphabet[b % alphabet.length]).join('');

    user.passwordHash = await bcrypt.hash(password, 10);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();
    await user.save();

    console.log(`Neues Passwort für ${username}: ${password}`);
    console.log('Bitte auf sicherem Weg übermitteln. Sobald SMTP eingerichtet ist, kann die Person es per "Passwort vergessen" selbst neu setzen (außer admin/developer).');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('Fehler:', err.message);
  process.exit(1);
});
