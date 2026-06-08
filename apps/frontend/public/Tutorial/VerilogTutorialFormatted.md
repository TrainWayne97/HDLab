<!--
lesson_id: 1
lesson_title: "Vorwort"
difficulty: "intro"
duration_min: 5
type: "theory" 
-->

# Ultimativer Spektakulärer (System)Verilog Guide 
## Vorwort 
Zuerst ein **Hallo und Willkommen!**
In diesem Guide werden wir lernen wie **Verilog funktioniert** und es zu einem **mächtigen Tool** für uns machen.
Zum Start ein kurzer Hintergrund: **Verilog** wurde 1983/84 von Phil Moorby entworfen, wobei man heutzutage fast ausschließlich die **synonym** verwendete **SystemVerilog** Extension aus 2009 nutzt. Dieses Tutorial wird auch dauerhaft Verilog schreiben und Systemverilog meinen.
---


<!--
lesson_id: 2
lesson_title: "Inhaltsverzeichnis"
difficulty: "intro"
duration_min: 0
type: "theory"-->


- [0. Grundlagen für das Hardware Verständnis](#0-grundlagen-für-das-hardware-verständnis)
  - [Was ist Verilog?](#was-ist-verilog)
  - [Zustände: Die "Highs and Lows" des Computers](#zustände-die-highs-and-lows-des-computers)
  - [Der Index \[7:0\]](#der-index-70)
  - [Binär und Hexadezimal](#binär-und-hexadezimal)
  - [Zahlensysteme](#zahlensysteme)
  - [Truth Table 1/0 \<-- Bild truth table maybe auch addition](#truth-table-10----bild-truth-table-maybe-auch-addition)
  - [Sequentiell Kombinatorisch, was ist das?](#sequentiell-kombinatorisch-was-ist-das)
  - [FPGA: Was, Warum, Wie?](#fpga-was-warum-wie)
  - [Was macht das Synthesetool und warum muss ich dauerhaft drauf achten, dass er mich nicht missversteht?](#was-macht-das-synthesetool-und-warum-muss-ich-dauerhaft-drauf-achten-dass-er-mich-nicht-missversteht)
  - [Das Testen mit unserer Website 1/0](#das-testen-mit-unserer-website-10)
- [1. Aufbau eines Moduls](#1-aufbau-eines-moduls)
  - [Modul: Der Rahmen des Codes](#modul-der-rahmen-des-codes)
  - [Portliste: Anschluss der Außenwelt](#portliste-anschluss-der-außenwelt)
  - [Kommentare: Überblick trotz Chaos](#kommentare-überblick-trotz-chaos)
- [2. Signale](#2-signale)
  - [Einfache Zuweisungen: Was soll wo hin?](#einfache-zuweisungen-was-soll-wo-hin)
  - [Leitungen: Verbindungen im Code.](#leitungen-verbindungen-im-code)
  - [Always @ (posedge signal) : Sequentiell](#always--posedge-signal--sequentiell)
  - [Always @ (\*): Kombinatorisch](#always---kombinatorisch)
  - [Blocking und Non-Blocking](#blocking-und-non-blocking)
  - [Begin End](#begin-end)
  - [Logic](#logic)
- [3. Erweiterte Signale](#3-erweiterte-signale)
  - [Breite von Signalen](#breite-von-signalen)
  - [Vorzeichen](#vorzeichen)
  - [Bitselektion aus Leitungen](#bitselektion-aus-leitungen)
  - [Anpassen von Bitgrößen \<-- das passt hier Kontexmäßig, aber nicht durch die addition](#anpassen-von-bitgrößen----das-passt-hier-kontexmäßig-aber-nicht-durch-die-addition)
  - [Arrays](#arrays)
- [4. Logische Operationen](#4-logische-operationen)
  - [Grundoperationen: AND, NOT](#grundoperationen-and-not)
  - [Weitere Grundoperationen: OR, XOR, NOR](#weitere-grundoperationen-or-xor-nor)
  - [Boolean: Wahrheitswerte](#boolean-wahrheitswerte)
  - [If: Wenn x, dann y](#if-wenn-x-dann-y)
  - [Case: If nur anders](#case-if-nur-anders)
  - [Bedingte Zuweisung](#bedingte-zuweisung)
- [5. Arithmetische Operationen](#5-arithmetische-operationen)
  - [Bit-Shifts](#bit-shifts)
  - [Arithmetische Operationen: Addition und Subtraktion](#arithmetische-operationen-addition-und-subtraktion)
  - [Arithmetische Operationen: Multiplikation](#arithmetische-operationen-multiplikation)
  - [Arithmetische Operationen: Divison und Rest](#arithmetische-operationen-divison-und-rest)
- [6. Startbedingungen und Moduling](#6-startbedingungen-und-moduling)
  - [Anfangswerte](#anfangswerte)
  - [Moduling](#moduling)
  - [Parameter](#parameter)
- [7. Zustände z und x](#7-zustände-z-und-x)
  - [Synthese von z und x](#synthese-von-z-und-x)
  - [casez und casex](#casez-und-casex)
- [8. Finite State Machine](#8-finite-state-machine)
  - [Automaten](#automaten)
  - [Moore](#moore)
  - [Mealy](#mealy)
- [9. Das Gesamtsystem](#9-das-gesamtsystem)
  - [Codestruktur](#codestruktur)
  - [Physische Größe (FPGA): Warum nicht alles riesig?](#physische-größe-fpga-warum-nicht-alles-riesig)
  - [Warum und wann sollte man Speichern?](#warum-und-wann-sollte-man-speichern)
  - [Zusammenfassung 1/0](#zusammenfassung-10)
- [Praktische Übungen](#praktische-übungen)
  - [Grundoperation: NAND](#grundoperation-nand)
  - [Grundoperation: OR](#grundoperation-or)
  - [NOR XOR](#nor-xor)
  - [Wechselschaltung](#wechselschaltung)
  - [Wechselschaltung mit Knöpfen](#wechselschaltung-mit-knöpfen)
  - [Halbaddierer](#halbaddierer)
  - [Volladdierer](#volladdierer)
  - [Boolean: Wahrheitswerte](#boolean-wahrheitswerte-1)
  - [2 zu 4 Binärer Dekodierer](#2-zu-4-binärer-dekodierer)
  - [Erweitern auf 3 zu 8 Binärer Dekodierer](#erweitern-auf-3-zu-8-binärer-dekodierer)
  - [Priority If](#priority-if)
  - [Ampel](#ampel)
  - [7-Segment Display](#7-segment-display)
  - [Timer](#timer)
  - [Uhr](#uhr)
  - [Vollständige Uhr](#vollständige-uhr)
- [Anmerkungen 1/0](#anmerkungen-10)
  - [Bilder hinzufügen, von den Truth Tables und Logikgattern](#bilder-hinzufügen-von-den-truth-tables-und-logikgattern)
  - [Fixedcomma/Float? in Aufgaben 1/0](#fixedcommafloat-in-aufgaben-10)
  - [Coder auf FPGA](#coder-auf-fpga)
- [Zurückgestellt](#zurückgestellt)
- [2. Testbenches 1/0](#2-testbenches-10)
  - [Was waren Testbenchen nochmal?](#was-waren-testbenchen-nochmal)
  - [Aufrufen](#aufrufen)
  - [Anfangseinstellungen](#anfangseinstellungen)
  - [Gutes Testen](#gutes-testen)
  - [Systemverilog Testen \<-- Alles mal durchprobieren automatisch auch bei riesigen Modulen](#systemverilog-testen----alles-mal-durchprobieren-automatisch-auch-bei-riesigen-modulen)
- [3. System Extension 1/0](#3-system-extension-10)
  - [Packages: Globale Parameter Familien](#packages-globale-parameter-familien)
  - [unique](#unique)
- [4. Extras (gerade noch außer vor, Integration in Website überdenken und daraufhin anpassen) 1/0](#4-extras-gerade-noch-außer-vor-integration-in-website-überdenken-und-daraufhin-anpassen-10)
  - [Latches](#latches)
  - [Data-Flip-Flop](#data-flip-flop)
  - [Vorgefertigte Datentypen 1/0](#vorgefertigte-datentypen-10)
  - [7-Segment-System](#7-segment-system)


---