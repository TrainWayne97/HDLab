<!-- DEUTSCH / GERMAN -->
# HDLab – HDL Playground & Simulation Platform

Webbasierte Entwicklungsumgebung für SystemVerilog mit End-to-End-Simulationen in Docker-Containern.

## Features

- **Monaco Editor** (VS Code im Browser)
- **SystemVerilog-Simulation** (Verilator, Docker-basiert)
- **Testbench optional & steuerbar**: Testbench kann per UI aktiviert/deaktiviert werden. Simulation funktioniert auch ohne Testbench (reines Modul).
- **Testbench-Editor**: Eigener Editorbereich für Testbench-Code (SystemVerilog oder Python).
- **Cocotb-Flow**: Python-Testbenches (`tb.py`) werden automatisch als Cocotb-Run ausgeführt.
- **Waveform-Output** (VCD)
- **Live-Logausgabe** im Frontend mit zwei Ansichten:
	- **Kompakt** (relevante Kurzinfos)
	- **Vollständig** (gefilterter Cocotb-Testlauf ohne Compiler-Build-Noise)
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

### Startskript

`start.sh` baut vor dem Start sowohl die Compose-Services als auch das Simulationsimage `hdl-sim-verilator`, damit Änderungen am Verilator/Cocotb-Container immer aktiv sind.

## Setup-Skript

Das Skript `setup.sh` automatisiert die komplette Einrichtung:

- Führt `npm install` in allen Apps aus
- Baut alle Docker-Images (inkl. sim-verilator)
- Legt automatisch eine `.env` im Projekt-Root an und trägt den korrekten absoluten Pfad für `SIMTMP_HOST_PATH` ein

**Ablauf:**

```sh
bash setup.sh
```

Danach ist das Projekt startklar und du kannst direkt mit `docker compose up` alle Services starten.

> **Tipp:** Die generierte .env enthält alle nötigen Variablen für einen lokalen Start. Für Server-Deployments kannst du die Werte einfach anpassen.

## Konfiguration & .env

Alle wichtigen Umgebungsvariablen werden zentral in einer .env-Datei im Projekt-Root verwaltet. Beispiele und empfohlene Werte findest du in .env.example. Wichtige Variablen sind u.a.:

- SIMTMP_HOST_PATH: Absoluter Pfad zum simtmp-Verzeichnis (wird für Worker und Docker benötigt)
- MONGO_URL: MongoDB-Verbindungs-URL
- RABBITMQ_URL: RabbitMQ-Verbindungs-URL
- BACKEND_PORT, FRONTEND_PORT: Ports für Backend und Frontend

> **Hinweis:** Die .env wird von allen Services (backend, worker, frontend) über docker-compose automatisch geladen.



## Workflows

## Datei-Upload & Download (Dateioperationen)

### Speichern (Download)
Im Sidebar-Menü kannst du deinen aktuellen Code und die Testbench herunterladen:

- **Nur Design:** Es wird eine Datei `main.sv` heruntergeladen.
- **Design + Testbench:** Es wird eine ZIP-Datei mit `main.sv` und `tb.sv` (oder `tb.py`) heruntergeladen.

### Öffnen (Upload)
Beim Klick auf „Öffnen“:
1. Es erscheint ein Hinweisfenster, das dich auffordert, eine Hardware-Design-Datei (`.sv` oder `.txt`) auszuwählen.
2. Nach Auswahl wirst du gefragt, ob du auch eine Testbench laden möchtest. Bei Bestätigung kannst du eine Testbench-Datei (`.sv`, `.py` oder `.txt`) auswählen.
3. Falsche Dateitypen werden abgefangen und mit einer Fehlermeldung abgelehnt.

Alle Hinweise und Fehlermeldungen erscheinen automatisch in Deutsch oder Englisch – je nach gewählter UI-Sprache.

---

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
- **Design + Testbench**: 10+ Beispiele mit passender Testbench (SystemVerilog und Cocotb/Python), inkl. ausführlicher Cocotb-Logs (z. B. ALU, Komparator, synchroner Zähler)

Beim Klick auf ein Beispiel werden der Code (und ggf. die Testbench) direkt in die Editoren geladen. Die Testbench-Option wird automatisch gesetzt.

Damit kannst du schnell verschiedene Schaltungen und Testbenches ausprobieren, ohne selbst Code eintippen zu müssen.
---

# English Documentation

HDLab – HDL Playground & Simulation Platform

Web-based development environment for SystemVerilog with end-to-end simulation in Docker containers.

## Features

- **Monaco Editor** (VS Code in the browser)
- **SystemVerilog simulation** (Verilator, Docker-based)
- **Testbench optional & controllable**: Testbench can be enabled/disabled via UI. Simulation works without testbench (pure module).
- **Testbench editor**: Separate editor area for testbench code (SystemVerilog or Python).
- **Cocotb flow**: Python testbenches (`tb.py`) are automatically executed via Cocotb.
- **Waveform output** (VCD)
- **Live log output** in the frontend with two views:
	- **Compact** (short relevant summary)
	- **Full** (filtered Cocotb test run without compiler/build noise)
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
- `apps/worker` – simulation worker, Docker orchestration
- `docker/sim-verilator` – Verilator container for simulations
- `simtmp/` – temporary simulation data (mounted, .gitignore!)

## Setup & Development

1. Requirements: Docker, Node.js, npm, MongoDB, RabbitMQ
2. `docker compose up --build` (starts all services)
3. Frontend: `cd apps/frontend && npm install && npm run dev`
4. Backend: `cd apps/backend && npm install && npm start`
5. Worker: `cd apps/worker && npm install && npm start`

### Start script

`start.sh` builds both the compose services and the simulation image `hdl-sim-verilator` before startup, ensuring container-side Verilator/Cocotb changes are always active.

## Setup Script

The `setup.sh` script automates the entire setup:

- Runs `npm install` in all apps
- Builds all Docker images (including sim-verilator)
- Automatically creates a `.env` in the project root and sets the correct absolute path for `SIMTMP_HOST_PATH`

**Usage:**

```sh
bash setup.sh
```

Afterwards, the project is ready and you can start all services with `docker compose up`.

> **Tip:** The generated .env contains all necessary variables for local startup. For server deployments, simply adjust the values.

## Configuration & .env

All important environment variables are managed centrally in a .env file in the project root. See .env.example for sample and recommended values. Important variables include:

- SIMTMP_HOST_PATH: Absolute path to simtmp directory (used by worker and Docker)
- MONGO_URL: MongoDB connection URL
- RABBITMQ_URL: RabbitMQ connection URL
- BACKEND_PORT, FRONTEND_PORT: Ports for backend and frontend

> **Note:** The .env is automatically loaded by all services (backend, worker, frontend) via docker-compose.

## Workflows

### Start simulation
## File Upload & Download (File Operations)

### Save (Download)
In the sidebar menu you can download your current code and testbench:

- **Design only:** A file `main.sv` will be downloaded.
- **Design + Testbench:** A ZIP file containing `main.sv` and `tb.sv` (or `tb.py`) will be downloaded.

### Open (Upload)
When clicking "Open":
1. A dialog appears prompting you to select a hardware design file (`.sv` or `.txt`).
2. After selection, you are asked if you want to load a testbench as well. If confirmed, you can select a testbench file (`.sv`, `.py`, or `.txt`).
3. Invalid file types are rejected with an error message.

All hints and error messages are automatically shown in German or English – depending on the selected UI language.

---
### Start simulation
1. Enter SystemVerilog code in the editor
2. Optionally enable testbench and write your own testbench code in the separate editor (SystemVerilog or Python)
3. Click "Start simulation"
4. Project & simulation are created in the backend
5. Worker picks up simulation job, creates temp directory, copies files
6. Docker container (Verilator) is started, simulation runs
7. Log & waveform (if any) are read and saved in backend
8. Frontend polls for result and displays log

#### Notes on testbench option
- If testbench is disabled, only the main module is simulated (e.g. for $display or minimal examples).
- If enabled, testbench code is passed as tb.sv (or tb.py) and used as top module.
- Switching is done directly via the UI (checkbox "Enable testbench").

---

### UI/UX Improvements (April 2026)
- Sidebar with language, testbench option, waveform option, file buttons
- Topbar with logo, title, and menu
- Testbench editor only visible when testbench is enabled
- Modern, responsive design (CSS)

### Code examples in frontend
In the sidebar menu, you now find a dedicated "Code Examples" submenu with two categories:

- **Design only**: 10+ minimal examples (AND, OR, NOT, XOR, full adder, counter, latch, multiplexer, flip-flop, etc.)
- **Design + Testbench**: 10+ examples with matching testbench (SystemVerilog and Cocotb/Python), including verbose Cocotb logs (e.g. ALU, comparator, synchronous counter)

Clicking an example loads the code (and testbench, if present) directly into the editors. The testbench option is set automatically.

This allows you to quickly try out different circuits and testbenches without having to type code yourself.
---


