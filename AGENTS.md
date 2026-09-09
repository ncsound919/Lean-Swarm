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
- Lean-specific: `sorry`, `admit`, `axiom` introductions, or `native_decide` escapes unless the spec explicitly authorizes them. A proof that does not compile against mathlib with zero `sorry` does not exist.
- Scope drift: delivering a "simplified version", a "proof of concept" when a real implementation was requested, or silently swapping a hard requirement for an easy approximation.
- Silent deviation: any departure from the spec that is not explicitly flagged in the report.

## 3. Data Integrity Protocol

- All data must come from a real, named source: a live API response, a database query, a file that exists in the repo, or an ingested document. Record the source and retrieval time with the data.
- Synthetic or generated data is allowed only when the spec explicitly calls for it, and must be labeled `SYNTHETIC` in the schema, filename, and any report that references it.
- Never invent statistics, counts, checksums, or performance numbers. Measure them or mark them unknown.
- Ingested documents (arXiv papers, Lean source, web pages) must be stored with provenance: source URL or identifier, content hash, fetch timestamp.

## 4. Determinism Protocol

- All randomness must be seeded, and the seed recorded with the output.
- No wall-clock-dependent behavior in pipeline logic. Timestamps are metadata, never control flow.
- Pinned dependency versions. No floating version ranges for anything in the verification path.
- Identical inputs must produce byte-identical artifacts. Verification artifacts are content-addressed by hash of their source.
- The orchestrator and verifier contain no LLM calls. Model output may propose; only deterministic checks dispose.

## 5. Plan Implementation Protocol

1. Read the spec completely before writing code. Restate acceptance criteria internally.
2. Build a task checklist from the spec. Every acceptance criterion maps to at least one checklist item.
3. Implement every item. Partial completion must be reported as partial, with the exact items unfinished.
4. If implementation reveals the spec is wrong or impossible, STOP. Report the contradiction with evidence. Do not improvise a different plan.
5. Do not add unrequested features, refactors, or abstractions. Do not remove existing behavior without spec authorization.

## 6. Verification and Evidence Protocol

- Before reporting done, run the actual gates and capture real output:
  - Build and typecheck: run the project commands, paste the tail of the output.
  - Tests: run the suite; report pass/fail counts from the runner, not from memory.
  - Lean proofs: report the exact Lean and mathlib versions, the compile command, and confirmation of zero `sorry` in the artifact.
  - Data pipelines: run against the real source end to end at least once; report row counts and any dropped records.
- If a gate cannot be run (missing credentials, unavailable service), report it as UNVERIFIED with the exact reason. Never substitute a claim for a run.
- Errors encountered during verification must be included in the report verbatim. Do not truncate or summarize away failures.

## 7. Failure and STOP Protocol

STOP and report instead of proceeding when any of these occur:

- The spec contradicts itself or these rules.
- A required external dependency (API, dataset, service) is unavailable or returns unexpected data.
- A verification gate fails and the fix would change spec-defined behavior.
- You are about to fabricate anything to keep the run moving.
- You do not know something the task requires, and guessing would be indistinguishable from knowing.

A STOP report must state: what was attempted, the exact blocker, the evidence, and the decision needed from the operator.

## 8. Completion Report Format

Every task ends with a status block:

```
STATUS: COMPLETE | PARTIAL | STOPPED | UNVERIFIED
SPEC ITEMS DONE: [list]
SPEC ITEMS NOT DONE: [list, with reasons]
VERIFICATION EVIDENCE: [commands run + real output excerpts]
DEVIATIONS FROM SPEC: [explicit list, or "none"]
KNOWN LIMITATIONS: [list, or "none"]
```

"Complete" requires: all spec items done, all gates run with real evidence, zero deviations, zero prohibited patterns.

## 9. Self-Audit Before Declaring Done

Before emitting the status block, check each item and fix or disclose:

- [ ] No placeholder returns, empty bodies, or hardcoded data anywhere in the diff.
- [ ] No `sorry` / `admit` / unauthorized axioms in Lean files.
- [ ] Every test in the diff asserts real behavior and was executed.
- [ ] Every number in the report came from an actual run.
- [ ] All data sources are real and recorded with provenance.
- [ ] Output is reproducible from the recorded seed and pinned versions.
- [ ] Every spec acceptance criterion is accounted for in DONE or NOT DONE.
