/**
 * CLI-Skript zum Setzen der Rollen eines Benutzers.
 *
 * Es gibt aktuell keine Admin-Oberfläche für die Rollenvergabe - das hier ist
 * der einzige Weg, jemanden zu 'developer' oder 'admin' zu machen. Läuft
 * direkt gegen MongoDB, unabhängig vom laufenden Backend-Prozess.
 *
 * Verwendung (im Container oder lokal mit MONGO_URL im Environment):
 *   node scripts/setRole.js <username> <role> [<role2> ...]   Rollen setzen (ersetzt bestehende)
 *   node scripts/setRole.js <username> --add <role>           Rolle hinzufügen (bestehende bleiben)
 *   node scripts/setRole.js <username> --remove <role>        Rolle entfernen
 *   node scripts/setRole.js <username> --list                 Aktuelle Rollen anzeigen
 *
 * Beispiel:
 *   docker compose exec backend node scripts/setRole.js aitor admin
 */
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongo:27017/hdlab';

async function main() {
  const [username, mode, ...rest] = process.argv.slice(2);

  if (!username || !mode) {
    console.error('Verwendung: node scripts/setRole.js <username> <role> [<role2> ...]');
    console.error('        node scripts/setRole.js <username> --add <role>');
    console.error('        node scripts/setRole.js <username> --remove <role>');
    console.error('        node scripts/setRole.js <username> --list');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URL);

  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.error(`Benutzer '${username}' nicht gefunden.`);
      process.exit(1);
    }

    if (mode === '--list') {
      console.log(`Rollen von ${username}:`, user.roles);
      return;
    }

    if (mode === '--add') {
      const role = rest[0];
      if (!role) throw new Error('Bitte eine Rolle angeben, z.B. --add admin');
      if (!user.roles.includes(role)) user.roles.push(role);
    } else if (mode === '--remove') {
      const role = rest[0];
      if (!role) throw new Error('Bitte eine Rolle angeben, z.B. --remove admin');
      user.roles = user.roles.filter((r) => r !== role);
    } else {
      // Direkte Rollenliste: erster Wert ist bereits eine Rolle, nicht --add/--remove/--list
      user.roles = [mode, ...rest];
    }

    await user.save();
    console.log(`Rollen von ${username} aktualisiert:`, user.roles);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('Fehler:', err.message);
  process.exit(1);
});
