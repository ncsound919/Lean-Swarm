# Contribution & Repository Hygiene Guidelines

## Branch Protection & Review Policies
- All changes must pass CI validation:
  1. `npm run lint` (TypeScript zero type-errors).
  2. `npm test` (Zero `sorry` in Lean artifacts, full test suite pass).
  3. `npm run build` (Production compilation cleanly outputs `dist/`).
- Direct commits to `main` should be avoided in production multi-developer workflows; use PR branches with required status checks and signed commits.

## Semantic Commit Conventions
- `feat:` New capability, formal track, or closer tier.
- `fix:` Bug fix or refutation correction.
- `test:` CI and unit test additions.
- `docs:` Documentation, specification, and agent rule updates.
