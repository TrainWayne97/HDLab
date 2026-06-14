import React, { useState } from 'react';
import hdlabLogo from '../assets/HDLab_logo_green+black.svg';
import { useAuth } from '../contexts/AuthContext';
import ModuleLibrary from './ModuleLibrary';
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
    modules: 'gespeicherteModule',
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
    modules: 'saved  Modules',
  }
};

export default function Topbar({ onSettings, onHelp, onHome, onTutorial, uiLanguage, setUiLanguage, onToggleSidebar, moduleLibraryOpen, onToggleModuleLibrary, moduleLibraryCode, onInsertModule, moduleRefreshKey }) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  const { user, logout, isAuthenticated } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setProfileMenuOpen(false);
  };

  return (
    <>
    <header className="topbar">
      <button className="hamburger-menu" onClick={onToggleSidebar} aria-label="Menü öffnen">
        ☰
      </button>
      <button type="button" className="topbar-home" onClick={onHome} aria-label="Go to home">
        <div className="topbar-left">
          <img src={hdlabLogo} className="topbar-logo" alt="HDLab Logo" />
          <span className="topbar-title">HDLab</span>
        </div>
      </button>
      <nav className="topbar-menu">
        {onTutorial && <button className="btn-tutorial" onClick={onTutorial}>{t.tutorial}</button>}
        <button
          className={`btn-modules ${moduleLibraryOpen ? 'active' : ''}`}
          onClick={onToggleModuleLibrary}
          title={t.modules}
        >
          {t.modules}
        </button>
        <button className="btn-help" onClick={onHelp}>{t.help}</button>
        <button onClick={onSettings}>{t.settings}</button>

        {isAuthenticated && user ? (
          <div className="profile-menu" style={{ position: 'relative' }}>
            <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="profile-button">
              👤 <span className="profile-username-text">{user.username}</span>
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

      {/* Module Library Drawer */}
      {moduleLibraryOpen && (
        <>
          <div
            className="module-drawer-backdrop"
            onClick={onToggleModuleLibrary}
            aria-hidden="true"
          />
          <div className="module-drawer">
            <div className="module-drawer-header">
              <span>{t.modules}</span>
              <button
                className="module-drawer-close"
                onClick={onToggleModuleLibrary}
                aria-label="Schließen"
              >
                ✕
              </button>
            </div>
            <div className="module-drawer-body">
              <ModuleLibrary
                key={moduleRefreshKey}
                currentCode={moduleLibraryCode || ''}
                onInsertModule={onInsertModule}
                uiLanguage={uiLanguage}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
