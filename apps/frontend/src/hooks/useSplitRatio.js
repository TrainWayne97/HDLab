import { useState } from 'react';

const read = (key, fallback) => {
  try {
    const saved = Number(localStorage.getItem(key));
    return saved > 0 && saved < 1 ? saved : fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, String(value));
  } catch {
    // Private window or blocked storage: the split just isn't remembered
  }
};

/**
 * Horizontal split of a container into two panes, as the share (0..1) of the first pane.
 * Unlike a pixel width it still fits after the window was resized. Remembered in localStorage.
 * `minStart`/`minEnd`: minimum widths (px) of the two panes while dragging.
 * Returns [ratio, onPointerDown, reset] - put the handler on the splitter between the panes.
 */
export default function useSplitRatio({ storageKey, containerRef, initial = 0.5, minStart = 0, minEnd = 0 }) {
  const [ratio, setRatio] = useState(() => read(storageKey, initial));

  const onPointerDown = e => {
    const box = containerRef.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    e.preventDefault();
    let last = ratio;
    const lo = Math.min(0.5, minStart / box.width);
    const hi = Math.max(0.5, 1 - minEnd / box.width);
    const onMove = ev => {
      last = Math.min(Math.max((ev.clientX - box.left) / box.width, lo), hi);
      setRatio(last);
    };
    const onUp = () => {
      write(storageKey, last);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.classList.remove('wb-resizing', 'wb-resizing-x');
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    // Same as useDragSize: resize cursor, no text selection / editor hover while dragging
    document.body.classList.add('wb-resizing', 'wb-resizing-x');
  };

  const reset = () => {
    write(storageKey, null);
    setRatio(initial);
  };

  return [ratio, onPointerDown, reset];
}
