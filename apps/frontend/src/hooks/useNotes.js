import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { deriveTitle } from '../utils/noteMarkdown';

const ACTIVE_NOTE_KEY = 'hdlab-notes-active';
const SAVE_DELAY_MS = 800;
const MAX_SAVE_WAIT_MS = 5000;
const RETRY_DELAY_MS = 10000;

/**
 * Notes of the logged-in user (backend /notes) with autosave.
 *
 * Contents are cached for the session, so switching back to a note shows edits that are not
 * saved yet. Saves run one after another (never two requests for the same note at once), and
 * a failed save is retried.
 *
 * error: 'load' | 'loadNote' | 'create' | 'full' | 'delete' | null
 * saveState: 'saved' | 'pending' | 'saving' | 'error' | 'tooLarge'
 */
export default function useNotes() {
  const { apiCall } = useAuth();
  const api = useRef(apiCall);
  api.current = apiCall;

  const [notes, setNotes] = useState(null); // [{_id, title, createdAt, updatedAt}], null while loading
  const [activeId, setActiveId] = useState(() => localStorage.getItem(ACTIVE_NOTE_KEY));
  const [content, setContent] = useState(null); // of the active note, null while loading
  const [error, setError] = useState(null);
  const [saveState, setSaveState] = useState('saved');

  const notesRef = useRef(notes);
  notesRef.current = notes;
  const activeRef = useRef(activeId);
  activeRef.current = activeId;

  const cache = useRef(new Map()); // id -> content
  const pending = useRef(new Map()); // id -> {content, title}, not saved yet
  const saving = useRef(null); // promise of the running save loop
  const timer = useRef(null);
  const dirtySince = useRef(0);
  const alive = useRef(true);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = null;
    // The running loop also saves what was edited in the meantime
    if (saving.current || !pending.current.size) return saving.current || Promise.resolve();

    saving.current = (async () => {
      let failure = null;
      while (pending.current.size && !failure) {
        const [id, body] = pending.current.entries().next().value;
        pending.current.delete(id);
        dirtySince.current = 0;
        setSaveState('saving');
        try {
          const res = await api.current(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(body) });
          if (res.ok) {
            const { updatedAt } = await res.json();
            setNotes(list => list?.map(n => (n._id === id ? { ...n, updatedAt } : n)));
          } else if (res.status !== 404) { // 404: deleted in the meantime, nothing to save
            failure = res.status === 400 || res.status === 413 ? 'tooLarge' : 'error';
          }
        } catch (err) {
          console.error('Error saving note:', err);
          failure = 'error';
        }
        if (failure && !pending.current.has(id)) pending.current.set(id, body);
      }
      saving.current = null;
      setSaveState(failure || 'saved');
      // Too large: retrying is pointless, the next edit tries again
      if (failure === 'error' && alive.current) timer.current = setTimeout(flush, RETRY_DELAY_MS);
    })();
    return saving.current;
  }, []);

  // List of notes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.current('/notes');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const list = await res.json();
        if (cancelled) return;
        setNotes(list);
        setActiveId(id => (list.some(n => n._id === id) ? id : list[0]?._id ?? null));
      } catch (err) {
        console.error('Error loading notes:', err);
        if (!cancelled) setError('load');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Content of the active note
  const listLoaded = notes !== null;
  useEffect(() => {
    if (!listLoaded) return undefined;
    if (!activeId) {
      localStorage.removeItem(ACTIVE_NOTE_KEY);
      setContent(null);
      return undefined;
    }
    localStorage.setItem(ACTIVE_NOTE_KEY, activeId);
    if (cache.current.has(activeId)) {
      setContent(cache.current.get(activeId));
      return undefined;
    }
    setContent(null);
    let cancelled = false;
    (async () => {
      try {
        const res = await api.current(`/notes/${activeId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const note = await res.json();
        if (!cache.current.has(activeId)) cache.current.set(activeId, note.content);
        if (!cancelled) setContent(cache.current.get(activeId));
      } catch (err) {
        console.error('Error loading note:', err);
        if (!cancelled) setError('loadNote');
      }
    })();
    return () => { cancelled = true; };
  }, [activeId, listLoaded]);

  // Save on close / logout; warn before leaving the page while something is not saved
  useEffect(() => {
    const onBeforeUnload = e => {
      if (!pending.current.size && !saving.current) return;
      for (const [id, body] of pending.current) {
        api.current(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(body), keepalive: true }).catch(() => {});
      }
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    alive.current = true;
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      alive.current = false;
      flush();
    };
  }, [flush]);

  const edit = useCallback(next => {
    const id = activeRef.current;
    if (!id) return;
    cache.current.set(id, next);
    setContent(next);
    const title = deriveTitle(next);
    pending.current.set(id, { content: next, title });
    setNotes(list => list?.map(n => (n._id === id && n.title !== title ? { ...n, title } : n)));
    setSaveState('pending');

    const now = Date.now();
    if (!dirtySince.current) dirtySince.current = now;
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, now - dirtySince.current > MAX_SAVE_WAIT_MS ? 0 : SAVE_DELAY_MS);
  }, [flush]);

  const select = useCallback(id => {
    flush();
    setError(null);
    setActiveId(id);
  }, [flush]);

  const create = useCallback(async () => {
    setError(null);
    try {
      const res = await api.current('/notes', { method: 'POST', body: JSON.stringify({ content: '', title: '' }) });
      if (!res.ok) {
        setError(res.status === 400 ? 'full' : 'create');
        return null;
      }
      const note = await res.json();
      cache.current.set(note._id, note.content);
      const { _id, title, createdAt, updatedAt } = note;
      setNotes(list => [{ _id, title, createdAt, updatedAt }, ...(list || [])]);
      setActiveId(_id);
      return _id;
    } catch (err) {
      console.error('Error creating note:', err);
      setError('create');
      return null;
    }
  }, []);

  const remove = useCallback(async id => {
    setError(null);
    try {
      const res = await api.current(`/notes/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('delete');
      return;
    }
    pending.current.delete(id);
    cache.current.delete(id);
    const list = notesRef.current || [];
    const index = list.findIndex(n => n._id === id);
    const rest = list.filter(n => n._id !== id);
    setNotes(rest);
    if (activeRef.current === id) setActiveId(rest[Math.min(index, rest.length - 1)]?._id ?? null);
    if (!pending.current.size && !saving.current) setSaveState('saved');
  }, []);

  return {
    notes, activeId, content, error, saveState,
    select, create, remove, edit, flush,
    clearError: () => setError(null),
  };
}
