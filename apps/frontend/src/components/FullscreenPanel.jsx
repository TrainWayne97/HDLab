import { useEffect, useState } from 'react';
import './FullscreenPanel.css';

const TRANSLATIONS = {
  de: { enter: 'Vollbild', exit: 'Vollbild beenden (Esc)' },
  en: { enter: 'Fullscreen', exit: 'Exit fullscreen (Esc)' },
};

/**
 * Wraps an editor or code block and lets the user expand it to cover the whole window.
 * The children stay mounted when toggling, so editor state (cursor, undo history) is kept.
 * `children` may be a function receiving `isFullscreen`, e.g. to switch the editor height.
 * `floating` puts the toggle button over the content instead of in a toolbar row.
 */
export default function FullscreenPanel({ label, title, floating = false, uiLanguage, className = '', children }) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const onKeyDown = e => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen]);

  const toggleButton = (
    <button
      type="button"
      className="fullscreen-toggle"
      onClick={() => setIsFullscreen(v => !v)}
      title={isFullscreen ? t.exit : t.enter}
      aria-label={isFullscreen ? t.exit : t.enter}
      aria-pressed={isFullscreen}
    >
      {isFullscreen ? '✕' : '⛶'}
    </button>
  );
  const showToolbar = !floating || isFullscreen;

  return (
    <div className={`fullscreen-panel ${isFullscreen ? 'is-fullscreen' : ''} ${className}`}>
      {showToolbar ? (
        <div className="fullscreen-panel-toolbar">
          <span className="fullscreen-panel-title">{isFullscreen ? (title || label) : label}</span>
          {toggleButton}
        </div>
      ) : (
        <div className="fullscreen-panel-floating">{toggleButton}</div>
      )}
      <div className="fullscreen-panel-body">
        {typeof children === 'function' ? children(isFullscreen) : children}
      </div>
    </div>
  );
}
