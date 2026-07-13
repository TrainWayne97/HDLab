# HDLab Backend Dokumentation

Diese README dokumentiert das Backend im Ordner `apps/backend` im aktuellen Ist-Zustand.

## 1. Zweck des Backends

Das Backend ist die zentrale API-Schicht für HDLab und übernimmt:

- Anlegen und Laden von Projekten (inkl. HDL-Dateien)
- Anlegen und Verfolgen von Simulationen
- Bereitstellen von Simulationslogs und optionalen Waveform-Hinweisen
- Vermittlung zwischen Frontend, MongoDB und RabbitMQ

Die eigentliche Simulation läuft **nicht** im Backend, sondern im Worker (`apps/worker`), der Jobs aus RabbitMQ verarbeitet.

## 2. Tech-Stack

### Sprachen

- JavaScript (Node.js, ES Modules)

### Frameworks & Libraries

- Express 4 (`express`) als HTTP/REST-Framework
- Mongoose 8 (`mongoose`) als ODM für MongoDB
- AMQP Client (`amqplib`) für RabbitMQ-Queueing
- CORS Middleware (`cors`) für Cross-Origin Requests
- Environment Management (`dotenv`) für `.env`-Variablen

### Infrastruktur

- MongoDB 6 (persistente Daten)
- RabbitMQ 3 (Queue für Simulationsjobs)
- Docker / Docker Compose für Orchestrierung

## 3. Laufzeitarchitektur

### UML-Sequenzdiagramm (Backend-Flow)

```mermaid
sequenceDiagram
	autonumber
	actor U as Frontend User
	participant F as Frontend App
	participant B as Backend API (Express)
	participant DB as MongoDB
	participant WF as Waveform Collection
	participant MQ as RabbitMQ (simulations)
	participant W as Worker

	U->>F: Simulation starten
	F->>B: POST /api/projects
	B->>DB: Project speichern
	DB-->>B: Project _id
	B-->>F: 201 Created (Project)

	F->>B: POST /api/simulations
	B->>DB: Simulation (pending) speichern
	B->>MQ: sendToQueue({ simulationId })
	B-->>F: 201 Created (Simulation)

	W->>MQ: consume simulations
	W->>DB: status=running, startedAt setzen
	W->>W: Verilator-Run im Docker-Container
	W->>DB: status=finished|error + resultRefs schreiben
	W->>WF: VCD upsert/delete per simulationId

	loop Polling
		F->>B: GET /api/simulations/:id/results
		B->>DB: Simulation laden
		DB-->>B: resultRefs (log, hasWaveform)
		B-->>F: JSON Ergebnis
	end

	opt Waveform anfordern
		F->>B: GET /api/simulations/:id/waveform
		B->>WF: VCD laden
		WF-->>B: vcdData
		B-->>F: waveform_<id>.vcd
	end
```

### Komponenten

- Frontend ruft `/api/*` Endpunkte im Backend auf
- Backend schreibt Projekte und Simulationen nach MongoDB
- Backend legt Simulationsjobs in RabbitMQ Queue `simulations`
- Worker konsumiert Queue-Nachrichten, führt Simulation aus und schreibt Ergebnis zurück in MongoDB
- Frontend pollt Simulationsergebnisse über Backend-Endpunkt

### Sequenz (vereinfacht)

1. Frontend: `POST /api/projects`
2. Backend speichert Projekt in MongoDB
3. Frontend: `POST /api/simulations`
4. Backend speichert Simulation und sendet `{ simulationId }` nach RabbitMQ (`simulations`)
5. Worker verarbeitet Job, aktualisiert `status` und `resultRefs`
6. Frontend pollt `GET /api/simulations/:id/results`

## 4. Start- und Konfigurationsverhalten

Beim Start (`src/index.js`) macht das Backend:

1. Laden von Umgebungsvariablen via `dotenv`
2. Validierung der Pflichtvariablen:
	 - `MONGO_URL`
	 - `RABBITMQ_URL`
	 - `BACKEND_PORT`
3. Verbindung zu MongoDB
4. Verbindung zu RabbitMQ (mit Retry)
5. `assertQueue('simulations', { durable: true })`
6. Setzen der Middlewares (`cors`, `express.json`)
7. Mount der API unter `/api`

Fehlt eine Pflichtvariable oder schlägt ein kritischer Connect fehl, beendet sich der Prozess mit Exit-Code 1.

## 5. Umgebungsvariablen

Typische Werte (im Root via `.env` / `.env.example`):

- `BACKEND_PORT=3001`
- `MONGO_URL=mongodb://mongo:27017/hdl`
- `RABBITMQ_URL=amqp://user:password@rabbitmq:5672`

Hinweis: Das Backend liest `BACKEND_PORT`, lauscht im Container aber auf Port `3001`.

## 6. Ports

### Backend intern

- Container-Port: `3001` (siehe `apps/backend/Dockerfile` und Compose)

### Docker Compose Mapping

- Host -> Backend: `${BACKEND_PORT:-3001}:3001`
- MongoDB: `27017:27017`
- RabbitMQ AMQP: `5672:5672`
- RabbitMQ UI: `15672:15672`

## 7. Datenmodell (MongoDB via Mongoose)

### `Project`

- `ownerId: ObjectId (ref User)`
- `name: String`
- `files: Array<File>`
- `createdAt: Date`
- `updatedAt: Date`

`File` Subdokument:

- `filename: String`
- `content: String`
- `language: String`

### `Simulation`

- `projectId: ObjectId (ref Project)`
- `userId: ObjectId (ref User)`
- `status: 'pending' | 'running' | 'finished' | 'error'` (default `pending`)
- `language: String` (default `systemverilog`)
- `testbenchType: 'systemverilog' | 'python'` (default `systemverilog`)
- `settings: Object`
- `createdAt, startedAt, finishedAt: Date`
- `resultRefs: Object`

In der aktuellen Implementierung wird `resultRefs` typischerweise so befüllt:

- `resultRefs.log: String`
- `resultRefs.hasWaveform: Boolean`

### `User`

- `username: String` (required, unique)
- `email: String` (required, unique)
- `passwordHash: String` (required)
- `roles: String[]` (default `['user']`) - Gruppen-/Rollensystem, siehe Abschnitt 14.1
- `createdAt: Date`

### `Result` (modelliert, derzeit nicht primär im aktiven API-Flow genutzt)

- `simulationId: ObjectId (ref Simulation)`
- `logs: String`
- `waveformPath: String`
- `downloadLinks: String[]`
- `createdAt: Date`

### `Waveform` (aktiv genutzt für VCD-Speicherung und Download-Endpunkt)

- `simulationId: ObjectId (ref Simulation)`
- `vcdData: Buffer`
- `createdAt: Date`

## 8. REST API

Alle Endpunkte sind unter `/api` gemountet.

### 8.1 Health

#### `GET /api/health`

Antwort:

```json
{
	"status": "ok",
	"time": "2026-04-18T10:00:00.000Z"
}
```

### 8.2 Projekte

#### `POST /api/projects`

Erstellt ein Projekt.

Request Body (Beispiel):

```json
{
	"name": "Playground",
	"files": [
		{
			"filename": "main.sv",
			"content": "module main; endmodule",
			"language": "systemverilog"
		}
	]
}
```

Responses:

- `201 Created` mit Projektobjekt
- `400 Bad Request` bei Validierungs-/Schemafehlern

#### `GET /api/projects/:id`

Lädt ein Projekt per MongoDB-ID.

Responses:

- `200 OK` mit Projektobjekt
- `404 Not found`
- `400 Bad Request` bei ungültiger ID

### 8.3 Simulationen

#### `POST /api/simulations`

Erstellt eine Simulation und sendet Job an RabbitMQ (Queue `simulations`).

Request Body (typisch):

```json
{
	"projectId": "<mongo-object-id>",
	"language": "systemverilog",
	"testbenchType": "systemverilog"
}
```

Ablauf intern:

- Simulation wird in MongoDB gespeichert (`status: pending`)
- Nachricht `{ "simulationId": "..." }` wird an RabbitMQ gesendet (falls `amqpChannel` verfügbar)

Responses:

- `201 Created` mit Simulation
- `400 Bad Request` bei fehlerhaftem Body

#### `GET /api/simulations/:id`

Lädt den Simulationseintrag.

Responses:

- `200 OK` mit Simulation
- `404 Not found`
- `400 Bad Request`

#### `GET /api/simulations/:id/results`

Liefert aufbereitete Ergebnisinformationen aus `simulation.resultRefs`.

Response (Beispiel):

```json
{
	"log": "...sim log...",
	"hasWaveform": false,
	"waveformUrl": null
}
```

Wenn `hasWaveform === true`, wird `waveformUrl` auf `/api/simulations/:id/waveform` gesetzt.

Responses:

- `200 OK`
- `404 Simulation not found`
- `500` bei internen Fehlern

#### `GET /api/simulations/:id/waveform`

Liefert die gespeicherten VCD-Daten zur Simulation als Download.

Typische Responses:

- `200 OK` mit `Content-Type: text/plain` und `Content-Disposition: attachment; filename="waveform_<id>.vcd"`
- `404` wenn keine Waveform zur Simulation gespeichert ist
- `500` bei internen Fehlern

### 8.4 Dateizugriff (`svfile`)

Diese Endpunkte lesen/schreiben Dateien relativ zum Projektverzeichnis (`process.cwd()`) und sind auf `.sv`/`.txt` beschränkt.

#### `GET /api/svfile?path=<relativer-pfad>`

Beispiel:

- `/api/svfile?path=simtmp/test.sv`

Responses:

- `200 OK` mit `{ "content": "..." }`
- `400` wenn `path` fehlt oder Dateiendung nicht erlaubt
- `403` bei Pfad außerhalb der Projektwurzel
- `404` wenn Datei nicht existiert

#### `POST /api/svfile`

Request Body:

```json
{
	"path": "simtmp/test.sv",
	"content": "module main; endmodule"
}
```

Responses:

- `200 OK` mit `{ "success": true }`
- `400` bei ungültigen Parametern
- `403` bei unzulässigem Pfad
- `500` bei Schreibfehler

### 8.5 Tutorial-Validierung

Dieser Endpunkt unterstützt das interaktive Tutorial-System mit automatisierter Code-Validierung. Implementiert in `src/routes/tutorial.js` (nicht zu verwechseln mit dem älteren, unbenutzten `/api/tutorials/validate` in `routes.js` - siehe Hinweis am Ende dieses Abschnitts).

#### `POST /api/tutorial/validate` (authentifiziert, `Authorization: Bearer <token>`)

Validiert Benutzercode für eine Übungsaufgabe, indem intern ein Projekt + eine Simulation über die eigene REST-API des Backends angelegt werden (Aufruf via `fetch` gegen `${BACKEND_URL}/api/projects` und `${BACKEND_URL}/api/simulations`, also denselben Weg, den auch das Frontend nutzt).

Request Body:

```json
{
	"lessonId": 100,
	"moduleCode": "module main(input logic a, b, output logic y); ... endmodule",
	"testbench": "module tb_name(...); ... endmodule"
}
```

Ablauf intern:

1. Request wird validiert (`moduleCode` und `testbench` erforderlich)
2. **Testbench-Instrumentierung** (`injectTestSolvedDisplay()`): Vor jedem `$finish;` in der Testbench wird ein Codeblock eingefügt, der über das Array `test_solved` iteriert (unpacked Array, ein Bit pro Testvektor, Konvention: `output logic test_solved [TEST_LENGTH]`) und es als zusammenhängenden String ausgibt: `$display("TEST_SOLVED=%s", ...)`. Ist die Testbench bereits instrumentiert (enthält schon `TEST_SOLVED=`), wird nichts doppelt eingefügt.
3. `POST /api/projects` (intern) mit `main.sv` (`moduleCode`) und `tb.sv` (instrumentierte Testbench)
4. `POST /api/simulations` (intern) mit `language: "systemverilog"`, `testbenchType: "systemverilog"` - der Worker erkennt daraus automatisch das Topmodule aus `tb.sv` (siehe Worker-README)
5. **Polling-Schleife** wartet auf Ergebnis (max. 30 Sekunden, 1 Sekunde Intervall) via `GET /api/simulations/:id/results`
6. Log wird ausgewertet (`checkValidationLog()`):
   - Enthält der Log `%Error`, `compilation error` oder `syntax error` → sofort `false`
   - Sonst: erste Zeile der Form `TEST_SOLVED=<bits>` wird gesucht (regex `TEST_SOLVED=([01x]+)`) - bestanden nur wenn **alle** Bits `1` sind
   - Fallback (keine `TEST_SOLVED=`-Zeile gefunden, z.B. bei nicht-instrumentierten/älteren Testbenches): generische `pass`/`fail`-Schlüsselwörter im Log

Response **Erfolg** (200 OK):

```json
{ "success": true }
```

Response **Fehlgeschlagen** (200 OK, `success: false`):

```json
{
	"success": false,
	"errors": "... relevante Fehlerzeilen (max. 20) oder Log-Auszug ..."
}
```

Response **Timeout** (504 Gateway Timeout):

```json
{ "success": false, "errors": "Simulation Timeout: Kein Ergebnis nach 30 Sekunden" }
```

Response **Bad Request** (400):

```json
{ "success": false, "errors": "moduleCode und testbench sind erforderlich" }
```

> **Hinweis - Legacy-Code:** In `src/routes.js` existiert zusätzlich ein älterer, **unauthentifizierter** Endpunkt `POST /api/tutorials/validate` (Plural!) sowie `GET /api/tutorials/content` (liest eine nicht mehr existierende `Tutorial/VerilogTutorial.md` vom Backend-Dateisystem). Beide werden vom aktuellen Frontend **nicht mehr aufgerufen** - das Tutorial-Markdown wird heute direkt statisch vom Frontend ausgeliefert (`apps/frontend/public/Tutorial/VerilogTutorialFormatted.md`) und geparst (siehe Frontend-README), und die Validierung läuft ausschließlich über `/api/tutorial/validate` (Singular) oben. Der alte Code ist totes/unbenutztes Gewicht und sollte bei Gelegenheit entfernt werden.

## 9. Lokale Entwicklung

### Im Backend-Ordner

```bash
cd apps/backend
npm install
npm start
```

Entwicklung mit Auto-Reload:

```bash
npm run dev
```

## 10. Zusammenspiel mit Worker

Wichtig für das Verständnis des Backends:

- Backend produziert Jobs (`sendToQueue('simulations', ...)`)
- Worker konsumiert Jobs
- Worker aktualisiert den `Simulation` Datensatz (`status`, `startedAt`, `finishedAt`, `resultRefs`)
- Backend liefert diese Informationen über die `/results` API an das Frontend zurück

## 11. Neuerungen (April 2026)

- Python-Testbenches (`testbenchType: "python"`, Datei `tb.py`) laufen über den Cocotb-Pfad im Worker/Sim-Container
- Ergebnisse werden weiterhin unverändert über `/api/simulations/:id/results` geliefert (`resultRefs.log` als Roh-Log)
- Die Reduktion/Filterung der Log-Ausgabe erfolgt im Frontend (Kompakt/Vollständig-Ansicht), nicht im Backend

Der End-to-End-Status einer Simulation wird daher primär über das Feld `Simulation.status` plus `resultRefs` bestimmt.

## 12. Bekannte Grenzen (aktueller Stand)

- Keine Authentifizierung/Autorisierung in den API-Routen
- Keine WebSocket-API im aktuellen Backend-Code
- `Result`-Collection ist weiterhin nicht Teil des primären API-Flows (Status/Logs laufen über `Simulation.resultRefs`)

## 13. Relevante Dateien

- `src/index.js` - Serverstart, DB/Queue-Connect, Middleware-Setup
- `src/routes.js` - REST-Endpunkte (Projekte, Simulationen, `svfile`, health; plus Legacy-Tutorial-Endpunkte, siehe 8.5)
- `src/routes/auth.js` - Registrierung, Login, `/auth/me`
- `src/routes/tutorial.js` - Tutorial-Fortschritt, Modul-Bibliothek, Code-Validierung (`/tutorial/validate`)
- `src/middleware/auth.js` - `authenticateToken`, `requireRole`
- `src/models/*.js` - Mongoose-Schemas
- `scripts/setRole.js` - CLI zum Setzen von Nutzerrollen (siehe 14.1)
- `Dockerfile` - Containerisierung des Backends

---

## Notes for English Readers

The core documentation above (Sections 1-18) is written in German. English translations of key sections are provided below where important for API integration. For API endpoint specifications, JSON examples, and technical details, refer to the German sections as the source of truth.

### English API Reference (Sections 8.1 - 8.4)

All backend endpoints are mounted under `/api`.

**Health**: `GET /api/health` returns `{ "status": "ok", "time": "..." }`

**Projects**: 
- `POST /api/projects` - Creates project
- `GET /api/projects/:id` - Loads project

**Simulations**:
- `POST /api/simulations` - Creates and queues simulation
- `GET /api/simulations/:id` - Gets simulation metadata
- `GET /api/simulations/:id/results` - Gets results (with waveformUrl if available)
- `GET /api/simulations/:id/waveform` - Downloads VCD file

**File Access** (`svfile` endpoints):
- `GET /api/svfile?path=<path>` - Reads file content
- `POST /api/svfile` - Writes file content (body: `{ "path": "...", "content": "..." }`)

**Tutorial Validation** (authenticated, `Authorization: Bearer <token>`): `POST /api/tutorial/validate` (singular - not the older, unused `/api/tutorials/validate` in `routes.js`) - body `{ lessonId, moduleCode, testbench }`. Instruments the testbench to dump its `test_solved` array (one bit per test vector) as `TEST_SOLVED=<bits>`, runs it as a real simulation via the backend's own `/api/projects` + `/api/simulations` endpoints, polls up to 30s, and returns `{ success: boolean, errors?: string }`. All bits must be `1` to pass.

**Authentication**:
- `POST /api/auth/register` - Register user (default role: `user`)
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Validate and fetch current user (requires `Authorization: Bearer <token>`)
- All three return/include `roles: string[]` on the user object; the JWT payload also carries `roles`.

**Roles/Groups** (see German section 14.1 for full details): every user has a `roles` array (`user` by default, plus optionally `developer`/`admin`). There is no admin UI for this yet - roles are set directly against MongoDB via the CLI script `node scripts/setRole.js <username> <role>` run inside the backend container. A new `requireRole(...roles)` middleware exists in `middleware/auth.js` for future role-gated routes (not yet applied to any route). The only current consumer of roles is the frontend, which skips the tutorial solution password prompt for `developer`/`admin` accounts - this is a UX convenience, not real server-side access control (the sample solution is already part of the lesson JSON shipped to every logged-in user).

**Tutorial Progress**:
- `GET /api/tutorial/progress/:lessonId` - Get lesson progress
- `POST /api/tutorial/progress/:lessonId` - Save/update lesson progress
- `GET /api/tutorial/progress` - Get all user progress

**Module Library**:
- `GET /api/modules` - List all user modules
- `GET /api/modules/:moduleName` - Get latest version
- `POST /api/modules` - Save new module
- `PATCH /api/modules/:moduleName` - Update module (creates new version)
- `DELETE /api/modules/:moduleName` - Delete all versions

See German sections for complete request/response examples and implementation details.

---

## 14. Authentication & Authorization (Mai 2026)

Das Backend implementiert JWT-basierte Authentifizierung für Benutzer-Management und Tutorial-Fortschritt.

### JWT Token System

- **Secret**: Über `JWT_SECRET` Env-Variable konfigurierbar
- **Gültigkeit**: 7 Tage (`expiresIn: '7d'`)
- **Header**: `Authorization: Bearer <token>`
- **Payload**: `{ userId, username, roles, iat, exp }`

### Auth-Middleware

```javascript
// Alle geschützten Routes verwenden diese Middleware
import { authenticateToken } from './middleware/auth.js';

router.get('/protected-endpoint', authenticateToken, (req, res) => {
  // req.userId, req.username und req.userRoles sind verfügbar
});
```

### 14.1 Gruppen-/Rollensystem

Jeder Benutzer hat ein `roles`-Array (z.B. `['user']`, `['user', 'developer']`, `['admin']`). Es gibt aktuell keine feste Rollenliste im Code - Konvention ist `user` (Standard bei Registrierung), `developer` und `admin`. `developer`/`admin` überspringen im Frontend z.B. die Passwortabfrage für Musterlösungen im Tutorial (siehe Frontend-README).

**Middleware `requireRole(...roles)`** (`middleware/auth.js`) - für künftige rollenbasierte Backend-Routen, muss nach `authenticateToken` in der Kette stehen:

```javascript
import { authenticateToken, requireRole } from './middleware/auth.js';

router.get('/admin/stuff', authenticateToken, requireRole('admin'), (req, res) => {
  // Nur erreichbar für Nutzer mit Rolle 'admin'
});
```

Wird aktuell noch auf keiner Route angewendet - reine Infrastruktur für spätere Erweiterungen.

**Rollen setzen** - es gibt keine Admin-Oberfläche dafür, nur ein CLI-Skript (`scripts/setRole.js`), das direkt gegen MongoDB läuft:

```bash
docker compose exec backend node scripts/setRole.js <username> admin        # Rollen ersetzen
docker compose exec backend node scripts/setRole.js <username> --add dev    # Rolle hinzufügen
docker compose exec backend node scripts/setRole.js <username> --remove dev # Rolle entfernen
docker compose exec backend node scripts/setRole.js <username> --list       # Anzeigen
```

Da Rollen im JWT stecken, wirkt eine Änderung erst nach erneutem Login (bestehende Tokens gelten bis zu 7 Tage mit dem alten Rollenstand weiter).

### API Endpoints

#### `POST /api/auth/register`
Registriert einen neuen Benutzer mit Passwort-Hashing (bcrypt).

**Request**:
```json
{
  "username": "student123",
  "email": "student@example.com",
  "password": "securepass"
}
```

**Response** (201):
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "student123",
    "email": "student@example.com",
    "roles": ["user"]
  }
}
```

#### `POST /api/auth/login`
Authentifiziert Benutzer mit Username + Passwort.

**Request**:
```json
{
  "username": "student123",
  "password": "securepass"
}
```

**Response** (200):
```json
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": { ... }
}
```

#### `GET /api/auth/me`
Validiert Token und gibt Benutzer-Info zurück.

**Header**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "student123",
    "email": "student@example.com",
    "roles": ["user"]
  }
}
```

---

## 15. Tutorial Progress System (Mai 2026)

Speichert Benutzer-Fortschritt pro Lektion mit Lösungen und Validierungsstatus.

### `TutorialProgress` Modell

```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // Reference zu User
  lessonId: Number,           // z.B. 1, 2, 3 ... aus VerilogTutorialFormatted.md (lesson_id Frontmatter)
  userCode: String,           // Code den der Benutzer geschrieben hat
  solution: String,           // Eingereichte Lösung (nach erfolgreichem Submit)
  isCompleted: Boolean,       // True wenn Aufgabe erfolgreich gelöst
  validationStatus: String,   // 'not-started' | 'passed' | 'failed'
  submissionDate: Date,       // Zeitstempel der Fertigstellung
  lastModified: Date,         // Letzter Änderungszeitpunkt
  createdAt: Date             // Erstellungszeitpunkt
}
```

**Unique Index**: `(userId, lessonId)` - Pro Benutzer+Lektion nur ein Fortschritt-Eintrag.

### API Endpoints

#### `GET /api/tutorial/progress/:lessonId`
Lädt Fortschritt für eine spezifische Lektion.

**Response** (200):
```json
{
  "lessonId": 10,
  "userCode": "module modul_nand(\n...",
  "solution": "module modul_nand(\n...",
  "isCompleted": true,
  "validationStatus": "passed",
  "lastModified": "2026-05-26T14:30:00Z",
  "submissionDate": "2026-05-26T14:25:00Z"
}
```

#### `POST /api/tutorial/progress/:lessonId`
Speichert oder aktualisiert Fortschritt (Upsert).

**Request**:
```json
{
  "userCode": "module modul_nand(\n...",
  "solution": "module modul_nand(\n...",
  "isCompleted": true,
  "validationStatus": "passed"
}
```

**Response** (200):
```json
{
  "message": "Progress saved",
  "progress": { ... }
}
```

#### `GET /api/tutorial/progress`
Lädt **kompletten** Fortschritt des Benutzers (alle Lektionen).

**Response** (200):
```json
[
  { lessonId: 1, isCompleted: true, validationStatus: "passed", ... },
  { lessonId: 2, isCompleted: false, validationStatus: "failed", ... },
  ...
]
```

---

## 16. Module Library System (Mai 2026)

Ermöglicht Benutzern, Verilog-Module zu speichern und wiederzuverwenden.

### `ModuleLibrary` Modell

```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // Reference zu User
  moduleName: String,         // z.B. "modul_nand", "modul_addierer"
  code: String,               // Der Verilog-Code
  description: String,        // Optionale Beschreibung
  sourceLesson: Number,       // Ggf. aus welcher Lektion (optional)
  usedInLessons: [Number],    // Liste von Lektionen, die dieses Modul nutzen
  version: Number,            // Auto-Versionierung (1, 2, 3, ...)
  isPublic: Boolean,          // Für zukünftige Sharing-Features
  tags: [String],             // z.B. ["addierer", "grundoperation"]
  createdAt: Date,
  updatedAt: Date
}
```

**Unique Index**: `(userId, moduleName, version)` - Jeder Benutzer kann mehrere Versionen eines Moduls haben.

### API Endpoints

#### `GET /api/modules`
Lädt alle Module eines Benutzers.

**Response** (200):
```json
[
  {
    "_id": "...",
    "moduleName": "modul_nand",
    "code": "module modul_nand(...",
    "version": 2,
    "tags": ["grundoperation", "logic"],
    "sourceLesson": 10
  },
  ...
]
```

#### `GET /api/modules/:moduleName`
Lädt das **neueste** Modul mit diesem Namen (höchste Version).

**Response** (200):
```json
{
  "_id": "...",
  "moduleName": "modul_nand",
  "code": "...",
  "version": 2,
  "description": "NAND-Gatter aus AND und NOT",
  "tags": ["grundoperation"]
}
```

#### `POST /api/modules`
Speichert ein neues Modul oder neue Version.

**Request**:
```json
{
  "moduleName": "modul_addierer",
  "code": "module modul_addierer(...",
  "description": "2-Bit Addierer",
  "sourceLesson": 20,
  "tags": ["addierer", "kombinatorisch"]
}
```

**Response** (201):
```json
{
  "message": "Module saved",
  "module": {
    "moduleName": "modul_addierer",
    "version": 1,
    ...
  }
}
```

#### `PATCH /api/modules/:moduleName`
Aktualisiert ein Modul (erstellt neue Version).

**Request**:
```json
{
  "code": "module modul_addierer(...",  // Neuer Code
  "description": "Verbesserter Addierer",
  "tags": ["addierer", "kombinatorisch", "verifiziert"]
}
```

**Response** (200):
```json
{
  "message": "Module updated",
  "module": {
    "version": 2,  // Automatisch erhöht
    ...
  }
}
```

#### `DELETE /api/modules/:moduleName`
Löscht alle Versionen eines Moduls.

**Response** (200):
```json
{
  "message": "Module deleted"
}
```

---

## 17. Installation & Setup (Mai 2026)

### Dependencies installieren

```bash
cd apps/backend
npm install  # Installiert jsonwebtoken, bcryptjs, etc.
```

### Environment-Variablen (.env)

```env
# MongoDB
MONGO_URL=mongodb://mongo:27017/hdlab

# RabbitMQ
RABBITMQ_URL=amqp://rabbitmq:5672

# Backend Port
BACKEND_PORT=3001

# JWT Secret (WICHTIG: In Produktion einen starken Secret nutzen!)
JWT_SECRET=your-super-secret-key-change-in-production
```

### MongoDB Collections

Beim Start werden automatisch folgende Collections erstellt:

- `users` - Benutzerkonten
- `tutorialprogresses` - Lektion-Fortschritt
- `modulelibraries` - Gespeicherte Verilog-Module
- `simulations` - Simulationsjobs
- `projects` - HDL-Projekte
- `waveforms` - VCD Daten

---

## 18. Security Notes

- **Passwort-Hashing**: bcrypt mit Salt-Rounds 10
- **JWT Secret**: Sollte in Produktion ein starker, zufälliger String sein
- **Token Expiration**: 7 Tage, danach muss User sich neu anmelden
- **Protected Routes**: Alle `/tutorial/*` und `/modules` Endpoints erfordern `Authorization` Header
- **CORS**: Aktuell **nicht eingeschränkt** - `app.use(cors())` in `src/index.js` ohne Origin-Whitelist, erlaubt also Requests von jeder Domain. Die `.env`-Variable `CORS_ORIGIN` wird generiert, aber vom Backend-Code derzeit nicht ausgewertet.
- **Rollen/Gruppen**: `roles`-Array pro Nutzer (`user`/`developer`/`admin`), siehe Abschnitt 14.1. Es gibt noch keine Backend-Route, die `requireRole` tatsächlich nutzt - die einzige aktuelle Anwendung ist ein Frontend-seitiger Bypass der Lösungs-Passwortabfrage im Tutorial für `developer`/`admin`. Das ist **kein echter Zugriffsschutz**, da die Musterlösung ohnehin Teil des an jeden eingeloggten Nutzer ausgelieferten Lesson-JSON ist (die Lösung wird nicht separat/geschützt vom Backend ausgeliefert).
