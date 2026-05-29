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
- `roles: String[]`
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

Diese neuen Endpunkte unterstützen das interaktive Tutorial-System mit automatisierter Code-Validierung.

#### `POST /api/tutorials/validate`

Validiert Benutzercode für eine Übungsaufgabe durch automatische Simulation mit generiertem Testbench.

Request Body:

```json
{
	"lessonId": "nand",
	"moduleCode": "module nand(output out, input a, b); ... endmodule",
	"moduleName": "nand",
	"testbench": "module tb; ... endmodule"
}
```

Ablauf intern:

1. Request wird validiert (lessonId, moduleCode, moduleName, testbench erforderlich)
2. Temporäre `Simulation` wird in MongoDB erstellt (status: `pending`)
3. Job wird an RabbitMQ gesendet mit Simulation-Daten
4. **Polling-Schleife** wartet auf Simulationsergebnis (max. 120 Sekunden):
   - 200ms Polling-Intervall (schnellere Responsive als 500ms)
   - Akzeptiert beide Status-Werte: `finished` ODER `completed` (wegen Worker/Backend-Variationen)
   - Lädt simulationsbezogenes Log aus `resultRefs.log`
5. Log wird auf Validierungsergebnis überprüft:
   - **SUCCESS**: Sucht nach dem String `"Status: SUCCESS"` (case-insensitiv) im Log
   - **FAILURE**: Sucht nach Patterns wie `error`, `failed`, `exception`, `undefined` etc.
6. Rückgabe strukturiertes Validierungsergebnis

Response **Success** (200 OK):

```json
{
	"success": true,
	"message": "Code validated successfully!",
	"output": "... sim.log content ..."
}
```

Response **Validation Failed** (200 OK, aber `success: false`):

```json
{
	"success": false,
	"message": "Validation failed: Error at line X",
	"output": "... sim.log snippet ..."
}
```

Response **Timeout** (408 Request Timeout):

```json
{
	"error": "Simulation timeout after 120 seconds"
}
```

Response **Bad Request** (400):

```json
{
	"error": "Missing required fields: lessonId, moduleCode, moduleName, testbench"
}
```

**Timeout-Handling:**

- Maximale Wartezeit: 120 Sekunden (erhöht von 60s für Zuverlässigkeit)
- Polling-Intervall: 200ms (reduziert von 500ms für bessere Responsivität)
- Detaillierte Checkpoint-Logging für Debugging:
  - "Sent simulation job to queue"
  - "Simulation started" (worker has begun processing)
  - "Simulation complete, checking result"

**Status-Field Kompatibilität:**

Das Backend akzeptiert beide Werte für `simulation.status`:
- `finished` - Worker-Standard (aus dockerRunner.js)
- `completed` - Alternative Bezeichnung (Konsistenz mit anderen Systemen)

Dies stellt sicher, dass die Validierung funktioniert, unabhängig davon, welcher Status vom Worker gesetzt wird.

**Fehlerbehandlung:**

- Leere Logs: Fehler "Simulation produced no output"
- Ungültige IDs: Fehler "Simulation not found"
- Netzwerkfehler: fetch() wird von Frontend-Error-Handler abgefangen
- RabbitMQ-Fehler: Graceful Fallback (Simulation wird mit Fehler-Status erstellt)

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
- `src/routes.js` - REST-Endpunkte
- `src/models/*.js` - Mongoose-Schemas
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

**Tutorial Validation**: `POST /api/tutorials/validate` - Validates exercise code (returns `{ success, message, output }`)

**Authentication**:
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user  
- `GET /api/auth/me` - Validate and fetch current user (requires `Authorization: Bearer <token>`)

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
- **Payload**: `{ userId, username, iat, exp }`

### Auth-Middleware

```javascript
// Alle geschützten Routes verwenden diese Middleware
import { authenticateToken } from './middleware/auth.js';

router.get('/protected-endpoint', authenticateToken, (req, res) => {
  // req.userId und req.username sind verfügbar
});
```

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
    "email": "student@example.com"
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
    "roles": ["student"]
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
  lessonId: Number,           // z.B. 1, 2, 3 ... aus VerilogTutorial.md
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
- **CORS**: Konfiguriert für `VITE_API_URL` Domain
