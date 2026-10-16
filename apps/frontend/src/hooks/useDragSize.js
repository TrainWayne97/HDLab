import { useRef, useState } from 'react';

const resolve = v => (typeof v === 'function' ? v() : v);

/**
 * Size (px) of a panel that can be resized by dragging a handle; remembered in localStorage.
 * `invert` is for handles on the top/left edge, where dragging towards the origin grows the panel.
 * Returns [size, onPointerDown, reset] - put the handler on the drag handle; reset() goes back
 * to `initial` and forgets the stored size (e.g. on double click).
 */
export default function useDragSize({ storageKey, initial, min, max, axis = 'y', invert = false }) {
  const clamp = v => Math.round(Math.min(Math.max(v, resolve(min)), Math.max(resolve(min), resolve(max))));
  const [size, setSize] = useState(() => {
    const saved = Number(localStorage.getItem(storageKey));
    return clamp(saved > 0 ? saved : resolve(initial));
  });
  const sizeRef = useRef(size);
  sizeRef.current = size;

  const onPointerDown = e => {
    e.preventDefault();
    const startPos = axis === 'x' ? e.clientX : e.clientY;
    const startSize = sizeRef.current;
    const onMove = ev => {
      const delta = (axis === 'x' ? ev.clientX : ev.clientY) - startPos;
      setSize(clamp(startSize + (invert ? -delta : delta)));
    };
    const onUp = () => {
      // Only a size the user chose is remembered - not one clamped by a small window.
      localStorage.setItem(storageKey, String(sizeRef.current));
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.classList.remove('wb-resizing', `wb-resizing-${axis}`);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    // Keeps the resize cursor and stops text selection / editor hover while dragging.
    document.body.classList.add('wb-resizing', `wb-resizing-${axis}`);
  };

  const reset = () => {
    localStorage.removeItem(storageKey);
    // Not limited by `max`: that depends on the current layout, which may be cramped right now
    setSize(Math.round(Math.max(resolve(min), resolve(initial))));
  };

  return [size, onPointerDown, reset];
}
