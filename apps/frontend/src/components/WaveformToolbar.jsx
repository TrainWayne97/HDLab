import React, { useState } from 'react';

const TRANSLATIONS = {
  de: {
    zoomIn: 'Zoom +',
    zoomOut: 'Zoom -',
    zoomReset: 'Reset',
    showAll: 'Alle anzeigen',
    hideAll: 'Alle ausblenden',
    search: 'Signal suchen...',
    settings: '⚙️ Einstellungen',
    export: '💾 Exportieren',
  },
  en: {
    zoomIn: 'Zoom +',
    zoomOut: 'Zoom -',
    zoomReset: 'Reset',
    showAll: 'Show all',
    hideAll: 'Hide all',
    search: 'Search signals...',
    settings: '⚙️ Settings',
    export: '💾 Export',
  }
};

export default function WaveformToolbar({
  zoom,
  setZoom,
  onShowAll,
  onHideAll,
  onExport,
  onSearch,
  uiLanguage
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 10));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.2));
  const handleZoomReset = () => setZoom(1);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch?.(term);
  };

  return (
    <div className="waveform-toolbar">
      <button onClick={handleZoomOut} title="Zoom Out">
        <span>🔍−</span> {t.zoomOut}
      </button>
      <button onClick={handleZoomIn} title="Zoom In">
        <span>🔍+</span> {t.zoomIn}
      </button>
      <button onClick={handleZoomReset} title="Reset Zoom">
        <span>↺</span> {t.zoomReset}
      </button>

      <div style={{ width: '1px', background: '#cbd5e0', margin: '0 0.5rem' }}></div>

      <button onClick={onShowAll}>
        <span>👁️</span> {t.showAll}
      </button>
      <button onClick={onHideAll}>
        <span>🙈</span> {t.hideAll}
      </button>

      <div style={{ width: '1px', background: '#cbd5e0', margin: '0 0.5rem' }}></div>

      <div className="waveform-search">
        <span>🔎</span>
        <input
          type="text"
          placeholder={t.search}
          value={searchTerm}
          onChange={handleSearch}
          aria-label="Search signals"
        />
      </div>

      <div className="waveform-toolbar-spacer"></div>

      <button onClick={onExport} title="Export Waveform">
        {t.export}
      </button>
    </div>
  );
}
