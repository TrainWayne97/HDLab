import React from 'react';
import hdlabLogo from '../assets/HDLab_logo_green+black.svg';
import './Topbar.css';

export default function Topbar({ onLogin, onSettings, onHelp }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <img src={hdlabLogo} className="topbar-logo" alt="HDLab Logo" />
        <span className="topbar-title">HDLab</span>
      </div>
      <nav className="topbar-menu">
        <button onClick={onHelp}>Hilfe</button>
        <button onClick={onSettings}>Einstellungen</button>
        <button onClick={onLogin}>Login</button>
      </nav>
    </header>
  );
}
