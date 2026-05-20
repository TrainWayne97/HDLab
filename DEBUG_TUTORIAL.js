// Quick Debug: Check LESSON_METADATA titles against actual markdown headers
// Run this in browser console to debug title matching

const expectedTitles = [
  'Grundoperation: OR',
  'Grundoperation: NAND',
  'Grundoperationen: AND, NOT',
  'Einfache Zuweisungen: Was soll wo hin?',
  'Leitungen: Verbindungen im Code.',
  'Portliste: Anschluss der Außenwelt',
  'Kommentare: Überblick trotz Chaos',
  'Modul: Der Rahmen des Codes',
  'If: Wenn x, dann y',
  'Boolean: Wahrheitswerte',
  'Vorzeichen',
  'Breite von Signalen',
];

// When tutorial loads, check the actual extracted sections
setTimeout(() => {
  const console_log_text = document.querySelector('.console-output');
  // Can also inspect window.__tutorialData if you expose it globally
  console.log('Expected titles:', expectedTitles);
  console.log('Check browser console for [TutorialParser] logs');
}, 1000);
