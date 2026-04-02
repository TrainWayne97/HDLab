
# HDLab – HDL Playground & Simulation Platform

Webbasierte Entwicklungsumgebung für SystemVerilog mit End-to-End-Simulationen in Docker-Containern.

## Features

- **Monaco Editor** (VS Code im Browser)
- **SystemVerilog-Simulation** (Verilator, Docker-basiert)
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
2. „Simulation starten“ klicken
3. Projekt & Simulation werden im Backend angelegt
4. Worker zieht Simulationsauftrag, erzeugt temporäres Verzeichnis, kopiert Dateien
5. Docker-Container (Verilator) wird gestartet, Simulation läuft
6. Log & ggf. Waveform werden ausgelesen und im Backend gespeichert
7. Frontend pollt auf Ergebnis und zeigt Log an

### Beispielcode (SystemVerilog)
```systemverilog
module counter;
	int i;
	initial begin
		for (i = 0; i < 5; i = i + 1) begin
			$display("Counter value: %0d", i);
		end
		$finish;
	end
endmodule
```

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
