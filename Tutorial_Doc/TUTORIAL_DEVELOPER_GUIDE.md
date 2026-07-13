# Tutorial Mode Developer Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      HDLab Frontend                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐      ┌──────────────────┐              │
│  │    Topbar      │      │  Tutorial Button │              │
│  └────────────────┘      └──────────────────┘              │
│         │                                  │                │
│         └──────────────┬───────────────────┘                │
│                        │ onClick                            │
│              ┌─────────▼────────────┐                       │
│              │ App.jsx Router       │                       │
│              │ (currentPage state)  │                       │
│              └─────────┬─────────┬──┘                       │
│                        │         │                          │
│         ┌──────────────┘         └──────────────┐           │
│         │                                       │           │
│    ┌────▼──────────────┐            ┌──────────▼────┐     │
│    │ TutorialOverview  │            │TutorialLesson │     │
│    │                   │            │               │     │
│    │ - Difficulty list │            │ - Explanation │     │
│    │ - Start buttons   │            │ - Editor      │     │
│    │ - Lesson preview  │            │ - Testbench   │     │
│    │                   │            │ - Validation  │     │
│    └───────────────────┘            └──────────────┘     │
│                                                              │
└─────────────────────────────┬───────────────────────────────┘
                              │ API Calls
                    ┌─────────▼────────────┐
                    │  HDLab Backend       │
                    ├──────────────────────┤
                    │                      │
                    │ GET /tutorials/...   │
                    │ POST /tutorials/...  │
                    │                      │
                    └─────────┬────────────┘
                              │
                ┌─────────────┴──────────────┐
                │                           │
         ┌──────▼──────────┐         ┌─────▼────────────┐
         │ Tutorial.md     │         │ Simulation Queue │
         │ (VCS Content)   │         │ (RabbitMQ)       │
         └─────────────────┘         └──────────────────┘
```

## File Structure

```
/apps/frontend/src/
├── App.jsx                          # Main app with routing
├── components/
│   ├── Topbar.jsx                  # Enhanced with Tutorial button
│   ├── TutorialOverview.jsx         # Tutorial landing page
│   ├── TutorialLesson.jsx           # Lesson page component
│   └── Tutorial.css                 # Tutorial styling
└── utils/
    └── tutorialParser.js            # Markdown parsing logic

/apps/backend/src/
└── routes.js                        # Backend API endpoints
                                     # + /tutorials/content (new)
                                     # + /tutorials/validate (new)

/Tutorial/
└── VerilogTutorial.md              # Tutorial content source
```

## How to Add New Lessons

### Step 1: Edit VerilogTutorial.md
Add your lesson as a `### ` (level-3 header) section:

```markdown
### Meine neue Lektion

Hier kommt die Erklärung hin.

```verilog
module template_code();
  // Template code for the exercise
endmodule
```

Lsg.:
```verilog
module template_code();
  // Solution code
endmodule
```
```

### Step 2: Update tutorialParser.js
Add an entry to `LESSON_METADATA`:

```javascript
{
  id: 'eindeutiger-id',
  title: 'Meine neue Lektion',
  difficulty: 'beginner', // or 'intermediate', 'advanced'
  section: 'Syntax',
  hasExercise: true, // if this is an exercise lesson
}
```

### Step 3: The Parser Will Automatically:
- Extract the section content
- Parse code blocks
- Create exercise templates and solutions
- Organize by difficulty level

## Validation Logic

### How Testbench Validation Works

1. **User submits code** → Frontend sends to `/api/tutorials/validate`
2. **Backend receives:**
   - `moduleName` - Name of the user's module
   - `moduleCode` - User's Verilog code
   - `testbench` - Testbench to run against (optional)
3. **Backend creates temporary Simulation** with the code
4. **Simulation sent to RabbitMQ** for execution
5. **Backend polls for completion** (max 30 seconds)
6. **Log analyzed:**
   - Success patterns: "passed", "test.*pass", "success", "ok"
   - Failure patterns: "failed", "fail", "error", "assert"
7. **Result returned** to frontend for display

### Example Validation Response

**Success:**
```javascript
{
  "success": true
}
```

**Failure:**
```javascript
{
  "success": false,
  "errors": "ERROR: Module output incorrect\nassert(expected == actual) failed"
}
```

## State Management

### Tutorial-related State in App.jsx:
```javascript
// Navigation page
const [currentPage, setCurrentPage] = useState('home'); 
// 'home', 'tutorial-overview', or 'tutorial-lesson'

// Parsed tutorial data structure
const [tutorialData, setTutorialData] = useState(null);
// {
//   lessons: { lessonId: LessonObject, ... },
//   lessonIds: [lessonId, ...],
//   byDifficulty: { beginner: [...], intermediate: [...], ... }
// }

// Currently active lesson
const [currentLessonId, setCurrentLessonId] = useState(null);
```

### Navigation Handlers:
- `handleTutorialOpen()` - Show overview
- `handleTutorialStart(lessonId)` - Start specific lesson
- `handleTutorialNext()` - Go to next lesson
- `handleTutorialPrevious()` - Go to previous lesson
- `handleTutorialBack()` - Return to overview
- `handleHome()` - Return to main editor

## Customization Points

### 1. Change Difficulty Color Scheme
Edit `/apps/frontend/src/components/Tutorial.css`:
```css
.difficulty-header {
  background: #f3f4f6; /* Change this color */
}
```

### 2. Modify Validation Rules
Edit `checkValidationLog()` in `/apps/backend/src/routes.js`:
```javascript
function checkValidationLog(log) {
  // Add custom pattern matching logic here
}
```

### 3. Change Editor Theme
Pass `editorTheme` prop to `<TutorialLesson>`:
```jsx
<TutorialLesson
  ...
  editorTheme={'vs-dark'} // or 'vs-light'
/>
```

### 4. Add More Languages
Update language keys in Tutorial components' `TRANSLATIONS` object:
```javascript
const TRANSLATIONS = {
  de: { /* German */ },
  en: { /* English */ },
  es: { /* Spanish - add here */ },
};
```

## Testing the Tutorial

### Manual Testing Steps:

1. **Start the app** - Navigate to http://localhost:5173
2. **Click "Tutorial" button** in Topbar
3. **Verify TutorialOverview displays:**
   - ✓ All difficulty categories visible
   - ✓ Lessons organized by level
   - ✓ "Start from Beginning" button works
4. **Select a lesson with exercise:**
   - ✓ Explanation displays
   - ✓ Code editor appears
   - ✓ Testbench visibility toggle works
   - ✓ Solution toggle works
5. **Test validation:**
   - ✓ Write incorrect code → "Failed" feedback
   - ✓ Write correct code → "Passed" feedback
   - ✓ Next button only enabled after passing
6. **Test navigation:**
   - ✓ Previous/Next buttons work
   - ✓ Back button returns to overview
   - ✓ Can switch between lessons

### Unit Testing (Future):

```javascript
// Test tutorial parser
import { parseTutorial } from '../utils/tutorialParser';

test('parseTutorial extracts lessons', () => {
  const result = parseTutorial(markdownContent);
  expect(result.lessons).toBeDefined();
  expect(result.byDifficulty.beginner.length).toBeGreaterThan(0);
});

// Test lesson navigation
test('handleTutorialNext goes to next lesson', () => {
  // Component test for navigation
});
```

## Performance Considerations

1. **Markdown Parsing:** Done once on app load, stored in state
2. **Code Block Extraction:** Regex matching is fast for typical md files
3. **Validation:** Async, non-blocking, 30sec timeout
4. **Editor Instances:** Monaco Editor instances created per lesson (may use resources)

### Optimization Tips:
- Lazy load large tutorial sections
- Cache parsed tutorial data in localStorage
- Use debouncing for user input validation
- Consider virtual scrolling for many lessons

## Common Issues & Solutions

### Issue: Tutorial content not loading
**Solution:** Check `/api/tutorials/content` endpoint:
```bash
curl http://localhost:3001/api/tutorials/content
```

### Issue: Validation always fails
**Solution:** Check simulation backend logs and RabbitMQ queue status

### Issue: Editor themes not applying
**Solution:** Ensure `editorTheme` prop matches Monaco Editor theme names

### Issue: Lessons not appearing
**Solution:** Verify lesson titles in `LESSON_METADATA` exactly match markdown headers

## Future Enhancements

1. **Progress Tracking:**
   - Save completed lessons to user profile
   - Show percentage completion
   - Highlight unfinished lessons

2. **Advanced Features:**
   - Hints system for stuck students
   - Time tracking per lesson
   - Automatic next lesson suggestions
   - Peer code review system

3. **Content Management:**
   - CMS integration for lesson editing
   - Version control for lessons
   - A/B testing for lesson effectiveness

4. **Analytics:**
   - Track lesson completion rates
   - Identify problematic lessons
   - Student performance metrics

---

**Last Updated:** 13. Mai 2026
**Maintainer:** HDLab Dev Team
