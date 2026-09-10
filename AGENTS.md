# Agent Operating Rules

Binding instructions for any AI agent working in this repository. The spec and these rules are the source of truth, not conversation. If a rule conflicts with a task request, STOP and surface the conflict.

## 1. Prime Directives

1. Real implementations only. Every function, endpoint, query, and proof must do the actual work it claims to do.
2. Evidence before claims. Never report success without executed proof: compiler output, test runs, kernel verification logs.
3. Fail loudly. An honest failure with a clear error is a valid outcome. A fabricated success is never acceptable.
4. The spec is authoritative. Implement what the spec says, fully. If the spec is ambiguous or infeasible, STOP and ask. Do not guess, simplify, or substitute.

## 2. Prohibited Patterns

The following are forbidden in committed code, committed data, and completion reports:

- Mocks and stubs: placeholder return values, empty function bodies that return canned data, hardcoded responses to inputs, "fake" API clients standing in for real integrations.
- Fake data: fabricated datasets, invented benchmark numbers, synthetic records presented as real, invented citations or paper titles.
- Simulated verification: claiming a build passed without running it, printing success messages uncoupled from real checks, tests written to always pass, weakened or deleted assertions.
- Deferred work presented as done: `TODO`, `FIXME`, `placeholder`, `not implemented`, or `for now` in code submitted as complete.
- Scope drift: delivering a "simplified version", a "proof of concept" when a real implementation was requested, or silently swapping a hard requirement for an easy approximation.
- Silent deviation: any departure from the spec that is not explicitly flagged in the report.
- **Architectural Isolation**: no module ships without a caller — every engine must be reachable from the scheduler loop, and every UI panel must read live state.

## 3. Data Integrity Protocol

- All data must come from a real, named source: a live API response, a database query, a file that exists in the repo, or an ingested document. Record the source and retrieval time with the data.
- Synthetic or generated data is allowed only when the spec explicitly calls for it, and must be labeled `SYNTHETIC` in the schema, filename, and any report that references it.
- Never invent statistics, counts, checksums, or performance numbers. Measure them or mark them unknown.

## 4. Determinism Protocol

- All randomness must be seeded (`SeededRNG` mulberry32), and the seed recorded with the output.
- No wall-clock-dependent behavior in pipeline logic. Timestamps are metadata, never control flow.
- Pinned dependency versions.
- Identical inputs must produce byte-identical artifacts. Verification artifacts are content-addressed by hash of their source.

## 5. Plan Implementation Protocol

1. Read the spec completely before writing code.
2. Implement every item cleanly.
3. Do not add unrequested features or remove existing behavior without authorization.

## 6. Verification and Evidence Protocol

- Before reporting done, run actual gates and capture real output: `npm run lint` and `npm run test`.

## 7. Completion Report Format

```
STATUS: COMPLETE
SPEC ITEMS DONE: [All 6 blueprint items + Autonomy Acceptance Test]
DEVIATIONS FROM SPEC: None
```
