import { memo, useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import verilogLanguage from 'react-syntax-highlighter/dist/esm/languages/prism/verilog';
import { vs, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import useNotes from '../hooks/useNotes';
import useDragSize from '../hooks/useDragSize';
import {
  HIGHLIGHT_COLORS, applyEdits, continueList, insertLink, remarkNoteSource,
  toggleCode, toggleInline, toggleLines, toggleMark, toggleTask,
} from '../utils/noteMarkdown';
import {
  formatEdits, hasHighlight, highlightEdits, readSelection, removeHighlightEdits, selectionSourceRange,
} from '../utils/noteSelection';
import './Workbench.css';
import './NotesPanel.css';

SyntaxHighlighter.registerLanguage('verilog', verilogLanguage);

const TRANSLATIONS = {
  de: {
    title: 'Notizen',
    close: 'Schließen',
    resize: 'Breite ändern (Doppelklick: zurücksetzen)',
    allNotes: 'Alle Notizen',
    newNote: 'Neue Notiz',
    deleteNote: 'Notiz löschen',
    confirmDelete: title => `Notiz „${title}" wirklich löschen?`,
    untitled: 'Unbenannte Notiz',
    loading: 'Wird geladen…',
    empty: 'Noch keine Notizen',
    emptyHint: 'Notizen schreibst du in Markdown. Sie werden in deinem Konto gespeichert.',
    createFirst: 'Erste Notiz anlegen',
    view: 'Ansicht',
    modes: { edit: 'Bearbeiten', split: 'Geteilt', preview: 'Vorschau' },
    save: {
      saved: '✓ Gespeichert',
      pending: 'Nicht gespeichert',
      saving: 'Speichert…',
      error: 'Speichern fehlgeschlagen',
      tooLarge: 'Zu groß zum Speichern (max. 256 KB)',
    },
    retry: 'Erneut versuchen',
    undo: 'Rückgängig (Strg+Z)',
    errors: {
      load: 'Notizen konnten nicht geladen werden.',
      loadNote: 'Notiz konnte nicht geladen werden.',
      create: 'Notiz konnte nicht angelegt werden.',
      full: 'Maximal 200 Notizen - bitte alte löschen.',
      delete: 'Notiz konnte nicht gelöscht werden.',
    },
    dismiss: 'Ausblenden',
    editorLabel: 'Markdown der Notiz',
    placeholder: '# Titel\n\nSchreibe hier in Markdown: **fett**, *kursiv*, - Listen, - [ ] Aufgaben, `Code` …',
    previewEmpty: 'Nichts anzuzeigen.',
    previewHint: 'Text auswählen, um ihn zu markieren oder zu formatieren · Checkboxen sind anklickbar',
    formatting: 'Formatierung',
    format: {
      heading: 'Überschrift (# → ## → ### → keine)',
      bold: 'Fett (Strg+B)',
      italic: 'Kursiv (Strg+I)',
      strike: 'Durchgestrichen',
      highlight: 'Markieren',
      bullet: 'Aufzählung',
      number: 'Nummerierte Liste',
      task: 'Aufgabenliste',
      quote: 'Zitat',
      code: 'Code (mehrzeilig: Codeblock)',
      link: 'Link (Strg+K)',
    },
    placeholders: { bold: 'fett', italic: 'kursiv', strike: 'durchgestrichen', highlight: 'markiert', code: 'code', link: 'Linktext' },
    selectionTools: 'Auswahl formatieren',
    colors: { yellow: 'gelb', green: 'grün', blue: 'blau', pink: 'rosa' },
    highlightIn: color => `Markieren (${color})`,
    removeHighlight: 'Markierung entfernen',
    editInSource: 'Im Markdown bearbeiten',
  },
  en: {
    title: 'Notes',
    close: 'Close',
    resize: 'Resize (double click: reset)',
    allNotes: 'All notes',
    newNote: 'New note',
    deleteNote: 'Delete note',
    confirmDelete: title => `Really delete the note "${title}"?`,
    untitled: 'Untitled note',
    loading: 'Loading…',
    empty: 'No notes yet',
    emptyHint: 'Notes are written in Markdown and saved in your account.',
    createFirst: 'Create the first note',
    view: 'View',
    modes: { edit: 'Edit', split: 'Split', preview: 'Preview' },
    save: {
      saved: '✓ Saved',
      pending: 'Not saved',
      saving: 'Saving…',
      error: 'Saving failed',
      tooLarge: 'Too large to save (max. 256 KB)',
    },
    retry: 'Retry',
    undo: 'Undo (Ctrl+Z)',
    errors: {
      load: 'Notes could not be loaded.',
      loadNote: 'The note could not be loaded.',
      create: 'The note could not be created.',
      full: 'At most 200 notes - please delete old ones.',
      delete: 'The note could not be deleted.',
    },
    dismiss: 'Dismiss',
    editorLabel: 'Markdown of the note',
    placeholder: '# Title\n\nWrite in Markdown here: **bold**, *italic*, - lists, - [ ] tasks, `code` …',
    previewEmpty: 'Nothing to show.',
    previewHint: 'Select text to highlight or format it · checkboxes can be clicked',
    formatting: 'Formatting',
    format: {
      heading: 'Heading (# → ## → ### → none)',
      bold: 'Bold (Ctrl+B)',
      italic: 'Italic (Ctrl+I)',
      strike: 'Strikethrough',
      highlight: 'Highlight',
      bullet: 'Bulleted list',
      number: 'Numbered list',
      task: 'Task list',
      quote: 'Quote',
      code: 'Code (several lines: code block)',
      link: 'Link (Ctrl+K)',
    },
    placeholders: { bold: 'bold', italic: 'italic', strike: 'strikethrough', highlight: 'highlighted', code: 'code', link: 'link text' },
    selectionTools: 'Format selection',
    colors: { yellow: 'yellow', green: 'green', blue: 'blue', pink: 'pink' },
    highlightIn: color => `Highlight (${color})`,
    removeHighlight: 'Remove highlight',
    editInSource: 'Edit in Markdown',
  },
};

const MODE_KEY = 'hdlab-notes-mode';
const MODES = ['edit', 'split', 'preview'];
// From this drawer width on, "split" shows editor and preview side by side instead of stacked
const SIDE_BY_SIDE_WIDTH = 760;
const REMARK_PLUGINS = [remarkGfm, remarkNoteSource];
const CODE_LANGUAGES = { verilog: 'verilog', systemverilog: 'verilog', sv: 'verilog', v: 'verilog' };
const CODE_BLOCK_STYLE = {
  margin: 0,
  padding: '10px 12px',
  borderRadius: 6,
  border: '1px solid var(--wb-border)',
  background: 'var(--notes-code-bg)',
  fontSize: '0.85rem',
};

// null = separator
const FORMAT_BUTTONS = [
  ['heading', 'H'], ['bold', 'B'], ['italic', 'I'], ['strike', 'S'], ['highlight', <mark key="m">A</mark>], null,
  ['bullet', '•'], ['number', '1.'], ['task', '☑'], ['quote', '❝'], null,
  ['code', '</>'], ['link', '🔗'],
];

function formatChange(id, text, start, end, placeholders) {
  switch (id) {
    case 'bold': return toggleInline(text, start, end, '**', placeholders.bold);
    case 'italic': return toggleInline(text, start, end, '*', placeholders.italic);
    case 'strike': return toggleInline(text, start, end, '~~', placeholders.strike);
    case 'highlight': return toggleMark(text, start, end, placeholders.highlight);
    case 'code': return toggleCode(text, start, end, placeholders.code);
    case 'link': return insertLink(text, start, end, placeholders.link);
    default: return toggleLines(text, start, end, id);
  }
}

function formatDate(iso, uiLanguage) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(uiLanguage === 'en' ? 'en-GB' : 'de-DE', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Scrolls the textarea so that `offset` is in view, a third from the top (measured with a mirror element). */
function scrollTextareaTo(textarea, offset) {
  const style = window.getComputedStyle(textarea);
  const mirror = document.createElement('div');
  for (const prop of ['boxSizing', 'width', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'fontFamily', 'fontSize',
    'fontWeight', 'lineHeight', 'letterSpacing', 'tabSize', 'overflowWrap', 'wordBreak']) {
    mirror.style[prop] = style[prop];
  }
  Object.assign(mirror.style, {
    position: 'absolute', visibility: 'hidden', top: '0', left: '-9999px', height: 'auto', whiteSpace: 'pre-wrap',
  });
  mirror.textContent = textarea.value.slice(0, offset);
  document.body.appendChild(mirror);
  const y = mirror.scrollHeight;
  mirror.remove();
  textarea.scrollTop = Math.max(0, y - textarea.clientHeight / 3);
}

// Only re-rendered when the Markdown changes, not on every selection change of the panel
const NotePreview = memo(function NotePreview({ source, components }) {
  return <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={components}>{source}</ReactMarkdown>;
});

export default function NotesPanel({ uiLanguage = 'de', darkMode = false, onClose }) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  const { notes, activeId, content, error, saveState, select, create, remove, edit, flush, clearError } = useNotes();

  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem(MODE_KEY);
    return MODES.includes(saved) ? saved : 'split';
  });
  const [listOpen, setListOpen] = useState(false);
  const [selectionBar, setSelectionBar] = useState(null); // {top, bottom, center, canFormat, hasMark}
  const [canUndo, setCanUndo] = useState(false);
  const [width, onResizeStart, resetWidth] = useDragSize({
    storageKey: 'hdlab-notes-width',
    initial: 520,
    min: 340,
    max: () => Math.max(340, window.innerWidth - 120),
    axis: 'x',
    invert: true,
  });

  const textareaRef = useRef(null);
  const previewRef = useRef(null);
  const previewWrapRef = useRef(null);
  const selectionBarRef = useRef(null);
  const undoStack = useRef([]); // contents before edits made in the preview
  const pointerDown = useRef(false);
  const focusEditor = useRef(false);
  const sourceSelection = useRef(null); // [from, to] to select in the textarea once it is shown

  // While typing, the preview may render an older version; edits in the preview use the
  // offsets of what is rendered and are only applied if that is still the current content.
  const previewSource = useDeferredValue(content ?? '');
  const contentRef = useRef(content);
  contentRef.current = content;
  const previewSourceRef = useRef(previewSource);
  previewSourceRef.current = previewSource;

  const activeNote = notes?.find(n => n._id === activeId);
  const title = activeNote?.title || t.untitled;

  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    undoStack.current = [];
    setCanUndo(false);
    setSelectionBar(null);
  }, [activeId]);

  // Focus the editor after creating a note
  useEffect(() => {
    if (focusEditor.current && content !== null && textareaRef.current) {
      focusEditor.current = false;
      textareaRef.current.focus();
    }
  }, [activeId, content, mode]);

  // ── Textarea ──

  const handleTextChange = useCallback(next => {
    if (undoStack.current.length) {
      undoStack.current = [];
      setCanUndo(false);
    }
    edit(next);
  }, [edit]);

  const applyToTextarea = ({ from, to, insert, selStart, selEnd }) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const expected = textarea.value.slice(0, from) + insert + textarea.value.slice(to);
    textarea.focus();
    textarea.setSelectionRange(from, to);
    // insertText keeps the browser's undo history (Ctrl+Z) intact
    const inserted = document.execCommand('insertText', false, insert);
    if (!inserted || textarea.value !== expected) flushSync(() => handleTextChange(expected));
    textarea.setSelectionRange(selStart, selEnd);
  };

  const runFormat = id => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { value, selectionStart, selectionEnd } = textarea;
    applyToTextarea(formatChange(id, value, selectionStart, selectionEnd, t.placeholders));
  };

  const handleTextKeyDown = e => {
    const textarea = e.currentTarget;
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
      const id = { b: 'bold', i: 'italic', k: 'link' }[e.key.toLowerCase()];
      if (id) {
        e.preventDefault();
        runFormat(id);
      }
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.nativeEvent.isComposing
        && textarea.selectionStart === textarea.selectionEnd) {
      const change = continueList(textarea.value, textarea.selectionStart);
      if (change) {
        e.preventDefault();
        applyToTextarea(change);
      }
    }
  };

  const selectPendingSource = useCallback(() => {
    const textarea = textareaRef.current;
    const range = sourceSelection.current;
    if (!textarea || !range) return;
    sourceSelection.current = null;
    textarea.focus({ preventScroll: true });
    textarea.setSelectionRange(range[0], range[1]);
    scrollTextareaTo(textarea, range[0]);
  }, []);

  useEffect(() => {
    selectPendingSource();
  }, [mode, selectPendingSource]);

  // ── Preview ──

  const commitPreviewEdit = useCallback(next => {
    const current = contentRef.current;
    if (current === null || next === current) return;
    undoStack.current.push(current);
    if (undoStack.current.length > 100) undoStack.current.shift();
    setCanUndo(true);
    edit(next);
  }, [edit]);

  const undoPreviewEdit = () => {
    if (!undoStack.current.length) return;
    const previous = undoStack.current.pop();
    setCanUndo(undoStack.current.length > 0);
    edit(previous);
  };

  const toggleTaskRef = useRef(null);
  toggleTaskRef.current = checkbox => {
    const item = checkbox.closest('li[data-s]');
    const source = previewSourceRef.current;
    if (!item || source !== contentRef.current) return;
    const next = toggleTask(source, Number(item.dataset.s));
    if (next !== null) commitPreviewEdit(next);
  };

  const components = useMemo(() => ({
    a: function NoteLink({ href, title, children }) {
      return <a href={href} title={title} target="_blank" rel="noopener noreferrer">{children}</a>;
    },
    // Task list checkboxes (the only inputs Markdown produces) toggle [ ] / [x] in the source
    input: function NoteTaskCheckbox({ checked }) {
      return <input type="checkbox" checked={!!checked} onChange={e => toggleTaskRef.current(e.currentTarget)} />;
    },
    pre: function NoteCodeBlock({ node }) {
      const code = node.children.find(child => child.tagName === 'code');
      const text = String(code?.children[0]?.value ?? '').replace(/\n$/, '');
      const className = (code?.properties.className || []).join(' ');
      const language = CODE_LANGUAGES[/language-(\S+)/.exec(className)?.[1].toLowerCase()];
      return (
        <div className="notes-code" data-s={code?.properties.dataS} data-e={code?.properties.dataE}>
          {language ? (
            <SyntaxHighlighter
              language={language}
              style={darkMode ? vscDarkPlus : vs}
              customStyle={CODE_BLOCK_STYLE}
              codeTagProps={{ style: { fontFamily: "'Courier New', monospace" } }}
            >
              {text}
            </SyntaxHighlighter>
          ) : (
            <pre><code>{text}</code></pre>
          )}
        </div>
      );
    },
  }), [darkMode]);

  const updateSelectionBar = useCallback(() => {
    const preview = previewRef.current;
    const wrap = previewWrapRef.current;
    const selection = preview && wrap && readSelection(preview, previewSourceRef.current);
    if (!selection) {
      setSelectionBar(null);
      return;
    }
    const rect = selection.range.getBoundingClientRect();
    const box = preview.getBoundingClientRect();
    if (rect.bottom < box.top || rect.top > box.bottom) {
      setSelectionBar(null); // scrolled out of view
      return;
    }
    setSelectionBar({
      top: rect.top,
      bottom: rect.bottom,
      center: rect.left + rect.width / 2,
      canFormat: selection.groups.length > 0,
      hasMark: hasHighlight(selection),
    });
  }, []);

  // Show the selection toolbar once a selection is made (after the mouse button is released)
  useEffect(() => {
    if (mode === 'edit') return undefined;
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateSelectionBar);
    };
    const onSelectionChange = () => {
      if (!pointerDown.current) schedule();
    };
    const onPointerUp = () => {
      if (!pointerDown.current) return;
      pointerDown.current = false;
      schedule();
    };
    document.addEventListener('selectionchange', onSelectionChange);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('selectionchange', onSelectionChange);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [mode, updateSelectionBar]);

  // Place the toolbar above the selection (below if there is no room), within the preview
  useLayoutEffect(() => {
    const bar = selectionBarRef.current;
    const wrap = previewWrapRef.current;
    if (!bar || !wrap || !selectionBar) return;
    const box = wrap.getBoundingClientRect();
    const above = selectionBar.top - box.top - bar.offsetHeight - 8;
    const top = above >= 0 ? above : Math.min(selectionBar.bottom - box.top + 8, box.height - bar.offsetHeight - 4);
    const left = Math.min(Math.max(selectionBar.center - box.left - bar.offsetWidth / 2, 4), box.width - bar.offsetWidth - 4);
    bar.style.top = `${Math.max(0, top)}px`;
    bar.style.left = `${Math.max(0, left)}px`;
  }, [selectionBar]);

  const clearSelection = () => {
    window.getSelection()?.removeAllRanges();
    setSelectionBar(null);
  };

  const runSelectionEdit = makeEdits => {
    const preview = previewRef.current;
    const source = previewSourceRef.current;
    if (!preview || source !== contentRef.current) return;
    const selection = readSelection(preview, source);
    const edits = selection ? makeEdits(selection, source) : [];
    clearSelection();
    if (edits.length) commitPreviewEdit(applyEdits(source, edits));
  };

  const showInSource = () => {
    const preview = previewRef.current;
    const selection = preview && readSelection(preview, previewSourceRef.current);
    const range = selection && selectionSourceRange(preview, selection);
    clearSelection();
    if (!range) return;
    sourceSelection.current = range;
    if (mode === 'preview') setMode('split');
    else selectPendingSource();
  };

  const handlePreviewKeyDown = e => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && canUndo) {
      e.preventDefault();
      undoPreviewEdit();
    }
  };

  // ── Notes ──

  const handleCreate = async () => {
    setListOpen(false);
    if (await create()) {
      focusEditor.current = true;
      if (mode === 'preview') setMode('split');
    }
  };

  const handleDelete = () => {
    if (activeId && window.confirm(t.confirmDelete(title))) remove(activeId);
  };

  const handlePanelKeyDown = e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      flush();
    }
  };

  const renderSelectionBar = () => (
    <div
      className="notes-selbar"
      ref={selectionBarRef}
      role="toolbar"
      aria-label={t.selectionTools}
      onMouseDown={e => e.preventDefault()}
    >
      {selectionBar.canFormat && HIGHLIGHT_COLORS.map(color => (
        <button
          key={color}
          type="button"
          className={`wb-btn notes-swatch notes-swatch-${color}`}
          title={t.highlightIn(t.colors[color])}
          aria-label={t.highlightIn(t.colors[color])}
          onClick={() => runSelectionEdit((selection, source) => highlightEdits(selection, source, color))}
        />
      ))}
      {selectionBar.hasMark && (
        <button
          type="button"
          className="wb-btn notes-selbar-unmark"
          title={t.removeHighlight}
          aria-label={t.removeHighlight}
          onClick={() => runSelectionEdit(removeHighlightEdits)}
        >
          <mark>A</mark>
        </button>
      )}
      {selectionBar.canFormat && (
        <>
          <span className="notes-selbar-sep" />
          {['bold', 'italic', 'strike'].map(kind => (
            <button
              key={kind}
              type="button"
              className={`wb-btn notes-format-${kind}`}
              title={t.format[kind]}
              aria-label={t.format[kind]}
              onClick={() => runSelectionEdit((selection, source) => formatEdits(selection, source, kind))}
            >
              {kind[0].toUpperCase()}
            </button>
          ))}
        </>
      )}
      <span className="notes-selbar-sep" />
      <button type="button" className="wb-btn" title={t.editInSource} aria-label={t.editInSource} onClick={showInSource}>
        ✎
      </button>
    </div>
  );

  const renderNote = () => (
    <>
      <div className="notes-bar">
        <div className="notes-picker">
          <button
            type="button"
            className="wb-btn notes-picker-btn"
            onClick={() => setListOpen(open => !open)}
            aria-haspopup="listbox"
            aria-expanded={listOpen}
            title={t.allNotes}
          >
            <span className="notes-picker-title">{title}</span>
            <span className="notes-picker-count">{notes.length}</span>
            <span aria-hidden="true">▾</span>
          </button>
          {listOpen && (
            <>
              <div className="notes-list-backdrop" onClick={() => setListOpen(false)} aria-hidden="true" />
              <ul className="notes-list" role="listbox" aria-label={t.allNotes}>
                {notes.map(note => (
                  <li key={note._id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={note._id === activeId}
                      className={`wb-btn notes-list-item ${note._id === activeId ? 'active' : ''}`}
                      onClick={() => {
                        select(note._id);
                        setListOpen(false);
                      }}
                    >
                      <span className="notes-list-title">{note.title || t.untitled}</span>
                      <span className="notes-list-date">{formatDate(note.updatedAt, uiLanguage)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <button type="button" className="wb-btn wb-icon-btn notes-bar-btn" onClick={handleCreate} title={t.newNote} aria-label={t.newNote}>
          +
        </button>
        <button
          type="button"
          className="wb-btn wb-icon-btn notes-bar-btn notes-danger"
          onClick={handleDelete}
          disabled={!activeId}
          title={t.deleteNote}
          aria-label={t.deleteNote}
        >
          🗑
        </button>
      </div>

      <div className="notes-modebar">
        <div className="notes-modes" role="group" aria-label={t.view}>
          {MODES.map(m => (
            <button
              key={m}
              type="button"
              className={`wb-btn notes-mode ${mode === m ? 'active' : ''}`}
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
            >
              {t.modes[m]}
            </button>
          ))}
        </div>
        {mode !== 'edit' && canUndo && (
          <button type="button" className="wb-btn wb-icon-btn" onClick={undoPreviewEdit} title={t.undo} aria-label={t.undo}>
            ↶
          </button>
        )}
        <span className={`notes-save notes-save-${saveState}`} role="status">
          {t.save[saveState]}
          {saveState === 'error' && (
            <button type="button" className="wb-btn notes-retry" onClick={flush}>{t.retry}</button>
          )}
        </span>
      </div>

      {mode !== 'preview' && (
        <div className="notes-format" role="toolbar" aria-label={t.formatting}>
          {FORMAT_BUTTONS.map((button, i) => (button ? (
            <button
              key={button[0]}
              type="button"
              className={`wb-btn wb-icon-btn notes-format-${button[0]}`}
              title={t.format[button[0]]}
              aria-label={t.format[button[0]]}
              disabled={content === null}
              onMouseDown={e => e.preventDefault()}
              onClick={() => runFormat(button[0])}
            >
              {button[1]}
            </button>
          ) : <span key={`sep-${i}`} className="notes-format-sep" />))}
        </div>
      )}

      <div className={`notes-body notes-body-${mode}${width >= SIDE_BY_SIDE_WIDTH ? ' wide' : ''}`}>
        {content === null ? (
          error !== 'loadNote' && <div className="notes-loading">{t.loading}</div>
        ) : (
          <>
            {mode !== 'preview' && (
              <textarea
                ref={textareaRef}
                className="notes-textarea"
                value={content}
                onChange={e => handleTextChange(e.target.value)}
                onKeyDown={handleTextKeyDown}
                placeholder={t.placeholder}
                aria-label={t.editorLabel}
              />
            )}
            {mode !== 'edit' && (
              <div className="notes-preview-wrap" ref={previewWrapRef}>
                <div
                  className="notes-preview"
                  ref={previewRef}
                  tabIndex={-1}
                  onPointerDown={() => { pointerDown.current = true; }}
                  onScroll={updateSelectionBar}
                  onKeyDown={handlePreviewKeyDown}
                >
                  {previewSource.trim()
                    ? <NotePreview source={previewSource} components={components} />
                    : <p className="notes-preview-empty">{t.previewEmpty}</p>}
                </div>
                {selectionBar && renderSelectionBar()}
                <div className="notes-preview-hint">{t.previewHint}</div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );

  return (
    <aside className="notes-drawer" style={{ width }} aria-label={t.title} onKeyDown={handlePanelKeyDown}>
      <div className="notes-resize" onPointerDown={onResizeStart} onDoubleClick={resetWidth} title={t.resize} />
      <div className="notes-header">
        <span>{t.title}</span>
        <button type="button" className="wb-btn notes-close" onClick={onClose} title={t.close} aria-label={t.close}>
          ✕
        </button>
      </div>

      {error && (
        <div className="notes-error" role="alert">
          <span>{t.errors[error]}</span>
          <button type="button" className="wb-btn" onClick={clearError} title={t.dismiss} aria-label={t.dismiss}>✕</button>
        </div>
      )}

      {notes === null ? (
        error !== 'load' && <div className="notes-loading">{t.loading}</div>
      ) : notes.length === 0 ? (
        <div className="notes-empty">
          <p className="notes-empty-title">{t.empty}</p>
          <p>{t.emptyHint}</p>
          <button type="button" className="wb-btn notes-primary" onClick={handleCreate}>+ {t.createFirst}</button>
        </div>
      ) : renderNote()}
    </aside>
  );
}
