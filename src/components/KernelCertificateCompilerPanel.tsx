import React, { useState, useEffect } from 'react';
import {
  Binary,
  Layers,
  ShieldCheck,
  Zap,
  Play,
  RotateCcw,
  Sparkles,
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Cpu,
  Database,
  ArrowRight,
  Filter,
  Flame,
  FileCode,
  Terminal,
  Activity,
  Award,
  Hash,
  Copy,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';

interface CheckableInequality {
  lhs: string;
  relation: string;
  rhs: string;
  quantifier_scope: string;
  constants: Record<string, string>;
}

interface Certificate {
  id: string;
  problem: string;
  informal: string;
  lean_statement?: string;
  bit_width: number;
  status: string;
  remainder?: CheckableInequality;
  parent_id?: string;
  child_ids: string[];
  evidence: Array<Record<string, any>>;
  kernel_hash?: string;
  createdAt: number;
}

interface GlueTheorem {
  id: string;
  lean_statement: string;
  leaf_ids: string[];
  remainder: CheckableInequality;
  kernel_verified: boolean;
}

interface ProblemConfig {
  name: string;
  equivalent_forms: string[];
  leaf_families: string[];
  glue_family: string;
}

interface ConductorLogEntry {
  ts: number;
  problem: string;
  round: number;
  event: string;
  leaf?: string;
  details?: Record<string, any>;
}

export const KernelCertificateCompilerPanel: React.FC = () => {
  const [selectedProblem, setSelectedProblem] = useState<string>('riemann');
  const [registry, setRegistry] = useState<Record<string, ProblemConfig>>({});
  const [dagNodes, setDagNodes] = useState<Certificate[]>([]);
  const [glues, setGlues] = useState<GlueTheorem[]>([]);
  const [specLean, setSpecLean] = useState<string>('');
  const [isSorryFree, setIsSorryFree] = useState<boolean>(false);
  const [openLeavesCount, setOpenLeavesCount] = useState<number>(0);
  const [logs, setLogs] = useState<ConductorLogEntry[]>([]);
  const [sharedLibrary, setSharedLibrary] = useState<Certificate[]>([]);
  const [isRunningConductor, setIsRunningConductor] = useState<boolean>(false);
  const [selectedLeaf, setSelectedLeaf] = useState<Certificate | null>(null);

  // Split proposal state
  const [splitChild1Title, setSplitChild1Title] = useState<string>('Dyadic Interval Probe [2^k, 2^(k+1)]');
  const [splitChild1Lean, setSplitChild1Lean] = useState<string>('theorem dyadic_subprobe (k : ℕ) : Bounds k');
  const [splitChild1BitWidth, setSplitChild1BitWidth] = useState<number>(500);
  const [remainderLhs, setRemainderLhs] = useState<string>('|S_N(x) - zeta(s)|');
  const [remainderRhs, setRemainderRhs] = useState<string>('C * N^(-sigma)');
  const [remainderScope, setRemainderScope] = useState<string>('forall n >= 5040');
  const [remainderConstants, setRemainderConstants] = useState<string>('{"C": "1.414", "n0": "5040"}');
  const [splitResult, setSplitResult] = useState<{ isLegal: boolean; message: string } | null>(null);

  // Active view tab
  const [viewTab, setViewTab] = useState<'dag' | 'conductor' | 'legality_gate' | 'dual_search' | 'toolbox' | 'shared_lib'>('dag');

  // Initial fetch
  useEffect(() => {
    fetchRegistry();
    fetchDag(selectedProblem);
    fetchLogs();
    fetchSharedLibrary();
  }, [selectedProblem]);

  const fetchRegistry = async () => {
    try {
      const res = await axios.get('/api/compiler/registry');
      setRegistry(res.data?.registry || {});
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDag = async (prob: string) => {
    try {
      const res = await axios.get(`/api/compiler/dag/${prob}`);
      setDagNodes(res.data?.nodes || []);
      setGlues(res.data?.glues || []);
      setSpecLean(res.data?.spec_lean || '');
      setIsSorryFree(res.data?.isSorryFree || false);
      setOpenLeavesCount(res.data?.openLeavesCount || 0);
      if (res.data?.nodes?.length > 0 && !selectedLeaf) {
        setSelectedLeaf(res.data.nodes[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/compiler/logs');
      setLogs(res.data?.logs || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSharedLibrary = async () => {
    try {
      const res = await axios.get('/api/compiler/shared-library');
      setSharedLibrary(res.data?.theorems || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunConductor = async () => {
    setIsRunningConductor(true);
    try {
      await axios.post('/api/compiler/run-conductor', {
        problemId: selectedProblem,
        maxRounds: 5
      });
      await fetchDag(selectedProblem);
      await fetchLogs();
      await fetchSharedLibrary();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunningConductor(false);
    }
  };

  const handleDualSearch = async (leafId: string) => {
    try {
      const res = await axios.post('/api/compiler/dual-search', {
        problemId: selectedProblem,
        leafId
      });
      await fetchDag(selectedProblem);
      await fetchLogs();
      if (res.data?.leaf) setSelectedLeaf(res.data.leaf);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCloseLeaf = async (leafId: string) => {
    try {
      const res = await axios.post('/api/compiler/close-leaf', {
        problemId: selectedProblem,
        leafId,
        stepBudget: 4096
      });
      await fetchDag(selectedProblem);
      await fetchLogs();
      await fetchSharedLibrary();
      if (res.data?.leaf) setSelectedLeaf(res.data.leaf);
    } catch (e) {
      console.error(e);
    }
  };

  const handleProposeSplit = async () => {
    if (!selectedLeaf) return;
    try {
      let parsedConsts: Record<string, string> = {};
      try {
        parsedConsts = JSON.parse(remainderConstants);
      } catch {
        parsedConsts = {};
      }

      const res = await axios.post('/api/compiler/propose-split', {
        problemId: selectedProblem,
        parentLeafId: selectedLeaf.id,
        childProposals: [
          {
            informal: splitChild1Title,
            lean_statement: splitChild1Lean,
            bit_width: splitChild1BitWidth
          }
        ],
        remainder: {
          lhs: remainderLhs,
          relation: '<=',
          rhs: remainderRhs,
          quantifier_scope: remainderScope,
          constants: parsedConsts
        }
      });
      setSplitResult(res.data);
      await fetchDag(selectedProblem);
      await fetchLogs();
    } catch (err: any) {
      setSplitResult({
        isLegal: false,
        message: err.response?.data?.error || 'Split proposal failed legality verification.'
      });
    }
  };

  const currentConfig = registry[selectedProblem];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-5 text-zinc-100 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Binary size={22} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Kernel-Certificate Compiler & Conductor
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Deterministic Legality Gate & Dual-Search
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Treats each Millennium problem as a finite certificate DAG with uniform remainder bounds, dual-search trap refutation, and a deterministic closer toolbox.
            </p>
          </div>
        </div>

        {/* Conductor Run Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunConductor}
            disabled={isRunningConductor}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-900/30 disabled:opacity-50"
          >
            <Play size={14} className={isRunningConductor ? "animate-spin" : ""} />
            {isRunningConductor ? "Running Conductor Loop..." : "Run Conductor Compilation Loop"}
          </button>
        </div>
      </div>

      {/* Problem Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-800 text-xs">
        <span className="text-zinc-500 font-mono text-[11px] uppercase tracking-wider whitespace-nowrap">
          Active Registry:
        </span>
        {['riemann', 'bsd', 'navier_stokes', 'yang_mills', 'hodge', 'p_vs_np'].map((prob) => (
          <button
            key={prob}
            onClick={() => setSelectedProblem(prob)}
            className={`px-3 py-1.5 rounded-md font-mono text-xs whitespace-nowrap transition-colors ${
              selectedProblem === prob
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-zinc-800'
            }`}
          >
            {prob.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Problem Config Metadata Banner */}
      {currentConfig && (
        <div className="p-3.5 rounded-lg bg-black/60 border border-zinc-800/80 text-xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-bold font-mono uppercase">{currentConfig.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                Glue: {currentConfig.glue_family}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className={`px-2 py-0.5 rounded font-mono font-semibold ${isSorryFree ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-amber-950 text-amber-400 border border-amber-800"}`}>
                {isSorryFree ? "KERNEL GREEN: SORRY-FREE" : `${openLeavesCount} Open Leaves Awaiting Closer`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px]">
            <div>
              <span className="text-zinc-500 font-mono">Equivalent Forms (Bit-Width Ordered):</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {currentConfig.equivalent_forms.map((form, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-zinc-900 text-emerald-400 font-mono border border-zinc-800 text-[10px]">
                    {i === 0 ? "★ " : ""}{form}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-zinc-500 font-mono">Registered Leaf Families:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {currentConfig.leaf_families.map((fam, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-zinc-900 text-blue-300 font-mono border border-zinc-800 text-[10px]">
                    {fam}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Internal Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-800 pb-2 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setViewTab('dag')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            viewTab === 'dag' ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <GitBranch size={13} className="text-emerald-400" />
          Certificate DAG & Leaf Scaffolds ({dagNodes.length})
        </button>

        <button
          onClick={() => setViewTab('legality_gate')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            viewTab === 'legality_gate' ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ShieldCheck size={13} className="text-amber-400" />
          Legality Gate & Remainder Bound Checker
        </button>

        <button
          onClick={() => setViewTab('dual_search')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            viewTab === 'dual_search' ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/40' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Zap size={13} className="text-rose-400" />
          Dual-Search (ζ(1)=0 Trap Killer)
        </button>

        <button
          onClick={() => setViewTab('toolbox')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            viewTab === 'toolbox' ? 'bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/40' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Cpu size={13} className="text-blue-400" />
          Deterministic Closer (Cost Order)
        </button>

        <button
          onClick={() => setViewTab('shared_lib')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            viewTab === 'shared_lib' ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Award size={13} className="text-cyan-400" />
          Shared Library Ledger ({sharedLibrary.length})
        </button>

        <button
          onClick={() => setViewTab('conductor')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            viewTab === 'conductor' ? 'bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/40' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Terminal size={13} className="text-purple-400" />
          Conductor Logs ({logs.length})
        </button>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 1. DAG & LEAF VIEW */}
      {/* ---------------------------------------------------------------------- */}
      {viewTab === 'dag' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Leaves List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>DAG Certificate Nodes</span>
              <span className="text-[10px] text-zinc-500 font-mono">Ordered by Bit-Width</span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {dagNodes.map((leaf) => (
                <div
                  key={leaf.id}
                  onClick={() => setSelectedLeaf(leaf)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedLeaf?.id === leaf.id
                      ? 'bg-zinc-900 border-emerald-500/70 shadow-md'
                      : 'bg-black/50 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono font-bold text-zinc-200">{leaf.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        leaf.status === 'proven'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : leaf.status === 'refuted'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : leaf.status === 'illegal'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : leaf.status === 'needs_split'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {leaf.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 line-clamp-2">{leaf.informal}</p>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-800/60 text-[10px] text-zinc-500 font-mono">
                    <span>Bit-Width: {leaf.bit_width.toLocaleString()} bits</span>
                    {leaf.kernel_hash && (
                      <span className="text-emerald-400">SHA-256: {leaf.kernel_hash.slice(0, 8)}...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Glue Theorems */}
            {glues.length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="text-xs font-semibold text-zinc-300">Glue Theorems (Reassembly Gate)</div>
                {glues.map((g) => (
                  <div key={g.id} className="p-2.5 rounded bg-zinc-900/70 border border-zinc-800 text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="font-bold text-blue-300">{g.id}</span>
                      <span className={g.kernel_verified ? "text-emerald-400 font-bold" : "text-amber-400"}>
                        {g.kernel_verified ? "KERNEL VERIFIED" : "AWAITING LEAVES"}
                      </span>
                    </div>
                    <pre className="text-[10px] font-mono text-zinc-400 bg-black/60 p-1.5 rounded overflow-x-auto">
                      {g.lean_statement}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leaf Detail & Execution Actions (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            {selectedLeaf ? (
              <div className="p-4 rounded-xl bg-black/80 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="font-mono font-bold text-sm text-emerald-300">{selectedLeaf.id}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{selectedLeaf.informal}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDualSearch(selectedLeaf.id)}
                      className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-mono flex items-center gap-1"
                    >
                      <Zap size={12} />
                      Dual-Search
                    </button>
                    <button
                      onClick={() => handleCloseLeaf(selectedLeaf.id)}
                      className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-mono flex items-center gap-1"
                    >
                      <Cpu size={12} />
                      Deterministic Close
                    </button>
                  </div>
                </div>

                {/* Lean Statement */}
                <div>
                  <div className="text-[11px] font-semibold text-zinc-400 mb-1">Typed Lean 4 Scaffold:</div>
                  <pre className="p-2.5 rounded bg-zinc-950 border border-zinc-900 text-xs font-mono text-emerald-300 overflow-x-auto">
                    {selectedLeaf.lean_statement || "-- No Lean statement assigned"}
                  </pre>
                </div>

                {/* Remainder Bound */}
                {selectedLeaf.remainder && (
                  <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-2">
                    <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck size={14} />
                      Checkable Uniform Remainder Bound
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-zinc-500 text-[10px] block">Inequality</span>
                        <span className="text-zinc-200">{selectedLeaf.remainder.lhs} {selectedLeaf.remainder.relation} {selectedLeaf.remainder.rhs}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[10px] block">Scope</span>
                        <span className="text-zinc-200">{selectedLeaf.remainder.quantifier_scope}</span>
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400">
                      Explicit Constants: <span className="text-emerald-400">{JSON.stringify(selectedLeaf.remainder.constants)}</span>
                    </div>
                  </div>
                )}

                {/* Evidence Chain */}
                <div>
                  <div className="text-[11px] font-semibold text-zinc-400 mb-1">Compiler Verification Evidence:</div>
                  <div className="space-y-1.5">
                    {selectedLeaf.evidence.length === 0 ? (
                      <div className="text-xs text-zinc-500 italic">No compiler evidence recorded yet.</div>
                    ) : (
                      selectedLeaf.evidence.map((ev, i) => (
                        <div key={i} className="p-2 rounded bg-zinc-900 border border-zinc-800/80 text-xs font-mono flex items-center justify-between">
                          <span className="text-zinc-300">{ev.stage} ➔ {ev.result || ev.tool || JSON.stringify(ev)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                Select a certificate leaf from the left column to inspect its typed scaffold and remainder bounds.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 2. LEGALITY GATE & SPLIT PROPOSER */}
      {/* ---------------------------------------------------------------------- */}
      {viewTab === 'legality_gate' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/50 text-xs space-y-1 text-amber-200">
            <div className="font-bold flex items-center gap-1.5 text-amber-300">
              <ShieldCheck size={16} />
              The Legality Gate: split_is_legal() Enforced Rule
            </div>
            <p>
              A split is rejected unless every child carries strictly smaller bit-width AND ships a <strong>uniform remainder bound</strong> with <strong>explicit constants</strong> and a valid quantifier scope. Big-O, hidden constants, and "sufficiently large" are rejected at admission time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-black/80 border border-zinc-800 space-y-3">
              <div className="text-xs font-bold text-zinc-200">Propose Stochastic Split for Selected Leaf</div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Target Parent Leaf</label>
                <div className="font-mono text-xs text-emerald-400 bg-zinc-900 p-2 rounded border border-zinc-800">
                  {selectedLeaf?.id || "None selected"}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Proposed Child Certificate Statement</label>
                <input
                  type="text"
                  value={splitChild1Title}
                  onChange={(e) => setSplitChild1Title(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-zinc-200 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Lean 4 Child Scaffold</label>
                <input
                  type="text"
                  value={splitChild1Lean}
                  onChange={(e) => setSplitChild1Lean(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-emerald-300 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Child Bit-Width (Must be smaller than parent)</label>
                <input
                  type="number"
                  value={splitChild1BitWidth}
                  onChange={(e) => setSplitChild1BitWidth(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-zinc-200 font-mono"
                />
              </div>
            </div>

            {/* Remainder Bound Input */}
            <div className="p-4 rounded-xl bg-black/80 border border-zinc-800 space-y-3">
              <div className="text-xs font-bold text-zinc-200">Required Uniform Remainder Bound</div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">LHS Expression</label>
                  <input
                    type="text"
                    value={remainderLhs}
                    onChange={(e) => setRemainderLhs(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-zinc-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">RHS Bound</label>
                  <input
                    type="text"
                    value={remainderRhs}
                    onChange={(e) => setRemainderRhs(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-zinc-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Quantifier Scope ("forall n &gt;= n0")</label>
                <input
                  type="text"
                  value={remainderScope}
                  onChange={(e) => setRemainderScope(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-zinc-200 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Explicit Constants JSON (No Big-O Allowed)</label>
                <input
                  type="text"
                  value={remainderConstants}
                  onChange={(e) => setRemainderConstants(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-amber-300 font-mono"
                />
              </div>

              <button
                onClick={handleProposeSplit}
                className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-900/30"
              >
                <ShieldCheck size={15} />
                Submit Split to Legality Gate
              </button>

              {splitResult && (
                <div
                  className={`p-3 rounded-lg border text-xs font-mono ${
                    splitResult.isLegal
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                      : 'bg-rose-950/80 text-rose-300 border-rose-800'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    {splitResult.isLegal ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {splitResult.isLegal ? 'SPLIT ADMITTED' : 'SPLIT REJECTED (ILLEGAL)'}
                  </div>
                  <p className="text-[11px] font-sans">{splitResult.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 3. DUAL-SEARCH TRAP KILLER */}
      {/* ---------------------------------------------------------------------- */}
      {viewTab === 'dual_search' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/50 text-xs space-y-1 text-rose-200">
            <div className="font-bold flex items-center gap-1.5 text-rose-300">
              <Zap size={16} />
              The ζ(1)=0 Trap Killer: Translator.dual_search()
            </div>
            <p>
              Every lemma candidate gets attempted alongside its negation under a small budget (64 steps) before real compute is spent. Negation proves ➔ mistranslation killed instantly. Both proving ➔ halts run on kernel inconsistency.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-black/80 border border-zinc-800 space-y-3">
              <div className="text-xs font-bold text-zinc-200">Test Dual-Search on Any Lemma</div>

              {selectedLeaf && (
                <div className="space-y-2">
                  <div className="text-xs font-mono text-zinc-300 bg-zinc-900 p-2.5 rounded border border-zinc-800">
                    <span className="text-zinc-500">Statement P: </span>
                    {selectedLeaf.lean_statement || selectedLeaf.informal}
                  </div>

                  <div className="text-xs font-mono text-rose-300 bg-zinc-900 p-2.5 rounded border border-zinc-800">
                    <span className="text-zinc-500">Negation ¬P: </span>
                    Not ({selectedLeaf.lean_statement || selectedLeaf.informal})
                  </div>

                  <button
                    onClick={() => handleDualSearch(selectedLeaf.id)}
                    className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-rose-900/30"
                  >
                    <Zap size={14} />
                    Run Dual-Search (64 Steps Budget)
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-black/80 border border-zinc-800 space-y-3">
              <div className="text-xs font-bold text-zinc-200">Dual-Search Outcomes & Proof State</div>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-400">If Statement (P) Proves:</span>
                  <span className="text-emerald-400 font-bold">TRANSLATED / PROVEN</span>
                </div>
                <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-400">If Negation (¬P) Proves:</span>
                  <span className="text-rose-400 font-bold">REFUTED (Trap Killed)</span>
                </div>
                <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-400">If Both Prove:</span>
                  <span className="text-red-500 font-bold">HALT (Kernel Inconsistency)</span>
                </div>
                <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-400">If Neither Proves:</span>
                  <span className="text-blue-400 font-bold">FORWARD TO CLOSER</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 4. DETERMINISTIC CLOSER TOOLBOX */}
      {/* ---------------------------------------------------------------------- */}
      {viewTab === 'toolbox' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-800/50 text-xs space-y-1 text-blue-200">
            <div className="font-bold flex items-center gap-1.5 text-blue-300">
              <Cpu size={16} />
              Deterministic Toolbox (Strict Cost Order)
            </div>
            <p>
              Tools are attempted in strictly ascending cost order: Aesop/Grind (~5ms) ➔ SAT/SMT Farkas (~20ms) ➔ Gröbner Bases (~45ms) ➔ Certified Interval Numerics (~90ms).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-black/60 border border-zinc-800 space-y-1.5">
              <div className="text-[10px] text-zinc-500 font-mono">Level 1 (Cheapest)</div>
              <div className="font-bold text-xs text-blue-300">Aesop / Grind</div>
              <p className="text-[11px] text-zinc-400">Syntactic rewrite normalization & congruence closure.</p>
              <div className="text-[10px] text-zinc-500 font-mono pt-1">Budget: ~120 steps</div>
            </div>

            <div className="p-3.5 rounded-lg bg-black/60 border border-zinc-800 space-y-1.5">
              <div className="text-[10px] text-zinc-500 font-mono">Level 2</div>
              <div className="font-bold text-xs text-purple-300">Z3 / CVC5 SMT Farkas</div>
              <p className="text-[11px] text-zinc-400">Linear real arithmetic & bit-vector refutation.</p>
              <div className="text-[10px] text-zinc-500 font-mono pt-1">Budget: ~512 steps</div>
            </div>

            <div className="p-3.5 rounded-lg bg-black/60 border border-zinc-800 space-y-1.5">
              <div className="text-[10px] text-zinc-500 font-mono">Level 3</div>
              <div className="font-bold text-xs text-amber-300">Gröbner / Buchberger</div>
              <p className="text-[11px] text-zinc-400">Nonlinear polynomial ideal membership & Nullstellensatz.</p>
              <div className="text-[10px] text-zinc-500 font-mono pt-1">Budget: ~1024 steps</div>
            </div>

            <div className="p-3.5 rounded-lg bg-black/60 border border-zinc-800 space-y-1.5">
              <div className="text-[10px] text-zinc-500 font-mono">Level 4 (Most Expensive)</div>
              <div className="font-bold text-xs text-emerald-300">Certified Interval Numerics</div>
              <p className="text-[11px] text-zinc-400">Taylor models & rigorous interval enclosures.</p>
              <div className="text-[10px] text-zinc-500 font-mono pt-1">Budget: ~4096 steps</div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 5. SHARED LIBRARY PROMOTION LEDGER */}
      {/* ---------------------------------------------------------------------- */}
      {viewTab === 'shared_lib' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/50 text-xs space-y-1 text-cyan-200">
            <div className="font-bold flex items-center gap-1.5 text-cyan-300">
              <Award size={16} />
              Shared Library Promotion: promote_to_shared_library()
            </div>
            <p>
              Only kernel-green artifacts with SHA-256 content hashes enter the shared library. Cross-problem reuse (like Prime Number Theorem compounding) can never import an unverified or contaminated lemma.
            </p>
          </div>

          <div className="space-y-2">
            {sharedLibrary.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg text-xs font-mono">
                No lemmas promoted to shared library yet. Run the Conductor to close open leaves.
              </div>
            ) : (
              sharedLibrary.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-black/60 border border-zinc-800 flex items-center justify-between text-xs font-mono">
                  <div className="space-y-1">
                    <div className="font-bold text-cyan-300 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      {item.id}
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                        {item.problem}
                      </span>
                    </div>
                    <div className="text-zinc-400 text-[11px] font-sans">{item.informal}</div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 block">SHA-256 Kernel Hash:</span>
                    <span className="text-emerald-400 font-mono text-[11px]">{item.kernel_hash?.slice(0, 16)}...</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 6. CONDUCTOR LOGS */}
      {/* ---------------------------------------------------------------------- */}
      {viewTab === 'conductor' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
            <span>conductor_log.jsonl Live Stream</span>
            <span className="text-[10px] text-zinc-500 font-mono">{logs.length} transitions</span>
          </div>

          <div className="p-3 rounded-xl bg-black border border-zinc-800 font-mono text-[11px] space-y-1.5 max-h-[400px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-zinc-600 italic">No conductor log entries yet.</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2 border-b border-zinc-900/80 pb-1">
                  <span className="text-zinc-600 text-[10px] whitespace-nowrap">
                    {new Date(log.ts).toLocaleTimeString()}
                  </span>
                  <span className="text-purple-400 font-bold uppercase text-[10px]">[{log.problem}]</span>
                  <span className="text-emerald-400 font-bold">{log.event}</span>
                  {log.leaf && <span className="text-zinc-400">leaf:{log.leaf}</span>}
                  {log.details && (
                    <span className="text-zinc-500 text-[10px] truncate max-w-xs">
                      {JSON.stringify(log.details)}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
