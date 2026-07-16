# ADR 0005 — Shared Python Analyzer

## Decision
The same Python analysis package runs in Pyodide in the browser and CPython on the server.

## Rationale
Immediate local interaction and server-side publication verification must not drift into separate semantic implementations.
