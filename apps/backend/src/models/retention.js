// Simulationsdaten (Projekt-Snapshot, Simulation, Waveform, Netlist, Board-Netlist) braucht
// das Frontend nur, solange die Seite offen ist. MongoDB löscht sie per TTL-Index nach
// dieser Zeit, damit die Datenbank nicht mit jedem Simulationslauf weiter wächst.
// Tutorial-Fortschritt und Modul-Bibliothek sind davon nicht betroffen.
//
// Achtung: Eine Änderung wirkt nicht auf bestehende Indizes - dafür den Index per
// collMod anpassen oder löschen, das Backend legt ihn beim Start neu an.
export const SIM_DATA_TTL_SECONDS = 7 * 24 * 60 * 60;

/** Fügt dem Schema einen TTL-Index auf createdAt hinzu. */
export function expireSimData(schema) {
  schema.index({ createdAt: 1 }, { expireAfterSeconds: SIM_DATA_TTL_SECONDS });
}
