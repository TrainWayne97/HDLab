import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

export function LoginPage({ onLoginSuccess, onSwitchToRegister, onForgotPassword }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuth();
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!username || !password) {
      setLocalError('Bitte fülle alle Felder aus');
      return;
    }

    try {
      await login(username, password);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setLocalError(err.message || 'Login fehlgeschlagen');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>HDLab Login</h1>
        <p className="subtitle">Willkommen zurück!</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Benutzername</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Gib deinen Benutzernamen ein"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <div className="password-input">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Gib dein Passwort ein"
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {(localError || error) && <div className="error-message">{localError || error}</div>}

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Wird eingeloggt...' : 'Anmelden'}
          </button>
        </form>

        <p className="switch-auth">
          Noch kein Konto? <button type="button" onClick={onSwitchToRegister} style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', textDecoration: 'underline' }}>Hier registrieren</button>
        </p>
        <p className="switch-auth">
          <button type="button" onClick={onForgotPassword} style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', textDecoration: 'underline' }}>Passwort vergessen?</button>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage({ onRegisterSuccess, onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading, error } = useAuth();
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Validierung
    if (!username || !email || !password || !confirmPassword) {
      setLocalError('Bitte fülle alle Felder aus');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwörter stimmen nicht überein');
      return;
    }

    if (password.length < 6) {
      setLocalError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    if (!email.includes('@')) {
      setLocalError('Bitte gib eine gültige Email ein');
      return;
    }

    try {
      await register(username, email, password);
      if (onRegisterSuccess) onRegisterSuccess();
    } catch (err) {
      setLocalError(err.message || 'Registrierung fehlgeschlagen');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>HDLab Registrierung</h1>
        <p className="subtitle">Erstelle dein Konto</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reg-username">Benutzername</label>
            <input
              id="reg-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Wähle einen Benutzernamen"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Gib deine Email ein"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Passwort</label>
            <div className="password-input">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-confirm">Passwort wiederholen</label>
            <input
              id="reg-confirm"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Wiederhol dein Passwort"
              disabled={isLoading}
            />
          </div>

          {(localError || error) && <div className="error-message">{localError || error}</div>}

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Wird registriert...' : 'Registrieren'}
          </button>
        </form>

        <p className="switch-auth">
          Hast bereits ein Konto? <button type="button" onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', textDecoration: 'underline' }}>Hier anmelden</button>
        </p>
      </div>
    </div>
  );
}

const RESET_ERRORS = {
  401: 'Benutzername und Email passen nicht zusammen',
  403: 'Für dieses Konto kann das Passwort nicht selbst zurückgesetzt werden. Bitte wende dich an einen Administrator.',
  429: 'Zu viele Versuche. Bitte versuche es später erneut.',
};

export function ForgotPasswordPage({ onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!username || !email || !password || !confirmPassword) {
      setLocalError('Bitte fülle alle Felder aus');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwörter stimmen nicht überein');
      return;
    }

    if (password.length < 6) {
      setLocalError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(username, email, password);
      setIsDone(true);
    } catch (err) {
      setLocalError(RESET_ERRORS[err.status] || 'Zurücksetzen fehlgeschlagen. Bitte versuche es später erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Passwort vergessen</h1>
        <p className="subtitle">Vergib ein neues Passwort für dein Konto</p>

        {isDone ? (
          <div className="success-message">
            Dein Passwort wurde geändert. Du kannst dich jetzt mit dem neuen Passwort anmelden.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="forgot-username">Benutzername</label>
              <input
                id="forgot-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Gib deinen Benutzernamen ein"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Gib die Email deines Kontos ein"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="forgot-password">Neues Passwort</label>
              <div className="password-input">
                <input
                  id="forgot-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="forgot-confirm">Passwort wiederholen</label>
              <input
                id="forgot-confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Wiederhol dein Passwort"
                disabled={isLoading}
              />
            </div>

            {localError && <div className="error-message">{localError}</div>}

            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? 'Wird gespeichert...' : 'Passwort speichern'}
            </button>
          </form>
        )}

        <p className="switch-auth">
          <button type="button" onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', textDecoration: 'underline' }}>Zurück zur Anmeldung</button>
        </p>
      </div>
    </div>
  );
}
