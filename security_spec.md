# Security Specification & "Dirty Dozen" Penetration Test Cases

## 1. Data Invariants
- **Identity Invariant**: A swarm document must have an `ownerId` that strictly matches the authenticated user's UID (`request.auth.uid`). No user can create or modify another user's swarm data.
- **Resource Poisoning Protection**: All path variables, IDs, and string properties must be strictly limited in size (e.g., UIDs <= 128 characters, string values <= 256 characters) to prevent Denial of Wallet resource attacks.
- **State Integrity**: Life-cycle phase values must adhere to the defined enum list: `["idle", "running", "paused", "completed", "failed"]`.
- **Temporal Integrity**: Time-stamps must be mathematically valid integers.

---

## 2. The "Dirty Dozen" Payloads
The following 12 payloads are designed to break the laws of Identity, Integrity, and State, and must be rejected by `firestore.rules`:

### P1: Identity Spoofing (Unauthenticated Create)
Attempt to create a swarm document without any authenticated session credentials.
```json
{
  "id": "swarm_123",
  "ownerId": "user_abc",
  "problemId": "riemann_hypothesis",
  "targetTheorem": "RH"
}
```

### P2: Owner ID Mimicking (UID Mismatch)
Authenticated user tries to write a swarm owned by another user.
```json
{
  "id": "swarm_123",
  "ownerId": "user_different",
  "problemId": "riemann_hypothesis",
  "targetTheorem": "RH"
}
```

### P3: Missing Required Fields
Attempt to create a swarm document missing the mandatory `problemId` field.
```json
{
  "id": "swarm_123",
  "ownerId": "user_abc",
  "targetTheorem": "RH"
}
```

### P4: Resource Poisoning (Oversized Swarm ID)
Attempt to create a swarm with a system ID exceeding 128 characters.
```json
{
  "id": "swarm_123_extremely_long_malicious_id_over_128_characters_intended_to_bloat_the_database_and_cause_denial_of_wallet_exhaustion_attacks",
  "ownerId": "user_abc",
  "problemId": "riemann_hypothesis",
  "targetTheorem": "RH"
}
```

### P5: Enum Value Injection (Illegal Phase State)
Attempt to set a state phase that is not part of the allowed schema enum values.
```json
{
  "id": "swarm_123",
  "ownerId": "user_abc",
  "problemId": "riemann_hypothesis",
  "targetTheorem": "RH",
  "phase": "super_intelligent_unauthorized_state"
}
```

### P6: Negative Spent Budget
Attempt to write a negative value for computational spendings.
```json
{
  "id": "swarm_123",
  "ownerId": "user_abc",
  "problemId": "riemann_hypothesis",
  "targetTheorem": "RH",
  "spent": -50000
}
```

### P7: Value Poisoning (Invalid Type for Spent)
Attempt to submit a non-numeric string value for the `spent` budget.
```json
{
  "id": "swarm_123",
  "ownerId": "user_abc",
  "problemId": "riemann_hypothesis",
  "targetTheorem": "RH",
  "spent": "ten_thousand_dollars_malicious_string"
}
```

### P8: PII Blanket Read Exposure
Attempt to read multiple swarm documents belonging to other users via a broad list query.
```json
{
  "query": "select * from swarms"
}
```

### P9: Self-Assigned Role Elevation
Attempt to write an unauthorized custom claim or role field to the document to compromise downstream operations.
```json
{
  "id": "swarm_123",
  "ownerId": "user_abc",
  "problemId": "riemann_hypothesis",
  "targetTheorem": "RH",
  "role": "admin"
}
```

### P10: Ghost Field Shadow Update
Attempt to update a document with a non-schema "ghost" field to inject unstructured data.
```json
{
  "id": "swarm_123",
  "ownerId": "user_abc",
  "problemId": "riemann_hypothesis",
  "targetTheorem": "RH",
  "ghost_field_is_verified": true
}
```

### P11: Non-Verbatim Update Keys (Shadow Overwrite)
Attempt to update immutable identifiers such as `problemId` post-creation.
```json
{
  "id": "swarm_123",
  "ownerId": "user_abc",
  "problemId": "p_vs_np_unauthorized_swap",
  "targetTheorem": "RH"
}
```

### P12: Out-of-bounds Extreme Allocation
Attempt to set an excessive, out-of-bounds maximum budget.
```json
{
  "id": "swarm_123",
  "ownerId": "user_abc",
  "problemId": "riemann_hypothesis",
  "targetTheorem": "RH",
  "budget": 9999999999
}
```

---

## 3. The Test Suite Assertions (TDD Execution)
All Dirty Dozen payloads must evaluate to `PERMISSION_DENIED` in client-side queries. This is verified by our master security rules.
