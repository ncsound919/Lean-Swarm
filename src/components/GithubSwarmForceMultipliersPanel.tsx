import React, { useState, useEffect } from 'react';
import {
  GitPullRequest,
  GitBranch,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  TrendingUp,
  Trophy,
  ShieldAlert,
  Compass,
  Moon,
  Zap,
  Play,
  Share2,
  Filter,
  Layers,
  Sparkles,
  Terminal,
  Activity,
  Check
} from 'lucide-react';

interface GitHubIssueLeaf {
  issueNumber: number;
  title: string;
  body: string;
  labels: string[];
  leafId: string;
  problem: string;
  bitWidth: number;
  provenanceHash: string;
  status: 'open' | 'claimed' | 'closed';
  branchName: string;
  prNumber?: number;
  prStatus?: 'pending_ci' | 'clean_room_green' | 'merged' | 'rejected';
  claimedBy?: string;
  createdAt: number;
  updatedAt: number;
}

interface CleanRoomReport {
  leafId: string;
  commitHash: string;
  leanToolchain: string;
  mathlibCommit: string;
  sorryCount: number;
  tacticSteps: number;
  executionMs: number;
  passed: boolean;
  artifactAttestationHash: string;
  timestamp: number;
  logTail: string;
}

interface MarketSummary {
  leafId: string;
  problem: string;
  bitWidth: number;
  marketPrice: number;
  totalBids: number;
  totalComputeStaked: number;
  difficultyRating: 'trivial' | 'moderate' | 'hard' | 'extreme' | 'critical_blocker';
  curriculumPriority: number;
}

interface ProverContender {
  name: string;
  category: string;
  elo: number;
  matchesPlayed: number;
  wins: number;
  averageLatencyMs: number;
}

interface GolfEntry {
  lemmaId: string;
  problem: string;
  initialBitWidth: number;
  currentBitWidth: number;
  compressionRatio: number;
  contributor: string;
  astStepCount: number;
}

interface SharedCandidateLemma {
  brokerId: string;
  sourceProblem: string;
  applicableProblems: string[];
  signature: string;
  mathematicalDomain: string;
  utilityScore: number;
  promotedToLibrary: boolean;
}

interface FailureCluster {
  clusterId: string;
  errorSignature: string;
  failureCount: number;
  affectedProblems: string[];
  prescribedTacticAction: string;
  priorityQueueAdjustment: string;
}

export const GithubSwarmForceMultipliersPanel: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<
    'github_ledger' | 'prediction_market' | 'prover_arena' | 'red_team' | 'proof_golf' | 'lemma_broker' | 'dream_distill'
  >('github_ledger');

  // GitHub Ledger state
  const [issues, setIssues] = useState<GitHubIssueLeaf[]>([]);
  const [projectColumns, setProjectColumns] = useState<Record<string, string[]>>({});
  const [ciReports, setCiReports] = useState<CleanRoomReport[]>([]);
  const [selectedLeafForPR, setSelectedLeafForPR] = useState<string>('');
  const [customProofCode, setCustomProofCode] = useState<string>(
    'theorem submit_certified_witness (n : Nat) (h : n > 5040) : (n > 5040) = true := by rfl'
  );
  const [prSubmitting, setPrSubmitting] = useState(false);

  // Prediction Market state
  const [marketSummaries, setMarketSummaries] = useState<MarketSummary[]>([]);
  const [bidLeafId, setBidLeafId] = useState('');
  const [bidProbability, setBidProbability] = useState(0.85);
  const [bidBudget, setBidBudget] = useState(100);

  // Prover Arena state
  const [contenders, setContenders] = useState<ProverContender[]>([]);
  const [matchLog, setMatchLog] = useState<any[]>([]);
  const [arenaRunning, setArenaRunning] = useState(false);

  // Red team state
  const [attacks, setAttacks] = useState<any[]>([]);
  const [targetHypothesis, setTargetHypothesis] = useState('sigma(5040) / 5040 < 1.781 * log(log(5040))');

  // Proof golf state
  const [golfEntries, setGolfEntries] = useState<GolfEntry[]>([]);

  // Lemma broker state
  const [sharedLemmas, setSharedLemmas] = useState<SharedCandidateLemma[]>([]);

  // Dream & Distill state
  const [clusters, setClusters] = useState<FailureCluster[]>([]);
  const [distillLoading, setDistillLoading] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [resIssues, resMarket, resArena, resRedTeam, resGolf, resBroker, resDistill] = await Promise.all([
        fetch('/api/github-swarm/issues').then(r => r.json()),
        fetch('/api/multipliers/prediction-market').then(r => r.json()),
        fetch('/api/multipliers/prover-arena').then(r => r.json()),
        fetch('/api/multipliers/red-team').then(r => r.json()),
        fetch('/api/multipliers/proof-golf').then(r => r.json()),
        fetch('/api/multipliers/lemma-broker').then(r => r.json()),
        fetch('/api/multipliers/dream-distill').then(r => r.json()),
      ]);

      if (resIssues.issues) {
        setIssues(resIssues.issues);
        setProjectColumns(resIssues.projectColumns || {});
        if (resIssues.issues.length > 0 && !selectedLeafForPR) {
          setSelectedLeafForPR(resIssues.issues[0].leafId);
        }
      }
      if (resMarket.summaries) setMarketSummaries(resMarket.summaries);
      if (resArena.contenders) setContenders(resArena.contenders);
      if (resArena.matchHistory) setMatchLog(resArena.matchHistory);
      if (resRedTeam.attackLog) setAttacks(resRedTeam.attackLog);
      if (resGolf.leaderboard) setGolfEntries(resGolf.leaderboard);
      if (resBroker.candidates) setSharedLemmas(resBroker.candidates);
      if (resDistill.failureClusters) setClusters(resDistill.failureClusters);

      const ciRes = await fetch('/api/github-swarm/ci-reports').then(r => r.json());
      if (ciRes.reports) setCiReports(ciRes.reports);
    } catch (e) {
      console.error('Error fetching multiplier data:', e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmitPR = async () => {
    if (!selectedLeafForPR || !customProofCode) return;
    setPrSubmitting(true);
    try {
      const res = await fetch('/api/github-swarm/submit-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leafId: selectedLeafForPR,
          author: 'SwarmResearcher@Polymath',
          leanProofCode: customProofCode
        })
      });
      await res.json();
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setPrSubmitting(false);
    }
  };

  const handlePlaceBid = async () => {
    if (!bidLeafId) return;
    try {
      await fetch('/api/multipliers/prediction-market/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leafId: bidLeafId,
          agentId: 'PolymathBiddingAgent',
          bidProbability,
          budgetUnits: bidBudget
        })
      });
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunArenaMatch = async () => {
    setArenaRunning(true);
    try {
      await fetch('/api/multipliers/prover-arena/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          benchmarkGoal: 'Nonlinear Sobolev Remainder Invariant',
          problem: 'riemann',
          bitWidth: 15000
        })
      });
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setArenaRunning(false);
    }
  };

  const handleRunRedTeamAttack = async () => {
    try {
      await fetch('/api/multipliers/red-team/attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLemmaId: 'glue_robin_mertens_bridge',
          statement: targetHypothesis
        })
      });
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunDistillation = async () => {
    setDistillLoading(true);
    try {
      await fetch('/api/multipliers/dream-distill/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setDistillLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
                <GitPullRequest size={20} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  GitHub-Native Swarm & Creative Force-Multipliers
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    ETP Polymath Architecture
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Leaves as Issues • Branch-per-Leaf Topology • Clean-Room Actions Gate • Prediction Markets • Prover Arena ELO
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="px-3 py-1.5 rounded-lg text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors"
            >
              <Activity size={14} className="text-indigo-400" />
              Sync Swarm State
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-zinc-800/80 overflow-x-auto">
          {[
            { id: 'github_ledger', label: 'GitHub Ledger & Clean-Room CI', icon: GitPullRequest, color: 'text-indigo-400' },
            { id: 'prediction_market', label: 'Compute Prediction Market', icon: TrendingUp, color: 'text-amber-400' },
            { id: 'prover_arena', label: 'Nightly Prover Arena (ELO)', icon: Trophy, color: 'text-yellow-400' },
            { id: 'red_team', label: 'Adversarial Glue Red-Team', icon: ShieldAlert, color: 'text-rose-400' },
            { id: 'proof_golf', label: 'Proof-Golf Leaderboard', icon: Flame, color: 'text-orange-400' },
            { id: 'lemma_broker', label: 'Cross-Problem Lemma Broker', icon: Share2, color: 'text-cyan-400' },
            { id: 'dream_distill', label: 'Dream & Distill Night Cycle', icon: Moon, color: 'text-purple-400' },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-zinc-800 text-white font-semibold border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <Icon size={14} className={tab.color} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. GITHUB LEDGER & CLEAN ROOM CI */}
      {activeSubTab === 'github_ledger' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Issues List & Project Columns */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <GitBranch size={16} className="text-indigo-400" />
                  GitHub Issues Mirror (`conductor_log.jsonl`)
                </h3>
                <span className="text-xs text-zinc-400">{issues.length} active leaf issues</span>
              </div>

              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {issues.map(iss => (
                  <div
                    key={iss.leafId}
                    onClick={() => setSelectedLeafForPR(iss.leafId)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      selectedLeafForPR === iss.leafId
                        ? 'bg-indigo-950/30 border-indigo-500/50 ring-1 ring-indigo-500/30'
                        : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-indigo-400">#{iss.issueNumber}</span>
                          <span className="text-xs font-medium text-zinc-200">{iss.title}</span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{iss.body.split('\n')[0]}</p>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                          iss.status === 'closed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : iss.status === 'claimed'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {iss.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-zinc-800/60 text-[11px] text-zinc-400 font-mono">
                      <span className="flex items-center gap-1 text-zinc-300">
                        <GitBranch size={12} className="text-zinc-500" />
                        {iss.branchName}
                      </span>
                      <span>{iss.bitWidth.toLocaleString()} bits</span>
                      {iss.prNumber && (
                        <span className="text-purple-400 font-semibold flex items-center gap-1">
                          <GitPullRequest size={12} /> PR #{iss.prNumber} ({iss.prStatus})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Submit Proof PR & Clean-Room Actions Gate */}
          <div className="lg:col-span-5 space-y-4">
            {/* PR Submission Form */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <GitPullRequest size={16} className="text-emerald-400" />
                Submit Proof PR & Trigger Clean-Room Gate
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Target Leaf Issue</label>
                  <select
                    value={selectedLeafForPR}
                    onChange={e => setSelectedLeafForPR(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    {issues.map(iss => (
                      <option key={iss.leafId} value={iss.leafId}>
                        #{iss.issueNumber} [{iss.problem.toUpperCase()}] {iss.leafId} ({iss.bitWidth} bits)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">
                    Lean 4 Proof Script (Strict Zero-`sorry` Policy)
                  </label>
                  <textarea
                    rows={5}
                    value={customProofCode}
                    onChange={e => setCustomProofCode(e.target.value)}
                    className="w-full bg-zinc-950 font-mono text-xs text-emerald-300 border border-zinc-800 rounded-lg p-3 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <button
                  onClick={handleSubmitPR}
                  disabled={prSubmitting || !selectedLeafForPR}
                  className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-950/40"
                >
                  {prSubmitting ? <Activity size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Submit PR & Run Isolated Kernel CI
                </button>
              </div>
            </div>

            {/* Clean-Room CI Attestation Stream */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <Terminal size={16} className="text-amber-400" />
                Clean-Room Attestation Stream
              </h3>

              <div className="space-y-2.5 max-h-[260px] overflow-y-auto">
                {ciReports.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No PR runs logged yet in clean room.</p>
                ) : (
                  ciReports.slice(0, 5).map(rep => (
                    <div key={rep.artifactAttestationHash} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-zinc-300 font-semibold flex items-center gap-1.5">
                          {rep.passed ? (
                            <CheckCircle2 size={13} className="text-emerald-400" />
                          ) : (
                            <XCircle size={13} className="text-rose-400" />
                          )}
                          Leaf: {rep.leafId}
                        </span>
                        <span className="text-[10px] text-zinc-500">{rep.executionMs}ms</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 font-mono line-clamp-2">{rep.logTail}</p>
                      <div className="mt-2 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
                        <span>Toolchain: {rep.leanToolchain}</span>
                        <span>Attestation: {rep.artifactAttestationHash.slice(0, 10)}...</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PREDICTION MARKET */}
      {activeSubTab === 'prediction_market' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-amber-400" />
                Live Compute Allocation Prediction Market & Difficulty Oracle
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {marketSummaries.map(s => (
                  <div key={s.leafId} className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-amber-400">{s.leafId}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                            s.difficultyRating === 'trivial'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : s.difficultyRating === 'moderate'
                              ? 'bg-blue-500/10 text-blue-400'
                              : s.difficultyRating === 'hard'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {s.difficultyRating}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-xl font-bold text-white">{Math.round(s.marketPrice * 100)}%</span>
                        <span className="text-xs text-zinc-400">implied provability price</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                      <span>Staked: {s.totalComputeStaked.toLocaleString()} FLOPs</span>
                      <span className="text-indigo-400 font-semibold">Priority: {s.curriculumPriority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <Flame size={16} className="text-amber-400" />
                Place Compute Bid on Leaf
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Target Leaf</label>
                  <select
                    value={bidLeafId || (marketSummaries[0]?.leafId ?? '')}
                    onChange={e => setBidLeafId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200"
                  >
                    {marketSummaries.map(s => (
                      <option key={s.leafId} value={s.leafId}>
                        {s.leafId} ({Math.round(s.marketPrice * 100)}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Estimated Provability: {Math.round(bidProbability * 100)}%</label>
                  <input
                    type="range"
                    min="0.05"
                    max="0.99"
                    step="0.05"
                    value={bidProbability}
                    onChange={e => setBidProbability(parseFloat(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Compute Units (FLOPs)</label>
                  <input
                    type="number"
                    value={bidBudget}
                    onChange={e => setBidBudget(parseInt(e.target.value) || 50)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200"
                  />
                </div>

                <button
                  onClick={handlePlaceBid}
                  className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors"
                >
                  Stake Compute & Update Oracle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. PROVER ARENA */}
      {activeSubTab === 'prover_arena' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Trophy size={16} className="text-yellow-400" />
                  Prover Contenders ELO Leaderboard & Dynamic Closer Routing
                </h3>
                <button
                  onClick={handleRunArenaMatch}
                  disabled={arenaRunning}
                  className="px-3 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  {arenaRunning ? <Activity size={13} className="animate-spin" /> : <Play size={13} />}
                  Run Tournament Round
                </button>
              </div>

              <div className="space-y-3">
                {contenders.map((c, idx) => (
                  <div key={c.name} className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-zinc-500 w-5">#{idx + 1}</span>
                      <div>
                        <h4 className="text-xs font-semibold text-white">{c.name}</h4>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          Category: {c.category} • Avg Latency: {c.averageLatencyMs}ms
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-yellow-400">{c.elo} ELO</span>
                      <p className="text-[10px] text-zinc-500">{c.wins} wins / {c.matchesPlayed} matches</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <Activity size={16} className="text-yellow-400" />
                Tournament Match Log
              </h3>
              <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {matchLog.map(m => (
                  <div key={m.matchId} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span>{m.proverA.split(' ')[0]} vs {m.proverB.split(' ')[0]}</span>
                      <span className="text-yellow-400 font-bold">Winner: {m.winner.split(' ')[0]}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">Goal: {m.benchmarkGoal}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. ADVERSARIAL RED-TEAM */}
      {activeSubTab === 'red_team' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <ShieldAlert size={16} className="text-rose-400" />
                Fuzz & Attack Proposed Glue Theorem
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Glue Hypothesis Statement</label>
                  <textarea
                    rows={3}
                    value={targetHypothesis}
                    onChange={e => setTargetHypothesis(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-rose-300 font-mono"
                  />
                </div>

                <button
                  onClick={handleRunRedTeamAttack}
                  className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <ShieldAlert size={14} />
                  Launch Adversarial Fuzzing Pass
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <Terminal size={16} className="text-rose-400" />
                Red-Team Negative Ledger Feed
              </h3>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
                {attacks.map(atk => (
                  <div key={atk.attackId} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold font-mono ${atk.falsified ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {atk.falsified ? '💥 FALSIFIED / TRAP KILLED' : '🛡 SURVIVED ATTACK'}
                      </span>
                      <span className="text-[10px] text-zinc-500">Strategy: {atk.attackStrategy}</span>
                    </div>
                    {atk.counterexampleWitness && (
                      <p className="mt-2 text-rose-300 font-mono text-[11px] bg-rose-950/20 p-2 rounded border border-rose-900/40">
                        {atk.counterexampleWitness}
                      </p>
                    )}
                    <p className="text-[10px] text-zinc-500 mt-2">Target: {atk.targetLemmaId} • Confidence: {atk.survivalConfidence * 100}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. PROOF GOLF */}
      {activeSubTab === 'proof_golf' && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Flame size={16} className="text-orange-400" />
            Proof-Golf Certificate Compression Leaderboard
          </h3>

          <div className="space-y-3">
            {golfEntries.map((g, idx) => (
              <div key={g.lemmaId} className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold font-mono text-orange-400 w-6">#{idx + 1}</span>
                  <div>
                    <h4 className="text-xs font-semibold text-white font-mono">{g.lemmaId}</h4>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {g.initialBitWidth.toLocaleString()} bits → {g.currentBitWidth.toLocaleString()} bits ({g.astStepCount} AST steps)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-orange-400">{Math.round(g.compressionRatio * 100)}% of original</span>
                  <p className="text-[10px] text-zinc-500">Contributor: {g.contributor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. LEMMA BROKER */}
      {activeSubTab === 'lemma_broker' && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Share2 size={16} className="text-cyan-400" />
            Cross-Problem Lemma Broker (Automated Millennium Machinery Sharing)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sharedLemmas.map(c => (
              <div key={c.brokerId} className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400">{c.brokerId}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      Utility: {c.utilityScore}/100
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 font-mono mt-2 bg-zinc-900 p-2 rounded border border-zinc-800">
                    {c.signature}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
                  <span>Source: {c.sourceProblem.toUpperCase()}</span>
                  <span>Applies To: {c.applicableProblems.join(', ').toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. DREAM & DISTILL */}
      {activeSubTab === 'dream_distill' && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Moon size={16} className="text-purple-400" />
                Dream-and-Distill Night Cycle (Offline Failure Clustering)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Replays negative ledger errors to synthesize tactic rules and adjust priority queues
              </p>
            </div>
            <button
              onClick={handleRunDistillation}
              disabled={distillLoading}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              {distillLoading ? <Activity size={13} className="animate-spin" /> : <Sparkles size={13} />}
              Run Dream & Distill Pass
            </button>
          </div>

          <div className="space-y-3">
            {clusters.map(cl => (
              <div key={cl.clusterId} className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-purple-400">{cl.clusterId}</span>
                  <span className="text-[10px] text-zinc-500">{cl.failureCount} recorded failures</span>
                </div>
                <p className="text-xs font-mono text-zinc-300 mt-1">Signature: {cl.errorSignature}</p>
                <div className="mt-2 text-xs text-zinc-400 grid grid-cols-1 md:grid-cols-2 gap-2 bg-zinc-900 p-2 rounded">
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">Prescribed Tactic</span>
                    <span className="text-emerald-400">{cl.prescribedTacticAction}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">Queue Adjustment</span>
                    <span className="text-amber-400">{cl.priorityQueueAdjustment}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
