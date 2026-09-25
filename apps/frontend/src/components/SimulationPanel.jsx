import { useMemo } from 'react';
import WaveformToolbar from './WaveformToolbar';
import { parseVcd, formatWaveValue } from '../utils/vcd';

/**
 * Run button, console output and waveform viewer for a single project.
 * Stateless: everything lives in `sim`, changes go through `onChange(patch)`,
 * where patch is an object or a function (prevSim) => object.
 */
export default function SimulationPanel({ sim, onChange, onRun, t, uiLanguage }) {
  const {
    status, logSummary, logDetails,
    waveformUrl, waveformPreview, waveformVisible, waveformLoading, waveformViewMode,
    waveZoom, selectedWaveSignalIds,
  } = sim;
  const running = status === 'running';

  const parsedWave = useMemo(
    () => (waveformPreview ? parseVcd(waveformPreview) : { signals: [], maxTime: 1 }),
    [waveformPreview]
  );
  const allWaveSignals = parsedWave.signals;
  const selectedWaveSignals = allWaveSignals.filter(sig => selectedWaveSignalIds.includes(sig.id));
  const timelineWidth = Math.round(900 * waveZoom);

  const setSelectedWaveSignalIds = updater => onChange(prev => ({
    selectedWaveSignalIds: typeof updater === 'function' ? updater(prev.selectedWaveSignalIds) : updater,
  }));

  async function toggleWaveformPreview() {
    if (!waveformUrl) return;
    if (waveformVisible) {
      onChange({ waveformVisible: false });
      return;
    }

    if (waveformPreview) {
      onChange({ waveformVisible: true });
      return;
    }

    onChange({ waveformLoading: true });
    try {
      const res = await fetch(waveformUrl);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const text = await res.text();
      // Preselect the first signals of the freshly loaded waveform.
      const ids = parseVcd(text).signals.map(sig => sig.id);
      onChange({ waveformPreview: text, selectedWaveSignalIds: ids.slice(0, 8), waveformVisible: true });
    } catch (err) {
      onChange({ waveformPreview: `${t.error}${err.message}`, waveformVisible: true });
    } finally {
      onChange({ waveformLoading: false });
    }
  }

  return (
    <>
      <button className="run-btn" onClick={onRun} disabled={running}>
        {running ? t.running : t.run}
      </button>
      <h3>{t.log}</h3>
      <pre className="log-output" style={{ maxHeight: 180, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{logSummary}</pre>
      {logDetails && (
        <details style={{ marginTop: 12 }}>
          <summary>{t.logDetails}</summary>
          <pre className="log-output" style={{ maxHeight: 240, overflowY: 'auto', whiteSpace: 'pre-wrap', marginTop: 8 }}>{logDetails}</pre>
        </details>
      )}
      {waveformUrl && (
        <div style={{ marginTop: 10 }}>
          <a href={waveformUrl} target="_blank" rel="noreferrer" style={{ marginRight: 12 }}>{t.downloadWave}</a>
          <button type="button" onClick={toggleWaveformPreview}>
            {waveformVisible ? t.hideWave : t.viewWave}
          </button>
        </div>
      )}

      {waveformLoading && (
        <div style={{ marginTop: 8 }}>{t.loadingWave}</div>
      )}

      {waveformVisible && waveformPreview && (
        <div style={{ marginTop: 12 }}>
          <WaveformToolbar
            zoom={waveZoom}
            setZoom={zoom => onChange(prev => ({ waveZoom: typeof zoom === 'function' ? zoom(prev.waveZoom) : zoom }))}
            onShowAll={() => setSelectedWaveSignalIds(allWaveSignals.map(s => s.id))}
            onHideAll={() => setSelectedWaveSignalIds([])}
            onSearch={(query) => {
              if (!query) {
                setSelectedWaveSignalIds(allWaveSignals.map(s => s.id));
              } else {
                const filtered = allWaveSignals
                  .filter(s => s.name.toLowerCase().includes(query.toLowerCase()))
                  .map(s => s.id);
                setSelectedWaveSignalIds(filtered);
              }
            }}
            onExport={() => {
              // Export as PNG (simple screenshot functionality)
              alert(uiLanguage === 'de' ? 'Export-Funktion wird noch implementiert.' : 'Export functionality coming soon.');
            }}
            uiLanguage={uiLanguage}
          />
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => onChange({ waveformViewMode: 'signal' })}
              style={{ fontWeight: waveformViewMode === 'signal' ? 'bold' : 'normal' }}
            >
              {t.waveSignalView}
            </button>
            <button
              type="button"
              onClick={() => onChange({ waveformViewMode: 'raw' })}
              style={{ fontWeight: waveformViewMode === 'raw' ? 'bold' : 'normal' }}
            >
              {t.waveRawView}
            </button>
          </div>

          {waveformViewMode === 'signal' ? (
            allWaveSignals.length > 0 ? (
              <div>
                <div style={{ marginBottom: 6, color: '#1f2937', fontSize: 12, fontWeight: 600 }}>{t.waveSignals}</div>

                <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', background: '#f8fafc', padding: 8, borderRadius: 6 }}>
                  {allWaveSignals.map(sig => {
                    const isSelected = selectedWaveSignalIds.includes(sig.id);
                    if (!isSelected) {
                      return (
                        <div key={sig.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, opacity: 0.55 }}>
                          <div style={{ width: 260, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'monospace', fontSize: 12, paddingRight: 8, color: '#111827' }}>
                            <input
                              type="checkbox"
                              checked={false}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedWaveSignalIds(prev => [...prev, sig.id]);
                                }
                              }}
                            />
                            <span title={sig.name} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#111827' }}>{sig.name}</span>
                            <span style={{ color: '#4b5563' }}>[{sig.width}]</span>
                          </div>
                          <div style={{ color: '#4b5563', fontSize: 12 }}>{t.waveHidden}</div>
                        </div>
                      );
                    }

                    const rowEvents = sig.events;
                    return (
                      <div key={sig.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ width: 260, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'monospace', fontSize: 12, overflow: 'hidden', paddingRight: 8, color: '#111827' }}>
                          <input
                            type="checkbox"
                            checked
                            onChange={() => setSelectedWaveSignalIds(prev => prev.filter(id => id !== sig.id))}
                          />
                          <span title={sig.name} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#111827', fontWeight: 600 }}>{sig.name}</span>
                          <span style={{ color: '#4b5563' }}>[{sig.width}]</span>
                        </div>
                        <div style={{ position: 'relative', width: timelineWidth, height: 30, border: '1px solid #666', background: '#111' }}>
                          {rowEvents.map((ev, idx) => {
                            const nextTime = idx < rowEvents.length - 1 ? rowEvents[idx + 1].time : parsedWave.maxTime;
                            const left = Math.round((ev.time / parsedWave.maxTime) * timelineWidth);
                            const width = Math.max(1, Math.round(((nextTime - ev.time) / parsedWave.maxTime) * timelineWidth));
                            const isHigh = ev.value === '1';
                            const isLow = ev.value === '0';
                            const top = isHigh ? 3 : isLow ? 18 : 10;
                            const segmentHeight = 6;
                            const color = isHigh ? '#5dd39e' : isLow ? '#6cb6ff' : '#f2cc60';
                            const label = formatWaveValue(ev.value, sig.width);
                            const prev = idx > 0 ? rowEvents[idx - 1] : null;
                            const prevIsHigh = prev?.value === '1';
                            const prevIsLow = prev?.value === '0';
                            const prevTop = prev ? (prevIsHigh ? 3 : prevIsLow ? 18 : 10) : top;
                            const hasTransition = !!prev && prev.value !== ev.value;
                            const transitionTop = Math.min(prevTop, top);
                            const transitionHeight = Math.abs(prevTop - top) + segmentHeight;
                            const isRisingEdge = !!prev && prev.value === '0' && ev.value === '1';
                            const isFallingEdge = !!prev && prev.value === '1' && ev.value === '0';
                            const transitionColor = isRisingEdge ? '#22c55e' : isFallingEdge ? '#ef4444' : '#d1d5db';

                            return [
                              hasTransition ? (
                                <div
                                  key={`${sig.id}-${idx}-transition`}
                                  style={{
                                    position: 'absolute',
                                    left: Math.max(0, left - 1),
                                    top: transitionTop,
                                    width: 2,
                                    height: transitionHeight,
                                    background: transitionColor
                                  }}
                                />
                              ) : null,
                              <div key={`${sig.id}-${idx}-segment`} style={{ position: 'absolute', left, width, top, height: segmentHeight, background: color, border: '1px solid #000', overflow: 'hidden' }} title={`t=${ev.time}, v=${ev.value}`}>
                                {sig.width > 1 && width >= 34 && (
                                  <span style={{ fontSize: 10, color: '#000', paddingLeft: 2, lineHeight: `${segmentHeight}px`, userSelect: 'none' }}>{label}</span>
                                )}
                              </div>
                            ];
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedWaveSignals.length === 0 && (
                  <div style={{ marginTop: 8, color: '#374151' }}>{t.noSignalSelected}</div>
                )}

                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10 }}>
                  <label style={{ minWidth: 90, color: '#1f2937', fontWeight: 600 }}>{t.waveZoom}: {waveZoom.toFixed(1)}x</label>
                  <input
                    type="range"
                    min="0.5"
                    max="4"
                    step="0.1"
                    value={waveZoom}
                    onChange={e => onChange({ waveZoom: Number(e.target.value) })}
                    style={{ width: 260 }}
                  />
                </div>
              </div>
            ) : (
              <div>{t.noSignalData}</div>
            )
          ) : (
            <pre className="log-output" style={{ maxHeight: 320, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{waveformPreview}</pre>
          )}
        </div>
      )}
    </>
  );
}
