// Default per-project simulation state (run status and console output).
// Waveform and netlist are loaded from the backend by the simulation panel.
export const EMPTY_SIM = {
  status: 'idle', // 'idle' | 'running' | 'finished' | 'error'
  runId: null,
  simulationId: null,
  logSummary: '',
  logDetails: '',
  hasWaveform: false,
  hasNetlist: false,
};
