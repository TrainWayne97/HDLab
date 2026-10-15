import { useEffect, useState } from 'react';

/**
 * Fullscreen state for a panel that covers the window via CSS (position: fixed).
 * While active, Escape leaves fullscreen and the page behind doesn't scroll.
 * @returns {[boolean, (value: boolean | ((prev: boolean) => boolean)) => void]}
 */
export default function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const onKeyDown = e => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen]);

  return [isFullscreen, setIsFullscreen];
}
