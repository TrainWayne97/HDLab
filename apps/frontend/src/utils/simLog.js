// Condenses the raw simulation log (Verilator/Cocotb output) into a short summary
// for the output tab plus details shown on demand.

// Boilerplate Verilator prints below every warning/error
const DIAGNOSTIC_BOILERPLATE = /^\s*\.\.\. (For (warning|error) description|Use "\/\* verilator lint_off|See the manual)/;

/**
 * Splits off Verilator diagnostics: a "%Warning-…"/"%Error…" line followed by its
 * indented context lines (notes, source excerpt, caret). Returns the kept diagnostic
 * lines and a flag per input line whether it belongs to a diagnostic.
 */
function extractDiagnostics(lines) {
  const diagnostics = [];
  const inDiagnostic = lines.map(() => false);
  let inBlock = false;
  lines.forEach((line, i) => {
    if (/^%(Warning|Error)/.test(line)) {
      inBlock = true;
    } else if (!inBlock || !/^\s/.test(line)) {
      inBlock = false;
      return;
    }
    inDiagnostic[i] = true;
    if (!DIAGNOSTIC_BOILERPLATE.test(line)) diagnostics.push(line);
  });
  return { diagnostics, inDiagnostic };
}

/**
 * @param {string} rawLog
 * @param {string} noResultMessage - shown if the log is empty
 * @param {(count: number) => string} [warningsHint] - summary line for Verilator warnings
 * @returns {{ summary: string, details: string }}
 */
export function summarizeSimulationLog(rawLog, noResultMessage, warningsHint = count => `${count} warning(s)`) {
  if (!rawLog || !rawLog.trim()) {
    return {
      summary: noResultMessage,
      details: ''
    };
  }

  const lines = rawLog
    .split(/\r?\n/)
    .map(line => line.trimEnd())
    .filter(line => line.length > 0);

  const { diagnostics, inDiagnostic } = extractDiagnostics(lines);
  const warningCount = lines.filter(line => /^%Warning/.test(line)).length;
  // Program output without the diagnostics' context lines (source excerpts could match the patterns below)
  const outputLines = lines.filter((line, i) => !inDiagnostic[i]);

  const relevant = [];
  const addUnique = line => {
    if (line && !relevant.includes(line)) {
      relevant.push(line);
    }
  };

  const passLine = outputLines.find(line => /\bpassed\b/i.test(line)) || null;
  const testsLine = outputLines.find(line => /TESTS=\d+ PASS=\d+ FAIL=\d+ SKIP=\d+/.test(line)) || null;
  const errorLines = lines.filter((line, i) =>
    (!inDiagnostic[i] || /^%Error/.test(line)) &&
    /%Error|^ERROR\b|ERROR:|\bFAIL\b|Traceback|AssertionError|Exception/i.test(line)
  );
  const verboseInfoLines = outputLines.filter(line =>
    /INFO\s+cocotb/i.test(line) &&
    !/Running on Verilator|Seeding Python|Initialized cocotb|Running tests|running\s+tb\.|regression\s+.*\bpassed\b/i.test(line)
  );

  verboseInfoLines.slice(0, 4).forEach(addUnique);
  if (passLine) addUnique(passLine);
  if (testsLine) addUnique(testsLine);
  errorLines.slice(0, 8).forEach(addUnique);

  const warningLine = warningCount > 0 ? warningsHint(warningCount) : null;
  // Warnings first in the details, then errors or the beginning of the output (without repeating diagnostics)
  const withDiagnostics = rest => {
    if (diagnostics.length === 0) return rest.join('\n');
    const remaining = rest.filter(line => !diagnostics.includes(line));
    return [...diagnostics.slice(0, 80), ...(remaining.length > 0 ? ['', ...remaining] : [])].join('\n');
  };

  if (relevant.length === 0) {
    const filtered = outputLines.filter(line =>
      !/^(rm -f results\.xml|"make"|make\[\d+\]|mkdir -p|Entering directory|Leaving directory|COCOTB_|-\s+V e r i l a t i o n|Verilator:|g\+\+|python3 |echo "" >|make -C |\/usr\/local\/bin\/verilator)/.test(line)
    );

    const fallback = filtered.slice(0, 6).join('\n') || outputLines.slice(-6).join('\n');
    return {
      summary: [fallback || (warningLine ? '' : noResultMessage), warningLine].filter(Boolean).join('\n'),
      details: withDiagnostics(outputLines.slice(0, 40))
    };
  }

  return {
    summary: [...relevant.slice(0, 4), warningLine].filter(Boolean).join('\n'),
    details: withDiagnostics(errorLines.length > 0 ? errorLines.slice(0, 20) : outputLines.slice(0, 40))
  };
}
