/-
  Yang-Mills Existence and Mass Gap:
  - Finite-volume lattice Hamiltonians
  - Osterwalder-Schrader reflection positivity typeclass
  - Spectral gap Δ > 0
-/

class OsterwalderSchraderAxioms (Hamiltonian : Type) where
  reflection_positive : Hamiltonian -> Bool
  euclidean_invariance : Hamiltonian -> Bool
  cluster_decomposition : Hamiltonian -> Bool

structure MassGapCertificate (H : Type) [OsterwalderSchraderAxioms H] where
  hamiltonian : H
  ground_state_energy : Float
  first_excited_energy : Float
  spectral_gap : Float
  gap_strictly_positive : spectral_gap > 0.0
  gap_consistent : first_excited_energy - ground_state_energy >= spectral_gap
