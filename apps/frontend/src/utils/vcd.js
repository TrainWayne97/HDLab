// VCD parsing and value formatting for the waveform viewer.

export function parseVcd(text) {
  const lines = text.split(/\r?\n/);
  const scopes = [];
  const signalMap = new Map();
  const events = new Map();
  let time = 0;
  let maxTimestamp = 0;
  let inDefs = true;

  const ensureEventList = id => {
    if (!events.has(id)) events.set(id, []);
    return events.get(id);
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('$scope')) {
      const parts = line.split(/\s+/);
      if (parts[2]) scopes.push(parts[2]);
      continue;
    }

    if (line.startsWith('$upscope')) {
      scopes.pop();
      continue;
    }

    if (line.startsWith('$var')) {
      const parts = line.split(/\s+/);
      const width = Number(parts[2]) || 1;
      const id = parts[3];
      const name = parts[4] || id;
      const fullName = [...scopes, name].join('.');
      signalMap.set(id, { id, name: fullName, width });
      ensureEventList(id);
      continue;
    }

    if (line.startsWith('$enddefinitions')) {
      inDefs = false;
      continue;
    }

    if (line.startsWith('#')) {
      const t = Number(line.slice(1));
      if (!Number.isNaN(t)) {
        time = t;
        if (t > maxTimestamp) maxTimestamp = t;
      }
      continue;
    }

    if (inDefs) continue;

    if (/^[01xXzZ].+/.test(line)) {
      const value = line[0].toLowerCase();
      const id = line.slice(1).trim();
      if (!signalMap.has(id)) continue;
      ensureEventList(id).push({ time, value });
      continue;
    }

    const vecMatch = line.match(/^b([01xXzZ]+)\s+(\S+)$/);
    if (vecMatch) {
      const value = vecMatch[1].toLowerCase();
      const id = vecMatch[2];
      if (!signalMap.has(id)) continue;
      ensureEventList(id).push({ time, value });
    }
  }

  const signals = Array.from(signalMap.values())
    .map(sig => ({ ...sig, events: events.get(sig.id) || [] }))
    .filter(sig => sig.events.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  let maxTime = 0;
  for (const sig of signals) {
    const last = sig.events[sig.events.length - 1];
    if (last && last.time > maxTime) maxTime = last.time;
  }

  // Use the final VCD timestamp as timeline end so the last signal level stays visible.
  if (maxTimestamp > maxTime) {
    maxTime = maxTimestamp;
  }

  // VCD dumpers only emit a new "#<time>" marker when a value actually changes, so if
  // nothing changes after the last event, the file ends right there and the final segment
  // would render with zero width. Pad the timeline by the most recent inter-event gap so
  // the last segment gets a similar width to the one before it instead of collapsing.
  const distinctTimes = Array.from(new Set([0, ...signals.flatMap(sig => sig.events.map(ev => ev.time))]))
    .sort((a, b) => a - b);
  if (distinctTimes.length >= 2 && distinctTimes[distinctTimes.length - 1] >= maxTime) {
    const lastGap = distinctTimes[distinctTimes.length - 1] - distinctTimes[distinctTimes.length - 2];
    if (lastGap > 0) maxTime += lastGap;
  }

  return {
    signals,
    maxTime: Math.max(maxTime, 1)
  };
}

export function formatWaveValue(value, width) {
  if (!value) return '';
  if (width <= 1) return value;
  if (!/^[01]+$/.test(value)) return value;

  try {
    const hexLen = Math.max(1, Math.ceil(width / 4));
    const hex = parseInt(value, 2).toString(16).toUpperCase().padStart(hexLen, '0');
    return `0x${hex}`;
  } catch {
    return value;
  }
}
