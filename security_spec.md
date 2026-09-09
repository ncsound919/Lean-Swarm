# Security Specification - Lean Swarm Orchestrator

## Data Invariants
- Only the owner of a swarm can initiate or pause it.
- Lemmas can only be updated by the server-side verifier/orchestrator (or the owner in theory, but primarily server).
- The verifier is the only agent that can promote a lemma to 'verified' status.
- All writes must adhere to the schema defined in firebase-blueprint.json.

## The Dirty Dozen Payloads (Rejection Targets)
1. **Unauthorized Swarm Creation**: Creating a swarm with an `ownerId` that doesn't match the current user.
2. **Ghost Lemma Injection**: Adding a lemma with an ID that doesn't match the 'L[0-9]+' pattern.
3. **Budget Manipulation**: Updating the `spent` field to a negative value or bypassing the `budget`.
4. **Identity Spoofing**: Updating a swarm's `ownerId` to hijack control.
5. **Phase Shortcutting**: Skipping directly to `finalizing` without the verifier promoting all lemmas.
6. **Agent Impersonation**: A client trying to update an agent's `status` to 'verified' when it's an AI agent.
7. **POISON_STRING_ID**: Using a 1MB string as a lemma document ID.
8. **Malicious Proof Injection**: Updating `leanSource` with a script that exceeds the size limit.
9. **Ledger Tampering**: Deleting a negative result to hide failures.
10. **Admin Escalation**: Setting `isAdmin` on a user profile if we had one (we use a separate admin check).
11. **Timestamp Faking**: Providing a manual `createdAt` instead of using `request.time`.
12. **Orphaned Lemma**: Creating a lemma that refers to a non-existent swarm.

## Test Runner (Logic Simulation)
All these must return `PERMISSION_DENIED`.
- `create /swarms/s1 { ownerId: 'other_user' }` -> FAIL
- `update /swarms/s1 { ownerId: 'new_owner' }` -> FAIL
- `create /swarms/s1/lemmas/hack { id: 'bad_id' }` -> FAIL
- `update /swarms/s1 { phase: 'finalizing' }` if not all lemmas verified -> FAIL
