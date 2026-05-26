import React, { useState } from 'react';
import hdlabLogo from '../assets/HDLab_logo_green+black.svg';
import { useAuth } from '../contexts/AuthContext';
import './Topbar.css';

const TRANSLATIONS = {
  de: {
    help: 'Hilfe',
    settings: 'Einstellungen',
    login: 'Login',
    logout: 'Abmelden',
    tutorial: 'Tutorial',
    language: 'Sprache',
    german: 'Deutsch',
    english: 'Englisch',
    profile: 'Profil',
  },
  en: {
    help: 'Help',
    settings: 'Settings',
    login: 'Login',
    logout: 'Logout',
    tutorial: 'Tutorial',
    language: 'Language',
    german: 'German',
    english: 'English',
    profile: 'Profile',
  }
};

export default function Topbar({ onSettings, onHelp, onHome, onTutorial, uiLanguage, setUiLanguage, onToggleSidebar }) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  const { user, logout, isAuthenticated } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setProfileMenuOpen(false);
  };

  return (
    <header className="topbar">
      {onToggleSidebar && (
        <button className="hamburger-menu" onClick={onToggleSidebar} aria-label="Toggle menu">
          ☰
        </button>
      )}
      <button type="button" className="topbar-home" onClick={onHome} aria-label="Go to home">
        <div className="topbar-left">
          <img src={hdlabLogo} className="topbar-logo" alt="HDLab Logo" />
          <span className="topbar-title">HDLab</span>
        </div>
      </button>
      <nav className="topbar-menu">
        {onTutorial && <button onClick={onTutorial}>{t.tutorial}</button>}
        <button onClick={onHelp}>{t.help}</button>
        <button onClick={onSettings}>{t.settings}</button>

        {isAuthenticated && user ? (
          <div className="profile-menu" style={{ position: 'relative' }}>
            <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="profile-button">
              👤 {user.username}
            </button>
            {profileMenuOpen && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <div className="profile-username">{user.username}</div>
                  <div className="profile-email">{user.email}</div>
                </div>
                <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                <button onClick={handleLogout} className="logout-button">
                  {t.logout}
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="login-button">Login</button>
        )}

        <div className="language-picker">
          <svg className="globe-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <select
            value={uiLanguage}
            onChange={e => setUiLanguage(e.target.value)}
            aria-label={t.language}
          >
            <option value="de">{t.german}</option>
            <option value="en">{t.english}</option>
          </select>
        </div>
      </nav>
    </header>
  );
}
