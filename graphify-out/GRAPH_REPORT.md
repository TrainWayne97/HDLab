# Graph Report - HDLab  (2026-09-04)

## Corpus Check
- 71 files · ~95,633 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 313 nodes · 410 edges · 28 communities (15 shown, 9 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.85)
- Token cost: 494,791 input · 0 output

## Community Hubs (Navigation)
- Frontend App Shell & Auth UI
- Backend API & Data Models
- Tutorial Rendering & Parsing
- Design Rationale & Docs
- Backend Dependencies
- Frontend Dependencies
- Worker Dependencies
- Simulation Worker Pipeline
- Frontend Dev Tooling
- Verilog Tutorial Curriculum
- Legacy Tutorial Parser
- HDLab Brand Assets
- Verilator Container Entrypoint
- Root Package Config
- User Auth Endpoints
- Verilator Testbench Fixture
- Tutorial Progress Tracking
- Vite Build Tool Asset
- React Library Asset
- Tutorial Debug Script
- Verilator Test Main
- Setup Script
- Start Script
- Stop Script

## God Nodes (most connected - your core abstractions)
1. `App()` - 19 edges
2. `Verilog Tutorial Content (Current)` - 15 edges
3. `useAuth()` - 12 edges
4. `POST /api/tutorial/validate` - 11 edges
5. `TutorialLesson()` - 9 edges
6. `parseTutorialFromMarkdown()` - 9 edges
7. `TutorialContainer()` - 8 edges
8. `parseLesson()` - 7 edges
9. `processSimulation()` - 7 edges
10. `HDLab Backend README` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Tutorial solution password gate (UX-only)` --semantically_similar_to--> `requireRole()`  [INFERRED] [semantically similar]
  apps/frontend/README.md → apps/backend/src/middleware/auth.js
- `Worker/backend validation separation of concerns` --rationale_for--> `checkValidationLog()`  [EXTRACTED]
  Tutorial_Doc/TUTORIAL_DEVELOPER_GUIDE.md → apps/backend/src/routes/tutorial.js
- `Non-locking lesson navigation with status marker` --rationale_for--> `TutorialLesson()`  [EXTRACTED]
  Tutorial_Doc/TUTORIAL_DEVELOPER_GUIDE.md → apps/frontend/src/components/TutorialLesson.jsx
- `requireRole()` --conceptually_related_to--> `POST /api/tutorial/validate`  [AMBIGUOUS]
  apps/backend/src/middleware/auth.js → apps/backend/README.md
- `Tutorial solution password gate (UX-only)` --rationale_for--> `TutorialLesson()`  [EXTRACTED]
  apps/frontend/README.md → apps/frontend/src/components/TutorialLesson.jsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Interactive Tutorial System (parse, render, validate)** — apps_frontend_src_components_tutorialcontainer_tutorialcontainer, apps_frontend_src_components_tutorialoverview_tutorialoverview, apps_frontend_src_components_tutoriallesson_tutoriallesson, apps_frontend_src_utils_tutorialparser_parsetutorialfrommarkdown, apps_backend_src_routes_tutorial_validateendpoint, apps_frontend_public_tutorial_verilogtutorialformatted_document [EXTRACTED 1.00]
- **JWT Authentication & Role/Group System** — apps_frontend_src_contexts_authcontext_authprovider, apps_frontend_src_contexts_authcontext_hasrole, apps_backend_src_middleware_auth_authenticatetoken, apps_backend_src_middleware_auth_requirerole, apps_backend_src_scripts_setrole_setrole, apps_backend_src_models_user_user [EXTRACTED 1.00]
- **HDLab Docker Compose Deployment Topology** — docker_compose_document, apps_backend_readme_document, apps_frontend_readme_document, apps_worker_readme_document, docker_compose_override_document [EXTRACTED 1.00]

## Communities (28 total, 9 thin omitted)

### Community 0 - "Frontend App Shell & Auth UI"
Cohesion: 0.08
Nodes (24): App(), extractTopModuleName(), runSimulation(), extractRelevantCocotbLog(), formatWaveValue(), parseVcd(), summarizeSimulationLog(), TRANSLATIONS (+16 more)

### Community 1 - "Backend API & Data Models"
Cohesion: 0.09
Nodes (15): app, startServer(), authenticateToken(), ModuleLibrarySchema, FileSchema, ProjectSchema, ResultSchema, SimulationSchema (+7 more)

### Community 2 - "Tutorial Rendering & Parsing"
Cohesion: 0.13
Nodes (27): TutorialContainer(), handleContentLinkClick(), TRANSLATIONS, TutorialLesson(), TRANSLATIONS, TutorialOverview(), TYPE_ICONS, loadTutorialFromServer() (+19 more)

### Community 3 - "Design Rationale & Docs"
Cohesion: 0.09
Nodes (30): Unrestricted CORS policy, HDLab Backend README, requireRole(), ModuleLibrary model, POST /api/projects, POST /api/simulations, GET /api/simulations/:id/results, GET /api/simulations/:id/waveform (+22 more)

### Community 4 - "Backend Dependencies"
Cohesion: 0.08
Nodes (25): dependencies, amqplib, bcryptjs, cors, dotenv, express, jsonwebtoken, mongoose (+17 more)

### Community 5 - "Frontend Dependencies"
Cohesion: 0.08
Nodes (24): dependencies, jszip, @monaco-editor/react, react, react-dom, react-markdown, rehype-raw, remark-gfm (+16 more)

### Community 6 - "Worker Dependencies"
Cohesion: 0.11
Nodes (17): dependencies, amqplib, dotenv, mongoose, devDependencies, nodemon, amqplib, dotenv (+9 more)

### Community 7 - "Simulation Worker Pipeline"
Cohesion: 0.14
Nodes (12): runVerilatorSimulation(), Dynamic sim_main.cpp generation, connectRabbitMQWithRetry(), detectTestbenchTopModule(), main(), processSimulation(), FileSchema, Project model (worker) (+4 more)

### Community 8 - "Frontend Dev Tooling"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-react-refresh, @types/react, @types/react-dom, vite (+9 more)

### Community 9 - "Verilog Tutorial Curriculum"
Cohesion: 0.13
Nodes (15): Sync Tutorial Workflow, Chapter 0: Grundlagen für das Hardware Verständnis, Chapter 10: Projekte, Chapter 1: Aufbau eines Moduls, Chapter 2: Signale, Chapter 3: Erweiterte Signale, Chapter 4: Logische Operationen, Chapter 5: Arithmetische Operationen (+7 more)

### Community 10 - "Legacy Tutorial Parser"
Cohesion: 0.27
Nodes (8): cleanCodeBlock(), extractBetween(), groupByDifficulty(), groupByType(), parseFrontmatter(), parseLesson(), parseTutorialFromFile(), parseTutorialFromMarkdown()

### Community 11 - "HDLab Brand Assets"
Cohesion: 0.38
Nodes (7): HDLab Logo (Green + Black), Frontend Assets Directory, HDLab Logo (Green + Black + Gold), HDLab Logo (Green + Black), HDLab Logo (Green + Gold), HDLab Logo (Green + Grey), HDLab Brand

### Community 12 - "Verilator Container Entrypoint"
Cohesion: 0.83
Nodes (3): run_cocotb(), run_verilator(), entrypoint.sh script

### Community 13 - "Root Package Config"
Cohesion: 0.50
Nodes (3): dependencies, jszip, jszip

### Community 14 - "User Auth Endpoints"
Cohesion: 0.67
Nodes (3): User model, POST /api/auth/login, POST /api/auth/register

## Ambiguous Edges - Review These
- `requireRole()` → `POST /api/tutorial/validate`  [AMBIGUOUS]
  apps/backend/README.md · relation: conceptually_related_to

## Knowledge Gaps
- **110 isolated node(s):** `expectedTitles`, `name`, `version`, `main`, `type` (+105 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 148 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `requireRole()` and `POST /api/tutorial/validate`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `POST /api/tutorial/validate` connect `Design Rationale & Docs` to `Backend API & Data Models`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **Why does `TutorialLesson()` connect `Tutorial Rendering & Parsing` to `Frontend App Shell & Auth UI`, `Design Rationale & Docs`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Why does `handleValidate()` connect `Design Rationale & Docs` to `Tutorial Rendering & Parsing`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **What connects `expectedTitles`, `name`, `version` to the rest of the system?**
  _110 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend App Shell & Auth UI` be split into smaller, more focused modules?**
  _Cohesion score 0.07505285412262157 - nodes in this community are weakly interconnected._
- **Should `Backend API & Data Models` be split into smaller, more focused modules?**
  _Cohesion score 0.0928030303030303 - nodes in this community are weakly interconnected._