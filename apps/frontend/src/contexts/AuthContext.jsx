import React, { createContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

// Nach einem Logout bleibt die GitLab-Sitzung bestehen; dieses Flag lässt den nächsten
// GitLab-Login eine neue Anmeldung erzwingen, damit man ein anderes Konto wählen kann.
const GITLAB_REAUTH_KEY = 'hdlab-gitlab-reauth';

// Fehlercodes, mit denen das Backend nach einem gescheiterten GitLab-Login zurückleitet
const OAUTH_ERRORS = {
  not_configured: 'Die Anmeldung über GitLab ist nicht eingerichtet',
  denied: 'Die Anmeldung über GitLab wurde abgebrochen',
  invalid_state: 'Die Anmeldung über GitLab ist abgelaufen. Bitte versuche es erneut.',
  no_email: 'Dein GitLab-Konto hat keine Email-Adresse hinterlegt',
};

export const AuthProvider = ({ children, apiBase = '/api' }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Laden des Tokens beim Start
  useEffect(() => {
    // Rückkehr vom GitLab-Login: das Backend hängt Token bzw. Fehler als Fragment an (/#authToken=...)
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const oauthToken = hash.get('authToken');
    const oauthError = hash.get('authError');
    if (oauthToken || oauthError) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    if (oauthToken) {
      localStorage.setItem('authToken', oauthToken);
      localStorage.removeItem(GITLAB_REAUTH_KEY);
    }
    if (oauthError) {
      setError(OAUTH_ERRORS[oauthError] || 'Anmeldung über GitLab fehlgeschlagen');
    }

    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      setToken(savedToken);
      validateToken(savedToken);
    }
  }, []);

  // Token validieren
  const validateToken = useCallback(async (tokenToValidate) => {
    try {
      const response = await fetch(`${apiBase}/auth/me`, {
        headers: { Authorization: `Bearer ${tokenToValidate}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Token validation error:', err);
      localStorage.removeItem('authToken');
      setToken(null);
    }
  }, [apiBase]);

  // Register
  const register = useCallback(async (username, email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem('authToken', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiBase]);

  // Login
  const login = useCallback(async (username, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('authToken', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiBase]);

  const postAuth = useCallback(async (endpoint, body) => {
    const response = await fetch(`${apiBase}/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const err = new Error(data.error || 'Request failed');
      err.status = response.status;
      throw err;
    }
  }, [apiBase]);

  // Passwort vergessen: Link zum Zurücksetzen an die Email des Kontos schicken lassen
  const requestPasswordReset = useCallback((email) => postAuth('forgot-password', { email }), [postAuth]);

  // Neues Passwort mit dem Token aus der Reset-Mail setzen
  const resetPassword = useCallback((token, password) => postAuth('reset-password', { token, password }), [postAuth]);

  // Login über GitLab (OAuth2): der Browser verlässt die Seite und kommt mit Token zurück
  const loginWithGitlab = useCallback(() => {
    const reauth = localStorage.getItem(GITLAB_REAUTH_KEY) ? '?reauth=1' : '';
    window.location.assign(`${apiBase}/auth/gitlab${reauth}`);
  }, [apiBase]);

  // Welche OAuth2-Anbieter das Backend konfiguriert hat, z.B. { gitlab: true }
  const getAuthProviders = useCallback(async () => {
    try {
      const response = await fetch(`${apiBase}/auth/providers`);
      return response.ok ? await response.json() : {};
    } catch (err) {
      return {};
    }
  }, [apiBase]);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.setItem(GITLAB_REAUTH_KEY, '1');
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  // API Helper mit automatischem Token
  const apiCall = useCallback(async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${apiBase}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      logout();
      throw new Error('Session expired');
    }

    return response;
  }, [token, apiBase, logout]);

  // Gruppen-/Rollenprüfung, z.B. hasRole('admin', 'developer')
  const hasRole = useCallback((...roles) => {
    const userRoles = user?.roles || [];
    return roles.some((role) => userRoles.includes(role));
  }, [user]);

  const value = {
    user,
    token,
    isLoading,
    error,
    register,
    login,
    logout,
    loginWithGitlab,
    getAuthProviders,
    requestPasswordReset,
    resetPassword,
    isAuthenticated: !!token,
    apiCall,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
