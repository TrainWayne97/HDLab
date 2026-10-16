import { useEffect, useState } from 'react';
import BottomDock from './BottomDock';
import WaveformViewer from './WaveformViewer';
import NetlistViewer from './NetlistViewer';
import Basys3Board from './Basys3Board';
import useSimArtifacts from '../hooks/useSimArtifacts';

/**
 * Dock of the editor page for a single project: run button, console output,
 * waveform and netlist of the last simulation, and the Basys3 board simulation.
 * The run state lives in `sim`.
 */
export default function SimulationPanel({ sim, onRun, onSynthesizeBoard, designKey, apiCall, t, uiLanguage }) {
  const { status, runId, simulationId, logSummary, logDetails, hasWaveform, hasNetlist } = sim;
  const running = status === 'running';
  const done = status === 'finished' || status === 'error';
  const [activeTab, setActiveTab] = useState('output');
  const { vcd, netlistUrl, netlistTree, loadNetlistModule, loading } = useSimArtifacts(apiCall, done ? simulationId : null, { hasWaveform, hasNetlist });

  // A finished run with a waveform opens the waveform, anything else the console output.
  useEffect(() => {
    if (status === 'finished' && hasWaveform) setActiveTab('waveform');
    else if (status !== 'idle') setActiveTab('output');
  }, [status, runId, hasWaveform]);

  const tabs = [
    {
      id: 'output',
      label: t.log,
      content: logSummary || running ? (
        <div className="dock-output">
          <pre className="log-output">{running ? t.running : logSummary}</pre>
          {logDetails && (
            <details>
              <summary>{t.logDetails}</summary>
              <pre className="log-output">{logDetails}</pre>
            </details>
          )}
        </div>
      ) : (
        <div className="wb-empty">{t.outputEmpty}</div>
      ),
    },
    {
      id: 'waveform',
      label: t.tabWaveform,
      ready: !!vcd,
      content: (
        <WaveformViewer vcdText={vcd} uiLanguage={uiLanguage} emptyMessage={loading ? t.loadingWave : t.waveformEmpty} />
      ),
    },
    {
      id: 'netlist',
      label: t.tabNetlist,
      ready: !!netlistUrl,
      content: (
        <NetlistViewer
          svgUrl={netlistUrl}
          hierarchy={netlistTree}
          loadModule={loadNetlistModule}
          uiLanguage={uiLanguage}
          emptyMessage={loading ? t.loadingWave : t.netlistEmpty}
        />
      ),
    },
    {
      id: 'board',
      label: t.tabBoard,
      content: (
        <Basys3Board
          onSynthesize={onSynthesizeBoard}
          designKey={designKey}
          active={activeTab === 'board'}
          uiLanguage={uiLanguage}
        />
      ),
    },
  ];

  return (
    <BottomDock
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      uiLanguage={uiLanguage}
      leading={(
        <button type="button" className="wb-btn dock-run-btn" onClick={onRun} disabled={running}>
          {running ? t.running : `▶ ${t.run}`}
        </button>
      )}
    />
  );
}
