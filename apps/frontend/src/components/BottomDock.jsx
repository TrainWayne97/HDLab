import { useState } from 'react';
import useDragSize from '../hooks/useDragSize';
import './Workbench.css';

const TRANSLATIONS = {
  de: { collapse: 'Einklappen', expand: 'Ausklappen', resize: 'Höhe anpassen' },
  en: { collapse: 'Collapse', expand: 'Expand', resize: 'Resize' },
};

/**
 * Resizable, collapsible panel at the bottom of the workbench with tabs (output, waveform, netlist).
 * `tabs`: [{ id, label, ready, content }] - `ready` shows a dot when the tab has fresh content.
 * All tab contents stay mounted, so e.g. the waveform zoom survives switching tabs.
 * `leading` is rendered in the header before the tabs (e.g. the run button).
 */
export default function BottomDock({ tabs, activeTab, onTabChange, leading, uiLanguage }) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  const [height, startResize] = useDragSize({
    storageKey: 'hdlab-dock-height',
    initial: 260,
    min: 120,
    max: () => window.innerHeight * 0.7,
    axis: 'y',
    invert: true,
  });
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className={`dock ${collapsed ? 'collapsed' : ''}`} style={collapsed ? undefined : { height }}>
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
          className="wb-btn wb-icon-btn dock-collapse"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? t.expand : t.collapse}
          aria-label={collapsed ? t.expand : t.collapse}
          aria-expanded={!collapsed}
        >
          {collapsed ? '▴' : '▾'}
        </button>
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
