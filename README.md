
<!-- DEUTSCH / GERMAN -->
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

<!-- ENGLISH -->
# HDLab – HDL Playground & Simulation Platform

Web-based development environment for SystemVerilog with end-to-end simulation in Docker containers.

## Features

- **Monaco Editor** (VS Code in the browser)
- **SystemVerilog simulation** (Verilator, Docker-based)
- **Testbench optional & controllable**: Testbench can be enabled/disabled via UI. Simulation works without testbench (pure module).
- **Testbench editor**: Separate editor area for testbench code (SystemVerilog or Python).
- **Waveform output** (VCD)
- **Live log output** in the frontend
- **RabbitMQ queue** for simulations
- **MongoDB** for projects & results
- **File upload/download** (optional)

## Architecture

- **Frontend:** React, Monaco Editor, Vite
- **Backend:** Node.js (Express), REST API, RabbitMQ
- **Worker:** Simulation worker, runs Docker containers
- **Database:** MongoDB
- **Messaging:** RabbitMQ
- **Simulation:** Docker container with Verilator

## Project Structure

- `apps/frontend` – Web UI (React, Vite, Monaco)
- `apps/backend` – REST API, project & simulation management
- `apps/worker` – Simulation worker, Docker control
- `docker/sim-verilator` – Verilator container for simulations
- `simtmp/` – temporary simulation data (mounted, .gitignore!)

## Setup & Development

1. Requirements: Docker, Node.js, npm, MongoDB, RabbitMQ
2. `docker-compose up --build` (starts all services)
3. Frontend: `cd apps/frontend && npm install && npm run dev`
4. Backend: `cd apps/backend && npm install && npm start`
5. Worker: `cd apps/worker && npm install && npm start`

## Workflows

### Start Simulation
1. Enter SystemVerilog code in the editor
2. Optionally enable testbench and write your own testbench code in the separate editor (SystemVerilog or Python)
3. Click “Start Simulation”
4. Project & simulation are created in the backend
5. Worker picks up simulation job, creates temp directory, copies files
6. Docker container (Verilator) is started, simulation runs
7. Log & waveform (if any) are read and stored in the backend
8. Frontend polls for result and displays log

#### Notes on the testbench option
- If the testbench is disabled, only the main module is simulated (e.g. for pure $display output or minimal examples).
- If the testbench is enabled, the testbench code is passed as tb.sv (or tb.py) and used as the top module.
- Switching is done directly via the UI (checkbox “Enable testbench”).

---
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
### UI/UX-Verbesserungen (April 2026)
- Sidebar mit Sprache, Testbench-Option, Waveform-Option, Datei-Buttons
- Topbar mit Logo, Titel und Menü
- Testbench-Editor nur sichtbar, wenn Testbench aktiviert
- Modernes, responsives Design (CSS)

### UI/UX Improvements (April 2026)
- Sidebar with language, testbench option, waveform option, file buttons
- Topbar with logo, title, and menu
- Testbench editor only visible when testbench is enabled
- Modern, responsive design (CSS)

---

### Code-Beispiele im Frontend
Im Sidebar-Menü findest du jetzt ein eigenes Untermenü „Code-Beispiele“ mit zwei Kategorien:

- **Nur Design**: 10+ Minimalbeispiele (AND, OR, NOT, XOR, Volladdierer, Zähler, Latch, Multiplexer, Flipflop, u.a.)
- **Design + Testbench**: 10+ Beispiele mit passender Testbench (AND, OR, NOT, XOR, Volladdierer, Zähler, Latch, Multiplexer, Flipflop, Inkrementierer, u.a.)

Beim Klick auf ein Beispiel werden der Code (und ggf. die Testbench) direkt in die Editoren geladen. Die Testbench-Option wird automatisch gesetzt.

Damit kannst du schnell verschiedene Schaltungen und Testbenches ausprobieren, ohne selbst Code eintippen zu müssen.

### Code Examples in the Frontend
In the sidebar menu you now find a dedicated submenu “Code Examples” with two categories:

- **Design only**: 10+ minimal examples (AND, OR, NOT, XOR, full adder, counter, latch, multiplexer, flip-flop, etc.)
- **Design + Testbench**: 10+ examples with matching testbench (AND, OR, NOT, XOR, full adder, counter, latch, multiplexer, flip-flop, incrementer, etc.)

Clicking an example loads the code (and testbench, if any) directly into the editors. The testbench option is set automatically.

This allows you to quickly try out different circuits and testbenches without having to type code yourself.

### .gitignore-Empfehlung / Recommendation
Füge folgende Zeilen hinzu, um das Repo schlank zu halten / Add the following lines to keep the repo clean:
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

For more details see the source code and /docker/sim-verilator/README.md
