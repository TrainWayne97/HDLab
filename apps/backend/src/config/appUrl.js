// Öffentliche URL des Frontends (Ziel nach dem GitLab-Login, Links in Mails).
// Erst zur Laufzeit lesen: dotenv.config() läuft nach dem Import der Routen.
export function getAppUrl() {
  return (process.env.APP_URL || process.env.CORS_ORIGIN || 'http://localhost:8080').replace(/\/+$/, '');
}
