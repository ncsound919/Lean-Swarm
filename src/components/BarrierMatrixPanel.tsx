import { useState } from 'react';
import { BarrierAuditResult } from '../types';
import { 
  ShieldCheck, 
  ShieldX, 
  AlertTriangle, 
  Play, 
  Loader2, 
  CheckCircle2, 
  Filter,
  Info
} from 'lucide-react';

interface BarrierMatrixPanelProps {
  barrierAudits?: BarrierAuditResult[];
}

export function BarrierMatrixPanel({ barrierAudits }: BarrierMatrixPanelProps) {
  const [techniqueName, setTechniqueName] = useState('Polynomial-Time Reductions via Truth-Table Combinatorics');
  const [problem, setProblem] = useState<'p_vs_np' | 'navier_stokes'>('p_vs_np');
  const [usesDiag, setUsesDiag] = useState(false);
  const [usesNatural, setUsesNatural] = useState(true);
  const [usesAlgebrization, setUsesAlgebrization] = useState(false);
  const [reliesOnViscosity, setReliesOnViscosity] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<BarrierAuditResult | null>(null);

  const runAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch('/api/audit/barrier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          techniqueName,
          usesDiagonalization: usesDiag,
          usesNaturalProperty: usesNatural,
          usesAlgebraicOracles: usesAlgebrization,
          reliesOnViscosity,
          problem
        })
      });
      const json = await res.json();
      setAuditResult(json);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuditing(false);
    }
  };

  const list = barrierAudits && barrierAudits.length > 0 ? barrierAudits : [
    {
      problem: 'p_vs_np' as const,
      techniqueName: 'Classical Cantor-style Time-Hierarchy Diagonalization',
      barrierStatus: {
        relativization: { violated: true, reason: 'VIOLATION: Relativizes. By Baker-Gill-Solovay (1975), P^A = NP^A and P^B != NP^B exist.' },
        naturalProofs: { violated: false, reason: 'PASSED' },
        algebrization: { violated: false, reason: 'PASSED' }
      },
      verdict: 'REJECTED_BY_BARRIER' as const,
      recommendation: 'Deterministic Orchestrator Rejection: Collides with Baker-Gill-Solovay. Allocate zero compute.'
    },
    {
      problem: 'p_vs_np' as const,
      techniqueName: 'Minimum Circuit Size Problem (MCSP) Non-Natural Invariant',
      barrierStatus: {
        relativization: { violated: false, reason: 'PASSED: Non-relativizing circuit size properties used.' },
        naturalProofs: { violated: false, reason: 'PASSED: Violates constructivity condition of Natural Proofs.' },
        algebrization: { violated: false, reason: 'PASSED: Circumvents algebrizing extensions.' }
      },
      verdict: 'PASSED_BARRIER_FILTER' as const,
      recommendation: 'Proposal respects all known complexity barriers. Authorized for proof search compute.'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">
              STRATEGY 8: HARDFORK FILTERS
            </span>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
              <Filter size={16} className="text-rose-400" />
              Barrier-Aware Routing: Hard Constraint Engine
            </h2>
          </div>
          <p className="text-xs text-zinc-300 mt-1">
            Rejects provably doomed technique classes before wasting compute: Baker–Gill–Solovay, Razborov–Rudich, Aaronson–Wigderson.
          </p>
        </div>
      </div>

      {/* The 3 P vs NP Barriers Reference */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/70 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
            <span>1. Relativization</span>
            <span className="text-[10px] font-mono text-zinc-400">BGS (1975)</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Oracles $A, B$ exist where $P^A = NP^A$ and $P^B \ne NP^B$. Pure diagonalization techniques that relativize are blocked.
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/70 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
            <span>2. Natural Proofs</span>
            <span className="text-[10px] font-mono text-zinc-400">RR (1997)</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Under cryptographic PRG assumptions, no "natural" property (constructive + large) can prove super-polynomial circuit bounds.
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/70 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
            <span>3. Algebrization</span>
            <span className="text-[10px] font-mono text-zinc-400">AW (2008)</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Techniques extending to low-degree algebraic oracle polynomials cannot separate $P$ from $NP$ (collapses IP=PSPACE methods).
          </p>
        </div>
      </div>

      {/* Interactive Technique Barrier Auditor */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/70 space-y-3.5">
        <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
          <ShieldCheck size={15} className="text-blue-400" />
          Audit Candidate Proof Proposal Against Barrier Invariants
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-mono text-zinc-400 mb-1 block">Technique Proposal Name:</label>
            <input
              type="text"
              value={techniqueName}
              onChange={(e) => setTechniqueName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-black/70 border border-zinc-800 font-mono text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-mono text-zinc-400 mb-1 block">Target Problem:</label>
            <select
              value={problem}
              onChange={(e) => setProblem(e.target.value as any)}
              className="w-full px-3 py-1.5 rounded-lg bg-black/70 border border-zinc-800 font-mono text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
            >
              <option value="p_vs_np">P versus NP</option>
              <option value="navier_stokes">Navier–Stokes Smoothness</option>
            </select>
          </div>
        </div>

        {/* Checkbox properties */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
          <label className="p-2.5 rounded-lg border border-zinc-800 bg-black/40 flex items-center gap-2 text-xs text-zinc-300 cursor-pointer hover:border-zinc-700">
            <input
              type="checkbox"
              checked={usesDiag}
              onChange={(e) => setUsesDiag(e.target.checked)}
              className="rounded bg-zinc-800 border-zinc-700"
            />
            <span>Uses Diagonalization</span>
          </label>

          <label className="p-2.5 rounded-lg border border-zinc-800 bg-black/40 flex items-center gap-2 text-xs text-zinc-300 cursor-pointer hover:border-zinc-700">
            <input
              type="checkbox"
              checked={usesNatural}
              onChange={(e) => setUsesNatural(e.target.checked)}
              className="rounded bg-zinc-800 border-zinc-700"
            />
            <span>Natural Property (Large)</span>
          </label>

          <label className="p-2.5 rounded-lg border border-zinc-800 bg-black/40 flex items-center gap-2 text-xs text-zinc-300 cursor-pointer hover:border-zinc-700">
            <input
              type="checkbox"
              checked={usesAlgebrization}
              onChange={(e) => setUsesAlgebrization(e.target.checked)}
              className="rounded bg-zinc-800 border-zinc-700"
            />
            <span>Algebrizing Extensions</span>
          </label>

          <label className="p-2.5 rounded-lg border border-zinc-800 bg-black/40 flex items-center gap-2 text-xs text-zinc-300 cursor-pointer hover:border-zinc-700">
            <input
              type="checkbox"
              checked={reliesOnViscosity}
              onChange={(e) => setReliesOnViscosity(e.target.checked)}
              className="rounded bg-zinc-800 border-zinc-700"
            />
            <span>Relies on Viscosity (ν &gt; 0)</span>
          </label>
        </div>

        <button
          onClick={runAudit}
          disabled={isAuditing}
          className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
        >
          {isAuditing ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} className="fill-current" />}
          Execute Deterministic Barrier Audit
        </button>

        {auditResult && (
          <div className={`p-3 rounded-lg border ${auditResult.verdict === 'PASSED_BARRIER_FILTER' ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/10'} space-y-2`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                {auditResult.verdict === 'PASSED_BARRIER_FILTER' ? <ShieldCheck size={16} className="text-emerald-400" /> : <ShieldX size={16} className="text-rose-400" />}
                {auditResult.verdict}
              </span>
              <span className="text-[10px] font-mono text-zinc-400">{auditResult.techniqueName}</span>
            </div>
            <p className="text-[11px] text-zinc-300 font-mono leading-relaxed">
              {auditResult.recommendation}
            </p>
          </div>
        )}
      </div>

      {/* Historical Barrier Audits Log */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/70 space-y-2.5">
        <h3 className="text-xs font-semibold text-zinc-200">Enforced Swarm Barrier Audits</h3>
        <div className="space-y-2">
          {list.map((item, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-black/40 border border-zinc-800 flex items-start justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-200">{item.techniqueName}</span>
                  <span className="text-[10px] font-mono uppercase text-zinc-400">({item.problem})</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">{item.recommendation}</p>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold whitespace-nowrap ${item.verdict === 'PASSED_BARRIER_FILTER' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {item.verdict === 'PASSED_BARRIER_FILTER' ? 'PASSED' : 'REJECTED'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
