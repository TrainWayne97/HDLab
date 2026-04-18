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

# English Documentation

This README documents the backend in `apps/backend` as it currently exists.

## 1. Backend Purpose

The backend is HDLab's central API layer and handles:

- Creating and loading projects (including HDL files)
- Creating and tracking simulations
- Providing simulation logs and waveform metadata
- Orchestration between frontend, MongoDB, and RabbitMQ

The actual simulation is **not** executed in the backend, but in the worker (`apps/worker`) consuming RabbitMQ jobs.

## 2. Tech Stack

### Languages

- JavaScript (Node.js, ES Modules)

### Frameworks & Libraries

- Express 4 (`express`) as HTTP/REST framework
- Mongoose 8 (`mongoose`) as MongoDB ODM
- AMQP client (`amqplib`) for RabbitMQ queueing
- CORS middleware (`cors`) for cross-origin requests
- Environment management (`dotenv`) for `.env` variables

### Infrastructure

- MongoDB 6 (persistent data)
- RabbitMQ 3 (simulation queue)
- Docker / Docker Compose for orchestration

## 3. Runtime Architecture

### UML Sequence Diagram (Backend Flow)

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

		U->>F: Start simulation
		F->>B: POST /api/projects
		B->>DB: Store project
		DB-->>B: Project _id
		B-->>F: 201 Created (Project)

		F->>B: POST /api/simulations
		B->>DB: Store simulation (pending)
		B->>MQ: sendToQueue({ simulationId })
		B-->>F: 201 Created (Simulation)

		W->>MQ: consume simulations
		W->>DB: set status=running, startedAt
		W->>W: run Verilator in Docker
		W->>DB: set status=finished|error + write resultRefs
		W->>WF: VCD upsert/delete per simulationId

		loop Polling
				F->>B: GET /api/simulations/:id/results
				B->>DB: load Simulation
				DB-->>B: resultRefs (log, hasWaveform)
				B-->>F: JSON result
		end

		opt Request waveform
				F->>B: GET /api/simulations/:id/waveform
				B->>WF: load VCD
				WF-->>B: vcdData
				B-->>F: waveform_<id>.vcd
		end
```

### Components

- Frontend calls `/api/*` endpoints in backend
- Backend writes projects and simulations to MongoDB
- Backend enqueues simulation jobs in RabbitMQ queue `simulations`
- Worker consumes queue messages, runs simulation, and writes results back to MongoDB
- Frontend polls simulation results via backend endpoint

### Sequence (Simplified)

1. Frontend: `POST /api/projects`
2. Backend stores project in MongoDB
3. Frontend: `POST /api/simulations`
4. Backend stores simulation and sends `{ simulationId }` to RabbitMQ (`simulations`)
5. Worker processes job, updates `status` and `resultRefs`
6. Frontend polls `GET /api/simulations/:id/results`

## 4. Startup and Configuration Behavior

On startup (`src/index.js`), backend does:

1. Load environment variables via `dotenv`
2. Validate required variables:
	 - `MONGO_URL`
	 - `RABBITMQ_URL`
	 - `BACKEND_PORT`
3. Connect to MongoDB
4. Connect to RabbitMQ (with retry)
5. `assertQueue('simulations', { durable: true })`
6. Set middlewares (`cors`, `express.json`)
7. Mount API under `/api`

If required config is missing or critical connection fails, process exits with code 1.

## 5. Environment Variables

Typical values (root `.env` / `.env.example`):

- `BACKEND_PORT=3001`
- `MONGO_URL=mongodb://mongo:27017/hdl`
- `RABBITMQ_URL=amqp://user:password@rabbitmq:5672`

Note: backend reads `BACKEND_PORT`, but listens on container port `3001`.

## 6. Ports

### Backend Internal

- Container port: `3001` (see `apps/backend/Dockerfile` and compose)

### Docker Compose Mapping

- Host -> backend: `${BACKEND_PORT:-3001}:3001`
- MongoDB: `27017:27017`
- RabbitMQ AMQP: `5672:5672`
- RabbitMQ UI: `15672:15672`

## 7. Data Model (MongoDB via Mongoose)

### `Project`

- `ownerId: ObjectId (ref User)`
- `name: String`
- `files: Array<File>`
- `createdAt: Date`
- `updatedAt: Date`

`File` subdocument:

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

In current implementation, `resultRefs` typically contains:

- `resultRefs.log: String`
- `resultRefs.hasWaveform: Boolean`

### `User`

- `username: String` (required, unique)
- `email: String` (required, unique)
- `passwordHash: String` (required)
- `roles: String[]`
- `createdAt: Date`

### `Result` (modeled, not primary in active API flow)

- `simulationId: ObjectId (ref Simulation)`
- `logs: String`
- `waveformPath: String`
- `downloadLinks: String[]`
- `createdAt: Date`

### `Waveform` (actively used for VCD persistence and download)

- `simulationId: ObjectId (ref Simulation)`
- `vcdData: Buffer`
- `createdAt: Date`

## 8. REST API

All endpoints are mounted under `/api`.

### 8.1 Health

#### `GET /api/health`

Response:

```json
{
	"status": "ok",
	"time": "2026-04-18T10:00:00.000Z"
}
```

### 8.2 Projects

#### `POST /api/projects`

Creates a project.

Request body (example):

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

- `201 Created` with project object
- `400 Bad Request` for validation/schema errors

#### `GET /api/projects/:id`

Loads project by MongoDB ID.

Responses:

- `200 OK` with project object
- `404 Not found`
- `400 Bad Request` for invalid ID

### 8.3 Simulations

#### `POST /api/simulations`

Creates simulation and sends job to RabbitMQ (`simulations` queue).

Request body (typical):

```json
{
	"projectId": "<mongo-object-id>",
	"language": "systemverilog",
	"testbenchType": "systemverilog"
}
```

Internal flow:

- Simulation stored in MongoDB (`status: pending`)
- Message `{ "simulationId": "..." }` sent to RabbitMQ (if `amqpChannel` available)

Responses:

- `201 Created` with simulation
- `400 Bad Request` for malformed body

#### `GET /api/simulations/:id`

Loads simulation entry.

Responses:

- `200 OK` with simulation
- `404 Not found`
- `400 Bad Request`

#### `GET /api/simulations/:id/results`

Returns processed result information from `simulation.resultRefs`.

Response (example):

```json
{
	"log": "...sim log...",
	"hasWaveform": false,
	"waveformUrl": null
}
```

If `hasWaveform === true`, `waveformUrl` is set to `/api/simulations/:id/waveform`.

Responses:

- `200 OK`
- `404 Simulation not found`
- `500` on internal errors

#### `GET /api/simulations/:id/waveform`

Returns stored VCD data for simulation as download.

Typical responses:

- `200 OK` with `Content-Type: text/plain` and `Content-Disposition: attachment; filename="waveform_<id>.vcd"`
- `404` when simulation has no waveform
- `500` on internal errors

### 8.4 File Access (`svfile`)

These endpoints read/write files relative to project root (`process.cwd()`) and are restricted to `.sv`/`.txt`.

#### `GET /api/svfile?path=<relative-path>`

Example:

- `/api/svfile?path=simtmp/test.sv`

Responses:

- `200 OK` with `{ "content": "..." }`
- `400` if `path` missing or extension invalid
- `403` if path escapes project root
- `404` if file does not exist

#### `POST /api/svfile`

Request body:

```json
{
	"path": "simtmp/test.sv",
	"content": "module main; endmodule"
}
```

Responses:

- `200 OK` with `{ "success": true }`
- `400` for invalid parameters
- `403` for disallowed path
- `500` on write errors

## 9. Local Development

In backend folder:

```bash
cd apps/backend
npm install
npm start
```

Development with auto-reload:

```bash
npm run dev
```

## 10. Interaction with Worker

Important for backend behavior:

- Backend produces jobs (`sendToQueue('simulations', ...)`)
- Worker consumes jobs
- Worker updates `Simulation` (`status`, `startedAt`, `finishedAt`, `resultRefs`)
- Backend exposes this information through `/results` endpoint to frontend

## 11. Updates (April 2026)

- Python testbenches (`testbenchType: "python"`, file `tb.py`) use Cocotb path in worker/sim container
- Results remain available via `/api/simulations/:id/results` (`resultRefs.log` as raw log)
- Log reduction/filtering is done in frontend (`Compact`/`Full`) and not in backend

Simulation end-to-end status is therefore primarily defined by `Simulation.status` plus `resultRefs`.

## 12. Known Limitations (Current)

- No authentication/authorization in current API routes
- No WebSocket API in current backend code
- `Result` collection is not part of the primary API flow (status/logs via `Simulation.resultRefs`)

## 13. Relevant Files

- `src/index.js` - server startup, DB/queue connect, middleware setup
- `src/routes.js` - REST endpoints
- `src/models/*.js` - Mongoose schemas
- `Dockerfile` - backend containerization
