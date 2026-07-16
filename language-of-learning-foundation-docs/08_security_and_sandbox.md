# Security and Sandbox Model

## Threat model

User code is untrusted. Risks include infinite loops, memory exhaustion, filesystem or network access, dynamic execution, introspection, secret extraction, malicious imports, browser freezing, and oversized traces.

## v0.1 rules

- no imports;
- no network;
- no filesystem;
- no `eval` or `exec`;
- no unrestricted introspection;
- literal call arguments only;
- source-size limit;
- collection-size limit;
- string-size limit;
- 500 trace-step cap;
- execution timeout;
- memory ceiling;
- captured output only;
- supported built-ins allow-list.

## Browser execution

Pyodide runs inside a Web Worker. The main UI thread never runs user Python. The worker supports hard termination and restart.

## Server execution

Server verification uses an isolated process or container with no outbound network, read-only runtime, temporary isolated storage, CPU and memory limits, and no secrets in its environment.

## Consent

Raw code is not saved unless the user explicitly chooses to save it.

Default telemetry may store construct counts, structure fingerprints, unsupported construct names, engine version, latency, and check results.

## Public-release gate

Hostile fixtures must cover infinite loops, huge allocations, forbidden built-ins, imports, recursive explosions, long strings, deep nesting, exception storms, and worker termination.
