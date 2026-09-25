// Default per-project simulation state (run status, console output, waveform viewer).
export const EMPTY_SIM = {
  status: 'idle', // 'idle' | 'running' | 'finished' | 'error'
  runId: null,
  simulationId: null,
  logSummary: '',
  logDetails: '',
  waveformUrl: null,
  waveformPreview: '',
  waveformVisible: false,
  waveformLoading: false,
  waveformViewMode: 'signal',
  waveZoom: 1,
  selectedWaveSignalIds: [],
};
