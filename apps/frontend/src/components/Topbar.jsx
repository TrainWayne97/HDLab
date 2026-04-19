import React from 'react';
import hdlabLogo from '../assets/HDLab_logo_green+black.svg';
import './Topbar.css';

const TRANSLATIONS = {
  de: {
    help: 'Hilfe',
    settings: 'Einstellungen',
    login: 'Login',
    language: 'Sprache',
    german: 'Deutsch',
    english: 'Englisch',
  },
  en: {
    help: 'Help',
    settings: 'Settings',
    login: 'Login',
    language: 'Language',
    german: 'German',
    english: 'English',
  }
};

export default function Topbar({ onLogin, onSettings, onHelp, onHome, uiLanguage, setUiLanguage, onToggleSidebar }) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
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
        <button onClick={onHelp}>{t.help}</button>
        <button onClick={onSettings}>{t.settings}</button>
        <button onClick={onLogin}>{t.login}</button>
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
