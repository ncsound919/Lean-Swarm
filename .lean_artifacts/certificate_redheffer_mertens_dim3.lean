/-
  CERTIFICATE PROVENANCE:
  - Subject: Redheffer Matrix Determinant Equality with Mertens Function M(3)
  - Theorem: det([[1, 1, 1], [1, 1, 0], [1, 0, 1]]) = M(3) = mu(1) + mu(2) + mu(3) = -1
  - Verification: Explicit symbolic determinant expansion without sorry
-/

def r3_11 : Int := 1
def r3_12 : Int := 1
def r3_13 : Int := 1
def r3_21 : Int := 1
def r3_22 : Int := 1
def r3_23 : Int := 0
def r3_31 : Int := 1
def r3_32 : Int := 0
def r3_33 : Int := 1

def det_R3 : Int :=
  r3_11 * (r3_22 * r3_33 - r3_23 * r3_32) -
  r3_12 * (r3_21 * r3_33 - r3_23 * r3_31) +
  r3_13 * (r3_21 * r3_32 - r3_22 * r3_31)

def mertens_3 : Int := 1 + (-1) + (-1)

theorem redheffer_3_equals_mertens_3 : det_R3 = mertens_3 := by
  decide
