import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useAuth } from '../contexts/AuthContext';
import './Tutorial.css';

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
    testbench: 'Testbench (versteckt)',
    showTestbench: 'Testbench anzeigen',
    hideTestbench: 'Testbench verbergen',
    solution: 'Lösung anzeigen',
    hideSolution: 'Lösung verbergen',
    solutionPasswordPrompt: 'Bitte Passwort eingeben, um die Lösung anzuzeigen:',
    solutionPasswordWrong: 'Falsches Passwort.',
    loadingProgress: 'Lädt vorherigen Fortschritt...',
    progressLoaded: 'Fortschritt geladen',
    lastSaved: 'Zuletzt gespeichert:',
    lessonCompleted: '✓ Abgeschlossen',
    lessonNotCompleted: '○ Nicht abgeschlossen',
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
    testbench: 'Testbench (hidden)',
    showTestbench: 'Show Testbench',
    hideTestbench: 'Hide Testbench',
    solution: 'Show Solution',
    hideSolution: 'Hide Solution',
    solutionPasswordPrompt: 'Please enter the password to show the solution:',
    solutionPasswordWrong: 'Incorrect password.',
    loadingProgress: 'Loading previous progress...',
    progressLoaded: 'Progress loaded',
    lastSaved: 'Last saved:',
    lessonCompleted: '✓ Completed',
    lessonNotCompleted: '○ Not completed',
  },
};

// Client-side gate only (not a real access control) - password is bundled in the frontend build.
const SOLUTION_PASSWORD = import.meta.env.VITE_TUTORIAL_SOLUTION_PASSWORD || 'verilog';

export default function TutorialLesson({
  lesson,
  lessonId,
  allLessonIds,
  onBack,
  onNextLesson,
  onPreviousLesson,
  uiLanguage = 'de',
  editorTheme = 'vs-light',
  onModuleSaved,
  onRegisterInsert,
}) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  const { apiCall, hasRole } = useAuth();
  
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
  const [showTestbench, setShowTestbench] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [testbench, setTestbench] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [moduleAutoSaved, setModuleAutoSaved] = useState(false);

  const currentIndex = allLessonIds.indexOf(lessonId);
  const hasNext = currentIndex < allLessonIds.length - 1;
  const hasPrev = currentIndex > 0;

  // Load progress from backend when lesson changes
  useEffect(() => {
    const loadProgress = async () => {
      setIsLoadingProgress(true);
      try {
        const res = await apiCall(`/tutorial/progress/${lessonId}`);
        const data = await res.json();
        
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
        setUserCode(exerciseTemplate);
      } finally {
        setIsLoadingProgress(false);
      }
    };

    loadProgress();
    setValidationStatus(null);
    setValidationErrors('');
    setShowTestbench(false);
    setShowSolution(false);
    setModuleAutoSaved(false);
  }, [lessonId, exerciseTemplate, apiCall]);

  // Auto-save nach Änderung (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveProgress();
    }, 2000); // Speichere nach 2 Sekunden Inaktivität

    return () => clearTimeout(timer);
  }, [userCode]);

  // Save progress to backend
  const saveProgress = async () => {
    if (!userCode || userCode === exerciseTemplate) return;
    
    setIsSaving(true);
    try {
      const res = await apiCall(`/tutorial/progress/${lessonId}`, {
        method: 'POST',
        body: JSON.stringify({
          userCode,
          solution: '',
          isCompleted: false,
          validationStatus: 'not-started',
        }),
      });

      if (res.ok) {
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

    const input = window.prompt(t.solutionPasswordPrompt);
    if (input === null) return;
    if (input !== SOLUTION_PASSWORD) {
      alert(t.solutionPasswordWrong);
      return;
    }
    setShowSolution(true);
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

      if (result.success) {
        setValidationStatus('passed');
        setValidationErrors('');
        setModuleAutoSaved(false);
        
        // Save solution to backend
        await apiCall(`/tutorial/progress/${lessonId}`, {
          method: 'POST',
          body: JSON.stringify({
            userCode,
            solution: userCode,
            isCompleted: true,
            validationStatus: 'passed',
          }),
        });

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
              tags: ['solution', `lesson_${lessonId}`],
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
        
        // Still save the attempt
        await apiCall(`/tutorial/progress/${lessonId}`, {
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
    }
  };

  return (
    <div className="tutorial-lesson">
        <div className="lesson-header">
          <button className="btn-back" onClick={onBack}>
            {t.back}
          </button>
          <h1>{lesson.title}</h1>
          {isLoadingProgress && <span style={{ fontSize: '12px', color: '#999' }}>{t.loadingProgress}</span>}
          {lastSaved && !isLoadingProgress && (
            <span style={{ fontSize: '11px', color: '#666', marginLeft: 'auto' }}>
              {t.lastSaved} {lastSaved.toLocaleTimeString(uiLanguage === 'de' ? 'de-DE' : 'en-US')}
            </span>
          )}
        </div>

        <div className="lesson-content">
        {/* Explanation Section */}
        <div className="explanation-section">
          <h2>Erklärung</h2>
          <div className="explanation-text">
            {lesson.explanation ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                {lesson.explanation}
              </ReactMarkdown>
            ) : (
              'Keine Erklärung verfügbar'
            )}
          </div>
        </div>

        {/* Code Template Section */}
        {exerciseTemplate && (
          <div className="exercise-section">
            <div className="exercise-section-header">
              <h2>Dein Code</h2>
              <button
                type="button"
                className="btn-reset"
                onClick={handleReset}
                disabled={userCode === exerciseTemplate && testbench === (lesson.testbench || '')}
              >
                {t.reset}
              </button>
            </div>
            <div className="editor-container">
              <Editor
                height="300px"
                defaultLanguage="verilog"
                value={userCode}
                onChange={v => setUserCode(v || '')}
                theme={editorTheme}
                options={{ fontSize: 14 }}
              />
            </div>
          </div>
        )}

        {/* Testbench Section */}
        {lesson.type === 'exercise' && (
          <div className="testbench-section">
            <button
              className="btn-testbench-toggle"
              onClick={() => setShowTestbench(!showTestbench)}
            >
              {showTestbench ? t.hideTestbench : t.showTestbench}
            </button>
            
            {showTestbench && (
              <div className="editor-container">
                <Editor
                  height="250px"
                  defaultLanguage="verilog"
                  value={testbench}
                  theme={editorTheme}
                  options={{ fontSize: 14, readOnly: true }}
                />
              </div>
            )}
          </div>
        )}

        {/* Solution Section */}
        {solution && (
          <div className="solution-section">
            <button
              className="btn-solution-toggle"
              onClick={handleToggleSolution}
            >
              {showSolution ? t.hideSolution : t.solution}
            </button>
            
            {showSolution && (
              <div className="editor-container">
                <Editor
                  height="250px"
                  defaultLanguage="verilog"
                  value={solution}
                  theme={editorTheme}
                  options={{ fontSize: 14, readOnly: true }}
                />
              </div>
            )}
          </div>
        )}

        {/* Validation Results */}
        {lesson.type === 'exercise' && validationStatus && (
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
          </div>
        )}

        {/* Submit Button */}
        {lesson.type === 'exercise' && (
          <div className="lesson-actions">
            <button
              className="btn-save"
              onClick={handleSaveManually}
              disabled={isSaving || !userCode.trim()}
              title="Save your code locally"
            >
              {isSaving ? t.saving : t.save}
            </button>
            <button
              className="btn-submit"
              onClick={handleValidate}
              disabled={validationStatus === 'validating' || !userCode.trim()}
            >
              {validationStatus === 'validating' ? t.validating : t.submit}
            </button>
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
  );
}
