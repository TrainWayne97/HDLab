import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import verilogLanguage from 'react-syntax-highlighter/dist/esm/languages/prism/verilog';
import { vs, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAuth } from '../contexts/AuthContext';
import FullscreenPanel from './FullscreenPanel';
import BottomDock from './BottomDock';
import WaveformViewer from './WaveformViewer';
import NetlistViewer from './NetlistViewer';
import useDragSize from '../hooks/useDragSize';
import useSimArtifacts from '../hooks/useSimArtifacts';
import { slugify } from '../utils/tutorialParser';
import './Tutorial.css';
import './Workbench.css';

SyntaxHighlighter.registerLanguage('verilog', verilogLanguage);

const CODE_BLOCK_LIGHT_STYLE = {
  margin: '12px 0',
  padding: '12px',
  borderRadius: '6px',
  border: '1px solid #e5e7eb',
  background: '#f3f4f6',
};

const CODE_BLOCK_DARK_STYLE = {
  margin: '12px 0',
  padding: '12px',
  borderRadius: '6px',
  border: '1px solid #334155',
  background: '#0f172a',
};

// Applied on top of the light/dark block style while a code example is shown fullscreen.
const CODE_BLOCK_FULLSCREEN_STYLE = {
  margin: 0,
  minHeight: '100%',
  boxSizing: 'border-box',
  borderRadius: 0,
  border: 'none',
  fontSize: '1rem',
};

const TRANSLATIONS = {
  de: {
    back: '← Zurück zur Übersicht',
    nextLesson: 'Nächste Lektion →',
    previousLesson: '← Vorherige Lektion',
    submit: 'Lösung einreichen',
    reset: '↺ Zurücksetzen',
    resetConfirm: 'Möchten Sie die Übung wirklich zurücksetzen? Ihr aktueller Code im Editor geht dadurch verloren.',
    save: 'Speichern',
    saved: '✓ Gespeichert',
    saving: 'Speichert...',
    validating: 'Validiere...',
    passed: '✓ Richtig gelöst!',
    passedWithModule: '✓ Richtig gelöst! 📚 Modul wurde automatisch gespeichert.',
    failed: '✗ Nicht korrekt',
    errors: 'Fehler:',
    showFullLog: 'Vollständige Ausgabe anzeigen',
    hideFullLog: 'Vollständige Ausgabe verbergen',
    testbench: 'Testbench (versteckt)',
    yourCode: 'Dein Code',
    testbenchTitle: 'Testbench',
    solutionTitle: 'Lösung',
    codeExample: 'Code-Beispiel',
    showTestbench: 'Testbench anzeigen',
    hideTestbench: 'Testbench verbergen',
    solution: 'Lösung anzeigen',
    hideSolution: 'Lösung verbergen',
    solutionPasswordPrompt: 'Bitte Passwort eingeben, um die Lösung anzuzeigen:',
    solutionPasswordWrong: 'Falsches Passwort.',
    password: 'Passwort',
    holdToReveal: 'Gedrückt halten, um das Passwort anzuzeigen',
    confirm: 'Anzeigen',
    cancel: 'Abbrechen',
    loadingProgress: 'Lädt vorherigen Fortschritt...',
    progressLoaded: 'Fortschritt geladen',
    lastSaved: 'Zuletzt gespeichert:',
    lessonCompleted: '✓ Abgeschlossen',
    lessonNotCompleted: '○ Nicht abgeschlossen',
    previousLessonTitle: 'Vorherige Lektion',
    nextLessonTitle: 'Nächste Lektion',
    explanation: 'Erklärung',
    noExplanation: 'Keine Erklärung verfügbar',
    hint: 'Tipp',
    showHint: '💡 Tipp anzeigen',
    nextHint: '💡 Nächster Tipp',
    hideHints: 'Tipps verbergen',
    typeTheory: 'Theorie',
    typeExercise: 'Übung',
    typeProject: 'Projekt',
    tabOutput: 'Ausgabe',
    tabWaveform: 'Waveform',
    tabNetlist: 'Netlist',
    outputEmpty: 'Reiche deine Lösung ein – hier erscheinen danach das Ergebnis, die Waveform und die Netlist deines Moduls.',
    waveformEmpty: 'Noch keine Waveform. Sie wird beim Einreichen der Lösung erzeugt, sofern der Code kompiliert.',
    netlistEmpty: 'Noch keine Netlist. Sie wird beim Einreichen der Lösung erzeugt, sofern Yosys das Modul synthetisieren kann.',
    loadingArtifacts: 'Lade Waveform und Netlist…',
  },
  en: {
    back: '← Back to Overview',
    nextLesson: 'Next Lesson →',
    previousLesson: '← Previous Lesson',
    submit: 'Submit Solution',
    reset: '↺ Reset',
    resetConfirm: 'Do you really want to reset the exercise? Your current code in the editor will be lost.',
    save: 'Save',
    saved: '✓ Saved',
    saving: 'Saving...',
    validating: 'Validating...',
    passed: '✓ Correct!',
    passedWithModule: '✓ Correct! 📚 Module was automatically saved.',
    failed: '✗ Incorrect',
    errors: 'Errors:',
    showFullLog: 'Show full output',
    hideFullLog: 'Hide full output',
    testbench: 'Testbench (hidden)',
    yourCode: 'Your Code',
    testbenchTitle: 'Testbench',
    solutionTitle: 'Solution',
    codeExample: 'Code Example',
    showTestbench: 'Show Testbench',
    hideTestbench: 'Hide Testbench',
    solution: 'Show Solution',
    hideSolution: 'Hide Solution',
    solutionPasswordPrompt: 'Please enter the password to show the solution:',
    solutionPasswordWrong: 'Incorrect password.',
    password: 'Password',
    holdToReveal: 'Hold to reveal the password',
    confirm: 'Show',
    cancel: 'Cancel',
    loadingProgress: 'Loading previous progress...',
    progressLoaded: 'Progress loaded',
    lastSaved: 'Last saved:',
    lessonCompleted: '✓ Completed',
    lessonNotCompleted: '○ Not completed',
    previousLessonTitle: 'Previous lesson',
    nextLessonTitle: 'Next lesson',
    explanation: 'Explanation',
    noExplanation: 'No explanation available',
    hint: 'Hint',
    showHint: '💡 Show hint',
    nextHint: '💡 Next hint',
    hideHints: 'Hide hints',
    typeTheory: 'Theory',
    typeExercise: 'Exercise',
    typeProject: 'Project',
    tabOutput: 'Output',
    tabWaveform: 'Waveform',
    tabNetlist: 'Netlist',
    outputEmpty: 'Submit your solution – the result, the waveform and the netlist of your module will show up here.',
    waveformEmpty: 'No waveform yet. It is generated when you submit your solution, provided the code compiles.',
    netlistEmpty: 'No netlist yet. It is generated when you submit your solution, provided Yosys can synthesize the module.',
    loadingArtifacts: 'Loading waveform and netlist…',
  },
};

const hastText = node => (node.type === 'text' ? node.value : (node.children || []).map(hastText).join(''));

// Rehype plugin: gives the headings inside a lesson the ids the table of contents links to.
// `headingAnchors` comes from the parser ([{ base, slug }] in document order); `slug` is unique
// across the whole course, so a repeated heading like "Schnittstelle" resolves per lesson.
function rehypeHeadingIds(headingAnchors = []) {
  return (tree) => {
    const used = new Set();
    const visit = (node) => {
      if (node.type === 'element' && /^h[1-6]$/.test(node.tagName)) {
        const base = slugify(hastText(node));
        const index = headingAnchors.findIndex((h, i) => h.base === base && !used.has(i));
        if (index !== -1) {
          used.add(index);
          node.properties = { ...node.properties, id: headingAnchors[index].slug };
        }
        return;
      }
      (node.children || []).forEach(visit);
    };
    visit(tree);
  };
}

// Client-side gate only (not a real access control) - password is bundled in the frontend build.
const SOLUTION_PASSWORD = import.meta.env.VITE_TUTORIAL_SOLUTION_PASSWORD || 'verilog';

export default function TutorialLesson({
  lesson,
  lessonId,
  courseId = null,
  allLessonIds,
  anchorMap = {},
  scrollRef,
  onNextLesson,
  onPreviousLesson,
  onNavigateToLesson,
  scrollAnchor = null,
  onLessonCompleted,
  uiLanguage = 'de',
  editorTheme = 'vs-light',
  onModuleSaved,
  onRegisterInsert,
}) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  const { apiCall, hasRole } = useAuth();
  const isDarkTheme = editorTheme === 'vs-dark';
  
  // Handle both old format (object with .content) and new format (string)
  const exerciseTemplate = typeof lesson.exerciseTemplate === 'string' 
    ? lesson.exerciseTemplate 
    : lesson.exerciseTemplate?.content || '';
  const solution = typeof lesson.solution === 'string' 
    ? lesson.solution 
    : lesson.solution?.content || '';

  const [userCode, setUserCode] = useState(exerciseTemplate);
  const [validationStatus, setValidationStatus] = useState(null);
  const [validationErrors, setValidationErrors] = useState('');
  const [validationFullLog, setValidationFullLog] = useState('');
  const [showFullLog, setShowFullLog] = useState(false);
  const [showTestbench, setShowTestbench] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  // Password dialog in front of the solution: null = closed, otherwise the typed password
  const [passwordInput, setPasswordInput] = useState(null);
  const [passwordWrong, setPasswordWrong] = useState(false);
  // Only true while the eye button is held down
  const [revealPassword, setRevealPassword] = useState(false);
  // Hints are revealed one at a time
  const [shownHints, setShownHints] = useState(0);
  const [testbench, setTestbench] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [moduleAutoSaved, setModuleAutoSaved] = useState(false);
  // Simulation behind the last submission: { simulationId, hasWaveform, hasNetlist }
  const [simRun, setSimRun] = useState(null);
  const [dockTab, setDockTab] = useState('output');
  // Students start with the dock (output, waveform, netlist) folded away; staff see it right away.
  const [dockCollapsed, setDockCollapsed] = useState(() => !hasRole('admin', 'developer'));
  const { vcd, netlistUrl, netlistTree, loadNetlistModule, loading: artifactsLoading } = useSimArtifacts(apiCall, simRun?.simulationId, {
    hasWaveform: !!simRun?.hasWaveform,
    hasNetlist: !!simRun?.hasNetlist,
  });
  const [editorWidth, startEditorResize] = useDragSize({
    storageKey: 'hdlab-tutorial-editor-width',
    initial: () => window.innerWidth * 0.38,
    min: 320,
    max: () => window.innerWidth - 720,
    axis: 'x',
    invert: true,
  });
  // Code as it is stored on the server, so the auto-save only fires for real changes.
  const savedCodeRef = useRef('');

  // Fortschritt pro Kurs getrennt speichern (ohne courseId = Verilog-Tutorial)
  const progressUrl = `/tutorial/progress/${lessonId}${courseId ? `?course=${encodeURIComponent(courseId)}` : ''}`;

  const currentIndex = allLessonIds.indexOf(lessonId);
  const hasNext = currentIndex < allLessonIds.length - 1;
  const hasPrev = currentIndex > 0;

  // Load progress from backend when lesson changes
  useEffect(() => {
    const loadProgress = async () => {
      setIsLoadingProgress(true);
      try {
        const res = await apiCall(progressUrl);
        const data = await res.json();
        savedCodeRef.current = data.userCode || '';

        if (data.userCode) {
          setUserCode(data.userCode);
        } else {
          setUserCode(exerciseTemplate);
        }
        
        if (data.validationStatus) {
          setValidationStatus(data.validationStatus);
        }
        
        if (data.lastModified) {
          setLastSaved(new Date(data.lastModified));
        }
      } catch (err) {
        console.error('Error loading progress:', err);
        savedCodeRef.current = '';
        setUserCode(exerciseTemplate);
      } finally {
        setIsLoadingProgress(false);
      }
    };

    loadProgress();
    setValidationStatus(null);
    setValidationErrors('');
    setValidationFullLog('');
    setShowFullLog(false);
    setShowTestbench(false);
    setShowSolution(false);
    setShownHints(0);
    setPasswordInput(null);
    setModuleAutoSaved(false);
    setSimRun(null);
    setDockTab('output');
  }, [lessonId, progressUrl, exerciseTemplate, apiCall]);

  // Auto-save nach Änderung (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveProgress();
    }, 2000); // Speichere nach 2 Sekunden Inaktivität

    return () => clearTimeout(timer);
  }, [userCode]);

  // Save progress to backend
  const saveProgress = async () => {
    // Unchanged code must not be re-saved: the save below resets the lesson to "not completed",
    // which would un-solve an exercise just by opening it again.
    if (!userCode || userCode === exerciseTemplate || userCode === savedCodeRef.current) return;
    const codeToSave = userCode;

    setIsSaving(true);
    try {
      const res = await apiCall(progressUrl, {
        method: 'POST',
        body: JSON.stringify({
          userCode,
          solution: '',
          isCompleted: false,
          validationStatus: 'not-started',
        }),
      });

      if (res.ok) {
        savedCodeRef.current = codeToSave;
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error('Error saving progress:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Manual save button click
  const handleSaveManually = async () => {
    await saveProgress();
  };

  // Reset exercise editors (code + testbench) back to their original template
  const handleReset = () => {
    if (!window.confirm(t.resetConfirm)) return;
    setUserCode(exerciseTemplate);
    setTestbench(lesson.testbench || '');
  };

  // Show solution only after entering the correct password; hiding needs no password.
  // admin/developer accounts skip the password prompt entirely.
  const handleToggleSolution = () => {
    if (showSolution) {
      setShowSolution(false);
      return;
    }

    if (hasRole('admin', 'developer')) {
      setShowSolution(true);
      return;
    }

    setPasswordInput('');
    setPasswordWrong(false);
    setRevealPassword(false);
  };

  const closePasswordDialog = () => {
    setPasswordInput(null);
    setRevealPassword(false);
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    if (passwordInput !== SOLUTION_PASSWORD) {
      setPasswordWrong(true);
      return;
    }
    closePasswordDialog();
    setShowSolution(true);
  };

  // Holding the eye button (mouse, touch or Space/Enter) shows the password; letting go hides it.
  const revealHandlers = {
    onPointerDown: () => setRevealPassword(true),
    onPointerUp: () => setRevealPassword(false),
    onPointerLeave: () => setRevealPassword(false),
    onPointerCancel: () => setRevealPassword(false),
    onKeyDown: (e) => { if (e.key === ' ' || e.key === 'Enter') setRevealPassword(true); },
    onKeyUp: () => setRevealPassword(false),
    onBlur: () => setRevealPassword(false),
    onContextMenu: (e) => e.preventDefault(), // long press on touch devices
  };

  // Scrolls to a heading inside the current lesson; false if the lesson has no such heading.
  const scrollToHeading = (slug) => {
    const target = scrollRef?.current?.querySelector(`[id="${CSS.escape(slug)}"]`);
    if (!target) return false;
    target.scrollIntoView({ block: 'start' });
    return true;
  };

  // Opened through a link to one of this lesson's sub-headings: jump there once it is rendered.
  useEffect(() => {
    if (scrollAnchor) scrollToHeading(scrollAnchor);
  }, [lessonId, scrollAnchor]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Links im Inhaltsverzeichnis (z.B. "#01-was-ist-verilog") zeigen auf Kapitelüberschriften,
  // die als eigene Lektionen gerendert werden - kein Anker auf der aktuellen Seite. Statt
  // wirkungslos zu scrollen, navigieren wir hier direkt zur passenden Lektion - und bei
  // Zwischenüberschriften (z.B. "#vom-bit-zur-zahl") weiter zum Abschnitt in dieser Lektion.
  const handleContentLinkClick = (event, href) => {
    if (!href || !href.startsWith('#')) return; // externe Links normal verhalten lassen

    const slug = decodeURIComponent(href.slice(1));
    const targetLessonId = anchorMap[slug];
    event.preventDefault();
    if (targetLessonId === undefined) return;
    if (targetLessonId === lessonId && scrollToHeading(slug)) return;
    if (onNavigateToLesson) onNavigateToLesson(targetLessonId, slug);
  };

  // Insert module from library into editor
  const handleInsertModule = (moduleCode) => {
    setUserCode((prev) => {
      if (!prev.includes(moduleCode)) {
        return prev + '\n\n' + moduleCode;
      }
      return prev;
    });
  };

  // Register insert handler with parent (Topbar drawer)
  useEffect(() => {
    if (onRegisterInsert) onRegisterInsert(handleInsertModule);
    return () => { if (onRegisterInsert) onRegisterInsert(null); };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    console.log('[TutorialLesson] Lesson loaded:', {
      id: lesson.id,
      title: lesson.title,
      type: lesson.type || 'theory',
      hasExplanation: !!lesson.explanation,
      explanationLength: lesson.explanation?.length || 0,
      hasExerciseTemplate: !!exerciseTemplate,
      hasSolution: !!solution,
      hasTestbench: !!lesson.testbench,
      duration_min: lesson.duration_min || '?',
      difficulty: lesson.difficulty || 'beginner',
    });

    // Use testbench from parsed lesson data
    setTestbench(lesson.testbench || '');
  }, [lesson, exerciseTemplate, solution]);

  const handleValidate = async () => {
    setValidationStatus('validating');

    try {
      // Send to backend for validation via tutorial validate endpoint
      const response = await apiCall('/tutorial/validate', {
        method: 'POST',
        body: JSON.stringify({
          lessonId,
          moduleCode: userCode,
          testbench,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      savedCodeRef.current = userCode;
      setSimRun(result.simulationId
        ? { simulationId: result.simulationId, hasWaveform: !!result.hasWaveform, hasNetlist: !!result.hasNetlist }
        : null);
      setDockTab(result.success && result.hasWaveform ? 'waveform' : 'output');

      if (result.success) {
        setValidationStatus('passed');
        setValidationErrors('');
        setValidationFullLog(result.fullLog || '');
        setModuleAutoSaved(false);
        
        // Save solution to backend
        await apiCall(progressUrl, {
          method: 'POST',
          body: JSON.stringify({
            userCode,
            solution: userCode,
            isCompleted: true,
            validationStatus: 'passed',
          }),
        });
        if (onLessonCompleted) onLessonCompleted(lessonId);

        // Auto-save as module in library (after successful validation)
        try {
          const moduleMatch = userCode.match(/module\s+(\w+)/);
          const moduleName = moduleMatch ? moduleMatch[1] : `lesson_${lessonId}_solution`;
          const description = `Lösung für Lektion ${lessonId}`;
          
          await apiCall('/modules', {
            method: 'POST',
            body: JSON.stringify({
              moduleName,
              code: userCode,
              description,
              tags: ['solution', `lesson_${lessonId}`, ...(courseId ? [courseId] : [])],
            }),
          });
          setModuleAutoSaved(true);
          // Notify parent to refresh module library
          if (onModuleSaved) onModuleSaved();
        } catch (err) {
          console.warn('Module auto-save failed:', err);
        }
      } else {
        setValidationStatus('failed');
        setValidationErrors(result.errors || 'Validation failed');
        setDockCollapsed(false);
        setValidationFullLog(result.fullLog || '');

        // Still save the attempt
        await apiCall(progressUrl, {
          method: 'POST',
          body: JSON.stringify({
            userCode,
            solution: '',
            isCompleted: false,
            validationStatus: 'failed',
          }),
        });
      }
    } catch (error) {
      setValidationStatus('failed');
      setValidationErrors(`Error: ${error.message}`);
      setDockCollapsed(false);
      setValidationFullLog('');
      setSimRun(null);
      setDockTab('output');
    }
  };

  const hasEditor = !!exerciseTemplate || lesson.type === 'exercise';
  const lessonType = lesson.type || 'theory';
  const typeLabel = { theory: t.typeTheory, exercise: t.typeExercise, project: t.typeProject }[lessonType] || lessonType;

  // Stored progress may carry 'not-started', which is not a result worth showing.
  const hasResult = ['passed', 'failed', 'validating'].includes(validationStatus);

  const outputPanel = hasResult ? (
    <div className="dock-output">
      <div className={`validation-result ${validationStatus}`}>
        <h3>
          {validationStatus === 'passed' && (
            moduleAutoSaved ? t.passedWithModule : t.passed
          )}
          {validationStatus === 'failed' && t.failed}
          {validationStatus === 'validating' && t.validating}
        </h3>
        {validationStatus === 'failed' && validationErrors && (
          <pre className="validation-errors">
            <strong>{t.errors}</strong>
            {validationErrors}
          </pre>
        )}
        {validationStatus !== 'validating' && validationFullLog && (
          <div className="validation-log-details">
            <button
              type="button"
              className="btn-log-toggle"
              onClick={() => setShowFullLog(!showFullLog)}
            >
              {showFullLog ? t.hideFullLog : t.showFullLog}
            </button>
            {showFullLog && (
              <pre className="validation-full-log">{validationFullLog}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="wb-empty">{t.outputEmpty}</div>
  );

  const hints = lesson.hints || [];

  const markdownComponents = {
    a: ({ href, children, ...props }) => (
      <a href={href} onClick={(e) => handleContentLinkClick(e, href)} {...props}>
        {children}
      </a>
    ),
    pre: ({ children }) => <>{children}</>,
    code: ({ className, children, node: _node, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      if (!match) {
        return <code {...props}>{children}</code>;
      }
      return (
        <FullscreenPanel floating title={t.codeExample} uiLanguage={uiLanguage}>
          {isFullscreen => (
            <SyntaxHighlighter
              language={match[1]}
              style={isDarkTheme ? vscDarkPlus : vs}
              customStyle={{
                ...(isDarkTheme ? CODE_BLOCK_DARK_STYLE : CODE_BLOCK_LIGHT_STYLE),
                ...(isFullscreen && CODE_BLOCK_FULLSCREEN_STYLE),
              }}
              codeTagProps={{ style: { fontFamily: "'Courier New', monospace" } }}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          )}
        </FullscreenPanel>
      );
    },
  };

  const readOnlyPanel = (title, code) => (
    <div className="editor-container">
      <FullscreenPanel label={title} title={title} uiLanguage={uiLanguage}>
        {isFullscreen => (
          <Editor
            height={isFullscreen ? '100%' : '220px'}
            defaultLanguage="verilog"
            value={code}
            theme={editorTheme}
            options={{ fontSize: 14, readOnly: true, minimap: { enabled: false } }}
          />
        )}
      </FullscreenPanel>
    </div>
  );

  const dockTabs = [
    { id: 'output', label: t.tabOutput, content: outputPanel },
    {
      id: 'waveform',
      label: t.tabWaveform,
      ready: !!vcd,
      content: (
        <WaveformViewer
          vcdText={vcd}
          uiLanguage={uiLanguage}
          emptyMessage={artifactsLoading ? t.loadingArtifacts : t.waveformEmpty}
        />
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
          emptyMessage={artifactsLoading ? t.loadingArtifacts : t.netlistEmpty}
        />
      ),
    },
  ];

  return (
    <div className="workbench">
      <div className="workbench-top">
        {/* Middle: lesson text */}
        <section className="wb-pane wb-pane-scroll wb-lesson" ref={scrollRef}>
          <div className="tutorial-lesson">
            <div className="lesson-header">
              <h1>{lesson.title}</h1>
              <span className={`lesson-type-chip type-${lessonType}`}>{typeLabel}</span>
              {/* Same as the buttons at the end of the lesson, reachable without scrolling */}
              <div className="lesson-header-nav">
                <button
                  type="button"
                  className="wb-btn wb-icon-btn"
                  onClick={onPreviousLesson}
                  disabled={!hasPrev}
                  title={t.previousLessonTitle}
                  aria-label={t.previousLessonTitle}
                >
                  ←
                </button>
                <button
                  type="button"
                  className="wb-btn wb-icon-btn"
                  onClick={onNextLesson}
                  disabled={!hasNext}
                  title={t.nextLessonTitle}
                  aria-label={t.nextLessonTitle}
                >
                  →
                </button>
              </div>
            </div>

            <div className="lesson-content">
              {/* Explanation Section */}
              <div className="explanation-section">
                <h2>{t.explanation}</h2>
                <div className="explanation-text">
                  {lesson.explanation ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, [rehypeHeadingIds, lesson.headingAnchors]]}
                      components={markdownComponents}
                    >
                      {lesson.explanation}
                    </ReactMarkdown>
                  ) : (
                    t.noExplanation
                  )}
                </div>
              </div>

              {/* Hints Section */}
              {hints.length > 0 && (
                <div className="hint-section">
                  {hints.slice(0, shownHints).map((hint, index) => (
                    <div key={index} className="hint-card explanation-text">
                      <div className="hint-card-label">
                        {t.hint} {index + 1}/{hints.length}
                      </div>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={markdownComponents}
                      >
                        {hint}
                      </ReactMarkdown>
                    </div>
                  ))}
                  <div className="hint-actions">
                    {shownHints < hints.length && (
                      <button
                        type="button"
                        className="wb-btn btn-hint"
                        onClick={() => setShownHints(shownHints + 1)}
                      >
                        {shownHints === 0 ? t.showHint : t.nextHint} ({shownHints + 1}/{hints.length})
                      </button>
                    )}
                    {shownHints > 0 && (
                      <button type="button" className="wb-btn btn-hint-hide" onClick={() => setShownHints(0)}>
                        {t.hideHints}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Without an editor pane there is no footer to host the solution toggle */}
              {solution && !hasEditor && (
                <div className="solution-section">
                  <button className="btn-solution-toggle" onClick={handleToggleSolution}>
                    {showSolution ? t.hideSolution : t.solution}
                  </button>
                  {showSolution && readOnlyPanel(t.solutionTitle, solution)}
                </div>
              )}

              {/* Navigation */}
              <div className="lesson-navigation">
                {hasPrev && (
                  <button className="btn-nav-prev" onClick={onPreviousLesson}>
                    {t.previousLesson}
                  </button>
                )}
                {lesson.type === 'exercise' && (
                  <span className={`lesson-status-marker ${validationStatus === 'passed' ? 'completed' : 'not-completed'}`}>
                    {validationStatus === 'passed' ? t.lessonCompleted : t.lessonNotCompleted}
                  </span>
                )}
                {hasNext && (
                  <button
                    className="btn-nav-next"
                    onClick={onNextLesson}
                  >
                    {t.nextLesson}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Right: the editor with the user's code */}
        {hasEditor && (
          <>
            <div className="wb-splitter" onPointerDown={startEditorResize} aria-hidden="true" />
            <section className="wb-pane wb-editor" style={{ width: editorWidth }}>
              <FullscreenPanel
                label={t.yourCode}
                uiLanguage={uiLanguage}
                actions={(
                  <div className="wb-editor-actions">
                    {isLoadingProgress && <span className="lesson-loading-indicator">{t.loadingProgress}</span>}
                    {lastSaved && !isLoadingProgress && (
                      <span className="lesson-last-saved">
                        {t.lastSaved} {lastSaved.toLocaleTimeString(uiLanguage === 'de' ? 'de-DE' : 'en-US')}
                      </span>
                    )}
                    <button
                      type="button"
                      className="btn-reset"
                      onClick={handleReset}
                      disabled={userCode === exerciseTemplate && testbench === (lesson.testbench || '')}
                    >
                      {t.reset}
                    </button>
                  </div>
                )}
              >
                <Editor
                  height="100%"
                  defaultLanguage="verilog"
                  value={userCode}
                  onChange={v => setUserCode(v || '')}
                  theme={editorTheme}
                  options={{ fontSize: 14, minimap: { enabled: false } }}
                />
              </FullscreenPanel>

              {(showTestbench || showSolution) && (
                <div className="wb-editor-extras">
                  {showTestbench && readOnlyPanel(t.testbenchTitle, testbench)}
                  {showSolution && readOnlyPanel(t.solutionTitle, solution)}
                </div>
              )}

              {(lesson.type === 'exercise' || solution) && (
                <div className="wb-editor-footer">
                  {lesson.type === 'exercise' && (
                    <>
                      <button
                        className="btn-save"
                        onClick={handleSaveManually}
                        disabled={isSaving || !userCode.trim()}
                      >
                        {isSaving ? t.saving : t.save}
                      </button>
                      <button
                        className="wb-btn btn-submit"
                        onClick={handleValidate}
                        disabled={validationStatus === 'validating' || !userCode.trim()}
                      >
                        {validationStatus === 'validating' ? t.validating : `▶ ${t.submit}`}
                      </button>
                      <button
                        className="btn-testbench-toggle"
                        onClick={() => setShowTestbench(!showTestbench)}
                        aria-expanded={showTestbench}
                      >
                        {showTestbench ? t.hideTestbench : t.showTestbench}
                      </button>
                    </>
                  )}
                  {solution && (
                    <button
                      className="btn-solution-toggle"
                      onClick={handleToggleSolution}
                      aria-expanded={showSolution}
                    >
                      {showSolution ? t.hideSolution : t.solution}
                    </button>
                  )}
                  {hasResult && (
                    <span className={`wb-status-chip ${validationStatus}`}>
                      {validationStatus === 'passed' && t.passed}
                      {validationStatus === 'failed' && t.failed}
                      {validationStatus === 'validating' && t.validating}
                    </span>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {passwordInput !== null && (
        <div className="wb-modal-backdrop" onPointerDown={closePasswordDialog}>
          <form
            className="wb-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="solution-password-label"
            onSubmit={handlePasswordSubmit}
            onPointerDown={e => e.stopPropagation()}
            onKeyDown={e => { if (e.key === 'Escape') closePasswordDialog(); }}
          >
            <label id="solution-password-label" htmlFor="solution-password">{t.solutionPasswordPrompt}</label>
            <div className="wb-password-field">
              <input
                id="solution-password"
                type={revealPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordWrong(false);
                }}
                placeholder={t.password}
                autoComplete="off"
                autoFocus
                aria-invalid={passwordWrong}
              />
              <button
                type="button"
                className="wb-btn wb-icon-btn"
                title={t.holdToReveal}
                aria-label={t.holdToReveal}
                {...revealHandlers}
              >
                👁
              </button>
            </div>
            {passwordWrong && <div className="wb-modal-error" role="alert">{t.solutionPasswordWrong}</div>}
            <div className="wb-modal-actions">
              <button type="button" className="wb-btn" onClick={closePasswordDialog}>{t.cancel}</button>
              <button type="submit" className="wb-btn wb-modal-primary">{t.confirm}</button>
            </div>
          </form>
        </div>
      )}

      {hasEditor && (
        <BottomDock
          tabs={dockTabs}
          activeTab={dockTab}
          onTabChange={setDockTab}
          collapsed={dockCollapsed}
          onCollapsedChange={setDockCollapsed}
          uiLanguage={uiLanguage}
        />
      )}
    </div>
  );
}
