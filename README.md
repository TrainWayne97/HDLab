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
- **Interaktives Tutorial-System**:
  - Knapp 90 Lektionen zu (System)Verilog, organisiert in einer Einführung + 11 Kapiteln (Kapitel-Dropdowns mit Typ-Badges 📖/✏️/🚀 in der Übersicht)
  - Code-Validierung für Übungen mit automatisch instrumentierter Testbench (kein Sperren der nächsten Lektion mehr, stattdessen Status-Marker "✓ Abgeschlossen"/"○ Nicht abgeschlossen")
  - Musterlösungen nur nach Passwortabfrage sichtbar (Bypass für Rollen `admin`/`developer`)
  - Reset-Button für Übungen, schreibgeschützte Testbench
  - Markdown-Rendering inkl. Tabellen und rohem HTML (`remark-gfm`, `rehype-raw`)
- **Gruppen-/Rollensystem**: `user` / `developer` / `admin`, Vergabe aktuell nur per CLI-Skript (`apps/backend/scripts/setRole.js`)

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

1. Voraussetzungen: Docker, Node.js, npm (MongoDB/RabbitMQ laufen als Container, keine lokale Installation nötig)
2. `./setup.sh local` (oder `server`) - installiert Dependencies, baut alle Docker-Images inkl. `hdl-sim-verilator`, generiert `.env.runtime`
3. `./start.sh local` (oder `server`) - startet den Stack per `docker compose`
4. Für isolierte Frontend-/Backend-/Worker-Entwicklung außerhalb Docker: `cd apps/frontend && npm install && npm run dev` (analog `apps/backend`, `apps/worker`)

### Lokal vs. Server-Modus

Beide Skripte (`setup.sh`, `start.sh`) nehmen `local` oder `server` als Argument (Default: `local`):

- **`local`**: `docker-compose.override.yml` wird zusätzlich geladen und exponiert Host-Ports (Frontend 5173, Backend 3001, Mongo 27017, RabbitMQ 5672/15672, Gateway 8080) - für Entwicklung auf dem eigenen Rechner
- **`server`**: nur `docker-compose.yml`, keine zusätzliche Portfreigabe - `80`/`443` werden extern (z.B. per Uni-Reverse-Proxy) auf den `gateway`-Service (nginx, Port 8080) weitergeleitet, der intern zu `frontend`/`backend` proxied (`docker/nginx/nginx.conf`)

### Setup-Skript (`setup.sh`)

- Führt `npm install` in `apps/frontend`, `apps/backend`, `apps/worker` aus
- Baut alle Docker-Images (`docker compose build`, inkl. `hdl-sim-verilator`)
- Generiert `.env.runtime` im Projekt-Root (**nicht** `.env`) mit an den Modus angepassten Werten (`NODE_ENV`, `CORS_ORIGIN`, `LOG_LEVEL`, ...)

```sh
./setup.sh local    # oder: ./setup.sh server
./start.sh local    # oder: ./start.sh server
```

> **Wichtig:** `frontend` läuft immer über den Vite-Dev-Server (`npm run dev`), nie über einen Production-Build. `docker-compose.yml` überschreibt dort `NODE_ENV` deshalb explizit auf `development`, unabhängig davon, was `.env.runtime` sonst für den Server-Modus einträgt - sonst bricht Reacts JSX-Dev-Runtime (`_jsxDEV is not a function`, weißer Bildschirm).

### Startskript (`start.sh`)

Startet den Stack per `docker compose up -d --build` mit `--env-file .env.runtime` und (im lokalen Modus zusätzlich) `docker-compose.override.yml`.

## Konfiguration & .env.runtime

Alle wichtigen Umgebungsvariablen werden zentral in `.env.runtime` im Projekt-Root verwaltet, generiert von `setup.sh` (nicht manuell anlegen). Wichtige Variablen:

- `SIMTMP_HOST_PATH`: Absoluter Pfad zum `simtmp`-Verzeichnis (wird für Worker und Docker benötigt)
- `MONGO_URL`, `RABBITMQ_URL`: Verbindungs-URLs
- `BACKEND_PORT`, `FRONTEND_PORT`: Ports für Backend und Frontend
- `BACKEND_URL`: Interne Backend-Adresse im Docker-Netz (`http://backend:3001`), u.a. für die Tutorial-Validierung genutzt, die intern die eigene REST-API aufruft
- `VITE_API_URL`: API-Basis-Pfad fürs Frontend (Standard `/api`, über Vite/nginx-Proxy)
- `VITE_TUTORIAL_SOLUTION_PASSWORD`: Passwort für die Musterlösungsanzeige im Tutorial
- `CORS_ORIGIN`: wird generiert, vom Backend aktuell aber **nicht** ausgewertet (CORS ist derzeit uneingeschränkt, siehe Backend-README Abschnitt 18)
- `NODE_ENV`, `LOG_LEVEL`: je nach Modus `production`/`development` bzw. `info`/`debug`

> **Hinweis:** `.env.runtime` wird von `backend`, `worker` und `frontend` über `env_file:` in `docker-compose.yml` automatisch geladen. `gateway` (nginx) nutzt keine `.env.runtime`-Werte, sondern die statische `docker/nginx/nginx.conf`.



## Workflows

Die folgenden Abschnitte beschreiben die wichtigsten Nutzer-Workflows im Detail.

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
- Hilfe-Dialog in der Topbar mit Funktionsbeschreibung und Signal-Farblegende
- Einstellungen-Dialog mit Light/Dark-Mode (persistiert via Local Storage)
- Testbench-Editor nur sichtbar, wenn Testbench aktiviert
- Modernes, responsives Design (CSS)
- Waveform-Signalansicht mit:
	- Signal-Auswahl pro Spur (Checkbox)
	- Zoom-Regler
	- Bus-Value-Labels (Hex)
	- Farbcodierten Flanken (rising/falling)

---

### Code-Beispiele im Frontend
Im Sidebar-Menü findest du jetzt ein eigenes Untermenü „Code-Beispiele“ mit zwei Kategorien:

- **Nur Design**: 10+ Minimalbeispiele (AND, OR, NOT, XOR, Volladdierer, Zähler, Latch, Multiplexer, Flipflop, u.a.)
- **Design + Testbench**: 10+ Beispiele mit passender Testbench (SystemVerilog und Cocotb/Python), inkl. ausführlicher Cocotb-Logs (z. B. ALU, Komparator, synchroner Zähler)

Beim Klick auf ein Beispiel fragt eine Bestätigung nach ("Möchten Sie dieses Code-Beispiel wirklich laden? Die bereits geschriebenen Module im Editor werden dadurch gelöscht.") - erst danach werden Code (und ggf. Testbench) direkt in die Editoren geladen und die Testbench-Option automatisch gesetzt.

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
- **Interactive tutorial system**:
  - Just under 90 lessons on (System)Verilog, organized into an introduction + 11 chapters (chapter dropdowns with type badges 📖/✏️/🚀 in the overview)
  - Code validation for exercises via an automatically instrumented testbench (the next lesson is no longer locked; instead a status marker shows "✓ Completed"/"○ Not completed")
  - Sample solutions only visible after a password prompt (bypassed for roles `admin`/`developer`)
  - Reset button for exercises, read-only testbench
  - Markdown rendering including tables and raw HTML (`remark-gfm`, `rehype-raw`)
- **Group/role system**: `user` / `developer` / `admin`, currently assigned only via a CLI script (`apps/backend/scripts/setRole.js`)

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

1. Requirements: Docker, Node.js, npm (MongoDB/RabbitMQ run as containers, no local install needed)
2. `./setup.sh local` (or `server`) - installs dependencies, builds all Docker images including `hdl-sim-verilator`, generates `.env.runtime`
3. `./start.sh local` (or `server`) - starts the stack via `docker compose`
4. For isolated frontend/backend/worker development outside Docker: `cd apps/frontend && npm install && npm run dev` (similarly for `apps/backend`, `apps/worker`)

### Local vs. Server Mode

Both scripts (`setup.sh`, `start.sh`) take `local` or `server` as an argument (default: `local`):

- **`local`**: `docker-compose.override.yml` is additionally loaded and exposes host ports (frontend 5173, backend 3001, Mongo 27017, RabbitMQ 5672/15672, gateway 8080) - for development on your own machine
- **`server`**: only `docker-compose.yml`, no additional port exposure - `80`/`443` are forwarded externally (e.g. via a university reverse proxy) to the `gateway` service (nginx, port 8080), which proxies internally to `frontend`/`backend` (`docker/nginx/nginx.conf`)

### Setup Script (`setup.sh`)

- Runs `npm install` in `apps/frontend`, `apps/backend`, `apps/worker`
- Builds all Docker images (`docker compose build`, including `hdl-sim-verilator`)
- Generates `.env.runtime` in the project root (**not** `.env`) with mode-specific values (`NODE_ENV`, `CORS_ORIGIN`, `LOG_LEVEL`, ...)

```sh
./setup.sh local    # or: ./setup.sh server
./start.sh local    # or: ./start.sh server
```

> **Important:** `frontend` always runs the Vite dev server (`npm run dev`), never a production build. `docker-compose.yml` therefore explicitly overrides `NODE_ENV` to `development` there, regardless of what `.env.runtime` otherwise sets for server mode - otherwise React's JSX dev runtime breaks (`_jsxDEV is not a function`, blank screen).

### Start Script (`start.sh`)

Starts the stack via `docker compose up -d --build` with `--env-file .env.runtime` and (in local mode, additionally) `docker-compose.override.yml`.

## Configuration & .env.runtime

All important environment variables are managed centrally in `.env.runtime` in the project root, generated by `setup.sh` (don't create it manually). Important variables:

- `SIMTMP_HOST_PATH`: absolute path to the `simtmp` directory (used by worker and Docker)
- `MONGO_URL`, `RABBITMQ_URL`: connection URLs
- `BACKEND_PORT`, `FRONTEND_PORT`: ports for backend and frontend
- `BACKEND_URL`: internal backend address on the Docker network (`http://backend:3001`), used e.g. by tutorial validation, which internally calls the backend's own REST API
- `VITE_API_URL`: API base path for the frontend (default `/api`, via Vite/nginx proxy)
- `VITE_TUTORIAL_SOLUTION_PASSWORD`: password for showing sample solutions in the tutorial
- `CORS_ORIGIN`: generated, but currently **not** evaluated by the backend (CORS is currently unrestricted, see backend README section 18)
- `NODE_ENV`, `LOG_LEVEL`: `production`/`development` resp. `info`/`debug` depending on mode

> **Note:** `.env.runtime` is automatically loaded by `backend`, `worker`, and `frontend` via `env_file:` in `docker-compose.yml`. `gateway` (nginx) doesn't use `.env.runtime` values at all, only the static `docker/nginx/nginx.conf`.

## Workflows

The following sections describe the key user workflows in detail.

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
- Topbar help dialog with feature explanation and signal color legend
- Settings dialog with Light/Dark mode (persisted via local storage)
- Testbench editor only visible when testbench is enabled
- Modern, responsive design (CSS)
- Waveform signal view with:
	- Per-row signal selection (checkbox)
	- Zoom slider
	- Inline bus value labels (hex)
	- Color-coded edge transitions (rising/falling)

### Code examples in frontend
In the sidebar menu, you now find a dedicated "Code Examples" submenu with two categories:

- **Design only**: 10+ minimal examples (AND, OR, NOT, XOR, full adder, counter, latch, multiplexer, flip-flop, etc.)
- **Design + Testbench**: 10+ examples with matching testbench (SystemVerilog and Cocotb/Python), including verbose Cocotb logs (e.g. ALU, comparator, synchronous counter)

Clicking an example first asks for confirmation ("Do you really want to load this code example? The modules already written in the editor will be deleted.") - only then is the code (and testbench, if present) loaded directly into the editors and the testbench option set automatically.

This allows you to quickly try out different circuits and testbenches without having to type code yourself.
---

## User Authentication & Progress Tracking (Mai 2026)

HDLab implementiert ein vollständiges Authentifizierungs- und Fortschritts-System für Tutorial-Lektionen.

### Features

#### 👤 User Authentication (JWT)
- **Registrierung**: Neuen Account mit Email/Passwort erstellen
- **Login**: Mit Benutzername und Passwort anmelden
- **Persistente Sessions**: Automatisch gespeichert im Browser
- **Sichere Passwörter**: bcrypt-Hashing auf dem Backend
- **Token-Management**: 7-Tage gültige JWT Tokens

#### 📚 Tutorial Progress
- **Auto-Save**: Code wird nach 2 Sekunden Inaktivität automatisch gespeichert
- **Manual Save**: Zusätzlicher Speichern-Button für manuelles Saving
- **Progress Loading**: Beim Öffnen einer Lektion wird der vorherige Code geladen
- **Solution Tracking**: Gelöste Aufgaben werden mit Status gespeichert
- **Timestamp**: "Zuletzt gespeichert" Indicator zeigt wann der Code zuletzt aktualisiert wurde
- **Validation Status**: Tracking ob eine Aufgabe `nicht-gestartet`, `bestanden` oder `fehlgeschlagen` hat

#### 📦 Module Library
- **Verilog Module speichern**: Geschriebene Module können mit Namen + Tags gespeichert werden
- **Modul-Katalog**: Alle gespeicherten Module sichtbar in einer Sidebar
- **Wiederverwendung**: Module können mit ➕ Button in andere Aufgaben eingefügt werden
- **Versionierung**: Jede Aktualisierung eines Moduls erstellt eine neue Version
- **Abhängigkeiten**: z.B. `modul_addierer` kann auf `modul_nand` aufbauen

#### 🔑 Gruppen/Rollen
- Jeder Nutzer hat `roles` (Standard `['user']` bei Registrierung)
- Rollen `developer`/`admin` schalten die Musterlösungsanzeige im Tutorial ohne Passwortabfrage frei
- Rollenvergabe nur per CLI-Skript (`apps/backend/scripts/setRole.js`), keine Admin-Oberfläche - siehe Backend-README Abschnitt 14.1

### Workflow Example

```
1. User registriert sich → Erstellt Account
2. Login → Token wird gespeichert
3. Öffnet Lektion 10 (modul_nand)
   - Vorheriger Code wird geladen
   - Beginnt zu schreiben
   - Nach 2s wird auto-gespeichert
4. Klickt "Lösung einreichen"
   - Code wird validiert
   - Bei Erfolg: Status = "passed", Lösung gespeichert, Status-Marker zeigt "✓ Abgeschlossen"
   - "Nächste Lektion" ist in jedem Fall klickbar (kein Sperren mehr bei nicht bestandener Übung)
5. Öffnet Lektion 20 (modul_addierer)
   - Benötigt modul_nand
   - Klickt ➕ Button in ModuleLibrary
   - modul_nand wird eingefügt
6. Speichert neues Modul "modul_addierer"
   - Kann später in anderen Aufgaben wiederverwendet werden
```

### Backend Changes
- `POST /api/auth/register` - Benutzer registrieren
- `POST /api/auth/login` - Anmelden
- `GET /api/auth/me` - Benutzer-Info
- `GET/POST /api/tutorial/progress/:lessonId` - Fortschritt laden/speichern
- `GET/POST/PATCH/DELETE /api/modules` - Module verwalten

**Alle Protected Endpoints** erfordern `Authorization: Bearer <token>` Header

### Frontend Components
- `<AuthContext>` - Hook für Auth-Verwaltung
- `<LoginPage>` / `<RegisterPage>` - Authentifizierungs-UI
- `<TutorialLesson>` - Mit Auto-Save und Progress-Loading
- `<ModuleLibrary>` - Modul-Verwaltungs-Sidebar
- `<Topbar>` - Mit Profil-Dropdown und Logout

### Environment Setup

Wird von `setup.sh` in `.env.runtime` generiert (siehe Abschnitt "Konfiguration & .env.runtime" oben), nicht manuell anlegen:

```bash
JWT_SECRET=your-secure-key
VITE_API_URL=/api
VITE_TUTORIAL_SOLUTION_PASSWORD=your-password
```

---

## Installation & Configuration (Mai 2026)

### Prerequisites
- Node.js 18+
- Docker & Docker Compose

(MongoDB und RabbitMQ laufen als Docker-Container, keine separate Installation nötig.)

### Quick Start

```bash
# 1. Clone
git clone https://github.com/your-repo/HDLab.git
cd HDLab

# 2. Setup (installiert Dependencies, baut Images, generiert .env.runtime)
./setup.sh local

# 3. Start (docker compose up -d --build)
./start.sh local

# 4. Optional: isolierte Entwicklung außerhalb Docker
# Terminal 1: Frontend
cd apps/frontend && npm run dev

# Terminal 2: Backend  
cd apps/backend && npm run dev

# Terminal 3: Worker (if needed)
cd apps/worker && npm run dev
```

### MongoDB Initialization

Collections werden beim ersten Backend-Start automatisch erstellt:
- `users` - Benutzerkonten
- `tutorialprogresses` - Lektion-Fortschritt
- `modulelibraries` - Gespeicherte Module
- `simulations` - Simulationsjobs
- `projects` - HDL-Projekte

## Neuerungen (Juli 2026)

- Tutorial-Übersicht: Kapitel-Dropdowns statt flacher Liste (max. 7 sichtbare Unterkapitel + "Mehr anzeigen"), Typ-Badges (Theorie/Übung/Projekt)
- Tutorial-Lektion: Reset-Button, schreibgeschützte Testbench, Passwortabfrage für Musterlösungen (Bypass für `admin`/`developer`), Status-Marker statt Sperre der "Nächste Lektion"
- Markdown-Rendering: `remark-gfm` (Tabellen) und `rehype-raw` (rohes HTML) ergänzt
- Gruppen-/Rollensystem eingeführt (`roles: ['user' | 'developer' | 'admin']`)
- Code-Beispiele in der Sidebar fragen jetzt immer vor dem Laden nach Bestätigung
- `setup.sh`/`start.sh` mit lokal/Server-Modus-Unterscheidung, `.env.runtime` (löst den alten einzelnen `.env`-Ablauf ab), nginx-Gateway für Server-Deployments

---

# English Documentation (continued) - Auth, Roles, Installation

The two sections below mirror the German "User Authentication & Progress Tracking" and "Installation & Configuration" sections above, which were added after the initial English translation.

## User Authentication & Progress Tracking (May 2026)

HDLab implements a full authentication and progress-tracking system for tutorial lessons.

### Features

#### 👤 User Authentication (JWT)
- **Registration**: create a new account with email/password
- **Login**: sign in with username and password
- **Persistent sessions**: automatically stored in the browser
- **Secure passwords**: bcrypt hashing on the backend
- **Token management**: JWT tokens valid for 7 days

#### 📚 Tutorial Progress
- **Auto-save**: code is automatically saved after 2 seconds of inactivity
- **Manual save**: additional save button for manual saving
- **Progress loading**: previous code is loaded when opening a lesson
- **Solution tracking**: solved exercises are saved with a status
- **Timestamp**: "last saved" indicator shows when the code was last updated
- **Validation status**: tracks whether an exercise is `not-started`, `passed`, or `failed`

#### 📦 Module Library
- **Save Verilog modules**: written modules can be saved with a name + tags
- **Module catalog**: all saved modules visible in a sidebar
- **Reuse**: modules can be inserted into other exercises via the ➕ button
- **Versioning**: every update to a module creates a new version
- **Dependencies**: e.g. `modul_addierer` can build on `modul_nand`

#### 🔑 Groups/Roles
- Every user has `roles` (default `['user']` on registration)
- Roles `developer`/`admin` unlock the tutorial sample solution without a password prompt
- Roles are assigned only via a CLI script (`apps/backend/scripts/setRole.js`), no admin UI - see backend README section 14.1

### Workflow Example

```
1. User registers → creates account
2. Login → token is stored
3. Opens lesson 10 (modul_nand)
   - Previous code is loaded
   - Starts writing
   - Auto-saved after 2s
4. Clicks "Submit solution"
   - Code is validated
   - On success: status = "passed", solution saved, status marker shows "✓ Completed"
   - "Next lesson" is clickable either way (no more locking on a failed exercise)
5. Opens lesson 20 (modul_addierer)
   - Needs modul_nand
   - Clicks ➕ button in ModuleLibrary
   - modul_nand is inserted
6. Saves new module "modul_addierer"
   - Can be reused later in other exercises
```

### Backend Changes
- `POST /api/auth/register` - register a user
- `POST /api/auth/login` - log in
- `GET /api/auth/me` - user info
- `GET/POST /api/tutorial/progress/:lessonId` - load/save progress
- `GET/POST/PATCH/DELETE /api/modules` - manage modules

**All protected endpoints** require an `Authorization: Bearer <token>` header

### Frontend Components
- `<AuthContext>` - hook for auth management, incl. `hasRole()`
- `<LoginPage>` / `<RegisterPage>` - authentication UI
- `<TutorialLesson>` - with auto-save and progress loading
- `<ModuleLibrary>` - module management sidebar
- `<Topbar>` - with profile dropdown and logout

### Environment Setup

Generated by `setup.sh` into `.env.runtime` (see "Configuration & .env.runtime" above), don't create manually:

```bash
JWT_SECRET=your-secure-key
VITE_API_URL=/api
VITE_TUTORIAL_SOLUTION_PASSWORD=your-password
```

## Installation & Configuration (May 2026)

### Prerequisites
- Node.js 18+
- Docker & Docker Compose

(MongoDB and RabbitMQ run as Docker containers, no separate install needed.)

### Quick Start

```bash
# 1. Clone
git clone https://github.com/your-repo/HDLab.git
cd HDLab

# 2. Setup (installs dependencies, builds images, generates .env.runtime)
./setup.sh local

# 3. Start (docker compose up -d --build)
./start.sh local

# 4. Optional: isolated development outside Docker
# Terminal 1: Frontend
cd apps/frontend && npm run dev

# Terminal 2: Backend
cd apps/backend && npm run dev

# Terminal 3: Worker (if needed)
cd apps/worker && npm run dev
```

### MongoDB Initialization

Collections are created automatically on first backend start:
- `users` - user accounts
- `tutorialprogresses` - lesson progress
- `modulelibraries` - saved modules
- `simulations` - simulation jobs
- `projects` - HDL projects

## Changelog (July 2026)

- Tutorial overview: chapter dropdowns instead of a flat list (capped at 7 visible sub-chapters + "Show more"), type badges (theory/exercise/project)
- Tutorial lesson: reset button, read-only testbench, password-gated sample solutions (bypassed for `admin`/`developer`), status marker instead of locking "Next lesson"
- Markdown rendering: added `remark-gfm` (tables) and `rehype-raw` (raw HTML)
- Introduced a group/role system (`roles: ['user' | 'developer' | 'admin']`)
- Sidebar code examples now always ask for confirmation before loading
- `setup.sh`/`start.sh` local/server mode split, `.env.runtime` (replacing the old single `.env` flow), nginx gateway for server deployments

---


