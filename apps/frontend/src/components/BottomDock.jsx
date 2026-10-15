import { useState } from 'react';
import useDragSize from '../hooks/useDragSize';
import useFullscreen from '../hooks/useFullscreen';
import './Workbench.css';

const TRANSLATIONS = {
  de: { collapse: 'Einklappen', expand: 'Ausklappen', resize: 'Höhe anpassen', enterFullscreen: 'Vollbild', exitFullscreen: 'Vollbild beenden (Esc)' },
  en: { collapse: 'Collapse', expand: 'Expand', resize: 'Resize', enterFullscreen: 'Fullscreen', exitFullscreen: 'Exit fullscreen (Esc)' },
};

/**
 * Resizable, collapsible panel at the bottom of the workbench with tabs (output, waveform, netlist).
 * It can also be switched to fullscreen (Escape leaves it again).
 * `tabs`: [{ id, label, ready, content }] - `ready` shows a dot when the tab has fresh content.
 * All tab contents stay mounted, so e.g. the waveform zoom survives switching tabs.
 * `leading` is rendered in the header before the tabs (e.g. the run button).
 * `collapsed` / `onCollapsedChange` make the collapsed state controlled; without them the dock
 * keeps it itself and starts expanded.
 */
export default function BottomDock({ tabs, activeTab, onTabChange, leading, collapsed: collapsedProp, onCollapsedChange, uiLanguage }) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  const [height, startResize] = useDragSize({
    storageKey: 'hdlab-dock-height',
    initial: 260,
    min: 120,
    max: () => window.innerHeight * 0.7,
    axis: 'y',
    invert: true,
  });
  const [ownCollapsed, setOwnCollapsed] = useState(false);
  const collapsed = collapsedProp ?? ownCollapsed;
  const setCollapsed = onCollapsedChange ?? setOwnCollapsed;
  const [fullscreen, setFullscreen] = useFullscreen();
  // In fullscreen the dock is never collapsed and fills the window instead of its drag height
  const showCollapsed = collapsed && !fullscreen;

  return (
    <section
      className={`dock ${showCollapsed ? 'collapsed' : ''} ${fullscreen ? 'is-fullscreen' : ''}`}
      style={showCollapsed || fullscreen ? undefined : { height }}
    >
      <div className="dock-resizer" onPointerDown={startResize} title={t.resize} aria-hidden="true" />
      <div className="dock-header">
        {leading}
        <div className="dock-tabs" role="tablist">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={tab.id === activeTab}
              className={`wb-btn dock-tab ${tab.id === activeTab ? 'active' : ''}`}
              onClick={() => {
                onTabChange(tab.id);
                setCollapsed(false);
              }}
            >
              {tab.label}
              {tab.ready && <span className="dock-tab-dot" />}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="wb-btn wb-icon-btn dock-header-btn"
          onClick={() => {
            if (!fullscreen) setCollapsed(false);
            setFullscreen(!fullscreen);
          }}
          title={fullscreen ? t.exitFullscreen : t.enterFullscreen}
          aria-label={fullscreen ? t.exitFullscreen : t.enterFullscreen}
          aria-pressed={fullscreen}
        >
          {fullscreen ? '✕' : '⛶'}
        </button>
        {!fullscreen && (
          <button
            type="button"
            className="wb-btn wb-icon-btn dock-header-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? t.expand : t.collapse}
            aria-label={collapsed ? t.expand : t.collapse}
            aria-expanded={!collapsed}
          >
            {collapsed ? '▴' : '▾'}
          </button>
        )}
      </div>
      <div className="dock-body">
        {tabs.map(tab => (
          <div key={tab.id} role="tabpanel" className="dock-panel" hidden={tab.id !== activeTab}>
            {tab.content}
          </div>
        ))}
      </div>
    </section>
  );
}
