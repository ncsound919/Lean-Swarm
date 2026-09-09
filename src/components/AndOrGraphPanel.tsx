import { useState, useEffect } from 'react';
import {
  TheoremRun,
  ProofNode,
  GoalNode,
  TacticEdge,
  AndOrGraphPreset,
  WorkerPoolStatus,
  ExpertIterationSummary,
  StateBlob
} from '../types';
import {
  GitFork,
  Network,
  Cpu,
  Layers,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  Zap,
  Server,
  Database,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Download,
  Upload,
  BookOpen,
  Award,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Split,
  Terminal,
  Activity
} from 'lucide-react';

interface AndOrGraphPanelProps {
  initialRun?: TheoremRun;
}

export function AndOrGraphPanel({ initialRun }: AndOrGraphPanelProps) {
  const [presets, setPresets] = useState<AndOrGraphPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset_and_comm_factorized');
  const [theoremStatement, setTheoremStatement] = useState<string>(
    'theorem and_comm (p q : Prop) (h : p ∧ q) : q ∧ p'
  );
  const [tacticsInput, setTacticsInput] = useState<string>('constructor\nexact h.2\nexact h.1');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [theoremRun, setTheoremRun] = useState<TheoremRun | null>(initialRun || null);
  const [workerPool, setWorkerPool] = useState<WorkerPoolStatus | null>(null);
  const [expertIteration, setExpertIteration] = useState<ExpertIterationSummary | null>(null);
  const [exportedBlob, setExportedBlob] = useState<StateBlob | null>(null);
  const [activeTab, setActiveTab] = useState<
    'graph' | 'factorization' | 'vector_reward' | 'worker_pool' | 'expert_iteration'
  >('graph');
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);
  const [expandedEdgeId, setExpandedEdgeId] = useState<string | null>(null);

  // Load presets, worker pool, and expert iteration data on mount
  useEffect(() => {
    fetch('/api/and-or/presets')
      .then(res => res.json())
      .then(data => {
        if (data.presets && Array.isArray(data.presets)) {
          setPresets(data.presets);
        }
      })
      .catch(err => console.error('Failed to load AND-OR presets:', err));

    fetchWorkerPoolStatus();
    fetchExpertIteration();
  }, []);

  // Run initial proof graph if none
  useEffect(() => {
    if (!theoremRun) {
      handleExecuteRun(theoremStatement, ['constructor', 'exact h.2', 'exact h.1']);
    }
  }, []);

  const fetchWorkerPoolStatus = async () => {
    try {
      const res = await fetch('/api/and-or/worker-pool');
      const data = await res.json();
      setWorkerPool(data);
    } catch (err) {
      console.error('Failed to fetch worker pool:', err);
    }
  };

  const fetchExpertIteration = async () => {
    try {
      const res = await fetch('/api/and-or/expert-iteration');
      const data = await res.json();
      setExpertIteration(data);
    } catch (err) {
      console.error('Failed to fetch expert iteration:', err);
    }
  };

  const handleSelectPreset = (preset: AndOrGraphPreset) => {
    setSelectedPresetId(preset.id);
    setTheoremStatement(preset.theorem);
    setTacticsInput(preset.tactics.join('\n'));
    handleExecuteRun(preset.theorem, preset.tactics);
  };

  const handleExecuteRun = async (stmt?: string, tacticsList?: string[]) => {
    setIsRunning(true);
    const tactics = tacticsList || tacticsInput.split('\n').map(t => t.trim()).filter(Boolean);
    try {
      const res = await fetch('/api/and-or/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theoremStatement: stmt || theoremStatement,
          tactics
        })
      });
      const data: TheoremRun = await res.json();
      setTheoremRun(data);
      fetchWorkerPoolStatus();
    } catch (err) {
      console.error('Failed to run AND-OR proof graph:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportRootState = async () => {
    if (!theoremRun) return;
    const rootNode = theoremRun.proofNodes[theoremRun.rootProofNodeId];
    const goals = rootNode ? rootNode.goalIds.map(id => theoremRun.goalNodes[id]).filter(Boolean) : [];
    try {
      const res = await fetch('/api/and-or/export-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stateId: rootNode?.id || 'state_root',
          stateHash: rootNode?.state_hash || 'hash_0',
          goals
        })
      });
      const blob: StateBlob = await res.json();
      setExportedBlob(blob);
    } catch (err) {
      console.error('Export state failed:', err);
    }
  };

  const getRewardColor = (val: number) => {
    if (val > 2.0) return 'text-cyan-400 font-bold';
    if (val > 0) return 'text-emerald-400 font-semibold';
    if (val < -1.0) return 'text-rose-400 font-bold';
    return 'text-amber-400 font-semibold';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-cyan-950/40 border border-zinc-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GitFork className="text-cyan-400" size={20} />
              <h2 className="text-lg font-bold text-zinc-100">
                LeanTree Multi-Goal AND–OR Proof Graph & Factorization Engine
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-full">
                ICML 2025 Architecture
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
              Treats Lean proof states as <strong>AND–OR graphs</strong> rather than linear tactic traces.
              Multi-goal states are decomposed into independent <strong>AND branches</strong> (G₁ ∧ … ∧ Gₙ)
              and solved in parallel, while tactic choices form <strong>OR branches</strong>. Terminal proof credit is awarded
              only when all required AND-branches close under critical-path credit (min V(Gᵢ)).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-lg text-right">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Total Reward ($R_t$)</div>
              <div className={`text-base font-mono ${theoremRun ? getRewardColor(theoremRun.totalScalarReward) : 'text-zinc-300'}`}>
                {theoremRun ? (theoremRun.totalScalarReward >= 0 ? `+${theoremRun.totalScalarReward.toFixed(2)}` : theoremRun.totalScalarReward.toFixed(2)) : '0.00'}
              </div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-lg text-right">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Proof Status</div>
              <div className="text-base font-mono flex items-center gap-1.5 justify-end">
                {theoremRun?.status === 'proved' ? (
                  <span className="text-cyan-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={16} /> Q.E.D.
                  </span>
                ) : theoremRun?.status === 'stuck' ? (
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <AlertTriangle size={16} /> Stuck
                  </span>
                ) : theoremRun?.status === 'failed' ? (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <XCircle size={16} /> Escape Killed
                  </span>
                ) : (
                  <span className="text-zinc-500">Idle</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preset Selector Bar */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5 mr-1">
            <Sparkles size={13} className="text-cyan-400" />
            Proof Scenarios:
          </span>
          {presets.map(p => {
            const isSelected = p.id === selectedPresetId;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`px-2.5 py-1 rounded text-xs transition-colors border ${
                  isSelected
                    ? 'bg-cyan-600/30 text-cyan-200 border-cyan-500/50 font-medium'
                    : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                {p.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Controls & Declaration Input */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <BookOpen size={14} className="text-cyan-400" />
                Theorem Statement
              </label>
              <span className="text-[11px] font-mono text-zinc-500">
                env: {theoremRun?.environment_hash || '4.14.0_pinned'}
              </span>
            </div>
            <input
              type="text"
              value={theoremStatement}
              onChange={e => setTheoremStatement(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />

            <div className="flex items-center justify-between mt-4 mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Layers size={14} className="text-emerald-400" />
                Proof Tactic Sequence
              </label>
              <span className="text-[11px] text-zinc-500">One tactic per line</span>
            </div>
            <textarea
              rows={4}
              value={tacticsInput}
              onChange={e => setTacticsInput(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500 leading-relaxed resize-none"
            />

            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-zinc-500">
                {theoremRun && (
                  <span>
                    Goals Closed: <strong className="text-cyan-300">{theoremRun.closedGoalCount}</strong> / {theoremRun.totalGoalCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const activePreset = presets.find(p => p.id === selectedPresetId);
                    if (activePreset) {
                      setTheoremStatement(activePreset.theorem);
                      setTacticsInput(activePreset.tactics.join('\n'));
                    }
                  }}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  Reset
                </button>
                <button
                  onClick={() => handleExecuteRun()}
                  disabled={isRunning}
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow"
                >
                  <Play size={12} />
                  {isRunning ? 'Constructing Graph...' : 'Build AND–OR Graph'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Critical Path Formula & Vector Equation */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <ShieldCheck size={14} className="text-cyan-400" />
                Critical-Path Credit Rule for AND Branches
              </h3>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                γ = 0.95
              </span>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center text-xs font-mono text-cyan-300">
              R_parent = R_local + γ · min_(i ∈ &#123;1..k&#125;) V(G_i)
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              <strong>Why the min is vital:</strong> An AND-node is only as provable as its hardest unresolved child.
              This prevents RL policies from farming easy side-goals while leaving impossible branches stranded.
              Branches receive closure reward directly, and full-proof bonus is backpropagated to ancestor decompositions.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Award size={14} className="text-emerald-400" />
                Deterministic Vector Reward Composition
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                6-Signal Vector
              </span>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-center text-xs font-mono text-emerald-300">
              R_t = 1.0·r_valid + 2.0·r_closure + 0.4·r_complexity + 0.2·r_novelty - 0.1·r_cost - 2.0·r_integrity
            </div>
            <p className="text-[11px] text-zinc-400">
              Logged as raw vector <code className="text-zinc-200">r_t</code> before scalarization, enabling offline re-scoring without re-running Lean workers.
            </p>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow">
        <div className="flex border-b border-zinc-800 bg-zinc-950 px-3 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'graph'
                ? 'bg-zinc-900 text-cyan-300 border-t border-x border-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <GitFork size={13} />
            AND–OR Graph Hierarchy ({Object.keys(theoremRun?.proofNodes || {}).length} Nodes)
          </button>
          <button
            onClick={() => setActiveTab('factorization')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'factorization'
                ? 'bg-zinc-900 text-indigo-300 border-t border-x border-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Split size={13} />
            Safe Split Rule (Metavariable Isolation)
          </button>
          <button
            onClick={() => setActiveTab('vector_reward')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'vector_reward'
                ? 'bg-zinc-900 text-emerald-300 border-t border-x border-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Award size={13} />
            Vector Reward Breakdown (r_t → R_t)
          </button>
          <button
            onClick={() => setActiveTab('worker_pool')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'worker_pool'
                ? 'bg-zinc-900 text-amber-300 border-t border-x border-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Server size={13} />
            REPL Worker Pool & Deduplication ({workerPool?.deduplicatedCount || 0} Deduped)
          </button>
          <button
            onClick={() => setActiveTab('expert_iteration')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'expert_iteration'
                ? 'bg-zinc-900 text-purple-300 border-t border-x border-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity size={13} />
            Asynchronous Expert Iteration (SorryDB Gating)
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {/* TAB 1: AND-OR Graph Hierarchy */}
          {activeTab === 'graph' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-400 pb-2">
                <span>
                  Root State: <code className="text-cyan-300 font-mono">{theoremRun?.rootProofNodeId}</code> |
                  Total Proof Nodes: <strong className="text-zinc-200">{Object.keys(theoremRun?.proofNodes || {}).length}</strong> |
                  Goal Nodes: <strong className="text-zinc-200">{Object.keys(theoremRun?.goalNodes || {}).length}</strong>
                </span>
                <button
                  onClick={handleExportRootState}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs flex items-center gap-1 transition-colors"
                >
                  <Download size={12} />
                  Export Root State Blob
                </button>
              </div>

              {exportedBlob && (
                <div className="bg-zinc-950 border border-cyan-800/40 rounded-lg p-3 text-xs font-mono space-y-1">
                  <div className="text-cyan-400 font-bold flex items-center gap-1">
                    <Database size={12} />
                    Content-Addressed State Blob Created: {exportedBlob.blobHash}
                  </div>
                  <div className="text-zinc-400 text-[11px] truncate">
                    state_hash: {exportedBlob.state_hash} | goals: {exportedBlob.goals.length} | env: {exportedBlob.environment_hash}
                  </div>
                </div>
              )}

              {/* Node Sequence Display */}
              <div className="space-y-3">
                {theoremRun &&
                  Object.values(theoremRun.proofNodes).map((node: ProofNode, idx) => {
                    const isExpanded = expandedNodeId === node.id;
                    const goals = node.goalIds.map(gid => theoremRun.goalNodes[gid]).filter(Boolean);

                    return (
                      <div
                        key={node.id}
                        className={`border rounded-xl transition-all ${
                          node.isSolved
                            ? 'bg-zinc-950/80 border-cyan-900/50'
                            : 'bg-zinc-950/40 border-zinc-800'
                        }`}
                      >
                        <div
                          onClick={() => setExpandedNodeId(isExpanded ? null : node.id)}
                          className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="font-mono text-xs text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                              Node {idx}
                            </div>
                            <div>
                              <div className="font-mono text-xs font-bold text-zinc-200 flex items-center gap-2">
                                <span>state_hash: {node.state_hash}</span>
                                {node.isolation_status === 'factorized' ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                    FACTORIZED (AND)
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                    COMPOSITE STATE
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-400 mt-0.5">
                                {node.factorizationReason}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-xs font-mono bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
                              <span className="text-zinc-500">AND Goals: </span>
                              <strong className="text-zinc-200">{node.goalIds.length}</strong>
                            </div>
                            <div className="text-xs font-mono bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
                              <span className="text-zinc-500">Critical V: </span>
                              <strong className="text-cyan-400">{node.criticalPathValue.toFixed(2)}</strong>
                            </div>
                            <div className="text-zinc-500">
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Goal Nodes */}
                        {isExpanded && (
                          <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/90 space-y-3">
                            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Required AND-Goal Branches (Each Solved Independently)
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {goals.map(g => (
                                <div
                                  key={g.id}
                                  className={`p-3 rounded-lg border text-xs font-mono space-y-1.5 ${
                                    g.isBottleneck
                                      ? 'bg-amber-950/20 border-amber-500/40'
                                      : 'bg-zinc-900/80 border-zinc-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-cyan-300 font-bold">⊢ {g.target}</span>
                                    {g.isBottleneck && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                        BOTTLENECK BRANCH
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-zinc-400">
                                    fingerprint: {g.goal_fingerprint}
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] pt-1 text-zinc-500">
                                    <span>complexity: {g.complexity}</span>
                                    <span>V(G_i): {g.estimatedValue.toFixed(2)}</span>
                                    <span className={g.isSolved ? 'text-emerald-400' : 'text-zinc-400'}>
                                      status: {g.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Tactic Edges Connecting the Nodes */}
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Tactic Transition Edges (OR Alternatives with Critical-Path Credit)
                </h4>
                {theoremRun &&
                  Object.values(theoremRun.tacticEdges).map((edge: TacticEdge) => (
                    <div
                      key={edge.id}
                      className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-zinc-500">{edge.sourceProofNodeId}</span>
                        <ArrowRight size={12} className="text-zinc-600" />
                        <span className="text-cyan-400 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                          {edge.tactic}
                        </span>
                        <ArrowRight size={12} className="text-zinc-600" />
                        <span className="text-zinc-400">{edge.successorProofNodeId}</span>
                      </div>

                      <div className="flex items-center gap-3 font-mono">
                        <div className="bg-zinc-900 px-2 py-1 rounded border border-zinc-800 text-[11px] text-zinc-400">
                          gas: {edge.resourceMeasurements.gas} | {edge.timingMs}ms
                        </div>
                        <div className="bg-zinc-900 px-2 py-1 rounded border border-zinc-800 text-xs">
                          <span className="text-zinc-500">Scalar: </span>
                          <span className={getRewardColor(edge.scalarReward)}>
                            {edge.scalarReward >= 0 ? `+${edge.scalarReward.toFixed(2)}` : edge.scalarReward.toFixed(2)}
                          </span>
                        </div>
                        <div className="bg-zinc-900 px-2 py-1 rounded border border-cyan-900/50 text-xs">
                          <span className="text-zinc-500">Critical Credit: </span>
                          <span className="text-cyan-400 font-bold">
                            {edge.criticalPathCredit >= 0 ? `+${edge.criticalPathCredit.toFixed(2)}` : edge.criticalPathCredit.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 2: Safe Split Rule Inspection */}
          {activeTab === 'factorization' && (
            <div className="space-y-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Split size={16} className="text-indigo-400" />
                  <h4 className="text-xs font-bold text-zinc-200">
                    LeanTree Safe Split Invariant Definition
                  </h4>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  A multi-goal state G₁, …, Gₙ can be safely split if and only if their relevant local contexts
                  do not overlap in a way that creates shared metavariables, unassigned universe constraints, or order-dependent dependencies:
                </p>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 font-mono text-xs text-indigo-300">
                  def can_factorize(goals):<br />
                  &nbsp;&nbsp;return (<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;no_shared_metavariables(goals) and<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;no_cross_goal_assignments(goals) and<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;all(goal.isolation_status == "independent" for goal in goals)<br />
                  &nbsp;&nbsp;)
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-950 border border-emerald-900/40 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 size={14} /> Safe Split Case (Factorized Independent Search)
                  </div>
                  <div className="font-mono text-xs bg-zinc-900 p-2.5 rounded border border-zinc-800 text-zinc-200">
                    Goal 1: ⊢ p (freeMetavars: [])<br />
                    Goal 2: ⊢ q (freeMetavars: [])
                  </div>
                  <p className="text-xs text-zinc-400">
                    Zero shared metavariables. Each goal is assigned to an isolated REPL worker process in parallel.
                    Progress on Goal 1 cannot invalidate or constrain Goal 2.
                  </p>
                </div>

                <div className="bg-zinc-950 border border-amber-900/40 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                    <AlertTriangle size={14} /> Unsafe Split Case (Retained as Composite State)
                  </div>
                  <div className="font-mono text-xs bg-zinc-900 p-2.5 rounded border border-zinc-800 text-zinc-200">
                    Goal 1: ⊢ P ?m_x (freeMetavars: ['m_x'])<br />
                    Goal 2: ⊢ Q ?m_x (freeMetavars: ['m_x'])
                  </div>
                  <p className="text-xs text-zinc-400">
                    Both subgoals share the existential variable <code className="text-amber-300">?m_x</code>.
                    Factorization is rejected because an instantiation chosen by Worker 1 would break Worker 2.
                    The state is searched sequentially as a composite state.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Vector Reward Breakdown */}
          {activeTab === 'vector_reward' && (
            <div className="space-y-4">
              <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] font-mono border-b border-zinc-800">
                    <tr>
                      <th className="px-3 py-2.5">Tactic</th>
                      <th className="px-3 py-2.5 text-right">r_valid (×1.0)</th>
                      <th className="px-3 py-2.5 text-right">r_closure (×2.0)</th>
                      <th className="px-3 py-2.5 text-right">r_complexity (×0.4)</th>
                      <th className="px-3 py-2.5 text-right">r_novelty (×0.2)</th>
                      <th className="px-3 py-2.5 text-right">r_cost (-0.1)</th>
                      <th className="px-3 py-2.5 text-right">r_integrity (-2.0)</th>
                      <th className="px-3 py-2.5 text-right">Scalar R_t</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/50 font-mono">
                    {theoremRun &&
                      Object.values(theoremRun.tacticEdges).map((edge: TacticEdge) => (
                        <tr key={edge.id} className="hover:bg-zinc-800/40">
                          <td className="px-3 py-2 text-cyan-300 font-bold">{edge.tactic}</td>
                          <td className="px-3 py-2 text-right text-emerald-400">
                            {edge.vectorReward.r_valid >= 0 ? `+${edge.vectorReward.r_valid.toFixed(2)}` : edge.vectorReward.r_valid.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right text-cyan-400">
                            {edge.vectorReward.r_closure > 0 ? `+${edge.vectorReward.r_closure.toFixed(2)}` : '0.00'}
                          </td>
                          <td className="px-3 py-2 text-right text-zinc-300">
                            {edge.vectorReward.r_complexity > 0 ? `+${edge.vectorReward.r_complexity.toFixed(2)}` : '0.00'}
                          </td>
                          <td className="px-3 py-2 text-right text-zinc-300">
                            {edge.vectorReward.r_novelty > 0 ? `+${edge.vectorReward.r_novelty.toFixed(2)}` : '0.00'}
                          </td>
                          <td className="px-3 py-2 text-right text-amber-400">
                            -{edge.vectorReward.r_cost.toFixed(3)}
                          </td>
                          <td className="px-3 py-2 text-right text-rose-400">
                            {edge.vectorReward.r_integrity > 0 ? '-2.00 (KILL)' : '0.00'}
                          </td>
                          <td className={`px-3 py-2 text-right font-bold ${getRewardColor(edge.scalarReward)}`}>
                            {edge.scalarReward >= 0 ? `+${edge.scalarReward.toFixed(2)}` : edge.scalarReward.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: REPL Worker Pool & Deduplication */}
          {activeTab === 'worker_pool' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                  <div className="text-[10px] uppercase text-zinc-500 font-mono">Isolated Workers</div>
                  <div className="text-lg font-bold text-zinc-200 font-mono mt-0.5">
                    {workerPool?.workers.length || 4}
                  </div>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                  <div className="text-[10px] uppercase text-zinc-500 font-mono">Deduplicated Tasks</div>
                  <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
                    {workerPool?.deduplicatedCount || 0}
                  </div>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                  <div className="text-[10px] uppercase text-zinc-500 font-mono">State Cache Hits</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                    {workerPool?.cacheHitCount || 0}
                  </div>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                  <div className="text-[10px] uppercase text-zinc-500 font-mono">Active Branches</div>
                  <div className="text-lg font-bold text-indigo-400 font-mono mt-0.5">
                    {workerPool?.activeBranches || 0}
                  </div>
                </div>
              </div>

              {/* Workers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {workerPool?.workers.map(w => (
                  <div key={w.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-200 font-mono">{w.id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {w.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                      Memory: {w.memoryUsageMb} MB<br />
                      Processed: {w.processedTasks} tasks
                    </div>
                  </div>
                ))}
              </div>

              {/* Deterministic Fallback Queue */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
                  <Cpu size={14} className="text-cyan-400" />
                  Deterministic Fallback Queue (Aesop, Ring, Omega, Linarith)
                </div>
                <p className="text-xs text-zinc-400">
                  Unproven but valuable branches with high estimated value are placed into deterministic decision procedures:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                  {workerPool?.deterministicFallbackQueue.map(item => (
                    <div key={item.goalId} className="bg-zinc-900 p-2.5 rounded border border-zinc-800 flex items-center justify-between">
                      <span className="text-zinc-300">⊢ {item.target}</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px]">
                        {item.tacticCandidate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Asynchronous Expert Iteration */}
          {activeTab === 'expert_iteration' && (
            <div className="space-y-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-purple-400" />
                    <h4 className="text-xs font-bold text-zinc-200">
                      Asynchronous Expert Iteration Cycle {expertIteration?.iteration}
                    </h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                    PROMOTED TO WORKERS
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs font-mono">
                  <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Frozen Model M_n</div>
                    <div className="text-zinc-300 font-bold mt-0.5">{expertIteration?.frozenModelVersion}</div>
                  </div>
                  <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Candidate M_(n+1)</div>
                    <div className="text-purple-300 font-bold mt-0.5">{expertIteration?.candidateModelVersion}</div>
                  </div>
                  <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">SorryDB Pass Rate</div>
                    <div className="text-emerald-400 font-bold mt-0.5">{expertIteration?.benchmarkGating.passRate}%</div>
                  </div>
                  <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Cost Per Theorem</div>
                    <div className="text-cyan-400 font-bold mt-0.5">{expertIteration?.benchmarkGating.costPerVerifiedTheorem} gas</div>
                  </div>
                </div>
              </div>

              {/* 3 Training Datasets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-zinc-950 border border-emerald-900/40 rounded-xl p-3.5 space-y-1.5 text-xs">
                  <div className="font-bold text-emerald-400 flex items-center justify-between">
                    <span>1. Positive Dataset</span>
                    <span className="font-mono">{expertIteration?.positiveDatasetCount}</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Shortest kernel-verified proof paths with zero forbidden escapes. Strict clean-room compilation.
                  </p>
                </div>
                <div className="bg-zinc-950 border border-indigo-900/40 rounded-xl p-3.5 space-y-1.5 text-xs">
                  <div className="font-bold text-indigo-400 flex items-center justify-between">
                    <span>2. Process Dataset</span>
                    <span className="font-mono">{expertIteration?.processDatasetCount}</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Valid intermediate tactic steps plus earliest-error negatives with first-error propagation penalties.
                  </p>
                </div>
                <div className="bg-zinc-950 border border-cyan-900/40 rounded-xl p-3.5 space-y-1.5 text-xs">
                  <div className="font-bold text-cyan-400 flex items-center justify-between">
                    <span>3. Decomposition Dataset</span>
                    <span className="font-mono">{expertIteration?.decompositionDatasetCount}</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Parent state → proposed subgoals → measured branch outcomes for tree search training.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
