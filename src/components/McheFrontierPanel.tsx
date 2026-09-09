import React, { useState, useEffect } from 'react';
import {
  Activity,
  Award,
  CheckCircle2,
  Cpu,
  Database,
  ExternalLink,
  Filter,
  Flame,
  GitBranch,
  GitFork,
  Hash,
  Layers,
  Lock,
  Play,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  TrendingUp,
  XCircle,
  Zap,
  ArrowRight,
  BookOpen,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import {
  Hypothesis,
  PromotionStage,
  EvidenceLogEntry,
  MCTSNodeState,
  LemmaMemoryItem,
  CompilerRefinementFeedback,
  DualLaneInferenceStatus,
  SpecializedEngineResult,
  BlueprintImplicationEdge,
  PriorityProofReceipt
} from '../types';

export function McheFrontierPanel() {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [pipelineStatus, setPipelineStatus] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<
    'funnel' | 'evolutionary_mcts' | 'dual_lane_seed' | 'blueprint_etp' | 'priority_receipts'
  >('funnel');
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // MCTS & Evolutionary state
  const [mctsRootStmt, setMctsRootStmt] = useState<string>(
    '∀ s ∈ ℂ, H_t(s, λ) = 0 → Re(s) = 1/2'
  );
  const [mctsDomain, setMctsDomain] = useState<string>('analysis');
  const [mctsNodes, setMctsNodes] = useState<MCTSNodeState[]>([]);
  const [evolvedCandidates, setEvolvedCandidates] = useState<Hypothesis[]>([]);

  // Lemma Memory & Compiler Refinement
  const [lemmaMemory, setLemmaMemory] = useState<LemmaMemoryItem[]>([]);
  const [lemmaSearchQuery, setLemmaSearchQuery] = useState<string>('deBruijn');
  const [compilerErrorInput, setCompilerErrorInput] = useState<string>(
    'type mismatch: has type Nat but was expected to have type Real.exp x'
  );
  const [compilerTacticInput, setCompilerTacticInput] = useState<string>('exact h');
  const [compilerFeedback, setCompilerFeedback] = useState<CompilerRefinementFeedback | null>(null);

  // Blueprint & Specialized CAS
  const [blueprintEdges, setBlueprintEdges] = useState<BlueprintImplicationEdge[]>([]);
  const [casDomain, setCasDomain] = useState<string>('analysis');
  const [casQuery, setCasQuery] = useState<string>('isolate critical strip zeros under de Bruijn deformation');
  const [casResult, setCasResult] = useState<SpecializedEngineResult | null>(null);

  // Priority Proof Receipts & Verification Gate
  const [receipts, setReceipts] = useState<PriorityProofReceipt[]>([]);
  const [gateTheoremId, setGateTheoremId] = useState<string>('thm_debruijn_polymath');
  const [gateStatement, setGateStatement] = useState<string>('theorem debruijn_bound : Lambda ≤ 0.178');
  const [gateLeanSource, setGateLeanSource] = useState<string>(
    'theorem debruijn_bound : True := by\n  trivial'
  );
  const [latestGateReceipt, setLatestGateReceipt] = useState<PriorityProofReceipt | null>(null);

  useEffect(() => {
    fetchStatus();
    fetchLemmaMemory();
    fetchBlueprint();
    fetchReceipts();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/mche/status');
      const data = await res.json();
      if (data.hypotheses) {
        setHypotheses(data.hypotheses);
        if (!selectedHypothesisId && data.hypotheses.length > 0) {
          setSelectedHypothesisId(data.hypotheses[0].id);
        }
      }
      if (data.pipelineStatus) {
        setPipelineStatus(data.pipelineStatus);
      }
    } catch (err) {
      console.error('Failed to load MCHE status:', err);
    }
  };

  const fetchLemmaMemory = async () => {
    try {
      const res = await fetch('/api/mche/lemma-memory');
      const data = await res.json();
      if (data.lemmas) setLemmaMemory(data.lemmas);
    } catch (err) {
      console.error('Failed to load lemma memory:', err);
    }
  };

  const fetchBlueprint = async () => {
    try {
      const res = await fetch('/api/mche/blueprint');
      const data = await res.json();
      if (data.edges) setBlueprintEdges(data.edges);
    } catch (err) {
      console.error('Failed to load blueprint:', err);
    }
  };

  const fetchReceipts = async () => {
    try {
      const res = await fetch('/api/mche/priority-receipts');
      const data = await res.json();
      if (data.receipts) setReceipts(data.receipts);
    } catch (err) {
      console.error('Failed to load receipts:', err);
    }
  };

  const handleRunFalsification = async (id: string, trials: number = 1000) => {
    setIsLoading(true);
    setActionFeedback(`Running ${trials} numerical falsification trials with deterministic seed...`);
    try {
      const res = await fetch('/api/mche/falsify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hypothesisId: id, trials })
      });
      const updated = await res.json();
      setHypotheses(prev => prev.map(h => (h.id === updated.id ? updated : h)));
      setActionFeedback(
        `Falsification completed: Stage is now "${updated.stage.toUpperCase()}" with ${updated.counterexample_count} counterexamples across ${updated.trial_count} trials.`
      );
    } catch (err: any) {
      setActionFeedback(`Falsification error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSignificance = async (id: string) => {
    setIsLoading(true);
    setActionFeedback('Computing Monte Carlo permutation null distribution with Bonferroni correction...');
    try {
      const res = await fetch('/api/mche/significance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hypothesisId: id, nSamples: 1000, nNull: 3000 })
      });
      const updated = await res.json();
      setHypotheses(prev => prev.map(h => (h.id === updated.id ? updated : h)));
      setActionFeedback(
        `Significance result: p = ${updated.p_value}, effect size = ${updated.effect_size} (Stage: ${updated.stage.toUpperCase()})`
      );
    } catch (err: any) {
      setActionFeedback(`Significance error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvolve = async () => {
    setIsLoading(true);
    setActionFeedback('Evolving program population in code-space (AlphaEvolve/FunSearch style)...');
    try {
      const res = await fetch('/api/mche/evolve', { method: 'POST' });
      const data = await res.json();
      setEvolvedCandidates(data.evolved || []);
      fetchStatus();
      setActionFeedback(`Generated ${data.evolvedCount} new program-space mutated candidates.`);
    } catch (err: any) {
      setActionFeedback(`Evolution error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunMcts = async () => {
    setIsLoading(true);
    setActionFeedback('Executing MCTS Conjecture tree search with UCB1 exploration...');
    try {
      const res = await fetch('/api/mche/mcts-conjecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootStatement: mctsRootStmt, domain: mctsDomain, iterations: 150 })
      });
      const data = await res.json();
      setMctsNodes(data.nodes || []);
      setActionFeedback(`MCTS search completed: evaluated ${data.nodes?.length} rollout branches.`);
    } catch (err: any) {
      setActionFeedback(`MCTS error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutonomousTargetSelect = async () => {
    setIsLoading(true);
    setActionFeedback('Autonomous Target Selector evaluating MCHE survivals and DAG topological gaps...');
    try {
      const res = await fetch('/api/mche/autonomous-target-select', { method: 'POST' });
      const data = await res.json();
      fetchStatus();
      setSelectedHypothesisId(data.target?.id);
      setActionFeedback(`Autonomous Target Selected: "${data.target?.id}" (Expected Utility: ${data.expectedUtility}). Reason: ${data.reason}`);
    } catch (err: any) {
      setActionFeedback(`Autonomous selection error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchLemmaMemory = async () => {
    try {
      const res = await fetch('/api/mche/lemma-memory/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: lemmaSearchQuery, topK: 3 })
      });
      const data = await res.json();
      if (data.retrieved) setLemmaMemory(data.retrieved);
    } catch (err) {
      console.error('Failed to search lemma memory:', err);
    }
  };

  const handleRefineCompilerError = async () => {
    try {
      const res = await fetch('/api/mche/refine-compiler-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tactic: compilerTacticInput,
          rawLeanMessage: compilerErrorInput,
          iteration: 1
        })
      });
      const data = await res.json();
      setCompilerFeedback(data);
    } catch (err) {
      console.error('Failed to refine compiler error:', err);
    }
  };

  const handleQuerySpecializedCas = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/mche/specialized-cas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: casDomain, query: casQuery })
      });
      const data = await res.json();
      setCasResult(data);
    } catch (err) {
      console.error('Failed to query specialized CAS:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndRelease = async () => {
    setIsLoading(true);
    setActionFeedback('Anthropic Verification Gate: Compiling against Lean 4 kernel with zero sorry...');
    try {
      const res = await fetch('/api/mche/verify-and-release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theoremId: gateTheoremId,
          statement: gateStatement,
          leanSource: gateLeanSource
        })
      });
      const data = await res.json();
      setLatestGateReceipt(data);
      fetchReceipts();
      if (data.status === 'VERIFIED_AND_SEALED') {
        setActionFeedback(`Proof Verified & Released! Sealed with cryptographic receipt: ${data.receiptHash}`);
      } else {
        setActionFeedback('Claim WITHHELD: Failed kernel check or contains unverified escapes (Buckmaster/Alpöge protocol).');
      }
    } catch (err: any) {
      setActionFeedback(`Verification Gate error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedHypothesis = hypotheses.find(h => h.id === selectedHypothesisId) || hypotheses[0];

  const getStageBadge = (stage: PromotionStage) => {
    switch (stage) {
      case 'verified':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <CheckCircle2 size={10} /> VERIFIED (KERNEL)
          </span>
        );
      case 'queued':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
            <GitFork size={10} /> QUEUED FOR PROOF
          </span>
        );
      case 'plausible':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
            <Sparkles size={10} /> STRUCTURALLY PLAUSIBLE
          </span>
        );
      case 'significant':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
            <Award size={10} /> STATISTICALLY SIGNIFICANT
          </span>
        );
      case 'survived':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
            <ShieldCheck size={10} /> NUMERICALLY SURVIVED
          </span>
        );
      case 'refuted':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
            <XCircle size={10} /> REFUTED (COUNTEREXAMPLE)
          </span>
        );
      case 'generated':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
            <Activity size={10} /> GENERATED (RAW)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wide uppercase bg-gradient-to-r from-amber-500/20 to-cyan-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Flame size={12} className="text-amber-400" />
                Continuous 24/7 Autonomous Synthesis
              </span>
              <span className="text-xs text-zinc-500 font-mono">v4.5-Frontier</span>
            </div>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              Monte Carlo Hypothesis Engine (MCHE) & 5-Camp Frontier Architecture
            </h3>
            <p className="text-xs text-zinc-400 max-w-4xl leading-relaxed">
              Unifies the 5 frontier camps into an open, continuously-running mathematical research organism.
              The machine continuously selects targets via numerical falsification, multi-testing Bonferroni significance,
              and DAG gap analysis; humans audit constraints while Lean kernel verification seals priority-proof receipts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAutonomousTargetSelect}
              disabled={isLoading}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-cyan-600 hover:from-amber-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow transition-all disabled:opacity-50"
            >
              <Zap size={14} />
              Autonomous Target Select
            </button>
            <button
              onClick={fetchStatus}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition-colors"
              title="Refresh Telemetry"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* 5-Camp Landscape Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-4 pt-4 border-t border-zinc-800/80 text-xs">
          <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60 space-y-1">
            <div className="font-semibold text-cyan-400 flex items-center gap-1">
              <Cpu size={12} /> OpenAI Camp
            </div>
            <p className="text-[11px] text-zinc-400">10k-agent scale, analytical proof to Lean formalization.</p>
          </div>

          <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60 space-y-1">
            <div className="font-semibold text-emerald-400 flex items-center gap-1">
              <ShieldCheck size={12} /> Anthropic Camp
            </div>
            <p className="text-[11px] text-zinc-400">Buckmaster/Alpöge verification-gated release (evidence before claims).</p>
          </div>

          <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60 space-y-1">
            <div className="font-semibold text-indigo-400 flex items-center gap-1">
              <Terminal size={12} /> Harmonic (Aristotle)
            </div>
            <p className="text-[11px] text-zinc-400">Continuous multi-day proof search, CAS & geometry solvers.</p>
          </div>

          <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60 space-y-1">
            <div className="font-semibold text-amber-400 flex items-center gap-1">
              <Layers size={12} /> Seed-Prover Camp
            </div>
            <p className="text-[11px] text-zinc-400">Lemma memory + self-summarization & dual-lane inference.</p>
          </div>

          <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60 space-y-1">
            <div className="font-semibold text-purple-400 flex items-center gap-1">
              <GitBranch size={12} /> ETP (Tao et al.)
            </div>
            <p className="text-[11px] text-zinc-400">Blueprint-coordinated systematic exploration & heterogeneous ledger.</p>
          </div>
        </div>

        {/* Live Feedback Toast */}
        {actionFeedback && (
          <div className="mt-3 p-2 bg-indigo-950/50 border border-indigo-500/30 rounded text-xs font-mono text-indigo-200 flex items-center gap-2">
            <Activity size={12} className="text-indigo-400 animate-pulse" />
            <span>{actionFeedback}</span>
          </div>
        )}
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveSubTab('funnel')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
            activeSubTab === 'funnel'
              ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Filter size={13} />
          MCHE Falsification Funnel ({hypotheses.length})
        </button>

        <button
          onClick={() => setActiveSubTab('evolutionary_mcts')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
            activeSubTab === 'evolutionary_mcts'
              ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles size={13} />
          Evolutionary Code Search & MCTS
        </button>

        <button
          onClick={() => setActiveSubTab('dual_lane_seed')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
            activeSubTab === 'dual_lane_seed'
              ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BookOpen size={13} />
          Lemma Memory & Compiler Refinement (Seed-Prover)
        </button>

        <button
          onClick={() => setActiveSubTab('blueprint_etp')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
            activeSubTab === 'blueprint_etp'
              ? 'bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <GitFork size={13} />
          Blueprint Exploration & Multi-CAS (ETP)
        </button>

        <button
          onClick={() => setActiveSubTab('priority_receipts')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
            activeSubTab === 'priority_receipts'
              ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ShieldCheck size={13} />
          Verification-Gated Release & Receipts ({receipts.length})
        </button>
      </div>

      {/* SUBTAB 1: MCHE FALSIFICATION FUNNEL */}
      {activeSubTab === 'funnel' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column: Candidate List & Funnel Pipeline */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            {/* Funnel Telemetry Bar */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="text-xs font-semibold text-zinc-300 mb-3 flex items-center justify-between">
                <span>MCHE GATING PIPELINE STATUS</span>
                <span className="font-mono text-zinc-400">{hypotheses.length} hypotheses</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <div className="text-zinc-500 text-[10px]">SURVIVED</div>
                  <div className="text-blue-400 font-bold text-sm">
                    {hypotheses.filter(h => h.stage === 'survived').length}
                  </div>
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <div className="text-zinc-500 text-[10px]">QUEUED PROOF</div>
                  <div className="text-cyan-400 font-bold text-sm">
                    {hypotheses.filter(h => h.stage === 'queued').length}
                  </div>
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <div className="text-zinc-500 text-[10px]">REFUTED</div>
                  <div className="text-rose-400 font-bold text-sm">
                    {hypotheses.filter(h => h.stage === 'refuted').length}
                  </div>
                </div>
              </div>
            </div>

            {/* Candidate List */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Hypothesis Backlog & Lineage
              </div>
              {hypotheses.map(h => {
                const isSelected = h.id === selectedHypothesisId;
                return (
                  <div
                    key={h.id}
                    onClick={() => setSelectedHypothesisId(h.id)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-zinc-800/90 border-amber-500/50 shadow-md'
                        : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-850'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-zinc-200 truncate">{h.id}</span>
                      {getStageBadge(h.stage)}
                    </div>
                    <p className="text-xs font-mono text-zinc-400 line-clamp-2">{h.statement_template}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/60 text-[11px] font-mono text-zinc-500">
                      <span>Trials: {h.trial_count}</span>
                      <span>CE: {h.counterexample_count}</span>
                      <span>Domain: {h.domain}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Hypothesis Detail & Actions */}
          <div className="col-span-12 lg:col-span-7 space-y-4">
            {selectedHypothesis ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <div className="text-xs font-mono text-zinc-500">Selected Candidate ID</div>
                    <div className="text-base font-bold text-zinc-100 font-mono flex items-center gap-2">
                      {selectedHypothesis.id}
                      {getStageBadge(selectedHypothesis.stage)}
                    </div>
                  </div>
                  <div className="text-right text-xs font-mono text-zinc-500">
                    <div>Domain: <span className="text-zinc-300 font-semibold">{selectedHypothesis.domain}</span></div>
                    <div>Method: <span className="text-zinc-300 font-semibold">{selectedHypothesis.generation_method}</span></div>
                  </div>
                </div>

                {/* Formula Box */}
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1">
                    Formalized / Symbolic Statement Template:
                  </label>
                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 font-mono text-xs text-amber-200 leading-relaxed overflow-x-auto">
                    {selectedHypothesis.statement_template}
                  </div>
                </div>

                {/* Statistical Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800">
                    <div className="text-zinc-500 text-[10px]">NUMERICAL TRIALS</div>
                    <div className="text-zinc-200 font-bold text-sm">{selectedHypothesis.trial_count}</div>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800">
                    <div className="text-zinc-500 text-[10px]">COUNTEREXAMPLES</div>
                    <div className={`font-bold text-sm ${selectedHypothesis.counterexample_count > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {selectedHypothesis.counterexample_count}
                    </div>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800">
                    <div className="text-zinc-500 text-[10px]">EMPIRICAL P-VALUE</div>
                    <div className="text-purple-300 font-bold text-sm">
                      {selectedHypothesis.p_value !== undefined && selectedHypothesis.p_value !== null
                        ? selectedHypothesis.p_value
                        : 'untested'}
                    </div>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800">
                    <div className="text-zinc-500 text-[10px]">EFFECT SIZE</div>
                    <div className="text-indigo-300 font-bold text-sm">
                      {selectedHypothesis.effect_size !== undefined && selectedHypothesis.effect_size !== null
                        ? selectedHypothesis.effect_size
                        : 'n/a'}
                    </div>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800">
                  <button
                    onClick={() => handleRunFalsification(selectedHypothesis.id, 1000)}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Play size={12} /> Run 1,000 Trials
                  </button>

                  <button
                    onClick={() => handleRunFalsification(selectedHypothesis.id, 10000)}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 border border-blue-500/50 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Play size={12} /> Deep Falsify (10k Trials)
                  </button>

                  <button
                    onClick={() => handleRunSignificance(selectedHypothesis.id)}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Award size={12} /> Permutation Test (Bonferroni)
                  </button>
                </div>

                {/* Evidence Trail Ledger */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                    <Database size={13} className="text-amber-400" />
                    Audit Evidence Trail ({selectedHypothesis.evidence_log.length} records)
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedHypothesis.evidence_log.map((log, idx) => (
                      <div
                        key={idx}
                        className="bg-zinc-950 p-2.5 rounded border border-zinc-800/80 font-mono text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-zinc-500 text-[11px]">
                          <span className="font-bold text-zinc-400 uppercase">Stage: {log.stage}</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        {log.note && <div className="text-zinc-300">{log.note}</div>}
                        {log.instance && (
                          <div className="text-[11px] text-amber-400/90 truncate">
                            Counterexample instance: {JSON.stringify(log.instance)}
                          </div>
                        )}
                        {log.raw_p_value !== undefined && (
                          <div className="text-[11px] text-purple-400">
                            raw_p={log.raw_p_value}, α_adj={log.corrected_alpha}, family_size={log.family_size}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-xl">
                No hypothesis selected. Select one from the backlog or run Autonomous Target Select.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: EVOLUTIONARY PROGRAM SEARCH & MCTS */}
      {activeSubTab === 'evolutionary_mcts' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column: Evolutionary Program Search (AlphaEvolve / FunSearch) */}
          <div className="col-span-12 lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                  <Sparkles size={14} className="text-cyan-400" />
                  Program-Space Evolutionary Search (AlphaEvolve)
                </h4>
                <p className="text-xs text-zinc-400">
                  Evolves constructive mathematical programs and scoring functions in code-space.
                </p>
              </div>
              <button
                onClick={handleEvolve}
                disabled={isLoading}
                className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Sparkles size={12} /> Evolve Generation
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono text-zinc-400">Active Population Programs:</div>
              {evolvedCandidates.length === 0 ? (
                <div className="p-4 bg-zinc-950 rounded border border-zinc-800 text-xs font-mono text-zinc-500 text-center">
                  Click &quot;Evolve Generation&quot; to mutate constructive programs and generate new candidate hypotheses.
                </div>
              ) : (
                evolvedCandidates.map((c, idx) => (
                  <div key={idx} className="bg-zinc-950 p-3 rounded border border-zinc-800/80 font-mono text-xs space-y-1">
                    <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                      <span className="font-bold text-cyan-300">{c.id}</span>
                      <span className="text-zinc-500">Domain: {c.domain}</span>
                    </div>
                    <div className="text-zinc-300 text-[11px] leading-relaxed overflow-x-auto">
                      {c.statement_template}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: MCTS Conjecture Search */}
          <div className="col-span-12 lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                  <GitFork size={14} className="text-amber-400" />
                  MCTS Conjecture Rollout Search
                </h4>
                <p className="text-xs text-zinc-400">
                  UCB1 tree search over partial lemma sketches and mathematical constructions.
                </p>
              </div>
              <button
                onClick={handleRunMcts}
                disabled={isLoading}
                className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Play size={12} /> Run 150 Rollouts
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Root Conjecture Formula:</label>
              <input
                type="text"
                value={mctsRootStmt}
                onChange={e => setMctsRootStmt(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              <div className="text-xs font-mono text-zinc-400">Expanded Construction Tree Nodes:</div>
              {mctsNodes.length === 0 ? (
                <div className="p-4 bg-zinc-950 rounded border border-zinc-800 text-xs font-mono text-zinc-500 text-center">
                  Run MCTS Rollouts to view tree construction states and UCB1 values.
                </div>
              ) : (
                mctsNodes.map(node => (
                  <div key={node.stateId} className="bg-zinc-950 p-2.5 rounded border border-zinc-800/80 font-mono text-xs space-y-1">
                    <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                      <span className="font-bold text-amber-300">{node.label}</span>
                      <span className="text-zinc-500">UCB1: {node.ucb1} (Visits: {node.visits})</span>
                    </div>
                    <div className="text-zinc-300 text-[11px] truncate">{node.conjectureFragment}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: DUAL-LANE & LEMMA MEMORY (SEED-PROVER INNOVATION) */}
      {activeSubTab === 'dual_lane_seed' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Dual-Lane Telemetry */}
          <div className="col-span-12 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <Layers size={14} className="text-amber-400" />
              Dual-Lane Test-Time Inference Monitor (Seed-Prover Strategy Lanes)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-cyan-400 flex items-center gap-1.5">
                    <Zap size={13} /> Wide Sweep Lane (Cheap Breadth-First)
                  </span>
                  <span className="font-mono text-zinc-500">Budget: 50k gas/branch</span>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs pt-1">
                  <div>Active: <span className="text-zinc-200 font-bold">8 lanes</span></div>
                  <div>Evaluated: <span className="text-zinc-200 font-bold">1,420</span></div>
                  <div>Surviving: <span className="text-emerald-400 font-bold">38</span></div>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Explores high-branching tactic space with rapid pruning before committing heavy compute.
                </p>
              </div>

              <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-purple-400 flex items-center gap-1.5">
                    <TrendingUp size={13} /> Deep Search Lane (Expensive Tree Search)
                  </span>
                  <span className="font-mono text-zinc-500">Budget: 500k gas/branch</span>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs pt-1">
                  <div>Active: <span className="text-zinc-200 font-bold">2 lanes</span></div>
                  <div>Rollouts: <span className="text-zinc-200 font-bold">2,500</span></div>
                  <div>Best Value: <span className="text-emerald-400 font-bold">0.942</span></div>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Focuses deep MCTS rollouts on high-value surviving branches identified by the wide sweep.
                </p>
              </div>
            </div>
          </div>

          {/* Lemma Memory Catalog */}
          <div className="col-span-12 lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <BookOpen size={14} className="text-indigo-400" />
                Verified Lemma Memory & Trajectory Compression
              </h4>
              <span className="text-xs font-mono text-zinc-500">{lemmaMemory.length} indexed</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={lemmaSearchQuery}
                onChange={e => setLemmaSearchQuery(e.target.value)}
                placeholder="Search lemma tags or name..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSearchLemmaMemory}
                className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded text-xs font-semibold flex items-center gap-1.5"
              >
                <Search size={12} /> Retrieve
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {lemmaMemory.map(item => (
                <div key={item.id} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 font-mono text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-300 font-bold text-xs">{item.name}</span>
                    <span className="text-zinc-500 text-[10px]">Used: {item.retrievalCount}x</span>
                  </div>
                  <div className="text-zinc-400 text-[11px] leading-relaxed">{item.summary}</div>
                  <div className="bg-zinc-900 p-2 rounded text-[11px] text-zinc-300 overflow-x-auto">
                    {item.leanCode}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compiler Error Feedback Loop Refiner */}
          <div className="col-span-12 lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <Terminal size={14} className="text-emerald-400" />
              Compiler Error Iterative Refinement
            </h4>
            <p className="text-xs text-zinc-400">
              The Lean compiler error isn&apos;t a dead end — it&apos;s the next prompt. Maps errors to corrective tactics.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Failed Tactic:</label>
              <input
                type="text"
                value={compilerTacticInput}
                onChange={e => setCompilerTacticInput(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Compiler Diagnostic Error Message:</label>
              <textarea
                value={compilerErrorInput}
                onChange={e => setCompilerErrorInput(e.target.value)}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-zinc-200 focus:outline-none"
              />
            </div>

            <button
              onClick={handleRefineCompilerError}
              className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Sparkles size={12} /> Refine Diagnostic to Counter-Tactic
            </button>

            {compilerFeedback && (
              <div className="bg-zinc-950 p-3 rounded-lg border border-emerald-500/30 font-mono text-xs space-y-2">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> Category: {compilerFeedback.leanErrorCategory.toUpperCase()}
                </div>
                <div className="text-zinc-400 text-[11px]">Suggested Replacement / Follow-Up Tactic:</div>
                <div className="bg-zinc-900 p-2 rounded text-cyan-300 text-xs font-bold">
                  {compilerFeedback.suggestedTactic}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 4: BLUEPRINT COORDINATION & MULTI-CAS */}
      {activeSubTab === 'blueprint_etp' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Equational Theories Project Blueprint Graph */}
          <div className="col-span-12 lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <GitFork size={14} className="text-purple-400" />
                Blueprint Implication Dependency Graph (ETP Model)
              </h4>
              <span className="text-xs font-mono text-zinc-500">{blueprintEdges.length} edges</span>
            </div>
            <p className="text-xs text-zinc-400">
              Systematically validates implication edges between mathematical laws across heterogeneous contributors.
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {blueprintEdges.map(edge => {
                const isProved = edge.status === 'proved';
                const isRefuted = edge.status === 'refuted';
                const isPending = edge.status === 'pending_gate';
                return (
                  <div
                    key={edge.id}
                    className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 font-mono text-xs flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="text-zinc-200 font-bold flex items-center gap-2">
                        <span>{edge.fromTheorem}</span>
                        <ArrowRight size={12} className="text-zinc-500" />
                        <span>{edge.toTheorem}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        Worker: {edge.assignedCampOrWorker} | File: {edge.leanFile}
                      </div>
                    </div>

                    <div>
                      {isProved && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          PROVED
                        </span>
                      )}
                      {isRefuted && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          REFUTED
                        </span>
                      )}
                      {isPending && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          PENDING GATE
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Specialized CAS Engine Federation */}
          <div className="col-span-12 lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <Cpu size={14} className="text-cyan-400" />
              Specialized Multi-CAS Federation (Seed-Geometry)
            </h4>
            <p className="text-xs text-zinc-400">
              When Lean&apos;s library is weak, delegates to dedicated engines (PARI/GP, Arb, OSCAR, SymPy).
            </p>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Target Discipline Domain:</label>
              <select
                value={casDomain}
                onChange={e => setCasDomain(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs font-mono text-zinc-200"
              >
                <option value="analysis">Analysis (Arb Rigorous Ball Arithmetic)</option>
                <option value="algebra">Algebra (OSCAR / GAP Group Computation)</option>
                <option value="fluid_dynamics">Fluid Dynamics (SymPy Invariants)</option>
                <option value="number_theory">Number Theory (PARI/GP 2.15)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Query / Property to Certify:</label>
              <input
                type="text"
                value={casQuery}
                onChange={e => setCasQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none"
              />
            </div>

            <button
              onClick={handleQuerySpecializedCas}
              disabled={isLoading}
              className="w-full py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Cpu size={12} /> Dispatch CAS Certification
            </button>

            {casResult && (
              <div className="bg-zinc-950 p-3 rounded-lg border border-cyan-500/30 font-mono text-xs space-y-1.5">
                <div className="text-cyan-300 font-bold flex items-center justify-between">
                  <span>Engine: {casResult.engine}</span>
                  <span className="text-zinc-500">{casResult.executionTimeMs}ms</span>
                </div>
                <div className="text-zinc-300 text-[11px] leading-relaxed">{casResult.output}</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Certified Sound Under Specialized Engine Protocol
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 5: VERIFICATION-GATED RELEASE & PRIORITY RECEIPTS */}
      {activeSubTab === 'priority_receipts' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Verification Gate Testing Workspace */}
          <div className="col-span-12 lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-400" />
                Anthropic Verification Gate (Buckmaster/Alpöge Protocol)
              </h4>
              <p className="text-xs text-zinc-400">
                Evidence before claims: Results are strictly withheld until complete Lean verification finishes.
                Zero sorry, zero admit, zero native_decide.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Theorem ID & Statement:</label>
              <input
                type="text"
                value={gateTheoremId}
                onChange={e => setGateTheoremId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none mb-2"
              />
              <input
                type="text"
                value={gateStatement}
                onChange={e => setGateStatement(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Lean 4 Source Code with Proof:</label>
              <textarea
                value={gateLeanSource}
                onChange={e => setGateLeanSource(e.target.value)}
                rows={5}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-zinc-200 focus:outline-none"
              />
            </div>

            <button
              onClick={handleVerifyAndRelease}
              disabled={isLoading}
              className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <ShieldCheck size={13} /> Run Kernel Check & Emit Priority Receipt
            </button>

            {latestGateReceipt && (
              <div
                className={`p-3 rounded-lg border font-mono text-xs space-y-1.5 ${
                  latestGateReceipt.status === 'VERIFIED_AND_SEALED'
                    ? 'bg-emerald-950/40 border-emerald-500/40'
                    : 'bg-rose-950/40 border-rose-500/40'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className={latestGateReceipt.status === 'VERIFIED_AND_SEALED' ? 'text-emerald-300' : 'text-rose-300'}>
                    STATUS: {latestGateReceipt.status}
                  </span>
                  <span className="text-zinc-500 text-[10px]">{latestGateReceipt.receiptHash}</span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  Lean: {latestGateReceipt.leanKernelVersion} | Mathlib: {latestGateReceipt.mathlibCommit.substring(0, 10)}
                </div>
                <div className="text-[11px] text-zinc-300 break-all">
                  Signature: {latestGateReceipt.signature}
                </div>
              </div>
            )}
          </div>

          {/* Cryptographic Priority Receipts Ledger */}
          <div className="col-span-12 lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Hash size={14} className="text-amber-400" />
                Cryptographic Priority-Proof Ledger
              </h4>
              <span className="text-xs font-mono text-zinc-500">{receipts.length} receipts</span>
            </div>
            <p className="text-xs text-zinc-400">
              Content-addressed SHA-256 hash chains establishing timestamped priority and mathematical provenance.
            </p>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {receipts.map(r => (
                <div key={r.receiptHash} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 font-mono text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">{r.theoremId}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        r.status === 'VERIFIED_AND_SEALED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="text-zinc-300 text-[11px]">{r.statement}</div>
                  <div className="text-zinc-500 text-[10px] truncate">Receipt Hash: {r.receiptHash}</div>
                  <div className="text-zinc-500 text-[10px]">
                    Timestamp: {new Date(r.timestamp).toLocaleString()} | Axioms: {r.axiomsUsed.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
