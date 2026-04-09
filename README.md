
# HDLab – HDL Playground & Simulation Platform

Webbasierte Entwicklungsumgebung für SystemVerilog mit End-to-End-Simulationen in Docker-Containern.

## Features

- **Monaco Editor** (VS Code im Browser)
- **SystemVerilog-Simulation** (Verilator, Docker-basiert)
- **Testbench optional & steuerbar**: Testbench kann per UI aktiviert/deaktiviert werden. Simulation funktioniert auch ohne Testbench (reines Modul).
- **Testbench-Editor**: Eigener Editorbereich für Testbench-Code (SystemVerilog oder Python).
- **Waveform-Output** (VCD)
- **Live-Logausgabe** im Frontend
- **RabbitMQ-Queue** für Simulationen
- **MongoDB** für Projekte & Ergebnisse
- **Datei-Upload/Download** (optional)

## Architektur

- **Frontend:** React, Monaco Editor, Vite
- **Backend:** Node.js (Express), REST-API, RabbitMQ
- **Worker:** Simulations-Worker, führt Docker-Container aus
- **Datenbank:** MongoDB
- **Messaging:** RabbitMQ
- **Simulation:** Docker-Container mit Verilator

## Projektstruktur

- `apps/frontend` – Web-UI (React, Vite, Monaco)
- `apps/backend` – REST-API, Projekt- & Simulationsmanagement
- `apps/worker` – Simulations-Worker, Docker-Ansteuerung
- `docker/sim-verilator` – Verilator-Container für Simulationen
- `simtmp/` – temporäre Simulationsdaten (wird gemountet, .gitignore!)

## Setup & Entwicklung

1. Voraussetzungen: Docker, Node.js, npm, MongoDB, RabbitMQ
2. `docker-compose up --build` (startet alle Services)
3. Frontend: `cd apps/frontend && npm install && npm run dev`
4. Backend: `cd apps/backend && npm install && npm start`
5. Worker: `cd apps/worker && npm install && npm start`

## Workflows


### Simulation starten
1. SystemVerilog-Code im Editor eingeben
2. Optional: Testbench aktivieren und eigenen Testbench-Code im separaten Editor schreiben (SystemVerilog oder Python)
3. „Simulation starten“ klicken
4. Projekt & Simulation werden im Backend angelegt
5. Worker zieht Simulationsauftrag, erzeugt temporäres Verzeichnis, kopiert Dateien
6. Docker-Container (Verilator) wird gestartet, Simulation läuft
7. Log & ggf. Waveform werden ausgelesen und im Backend gespeichert
8. Frontend pollt auf Ergebnis und zeigt Log an

#### Hinweise zur Testbench-Option
- Ist die Testbench deaktiviert, wird nur das Hauptmodul simuliert (z.B. für reine $display-Ausgaben oder Minimalbeispiele).
- Ist die Testbench aktiviert, wird der Testbench-Code als tb.sv (oder tb.py) übergeben und als Topmodul verwendet.
- Die Umschaltung erfolgt direkt über die UI (Checkbox „Testbench aktivieren“).
---
### UI/UX-Verbesserungen (April 2026)
- Sidebar mit Sprache, Testbench-Option, Waveform-Option, Datei-Buttons
- Topbar mit Logo, Titel und Menü
- Testbench-Editor nur sichtbar, wenn Testbench aktiviert
- Modernes, responsives Design (CSS)

---


### Code-Beispiele im Frontend
Im Sidebar-Menü findest du jetzt ein eigenes Untermenü „Code-Beispiele“ mit zwei Kategorien:

- **Nur Design**: 10+ Minimalbeispiele (AND, OR, NOT, XOR, Volladdierer, Zähler, Latch, Multiplexer, Flipflop, u.a.)
- **Design + Testbench**: 10+ Beispiele mit passender Testbench (AND, OR, NOT, XOR, Volladdierer, Zähler, Latch, Multiplexer, Flipflop, Inkrementierer, u.a.)

Beim Klick auf ein Beispiel werden der Code (und ggf. die Testbench) direkt in die Editoren geladen. Die Testbench-Option wird automatisch gesetzt.

Damit kannst du schnell verschiedene Schaltungen und Testbenches ausprobieren, ohne selbst Code eintippen zu müssen.

### .gitignore-Empfehlung
Füge folgende Zeilen hinzu, um das Repo schlank zu halten:
```
node_modules/
simtmp/
dist/
build/
.env
.DS_Store
*.log
coverage/
.vscode/
obj_dir/
.idea/
__pycache__/
*.pyc
```


---
Weitere Details siehe Quellcode und /docker/sim-verilator/README.md
