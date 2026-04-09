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

export default function Topbar({ onLogin, onSettings, onHelp, uiLanguage, setUiLanguage }) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  return (
    <header className="topbar">
      <div className="topbar-left">
        <img src={hdlabLogo} className="topbar-logo" alt="HDLab Logo" />
        <span className="topbar-title">HDLab</span>
      </div>
      <nav className="topbar-menu">
        <button onClick={onHelp}>{t.help}</button>
        <button onClick={onSettings}>{t.settings}</button>
        <button onClick={onLogin}>{t.login}</button>
        <select
          value={uiLanguage}
          onChange={e => setUiLanguage(e.target.value)}
          style={{ marginLeft: 16, padding: '0.2em 0.5em', borderRadius: 4 }}
          aria-label={t.language}
        >
          <option value="de">{t.german}</option>
          <option value="en">{t.english}</option>
        </select>
      </nav>
    </header>
  );
}
