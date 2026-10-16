// -----------------------------
// HDLab Backend – OAuth2-Login (GitLab)
// -----------------------------
// Anmeldung über das GitLab der HTWK (Authorization Code Flow). Der Tausch
// Code -> Access Token läuft hier im Backend, damit das Client Secret nie im
// Browser landet. Nach erfolgreichem Login stellt das Backend sein eigenes JWT
// aus - der Rest der API merkt keinen Unterschied zum Passwort-Login.

import { Router } from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
import { signToken } from '../config/jwt.js';
import { getAppUrl } from '../config/appUrl.js';
import { isMailConfigured } from '../services/mailer.js';

const router = Router();
const STATE_COOKIE = 'hdlab_oauth_state';

const trimSlashes = (url) => (url || '').replace(/\/+$/, '');

// Erst zur Laufzeit lesen: dotenv.config() läuft nach dem Import dieses Moduls
function getConfig() {
  const appUrl = getAppUrl();
  return {
    appUrl,
    gitlabUrl: trimSlashes(process.env.GITLAB_URL || 'https://gitlab.imn.htwk-leipzig.de'),
    clientId: process.env.GITLAB_CLIENT_ID,
    clientSecret: process.env.GITLAB_CLIENT_SECRET,
    // Muss exakt der in der GitLab-Application eingetragenen Redirect URI entsprechen
    redirectUri: process.env.GITLAB_REDIRECT_URI || `${appUrl}/api/auth/gitlab/callback`,
  };
}

const isConfigured = (config) => !!(config.clientId && config.clientSecret);

function readCookie(req, name) {
  const cookies = (req.headers.cookie || '').split(';').map((part) => part.trim().split('='));
  const match = cookies.find(([key]) => key === name);
  return match ? match[1] : null;
}

function stateCookie(config, value, maxAgeSeconds) {
  const secure = config.redirectUri.startsWith('https://') ? '; Secure' : '';
  return `${STATE_COOKIE}=${value}; Max-Age=${maxAgeSeconds}; Path=/; HttpOnly; SameSite=Lax${secure}`;
}

/**
 * Sucht das HDLab-Konto zum GitLab-Profil bzw. legt es beim ersten Login an.
 * Ein bestehendes Konto mit derselben Email wird mit dem GitLab-Konto verknüpft.
 *
 * Die Registrierung prüft die Email nicht: jemand könnte vorab ein Konto mit fremder
 * Adresse anlegen und danach mitlesen, sobald die echte Person sich per GitLab anmeldet.
 * Beim Verknüpfen fällt deshalb das lokale Passwort weg (danach nur noch GitLab-Login),
 * und alle zuvor ausgestellten Tokens werden ungültig.
 */
async function findOrCreateUser(profile) {
  let user = await User.findOne({ gitlabId: profile.id });
  if (user) return user;

  const email = profile.email.trim();
  const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  user = await User.findOne({ email: new RegExp(`^${escapedEmail}$`, 'i') });
  if (user) {
    user.gitlabId = profile.id;
    user.passwordHash = undefined;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();
    console.log(`[OAuth] Linked account ${user.username} to GitLab user ${profile.id}; local password removed`);
    return user.save();
  }

  // Benutzername kann schon von einem lokalen Konto belegt sein
  let username = profile.username;
  for (let i = 2; await User.exists({ username }); i++) {
    username = `${profile.username}${i}`;
  }

  return User.create({ username, email, gitlabId: profile.id, roles: ['user'] });
}

/**
 * GET /auth/providers
 * Welche Login-Anbieter konfiguriert sind (für den Button auf der Login-Seite) und ob
 * "Passwort vergessen" per Mail verfügbar ist
 */
router.get('/providers', (req, res) => {
  res.json({ gitlab: isConfigured(getConfig()), passwordReset: isMailConfigured() });
});

/**
 * GET /auth/gitlab
 * Startet den Login: leitet den Browser zur GitLab-Anmeldung weiter.
 * Mit ?reauth=1 (nach einem HDLab-Logout) meldet GitLab die bestehende Sitzung ab und
 * zeigt die Anmeldemaske, statt still das zuletzt verwendete Konto freizugeben.
 * prompt=login wertet GitLab nur bei OpenID-Connect-Anfragen aus, daher der Scope openid.
 */
router.get('/gitlab', (req, res) => {
  const config = getConfig();
  if (!isConfigured(config)) {
    return res.redirect(`${config.appUrl}/#authError=not_configured`);
  }

  // state bindet die Antwort an diesen Browser (Schutz vor Login-CSRF)
  const state = crypto.randomBytes(24).toString('hex');
  res.setHeader('Set-Cookie', stateCookie(config, state, 600));

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'read_user openid',
    state,
  });
  if (req.query.reauth) params.set('prompt', 'login');
  res.redirect(`${config.gitlabUrl}/oauth/authorize?${params}`);
});

/**
 * GET /auth/gitlab/callback
 * Ziel der GitLab-Weiterleitung: tauscht den Code gegen ein Access Token, lädt
 * das Profil und schickt den Browser mit dem HDLab-JWT zurück ins Frontend.
 * Das JWT steht im URL-Fragment, damit es nicht in Server-Logs landet.
 */
router.get('/gitlab/callback', async (req, res) => {
  const config = getConfig();
  const fail = (code) => res.redirect(`${config.appUrl}/#authError=${code}`);

  try {
    const { code, state } = req.query;
    const expectedState = readCookie(req, STATE_COOKIE);
    res.setHeader('Set-Cookie', stateCookie(config, '', 0));

    if (!isConfigured(config)) return fail('not_configured');
    // z.B. wenn der Nutzer die Freigabe bei GitLab ablehnt
    if (req.query.error) return fail('denied');
    if (typeof code !== 'string' || typeof state !== 'string' || !expectedState || state !== expectedState) {
      return fail('invalid_state');
    }

    const tokenResponse = await fetch(`${config.gitlabUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      }),
    });
    if (!tokenResponse.ok) {
      console.error('[OAuth] GitLab token exchange failed:', tokenResponse.status, await tokenResponse.text());
      return fail('gitlab_failed');
    }
    const { access_token: accessToken } = await tokenResponse.json();

    const profileResponse = await fetch(`${config.gitlabUrl}/api/v4/user`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileResponse.ok) {
      console.error('[OAuth] GitLab profile request failed:', profileResponse.status);
      return fail('gitlab_failed');
    }
    const profile = await profileResponse.json();
    if (!profile.id || !profile.username || !profile.email) {
      return fail('no_email');
    }

    const user = await findOrCreateUser(profile);
    const token = signToken(user);

    res.redirect(`${config.appUrl}/#authToken=${token}`);
  } catch (err) {
    console.error('[OAuth] GitLab login error:', err);
    fail('gitlab_failed');
  }
});

export default router;
