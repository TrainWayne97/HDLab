<!-- DEUTSCH / GERMAN -->
# HDLab – HDL Playground & Simulation Platform

Webbasierte Entwicklungsumgebung für SystemVerilog mit End-to-End-Simulationen in Docker-Containern.

## Features

- **Monaco Editor** (VS Code im Browser)
- **SystemVerilog-Simulation** (Verilator, Docker-basiert)
- **Testbench optional & steuerbar**: Testbench kann per UI aktiviert/deaktiviert werden. Simulation funktioniert auch ohne Testbench (reines Modul).
- **Testbench-Editor**: Eigener Editorbereich für Testbench-Code (SystemVerilog oder Python).
- **Cocotb-Flow**: Python-Testbenches (`tb.py`) werden automatisch als Cocotb-Run ausgeführt.
- **Design-Explorer** (links im HDL-Code): Module, SystemVerilog-Packages und Ordner anlegen, beliebig verschachteln, per Drag & Drop verschieben und `.sv`/`.v`-Dateien importieren (Dateidialog oder hineinziehen); die Top-Datei ist frei wählbar (★). Die Ansicht „Hierarchie“ zeigt wie in Vivado, welches Modul welche Untermodule instanziiert, dazu Packages und nicht verwendete Module. Packages werden automatisch vor den Dateien kompiliert, die sie importieren; Module aus „Meine Module“ lassen sich als eigene Datei einbinden. Header-Dateien (`.svh`/`.vh`, „+ Header“) für `` `define ``, `typedef` & Co. werden mit `` `include `` eingebunden und nicht einzeln kompiliert; Ordnerpfade im `` `include `` (z.B. aus Vivado-Projekten) löst der Worker auf den Dateinamen auf, da die Simulation alle Dateien flach bekommt
- **Multi-Projekt-Editor**: mehrere Projekte als Tabs, umbenennbar, bleiben beim Wechsel ins Tutorial und beim Neuladen erhalten
- **Parallele Simulationen**: jedes Projekt simuliert unabhängig (eigene Konsole, eigener Waveform-Viewer, Status im Tab); der Worker führt bis zu `MAX_WORKERS` (Default 4) Simulationen gleichzeitig aus
- **Workbench-Layout**: Editor, Tutorial und Kurse teilen sich denselben Aufbau mit einem Dock unten (Reiter Ausgabe / Waveform / Netlist / Basys3); Editorbreite und Dockhöhe per Ziehen anpassbar, Dock einklappbar
- **Waveform-Viewer** (VCD, inkl. Signale in Structs/Interfaces via `--trace-structs`): Einzelbits als Linien, Busse als Wertboxen, Zeitlineal und Cursor, Filter, Zoom, Verschieben, "Gehe zu Zeit", Hex/Dez/Bin pro Signal, Signale aus-/einblenden, VCD-Download
- **Netlist-Ansicht**: Schaltplan des Designs (Top-Datei samt Packages und Untermodulen), erzeugt mit Yosys im Sim-Container und von `netlistsvg` im Worker als SVG gerendert, mit Gatternamen, Zoom, Verschieben und SVG-Download. Untermodule lassen sich öffnen: Klick auf den Kasten (`instanz : modul`), Pfadleiste `top › u_alu › u_add` oder Auswahlliste aller Instanzen. Gezeichnet wird mit jeder Simulation nur das Top-Modul; ein Untermodul erst, wenn es jemand öffnet (Queue `netlist-render`, danach gespeichert). Instanzen mit gleicher Struktur teilen sich eine Zeichnung (z. B. 512 Instanzen aus einer Generate-Schleife → 3 Zeichnungen)
- **Basys3-Board-Simulation** (Dock-Reiter „Basys3“, Details in [apps/frontend/src/utils/boardSim/README.md](apps/frontend/src/utils/boardSim/README.md)): das Top-Modul läuft auf einem virtuellen Basys3 mit 16 Schaltern, 5 Tastern, 16 LEDs und 4-stelliger 7-Segment-Anzeige. Der Server synthetisiert nur einmal mit Yosys (kein Verilator-Lauf, unter einer Sekunde), simuliert wird im Browser in einem Web Worker: das Netlist wird zu JavaScript übersetzt (typische Übungsdesigns ≈ 10–20 MHz, also etwa 1:5 bis 1:10 der echten 100 MHz; Takt frei einstellbar von 1 mHz bis 100 MHz oder Max, Pause, Einzeltakt, Neustart; CLK-LED und ein-/ausblendbares Mini-Oszilloskop zeigen den Takt, bis 12 Hz mit echter High-Phase und Ausgängen, die an der steigenden Flanke umschalten). LEDs und 7-Segment-Anzeige werden zeitlich gemittelt: PWM wirkt gedimmt, das Multiplexing flackert nicht (Nachleuchten 50 ms Simulationszeit – was auf dem echten Board flackert, flackert auch hier). Ports werden über die Namen aus dem Basys3-Master-XDC zugeordnet (`clk`, `sw`, `led`, `seg`, `dp`, `an`, `btnC/U/L/R/D`). Jeder Tasterzustand hält mindestens 25 ms Board-Zeit (höchstens 1 s Echtzeit), damit auch Designs mit Entprellung für echte Hardware kurze Mausklicks erkennen; schnelle Klicks werden der Reihe nach abgearbeitet
- **Logausgabe** im Frontend als Kurzfassung, Details per "Details anzeigen"
- **Vollbildmodus** für Code-/Testbench-Editoren und Tutorial-Codeblöcke (Esc beendet)
- **Eigene URLs** für Editor, Tutorial, Kurse und einzelne Lektionen (`/Editor`, `/Tutorial/<lesson_id>`, `/Lehre/<kurs>/<lesson_id>`): Browser-Pfeile, Reload und Links funktionieren
- **RabbitMQ-Queue** für Simulationen
- **MongoDB** für Projekte & Ergebnisse
- **Datei-Upload/Download** (optional)
- **Interaktives Tutorial-System**:
  - Knapp 90 Lektionen zu (System)Verilog, organisiert in einer Einführung + 11 Kapiteln (Kapitel-Dropdowns mit Typ-Badges 📖/✏️/🚀 in der Übersicht)
  - Lektionsbaum links mit ausklappbaren Kapiteln, Haken für gelöste Übungen und Fortschrittszähler pro Kapitel; das Tutorial öffnet die zuletzt besuchte Lektion
  - Code-Validierung für Übungen mit automatisch instrumentierter Testbench (kein Sperren der nächsten Lektion mehr, stattdessen Status-Marker "✓ Abgeschlossen"/"○ Nicht abgeschlossen"); die Validierung liefert auch Waveform und Netlist ins Dock
  - Tipps pro Lektion (`**HINT_START**` / `**HINT_END**` im Markdown), die per "Tipp anzeigen" einzeln aufgedeckt werden
  - Musterlösungen nur nach Passwortabfrage sichtbar (eigener Dialog, Bypass für Rollen `admin`/`developer`)
  - Reset-Button für Übungen, schreibgeschützte Testbench
  - Markdown-Rendering inkl. Tabellen und rohem HTML (`remark-gfm`, `rehype-raw`), Syntax-Highlighting für Verilog-Codebeispiele, Bilder
  - Validierungsergebnis mit aufklappbarer vollständiger Simulationsausgabe (inkl. Warnungen)
  - Tutorial-Inhalt wird täglich per GitHub Action aus dem externen Repo `Chaos-097/VerilogTutorial` synchronisiert (siehe "Tutorial-Sync")
- **Lehre / Kurse**: Topbar-Menü "Lehre" mit Kurs-Tutorials im selben Format (aktuell `ES1 – Embedded Systems 1`), Fortschritt pro Kurs getrennt gespeichert; Kursliste in `apps/frontend/src/config/courses.js`
- **Login**: Benutzername + Passwort oder HTWK-GitLab (OAuth2); "Passwort vergessen" setzt das Passwort per Benutzername + Email neu (ohne Mail)
- **Gruppen-/Rollensystem**: `user` / `developer` / `admin`, Vergabe aktuell nur per CLI-Skript (`apps/backend/scripts/setRole.js`)

## Architektur

- **Frontend:** React, Monaco Editor, Vite
- **Backend:** Node.js (Express), REST-API, RabbitMQ
- **Worker:** Simulations-Worker, führt Docker-Container aus
- **Datenbank:** MongoDB
- **Messaging:** RabbitMQ
- **Simulation:** Docker-Container mit Verilator (plus Yosys für die Netlist)

## Projektstruktur

- `apps/frontend` – Web-UI (React, Vite, Monaco)
- `apps/frontend/public/Tutorial`, `apps/frontend/public/Kurse/<Kurs>` – Tutorial- und Kursinhalte (Markdown + Bilder, per GitHub Action synchronisiert)
- `apps/backend` – REST-API, Projekt- & Simulationsmanagement
- `apps/worker` – Simulations-Worker, Docker-Ansteuerung, Netlist-Rendering
- `docker/sim-verilator` – Verilator-Container für Simulationen
- `docker/nginx` – Gateway-Konfiguration für den Server-Modus
- `Tutorial_Doc/` – Entwickler-Dokumentation zum Tutorial-System
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
- `BACKEND_URL`: Interne Backend-Adresse im Docker-Netz (`http://backend:3001`). Wird seit September 2026 nicht mehr benötigt - die Tutorial-Validierung ruft nicht mehr die eigene REST-API auf, sondern legt Projekt/Simulation direkt an. `setup.sh` setzt die Variable weiterhin, sie ist aber wirkungslos
- `VITE_API_URL`: API-Basis-Pfad fürs Frontend (Standard `/api`, über Vite/nginx-Proxy)
- `VITE_TUTORIAL_SOLUTION_PASSWORD`: Passwort für die Musterlösungsanzeige im Tutorial
- `CORS_ORIGIN`: wird generiert, vom Backend aktuell aber **nicht** ausgewertet (CORS ist derzeit uneingeschränkt, siehe Backend-README Abschnitt 18)
- `NODE_ENV`, `LOG_LEVEL`: je nach Modus `production`/`development` bzw. `info`/`debug`
- `MAX_WORKERS` (optional, wird von `setup.sh` nicht gesetzt): maximale Anzahl paralleler Simulationen pro Worker, Default `4`
- `APP_URL`: öffentliche Frontend-URL, auf die der GitLab-Login zurückleitet (lokal `http://localhost:8080`, Server `https://hdlab.eit.htwk-leipzig.de`)

### Zugangsdaten (`.env.secrets`)

Zugangsdaten stehen in `.env.secrets` im Projekt-Root. Die Datei liegt nicht im Git und wird von `setup.sh` an die generierte `.env.runtime` angehängt, übersteht also jedes erneute Setup. `setup.sh` gibt die Werte nicht mehr im Klartext aus.

```bash
JWT_SECRET=<mind. 32 Zeichen, z.B. openssl rand -hex 32>
GITLAB_CLIENT_ID=<application-id>        # leer lassen = GitLab-Login deaktiviert
GITLAB_CLIENT_SECRET=<secret>
# optional: GITLAB_URL (Standard https://gitlab.imn.htwk-leipzig.de), GITLAB_REDIRECT_URI
```

> **Wichtig:** `JWT_SECRET` ist Pflicht. Das Backend startet nicht, wenn es fehlt, ein bekannter Platzhalter (z.B. `your-secret-key`) oder kürzer als 32 Zeichen ist (`apps/backend/src/config/jwt.js`) - einen Fallback-Wert gibt es nicht mehr. Auf dem Server wird es manuell in `.env.secrets` gepflegt (`echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env.secrets`); `./setup.sh server` bricht vor dem Build ab, wenn es fehlt. `./setup.sh local` erzeugt bei Bedarf selbst ein zufälliges Secret in `.env.secrets`. Ein neues Secret macht alle bestehenden Logins ungültig. Einrichtung der GitLab-Application: siehe Backend-README Abschnitt 14 ("OAuth2-Login über GitLab").

> **Hinweis:** `.env.runtime` wird von `backend`, `worker` und `frontend` über `env_file:` in `docker-compose.yml` automatisch geladen. `gateway` (nginx) nutzt keine `.env.runtime`-Werte, sondern die statische `docker/nginx/nginx.conf`.



## Workflows

Die folgenden Abschnitte beschreiben die wichtigsten Nutzer-Workflows im Detail.

## Datei-Upload & Download (Dateioperationen)

### Speichern (Download)
Im Sidebar-Menü kannst du deinen aktuellen Code und die Testbench herunterladen:

- **Nur eine Design-Datei:** Es wird die Top-Datei (z. B. `main.sv`) heruntergeladen.
- **Mehrere Dateien oder mit Testbench:** Es wird eine ZIP-Datei mit allen Design-Dateien in ihrer Ordnerstruktur, `tb.sv` (oder `tb.py`) und `hdlab.json` (Top-Datei, Testbench, Wave-Einstellung) heruntergeladen. Sie lässt sich mit „Öffnen“ wieder als Projekt importieren.

### Öffnen (Upload)
Beim Klick auf „Öffnen“ wählst du entweder ein ganzes Projekt als ZIP oder eine einzelne Design-Datei:

- **Projekt-ZIP** (seit Oktober 2026): wird als **neuer Projekt-Tab** geöffnet, das aktuelle Projekt bleibt unverändert. Alle `.sv`/`.v`-Dateien werden mit ihrer Ordnerstruktur übernommen (ein gemeinsamer Wurzelordner wird entfernt). Mit „Speichern“ exportierte ZIPs enthalten eine `hdlab.json` mit Top-Datei, Testbench und Wave-Einstellung und werden exakt wiederhergestellt. Bei anderen ZIPs (z. B. einem gezippten Vivado-Quellordner) wird die Testbench erkannt (`tb.sv`/`tb.py`, sonst eine eindeutige Datei wie `*_tb.sv`) und als Top-Datei `main.sv` bzw. die Datei mit dem obersten Modul der Hierarchie gewählt. Doppelte Dateinamen werden umbenannt (Dateinamen müssen im Projekt eindeutig sein), andere Dateitypen übersprungen; beides meldet der Import. Grenzen: höchstens 31 Design-Dateien, 10 MB Inhalt. Logik in `apps/frontend/src/utils/projectImport.js`.
- **Einzelne Design-Datei** (`.sv`, `.v` oder `.txt`): ersetzt den Inhalt der Top-Datei. Danach wirst du gefragt, ob du auch eine Testbench laden möchtest (`.sv`, `.py` oder `.txt`).

Falsche Dateitypen werden abgefangen und mit einer Fehlermeldung abgelehnt.

Alle Hinweise und Fehlermeldungen erscheinen automatisch in Deutsch oder Englisch – je nach gewählter UI-Sprache.

---

### Simulation starten
1. SystemVerilog-Code im Editor eingeben
2. Optional: Testbench aktivieren und eigenen Testbench-Code im separaten Editor schreiben (SystemVerilog oder Python)
3. „Simulation starten“ klicken
4. Projekt & Simulation werden im Backend angelegt
5. Worker zieht Simulationsauftrag, erzeugt temporäres Verzeichnis, kopiert Dateien
6. Docker-Container (Verilator) wird gestartet: Yosys erzeugt die Netlist des Designs (Top-Datei samt Packages), danach läuft die Simulation
7. Log, ggf. Waveform und der vom Worker gerenderte Schaltplan (SVG) werden in MongoDB gespeichert
8. Frontend pollt auf Ergebnis und zeigt Log, Waveform und Netlist in den Dock-Reitern an

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
- **Design explorer** (left of the HDL code): create modules, SystemVerilog packages and folders, nest them freely, move them by drag & drop and import `.sv`/`.v` files (file dialog or drop); the top file can be chosen freely (★). The "Hierarchy" view shows, like Vivado, which module instantiates which submodules, plus packages and unused modules. Packages are compiled automatically before the files importing them; modules from "My Modules" can be added as separate files. Header files (`.svh`/`.vh`, "+ Header") for `` `define ``, `typedef` & co. are pulled in with `` `include `` and never compiled on their own; folder paths in an `` `include `` (e.g. from Vivado projects) are resolved to the file name by the worker, since the simulation gets all files flat
- **Multi-project editor**: multiple projects as tabs, renamable, kept when switching to the tutorial and across reloads
- **Parallel simulations**: each project simulates independently (own console, own waveform viewer, status in the tab); the worker runs up to `MAX_WORKERS` (default 4) simulations at once
- **Workbench layout**: editor, tutorial and courses share the same layout with a dock at the bottom (tabs Output / Waveform / Netlist / Basys3); editor width and dock height can be resized by dragging, the dock can be collapsed
- **Waveform viewer** (VCD, incl. signals inside structs/interfaces via `--trace-structs`): single bits as lines, buses as value boxes, time ruler and cursor, filter, zoom, pan, "go to time", hex/dec/bin per signal, hide/show signals, VCD download
- **Netlist view**: schematic of the design (top file with packages and submodules), generated by Yosys in the sim container and rendered to SVG by `netlistsvg` in the worker, with gate names, zoom, pan and SVG download. Submodules can be opened: click their box (`instance : module`), the path bar `top › u_alu › u_add` or the list of all instances. Every simulation only draws the top module; a submodule is drawn when someone opens it (queue `netlist-render`, stored afterwards). Instances with the same structure share one drawing (e.g. 512 instances from a generate loop → 3 drawings)
- **Basys3 board simulation** (dock tab "Basys3", details (German) in [apps/frontend/src/utils/boardSim/README.md](apps/frontend/src/utils/boardSim/README.md)): the top module runs on a virtual Basys3 with 16 switches, 5 buttons, 16 LEDs and a 4-digit 7-segment display. The server only synthesizes once with Yosys (no Verilator run, under a second); the simulation runs in the browser in a web worker: the netlist is compiled to JavaScript (typical exercise designs ≈ 10–20 MHz, about 1:5 to 1:10 of the real 100 MHz; clock freely adjustable from 1 mHz to 100 MHz or max, pause, single cycle, restart; a CLK LED and a toggleable mini scope show the clock, up to 12 Hz with a real high phase and outputs switching at the rising edge). LEDs and the 7-segment display are time-averaged: PWM looks dimmed, multiplexing doesn't flicker (50 ms persistence in simulated time – what flickers on the real board flickers here too). Ports are mapped by the names from the Basys3 master XDC (`clk`, `sw`, `led`, `seg`, `dp`, `an`, `btnC/U/L/R/D`). Each button level lasts at least 25 ms of board time (at most 1 s of real time), so designs debounced for real hardware also see short mouse clicks; fast clicks are queued
- **Log output** in the frontend as a short summary, details via "Details anzeigen"
- **Fullscreen mode** for code/testbench editors and tutorial code blocks (Esc exits)
- **Own URLs** for editor, tutorial, courses and individual lessons (`/Editor`, `/Tutorial/<lesson_id>`, `/Lehre/<course>/<lesson_id>`): browser back/forward, reload and links work
- **RabbitMQ queue** for simulations
- **MongoDB** for projects & results
- **File upload/download** (optional)
- **Interactive tutorial system**:
  - Just under 90 lessons on (System)Verilog, organized into an introduction + 11 chapters (chapter dropdowns with type badges 📖/✏️/🚀 in the overview)
  - Lesson tree on the left with collapsible chapters, check marks for solved exercises and a progress counter per chapter; the tutorial opens the last visited lesson
  - Code validation for exercises via an automatically instrumented testbench (the next lesson is no longer locked; instead a status marker shows "✓ Completed"/"○ Not completed"); validation also fills the waveform and netlist tabs in the dock
  - Hints per lesson (`**HINT_START**` / `**HINT_END**` in the markdown), revealed one at a time via "Show hint"
  - Sample solutions only visible after a password prompt (own dialog, bypassed for roles `admin`/`developer`)
  - Reset button for exercises, read-only testbench
  - Markdown rendering including tables and raw HTML (`remark-gfm`, `rehype-raw`), syntax highlighting for Verilog code examples, images
  - Validation result with a collapsible full simulation output (incl. warnings)
  - Tutorial content is synced daily via a GitHub Action from the external repo `Chaos-097/VerilogTutorial` (see "Tutorial sync")
- **Teaching / courses**: "Lehre" topbar menu with course tutorials in the same format (currently `ES1 – Embedded Systems 1`), progress stored separately per course; course list in `apps/frontend/src/config/courses.js`
- **Login**: username + password or HTWK GitLab (OAuth2); "Forgot password" sets a new password via username + email (no mail)
- **Group/role system**: `user` / `developer` / `admin`, currently assigned only via a CLI script (`apps/backend/scripts/setRole.js`)

## Architecture

- **Frontend:** React, Monaco Editor, Vite
- **Backend:** Node.js (Express), REST API, RabbitMQ
- **Worker:** Simulation worker, runs Docker containers
- **Database:** MongoDB
- **Messaging:** RabbitMQ
- **Simulation:** Docker container with Verilator (plus Yosys for the netlist)

## Project Structure

- `apps/frontend` – Web UI (React, Vite, Monaco)
- `apps/frontend/public/Tutorial`, `apps/frontend/public/Kurse/<course>` – tutorial and course content (markdown + images, synced via GitHub Action)
- `apps/backend` – REST API, project & simulation management
- `apps/worker` – simulation worker, Docker orchestration, netlist rendering
- `docker/sim-verilator` – Verilator container for simulations
- `docker/nginx` – gateway configuration for server mode
- `Tutorial_Doc/` – developer documentation for the tutorial system
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
- `BACKEND_URL`: internal backend address on the Docker network (`http://backend:3001`). No longer needed since September 2026 - tutorial validation no longer calls the backend's own REST API but creates the project/simulation directly. `setup.sh` still sets it, but it has no effect
- `VITE_API_URL`: API base path for the frontend (default `/api`, via Vite/nginx proxy)
- `VITE_TUTORIAL_SOLUTION_PASSWORD`: password for showing sample solutions in the tutorial
- `CORS_ORIGIN`: generated, but currently **not** evaluated by the backend (CORS is currently unrestricted, see backend README section 18)
- `NODE_ENV`, `LOG_LEVEL`: `production`/`development` resp. `info`/`debug` depending on mode
- `MAX_WORKERS` (optional, not set by `setup.sh`): maximum number of parallel simulations per worker, default `4`
- `APP_URL`: public frontend URL the GitLab login redirects back to (local `http://localhost:8080`, server `https://hdlab.eit.htwk-leipzig.de`)

### Credentials (`.env.secrets`)

Credentials live in `.env.secrets` in the project root. The file is not in Git; `setup.sh` appends it to the generated `.env.runtime`, so it survives every re-run of the setup. `setup.sh` no longer prints the values in plain text.

```bash
JWT_SECRET=<at least 32 chars, e.g. openssl rand -hex 32>
GITLAB_CLIENT_ID=<application-id>        # leave empty = GitLab login disabled
GITLAB_CLIENT_SECRET=<secret>
# optional: GITLAB_URL (default https://gitlab.imn.htwk-leipzig.de), GITLAB_REDIRECT_URI
```

> **Important:** `JWT_SECRET` is required. The backend refuses to start if it's missing, a known placeholder (e.g. `your-secret-key`) or shorter than 32 characters (`apps/backend/src/config/jwt.js`) - there is no fallback value anymore. On the server it is maintained manually in `.env.secrets` (`echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env.secrets`); `./setup.sh server` aborts before the build if it's missing. `./setup.sh local` generates a random secret in `.env.secrets` if needed. A new secret invalidates all existing logins. Setting up the GitLab application: see backend README section 14 ("OAuth2-Login über GitLab").

> **Note:** `.env.runtime` is automatically loaded by `backend`, `worker`, and `frontend` via `env_file:` in `docker-compose.yml`. `gateway` (nginx) doesn't use `.env.runtime` values at all, only the static `docker/nginx/nginx.conf`.

## Workflows

The following sections describe the key user workflows in detail.

## File Upload & Download (File Operations)

### Save (Download)
In the sidebar menu you can download your current code and testbench:

- **A single design file:** The top file (e.g. `main.sv`) will be downloaded.
- **Several files or with testbench:** A ZIP file with all design files in their folder structure, `tb.sv` (or `tb.py`) and `hdlab.json` (top file, testbench, wave setting) will be downloaded. It can be imported again as a project with "Open".

### Open (Upload)
When clicking "Open", you select either a whole project as ZIP or a single design file:

- **Project ZIP** (since October 2026): opened as a **new project tab**, the current project stays unchanged. All `.sv`/`.v` files are taken over with their folder structure (a shared root folder is removed). ZIPs exported with "Save" contain an `hdlab.json` with top file, testbench and wave setting and are restored exactly. For other ZIPs (e.g. a zipped Vivado source folder) the testbench is detected (`tb.sv`/`tb.py`, otherwise a unique file like `*_tb.sv`) and `main.sv` or the file with the topmost module of the hierarchy becomes the top file. Duplicate file names are renamed (file names must be unique within a project), other file types are skipped; the import reports both. Limits: at most 31 design files, 10 MB of content. Logic in `apps/frontend/src/utils/projectImport.js`.
- **Single design file** (`.sv`, `.v` or `.txt`): replaces the content of the top file. You are then asked whether to load a testbench as well (`.sv`, `.py` or `.txt`).

Invalid file types are rejected with an error message.

All hints and error messages are automatically shown in German or English – depending on the selected UI language.

---
### Start simulation
1. Enter SystemVerilog code in the editor
2. Optionally enable testbench and write your own testbench code in the separate editor (SystemVerilog or Python)
3. Click "Start simulation"
4. Project & simulation are created in the backend
5. Worker picks up simulation job, creates temp directory, copies files
6. Docker container (Verilator) is started: Yosys generates the netlist of the design (top file with packages), then the simulation runs
7. Log, waveform (if any) and the schematic (SVG) rendered by the worker are saved in MongoDB
8. Frontend polls for the result and shows log, waveform and netlist in the dock tabs

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
- `POST /api/auth/reset-password` - Passwort mit Benutzername + Email neu setzen
- `GET /api/auth/providers`, `GET /api/auth/gitlab`, `GET /api/auth/gitlab/callback` - Login über HTWK-GitLab (OAuth2)
- `GET /api/auth/me` - Benutzer-Info
- `GET/POST /api/tutorial/progress/:lessonId` - Fortschritt laden/speichern (`?course=<id>` für Kurse aus dem Lehre-Menü, ohne Parameter = Verilog-Tutorial)
- `GET/POST/PATCH/DELETE /api/modules` - Module verwalten
- `POST /api/projects`, `POST /api/simulations`, `GET /api/simulations/:id/results|waveform|netlist` - Simulationen (nur eigene Projekte/Simulationen)

**Alle Endpoints außer `/api/health` und `/api/auth/register|login|reset-password|providers|gitlab`** erfordern `Authorization: Bearer <token>` Header

### Frontend Components
- `<AuthContext>` - Hook für Auth-Verwaltung, inkl. `hasRole()` und GitLab-Login
- `<LoginPage>` / `<RegisterPage>` / `<ForgotPasswordPage>` - Authentifizierungs-UI
- `<TutorialLesson>` - Mit Auto-Save und Progress-Loading
- `<ModuleLibrary>` - Modul-Verwaltungs-Sidebar
- `<Topbar>` - Mit Profil-Dropdown und Logout

### Environment Setup

`VITE_API_URL` und `VITE_TUTORIAL_SOLUTION_PASSWORD` werden von `setup.sh` in `.env.runtime` generiert, `JWT_SECRET` kommt aus `.env.secrets` (siehe Abschnitt "Konfiguration & .env.runtime" oben):

```bash
JWT_SECRET=<mind. 32 Zeichen>        # .env.secrets, Pflicht
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
- `tutorialprogresses` - Lektion-Fortschritt (pro `courseId`)
- `modulelibraries` - Gespeicherte Module
- `simulations` - Simulationsjobs
- `projects` - HDL-Projekte
- `waveforms` - VCD-Daten pro Simulation
- `netlists` - Schaltplan (SVG) pro Simulation

Beim Backend-Start wird Fortschritt ohne `courseId` (aus der Zeit vor den Kursen) dem Verilog-Tutorial zugeordnet (`courseId: 'verilog'`) und der alte Unique-Index `{userId, lessonId}` durch `{userId, courseId, lessonId}` ersetzt.

## Neuerungen (Juli 2026)

- Tutorial-Übersicht: Kapitel-Dropdowns statt flacher Liste (max. 7 sichtbare Unterkapitel + "Mehr anzeigen"), Typ-Badges (Theorie/Übung/Projekt)
- Tutorial-Lektion: Reset-Button, schreibgeschützte Testbench, Passwortabfrage für Musterlösungen (Bypass für `admin`/`developer`), Status-Marker statt Sperre der "Nächste Lektion"
- Markdown-Rendering: `remark-gfm` (Tabellen) und `rehype-raw` (rohes HTML) ergänzt
- Gruppen-/Rollensystem eingeführt (`roles: ['user' | 'developer' | 'admin']`)
- Code-Beispiele in der Sidebar fragen jetzt immer vor dem Laden nach Bestätigung
- `setup.sh`/`start.sh` mit lokal/Server-Modus-Unterscheidung, `.env.runtime` (löst den alten einzelnen `.env`-Ablauf ab), nginx-Gateway für Server-Deployments

## Tutorial-Sync (GitHub Action)

Der Tutorial-Inhalt wird nicht in diesem Repo gepflegt, sondern im privaten Repo `Chaos-097/VerilogTutorial`. Die Action `.github/workflows/sync-Tutorial.yml` läuft täglich um 06:00 UTC (und manuell per `workflow_dispatch`):

1. **sync** (GitHub-Runner): kopiert `VerilogTutorial_V0.4.md` nach `apps/frontend/public/Tutorial/VerilogTutorialFormatted.md`, spiegelt den `images/`-Ordner per `rsync --delete` nach `apps/frontend/public/Tutorial/images/`, schreibt relative `./images/`-Pfade auf absolute `/Tutorial/images/` um und committet nur bei Änderungen ("Update Verilog tutorial from external repository")
2. **deploy** (self-hosted Runner `hdlab-server`, nur wenn sich etwas geändert hat): `git pull` im Server-Checkout (`vars.SERVER_REPO_PATH`) und `docker compose --env-file .env.runtime up -d --build frontend` - nötig, weil die Tutorial-Datei per `COPY` ins Frontend-Image gebacken wird

Benötigt das Secret `VERILOGTUTORIAL` (Token mit Lesezugriff auf das externe Repo). Der Server ist nur über das HTWK-VPN erreichbar, daher der self-hosted Runner.

### Kurs-Sync ES1 (`sync-ES1.yml`)

Der Kurs ES1 kommt aus dem Repo `joernhoffmann/VerilogTutorial-ES1` und wird nach demselben Muster synchronisiert:

- Auslöser: `repository_dispatch` (Typ `es1-tutorial-updated`, vom Workflow `notify-hdlab.yml` im Kurs-Repo bei jedem Push auf `ES1Tutorial.md`/`images/`), zusätzlich täglich um 06:15 UTC als Fallback und manuell per `workflow_dispatch`
- kopiert `ES1Tutorial.md` und `images/` nach `apps/frontend/public/Kurse/ES1/`, schreibt Bildpfade auf `/Kurse/ES1/images/` um, committet nur bei Änderungen ("Update ES1 course tutorial from external repository") und baut danach das Frontend auf dem Server neu
- ist das Kurs-Repo noch leer, wird der Lauf sauber übersprungen; das Repo ist öffentlich, das Secret `ES1TUTORIAL` ist nur nötig, falls es privat wird

Beide Sync-Workflows teilen sich die `concurrency`-Gruppe `tutorial-sync` und machen vor dem Push ein `git pull --rebase`, damit sie sich nicht gegenseitig blockieren.

### Neuen Kurs anlegen

1. Ordner `apps/frontend/public/Kurse/<Ordner>/` mit Markdown (gleiches Format wie das Verilog-Tutorial) und `images/` anlegen
2. Eintrag in `apps/frontend/src/config/courses.js` ergänzen (`id`, `shortTitle`, `title`, `subtitle`, `tutorialPath`). Die `id` dient im Backend als `courseId` für den Fortschritt und darf nachträglich nicht geändert werden
3. Optional einen Sync-Workflow nach dem Vorbild von `sync-ES1.yml` anlegen

## Neuerungen (August/September 2026)

**Editor & Simulation**
- Parallele Simulationen pro Projekt (eigener Status/Konsole/Waveform je Projekt, Status in den Tabs); `GET /api/simulations/:id/results` liefert jetzt `status`; Worker begrenzt Parallelität über `MAX_WORKERS` (Prefetch)
- Projekte bleiben beim Zurückkehren aus dem Tutorial und beim Neuladen erhalten; Umbenennen per Stift-Icon/Doppelklick; Bestätigung beim Schließen; neuer Topbar-Button "Editor"
- Konsole vereinfacht (Kompakt/Vollständig-Umschalter entfernt, Details über "Details anzeigen")
- Vollbildmodus für Editoren und Tutorial-Codeblöcke
- Waveforms: `--trace-structs` für Verilator (Signale in Structs/Interfaces/tieferen Hierarchien), letztes Segment im Viewer wird nicht mehr abgeschnitten

**Tutorial**
- Validierung: Warnungen erscheinen in der Fehler-Kurzfassung, vollständiges Log (`fullLog`) in aufklappbarem Panel
- Inhaltsverzeichnis-Links navigieren zur passenden Lektion
- Syntax-Highlighting für Verilog-Codebeispiele, Bilder werden aus dem externen Repo mitsynchronisiert
- Dark-Mode-Lesbarkeit im Tutorial verbessert

**Betrieb & Sicherheit**
- Tutorial-Sync-Action mit automatischem Frontend-Rebuild auf dem Server (siehe oben)
- `restart: always` für `backend`, `worker`, `frontend` und `gateway` in `docker-compose.yml`
- Unauthentifizierte Legacy-Endpunkte `POST /api/tutorials/validate` / `GET /api/tutorials/content` entfernt
- `/api/projects` und `/api/simulations` erfordern Login und liefern nur eigene Projekte/Simulationen (vorher konnte jeder mit Zugriff auf `/api/` Simulationen starten und fremde Logs lesen); `/api/svfile` nur noch für `admin`/`developer`. Projekte/Simulationen von vor dieser Änderung haben keinen Besitzer und sind nicht mehr abrufbar
- Vite 8.3.1 (esbuild-Dev-Server-Schwachstelle) und weitere `npm audit`-Fixes in Frontend und Worker

## Neuerungen (Oktober 2026)

**Lehre & Navigation**
- Topbar-Menü "Lehre" mit Kurs ES1 – Embedded Systems 1 (`public/Kurse/ES1`, Sync aus `joernhoffmann/VerilogTutorial-ES1`); Tutorial-Fortschritt ist pro `courseId` getrennt
- Eigene URLs: `/Editor`, `/Tutorial`, `/Tutorial/<lesson_id>`, `/Tutorial/Uebersicht`, `/Lehre/<id>`, `/Lehre/<id>/<lesson_id>`, `/Lehre/<id>/Uebersicht`. `/` und unbekannte Pfade werden ohne Verlaufseintrag auf `/Editor` umgeschrieben, fehlende Lektionen auf die zuletzt geöffnete bzw. erste

**Workbench, Waveform & Netlist**
- Dreispaltiges Layout in Tutorial und Kursen (Lektionsbaum, Lektion, Editor) mit Dock (Ausgabe/Waveform/Netlist); der Editor nutzt denselben Aufbau. Theorie-Lektionen ohne Übung zeigen weder Editor noch Dock
- Neuer Waveform-Viewer (siehe Features), Tutorial-Validierung erzeugt jetzt eine Waveform
- Netlist-Ansicht: Yosys im Sim-Image, Rendering mit `netlistsvg` im Worker, neuer Endpoint `GET /api/simulations/:id/netlist`

**Tutorial**
- Vor/Zurück-Pfeile neben dem Lektionstitel, Lektionskopf bleibt beim Scrollen oben (Desktop)
- "Testbench anzeigen"/"Lösung anzeigen" in der Fußzeile unter dem Editor; Dock startet für Studierende zugeklappt und öffnet sich bei fehlgeschlagener Einreichung
- Links im Inhaltsverzeichnis auf Zwischenüberschriften springen zum Abschnitt in der Lektion
- Tipps pro Lektion, Passwortabfrage für die Lösung als eigener Dialog statt `window.prompt`
- Fix: Auto-Speichern setzt eine gelöste Übung nicht mehr auf "nicht abgeschlossen" zurück

**Login**
- "Passwort vergessen": neues Passwort per Benutzername + Email (ohne Mail; `admin`/`developer` ausgenommen, Sperre nach 5 Fehlversuchen)
- Login über HTWK-GitLab (OAuth2), Zugangsdaten in `.env.secrets`
- **Sicherheit:** kein Fallback mehr auf `'your-secret-key'` - ohne gültiges `JWT_SECRET` (mind. 32 Zeichen, kein Platzhalter) startet das Backend nicht; `setup.sh` prüft das vor dem Build (Server: Abbruch, lokal: Secret wird erzeugt)

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
- `POST /api/auth/reset-password` - set a new password with username + email
- `GET /api/auth/providers`, `GET /api/auth/gitlab`, `GET /api/auth/gitlab/callback` - login via HTWK GitLab (OAuth2)
- `GET /api/auth/me` - user info
- `GET/POST /api/tutorial/progress/:lessonId` - load/save progress (`?course=<id>` for courses from the "Lehre" menu, no parameter = Verilog tutorial)
- `GET/POST/PATCH/DELETE /api/modules` - manage modules
- `POST /api/projects`, `POST /api/simulations`, `GET /api/simulations/:id/results|waveform|netlist` - simulations (own projects/simulations only)

**All endpoints except `/api/health` and `/api/auth/register|login|reset-password|providers|gitlab`** require an `Authorization: Bearer <token>` header

### Frontend Components
- `<AuthContext>` - hook for auth management, incl. `hasRole()` and GitLab login
- `<LoginPage>` / `<RegisterPage>` / `<ForgotPasswordPage>` - authentication UI
- `<TutorialLesson>` - with auto-save and progress loading
- `<ModuleLibrary>` - module management sidebar
- `<Topbar>` - with profile dropdown and logout

### Environment Setup

`VITE_API_URL` and `VITE_TUTORIAL_SOLUTION_PASSWORD` are generated by `setup.sh` into `.env.runtime`; `JWT_SECRET` comes from `.env.secrets` (see "Configuration & .env.runtime" above):

```bash
JWT_SECRET=<at least 32 chars>       # .env.secrets, required
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
- `tutorialprogresses` - lesson progress (per `courseId`)
- `modulelibraries` - saved modules
- `simulations` - simulation jobs
- `projects` - HDL projects
- `waveforms` - VCD data per simulation
- `netlists` - schematic (SVG) per simulation

On backend start, progress without a `courseId` (from before courses existed) is assigned to the Verilog tutorial (`courseId: 'verilog'`), and the old unique index `{userId, lessonId}` is replaced by `{userId, courseId, lessonId}`.

## Changelog (July 2026)

- Tutorial overview: chapter dropdowns instead of a flat list (capped at 7 visible sub-chapters + "Show more"), type badges (theory/exercise/project)
- Tutorial lesson: reset button, read-only testbench, password-gated sample solutions (bypassed for `admin`/`developer`), status marker instead of locking "Next lesson"
- Markdown rendering: added `remark-gfm` (tables) and `rehype-raw` (raw HTML)
- Introduced a group/role system (`roles: ['user' | 'developer' | 'admin']`)
- Sidebar code examples now always ask for confirmation before loading
- `setup.sh`/`start.sh` local/server mode split, `.env.runtime` (replacing the old single `.env` flow), nginx gateway for server deployments

## Tutorial sync (GitHub Action)

The tutorial content isn't maintained in this repo but in the private repo `Chaos-097/VerilogTutorial`. The action `.github/workflows/sync-Tutorial.yml` runs daily at 06:00 UTC (and manually via `workflow_dispatch`):

1. **sync** (GitHub runner): copies `VerilogTutorial_V0.4.md` to `apps/frontend/public/Tutorial/VerilogTutorialFormatted.md`, mirrors the `images/` folder via `rsync --delete` into `apps/frontend/public/Tutorial/images/`, rewrites relative `./images/` paths to absolute `/Tutorial/images/`, and commits only if something changed ("Update Verilog tutorial from external repository")
2. **deploy** (self-hosted runner `hdlab-server`, only if something changed): `git pull` in the server checkout (`vars.SERVER_REPO_PATH`) and `docker compose --env-file .env.runtime up -d --build frontend` - required because the tutorial file is baked into the frontend image via `COPY`

Requires the secret `VERILOGTUTORIAL` (token with read access to the external repo). The server is only reachable via the HTWK VPN, hence the self-hosted runner.

### Course sync ES1 (`sync-ES1.yml`)

The ES1 course comes from the repo `joernhoffmann/VerilogTutorial-ES1` and is synced the same way:

- Triggers: `repository_dispatch` (type `es1-tutorial-updated`, sent by the `notify-hdlab.yml` workflow in the course repo on every push to `ES1Tutorial.md`/`images/`), plus daily at 06:15 UTC as a fallback and manually via `workflow_dispatch`
- copies `ES1Tutorial.md` and `images/` to `apps/frontend/public/Kurse/ES1/`, rewrites image paths to `/Kurse/ES1/images/`, commits only if something changed ("Update ES1 course tutorial from external repository") and then rebuilds the frontend on the server
- if the course repo is still empty, the run is skipped cleanly; the repo is public, the secret `ES1TUTORIAL` is only needed if it becomes private

Both sync workflows share the `concurrency` group `tutorial-sync` and run `git pull --rebase` before pushing, so they don't block each other.

### Adding a new course

1. Create the folder `apps/frontend/public/Kurse/<folder>/` with the markdown (same format as the Verilog tutorial) and `images/`
2. Add an entry to `apps/frontend/src/config/courses.js` (`id`, `shortTitle`, `title`, `subtitle`, `tutorialPath`). The `id` is used as the `courseId` for progress in the backend and must not be changed afterwards
3. Optionally add a sync workflow modeled on `sync-ES1.yml`

## Changelog (August/September 2026)

**Editor & simulation**
- Parallel simulations per project (own status/console/waveform per project, status in the tabs); `GET /api/simulations/:id/results` now returns `status`; the worker limits concurrency via `MAX_WORKERS` (prefetch)
- Projects are kept when returning from the tutorial and across reloads; rename via pencil icon/double-click; confirmation on close; new "Editor" topbar button
- Simplified console (compact/full toggle removed, details via "Details anzeigen")
- Fullscreen mode for editors and tutorial code blocks
- Waveforms: `--trace-structs` for Verilator (signals inside structs/interfaces/deeper hierarchies), the last segment in the viewer is no longer cut off

**Tutorial**
- Validation: warnings show up in the short error summary, full log (`fullLog`) in a collapsible panel
- Table-of-contents links navigate to the matching lesson
- Syntax highlighting for Verilog code examples, images are synced from the external repo
- Improved dark-mode readability in the tutorial

**Operations & security**
- Tutorial sync action with automatic frontend rebuild on the server (see above)
- `restart: always` for `backend`, `worker`, `frontend` and `gateway` in `docker-compose.yml`
- Removed the unauthenticated legacy endpoints `POST /api/tutorials/validate` / `GET /api/tutorials/content`
- `/api/projects` and `/api/simulations` require login and only return your own projects/simulations (previously anyone with access to `/api/` could start simulations and read other users' logs); `/api/svfile` is restricted to `admin`/`developer`. Projects/simulations from before this change have no owner and can no longer be retrieved
- Vite 8.3.1 (esbuild dev-server vulnerability) and further `npm audit` fixes in frontend and worker

## Changelog (October 2026)

**Teaching & navigation**
- "Lehre" topbar menu with the course ES1 – Embedded Systems 1 (`public/Kurse/ES1`, synced from `joernhoffmann/VerilogTutorial-ES1`); tutorial progress is stored separately per `courseId`
- Own URLs: `/Editor`, `/Tutorial`, `/Tutorial/<lesson_id>`, `/Tutorial/Uebersicht`, `/Lehre/<id>`, `/Lehre/<id>/<lesson_id>`, `/Lehre/<id>/Uebersicht`. `/` and unknown paths are rewritten to `/Editor` without a history entry, a missing lesson to the last opened (or first) one

**Workbench, waveform & netlist**
- Three-column layout in tutorial and courses (lesson tree, lesson, editor) with a dock (output/waveform/netlist); the editor uses the same layout. Theory lessons without an exercise show neither editor nor dock
- New waveform viewer (see features), tutorial validation now produces a waveform
- Netlist view: Yosys in the sim image, rendering with `netlistsvg` in the worker, new endpoint `GET /api/simulations/:id/netlist`

**Tutorial**
- Previous/next arrows next to the lesson title, the lesson header stays pinned while scrolling (desktop)
- "Show testbench"/"Show solution" in the footer below the editor; the dock starts collapsed for students and opens on a failed submission
- Table-of-contents links to sub-headings jump to the section within the lesson
- Hints per lesson, the solution password prompt is its own dialog instead of `window.prompt`
- Fix: auto-save no longer resets a solved exercise to "not completed"

**Login**
- "Forgot password": new password via username + email (no mail; `admin`/`developer` excluded, locked after 5 failed attempts)
- Login via HTWK GitLab (OAuth2), credentials in `.env.secrets`
- **Security:** no more fallback to `'your-secret-key'` - without a valid `JWT_SECRET` (at least 32 chars, no placeholder) the backend doesn't start; `setup.sh` checks this before the build (server: abort, local: a secret is generated)
