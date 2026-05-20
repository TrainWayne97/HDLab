import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import './Tutorial.css';

// Helper function to parse and format explanation text
function parseExplanationMarkdown(text) {
  if (!text) return null;
  
  // Split by lines
  const lines = text.split('\n');
  const elements = [];
  let currentList = [];
  let isInCodeBlock = false;
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    
    // Skip code blocks
    if (trimmed.startsWith('```')) {
      isInCodeBlock = !isInCodeBlock;
      return;
    }
    if (isInCodeBlock) return;
    
    // Handle bullet points
    if (trimmed.startsWith('-')) {
      const content = trimmed.substring(1).trim();
      currentList.push({ level: 0, content });
    } else if (trimmed.startsWith('  -')) {
      const content = trimmed.substring(3).trim();
      currentList.push({ level: 1, content });
    } else {
      // Flush list if we have one
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${idx}`} style={{ marginLeft: '0px', marginTop: '8px', marginBottom: '8px' }}>
            {currentList.map((item, i) => (
              <li key={i} style={{ marginLeft: `${item.level * 20}px`, marginBottom: '4px' }}>
                {formatInlineMarkdown(item.content)}
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
      
      // Regular paragraph
      if (trimmed.length > 0) {
        elements.push(
          <p key={`p-${idx}`} style={{ marginTop: '8px', marginBottom: '8px', lineHeight: '1.6' }}>
            {formatInlineMarkdown(trimmed)}
          </p>
        );
      }
    }
  });
  
  // Flush remaining list
  if (currentList.length > 0) {
    elements.push(
      <ul key="final-list" style={{ marginLeft: '0px', marginTop: '8px', marginBottom: '8px' }}>
        {currentList.map((item, i) => (
          <li key={i} style={{ marginLeft: `${item.level * 20}px`, marginBottom: '4px' }}>
            {formatInlineMarkdown(item.content)}
          </li>
        ))}
      </ul>
    );
  }
  
  return elements;
}

// Format inline markdown (bold, etc)
function formatInlineMarkdown(text) {
  // Handle **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

const TRANSLATIONS = {
  de: {
    back: '← Zurück zur Übersicht',
    nextLesson: 'Nächste Lektion →',
    previousLesson: '← Vorherige Lektion',
    submit: 'Lösung einreichen',
    validating: 'Validiere...',
    passed: '✓ Richtig gelöst!',
    failed: '✗ Nicht korrekt',
    errors: 'Fehler:',
    testbench: 'Testbench (versteckt)',
    showTestbench: 'Testbench anzeigen',
    hideTestbench: 'Testbench verbergen',
    solution: 'Lösung anzeigen',
    hideSolution: 'Lösung verbergen',
  },
  en: {
    back: '← Back to Overview',
    nextLesson: 'Next Lesson →',
    previousLesson: '← Previous Lesson',
    submit: 'Submit Solution',
    validating: 'Validating...',
    passed: '✓ Correct!',
    failed: '✗ Incorrect',
    errors: 'Errors:',
    testbench: 'Testbench (hidden)',
    showTestbench: 'Show Testbench',
    hideTestbench: 'Hide Testbench',
    solution: 'Show Solution',
    hideSolution: 'Hide Solution',
  },
};

export default function TutorialLesson({
  lesson,
  lessonId,
  allLessonIds,
  onBack,
  onNextLesson,
  onPreviousLesson,
  uiLanguage = 'de',
  editorTheme = 'vs-light',
}) {
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.de;
  // Handle both old format (object with .content) and new format (string)
  const exerciseTemplate = typeof lesson.exerciseTemplate === 'string' 
    ? lesson.exerciseTemplate 
    : lesson.exerciseTemplate?.content || '';
  const solution = typeof lesson.solution === 'string' 
    ? lesson.solution 
    : lesson.solution?.content || '';

  const [userCode, setUserCode] = useState(exerciseTemplate);
  const [validationStatus, setValidationStatus] = useState(null); // null, 'validating', 'passed', 'failed'
  const [validationErrors, setValidationErrors] = useState('');
  const [showTestbench, setShowTestbench] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [testbench, setTestbench] = useState('');

  const currentIndex = allLessonIds.indexOf(lessonId);
  const hasNext = currentIndex < allLessonIds.length - 1;
  const hasPrev = currentIndex > 0;

  useEffect(() => {
    console.log('[TutorialLesson] Lesson loaded:', {
      id: lesson.id,
      title: lesson.title,
      type: lesson.type || 'theory',
      hasExplanation: !!lesson.explanation,
      explanationLength: lesson.explanation?.length || 0,
      hasExerciseTemplate: !!exerciseTemplate,
      hasSolution: !!solution,
      duration_min: lesson.duration_min || '?',
      difficulty: lesson.difficulty || 'beginner',
    });
    
    // Generate a basic testbench for this lesson
    // In a real implementation, this would come from lesson metadata
    const basicTestbench = `\`timescale 1ns/1ps

module tb_lesson();
  // Auto-generated testbench
  // Will validate user's module implementation
  
  initial begin
    $display("Test started for: ${lesson.title}");
    #100;
    $display("Test completed");
    $finish;
  end
  
endmodule`;
    
    setTestbench(basicTestbench);
  }, [lesson, exerciseTemplate, solution]);

  const handleValidate = async () => {
    setValidationStatus('validating');
    
    try {
      // Extract module name from user code
      const moduleMatch = userCode.match(/module\s+(\w+)/);
      const moduleName = moduleMatch ? moduleMatch[1] : 'unknown';

      // Send to backend for validation
      const response = await fetch('/api/tutorials/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          moduleCode: userCode,
          moduleName,
          testbench: testbench,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setValidationStatus('passed');
        setValidationErrors('');
      } else {
        setValidationStatus('failed');
        setValidationErrors(result.errors || 'Validation failed');
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
      </div>

      <div className="lesson-content">
        {/* Explanation Section */}
        <div className="explanation-section">
          <h2>Erklärung</h2>
          <div className="explanation-text">
            {lesson.explanation ? parseExplanationMarkdown(lesson.explanation) : 'Keine Erklärung verfügbar'}
          </div>
        </div>

        {/* Code Template Section */}
        {exerciseTemplate && (
          <div className="exercise-section">
            <h2>Dein Code</h2>
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
                onChange={setTestbench}
                theme={editorTheme}
                options={{ fontSize: 14 }}
              />
            </div>
          )}
        </div>

        {/* Solution Section */}
        {solution && (
          <div className="solution-section">
            <button
              className="btn-solution-toggle"
              onClick={() => setShowSolution(!showSolution)}
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
        {validationStatus && (
          <div className={`validation-result ${validationStatus}`}>
            <h3>
              {validationStatus === 'passed' && t.passed}
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
        <div className="lesson-actions">
          <button
            className="btn-submit"
            onClick={handleValidate}
            disabled={validationStatus === 'validating' || !userCode.trim()}
          >
            {validationStatus === 'validating' ? t.validating : t.submit}
          </button>
        </div>

        {/* Navigation */}
        <div className="lesson-navigation">
          {hasPrev && (
            <button className="btn-nav-prev" onClick={onPreviousLesson}>
              {t.previousLesson}
            </button>
          )}
          {hasNext && (
            <button 
              className="btn-nav-next" 
              onClick={onNextLesson}
              disabled={validationStatus !== 'passed'}
            >
              {t.nextLesson}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
