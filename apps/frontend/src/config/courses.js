/**
 * Lehre - Kursliste
 *
 * Jeder Kurs ist ein eigenes Tutorial (Markdown im gleichen Format wie das
 * Verilog-Tutorial) unter public/Kurse/<Ordner>/. Die Inhalte werden per
 * GitHub-Workflow aus dem jeweiligen Kurs-Repository synchronisiert.
 *
 * Neuen Kurs anlegen: Ordner public/Kurse/<Ordner>/ mit Markdown + images/
 * anlegen und hier einen Eintrag ergänzen. Die id wird im Backend als
 * courseId für den Lernfortschritt verwendet - nachträglich nicht ändern.
 */
export const COURSES = [
  {
    id: 'es1',
    shortTitle: 'ES1',
    title: {
      de: 'ES1 – Embedded Systems 1',
      en: 'ES1 – Embedded Systems 1',
    },
    subtitle: {
      de: 'Kursmaterial zur Lehrveranstaltung',
      en: 'Course material for the lecture',
    },
    tutorialPath: '/Kurse/ES1/ES1Tutorial.md',
  },
];

export function getCourse(courseId) {
  return COURSES.find((c) => c.id === courseId) || null;
}
