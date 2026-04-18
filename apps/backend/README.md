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

	loop Polling
		F->>B: GET /api/simulations/:id/results
		B->>DB: Simulation laden
		DB-->>B: resultRefs (log, hasWaveform)
		B-->>F: JSON Ergebnis
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

### `Result` (modelliert, aktuell nicht aktiv in den API-Routen genutzt)

- `simulationId: ObjectId (ref Simulation)`
- `logs: String`
- `waveformPath: String`
- `downloadLinks: String[]`
- `createdAt: Date`

### `Waveform` (modelliert, aktuell nicht aktiv in den API-Routen genutzt)

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

Aktuell Platzhalter, derzeit **nicht implementiert**.

- Antwort: `404` mit Text `Waveform download not implemented`

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
- Waveform-Download-Endpunkt ist noch nicht implementiert
- `Result` und `Waveform` Modelle sind vorhanden, aber aktuell nicht im aktiven API-Flow verdrahtet

## 13. Relevante Dateien

- `src/index.js` - Serverstart, DB/Queue-Connect, Middleware-Setup
- `src/routes.js` - REST-Endpunkte
- `src/models/*.js` - Mongoose-Schemas
- `Dockerfile` - Containerisierung des Backends
