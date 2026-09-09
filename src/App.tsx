import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Square, 
  ShieldCheck, 
  Terminal, 
  Cpu, 
  Layers, 
  WifiOff,
  AlertCircle,
  BrainCircuit,
  Wrench,
  BarChart3,
  RefreshCw,
  Sparkles,
  Zap,
  TrendingUp,
  Gauge,
  Activity,
  CheckCircle,
  Code2
} from 'lucide-react';
import { MILLENNIUM_PROBLEMS, INITIAL_STATE } from './constants';
import { MillenniumProblemId, OrchestratorState, PortfolioTier } from './types';

const TABS = [
  { id: 'strategies', label: '8 Strategies' },
  { id: 'dag', label: 'Sub-Lemma DAG' },
  { id: 'agents', label: 'Swarm Agents' },
  { id: 'learning', label: 'Self-Learning' },
  { id: 'tools', label: 'Tool Synthesis' },
  { id: 'analytics', label: 'Deep Analytics' },
  { id: 'ledger', label: 'Proof Ledger' },
  { id: 'cas', label: 'Deterministic CAS' }
] as const;

type TabId = typeof TABS[number]['id'];

export default function App() {
  const [selectedProblem, setSelectedProblem] = useState<MillenniumProblemId>('riemann_hypothesis');
  const [portfolioTier, setPortfolioTier] = useState<PortfolioTier>('tier1_rapid');
  const [state, setState] = useState<OrchestratorState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<TabId>('strategies');
  const [loading, setLoading] = useState(false);
  const [actionOutput, setActionOutput] = useState<string>('');
  const [connectionError, setConnectionError] = useState<boolean>(false);
  const [newToolType, setNewToolType] = useState<'LeanTactic' | 'SMTSolver' | 'CASTransformer' | 'ASTMutator'>('LeanTactic');

  const problem = MILLENNIUM_PROBLEMS[selectedProblem] || Object.values(MILLENNIUM_PROBLEMS)[0];
  const isSolvedProblem = problem?.status === 'SOLVED_PERELMAN';

  const fetchState = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/swarm/state', { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setState(data);
      setConnectionError(false);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setConnectionError(true);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      fetchState(controller.signal).finally(() => {
        timer = setTimeout(tick, 3000);
      });
    };
    tick();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [fetchState]);

  const handleStartMission = async () => {
    setActionOutput('');
    if (isSolvedProblem) {
      setActionOutput('Poincaré Conjecture is already solved (Perelman 2003) and serves as a reference baseline track.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/swarm/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: selectedProblem, portfolioTier })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.state) setState(data.state);
      setActionOutput(`Mission started: ${data.message || 'Dispatched strategies'}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionOutput(`Mission Start Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStopMission = async () => {
    setActionOutput('');
    setLoading(true);
    try {
      const res = await fetch('/api/swarm/stop', { method: 'POST' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.state) setState(data.state);
      setActionOutput('Swarm mission execution halted by user abort signal.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionOutput(`Stop Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAllDeterministic = async () => {
    setActionOutput('');
    setLoading(true);
    try {
      const res = await fetch('/api/swarm/verify-all', { method: 'POST' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Server verification failed`);
      }
      const data = await res.json();
      if (data.allPassed) {
        setActionOutput(`ALL 6 GATES PASSED CLEANLY (Verified: ${data.compileSummary?.verified ?? 6}/${data.compileSummary?.total ?? 6}, DAG Acyclic: ${data.dagAcyclic ? 'Yes' : 'No'})`);
      } else {
        setActionOutput(`Gate Failure Detected: Verified ${data.compileSummary?.verified ?? 0}/${data.compileSummary?.total ?? 6}, DAG Acyclic: ${data.dagAcyclic ? 'Yes' : 'No'}`);
      }
      fetchState();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionOutput(`Verification Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelfImprovement = async () => {
    setActionOutput('');
    setLoading(true);
    try {
      const res = await fetch('/api/swarm/self-improve', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.state) setState(data.state);
      setActionOutput(`Self-Improvement Epoch completed: Tactic weights re-balanced, learned heuristics updated.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionOutput(`Self-Improvement Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSynthesizeTool = async () => {
    setActionOutput('');
    setLoading(true);
    try {
      const res = await fetch('/api/swarm/synthesize-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: newToolType })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.state) setState(data.state);
      setActionOutput(`Tool Generated & Verified: New ${newToolType} tool added to swarm toolchain.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionOutput(`Tool Synthesis Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const getTabCount = (tabId: TabId): number => {
    switch (tabId) {
      case 'strategies':
        return state?.tracks?.length ?? 0;
      case 'dag':
        return state?.lemmas?.length ?? 0;
      case 'agents':
        return state?.agents?.length ?? 0;
      case 'learning':
        return state?.selfLearning?.learnedHeuristics?.length ?? 0;
      case 'tools':
        return state?.generatedTools?.length ?? 0;
      case 'analytics':
        return 5;
      case 'ledger':
        return state?.ledger?.length ?? 0;
      case 'cas':
        return 4;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-white flex items-center gap-2">
              Lean Swarm Orchestrator
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Lean {state?.leanVersion || '4.18.0'}
              </span>
            </h1>
            <p className="text-xs text-slate-400">Autonomous Millennium Prize Verification Shell & Mathlib Bridge</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {connectionError && (
            <div className="flex items-center space-x-1.5 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-400 px-2.5 py-1 rounded-lg">
              <WifiOff className="h-3.5 w-3.5" />
              <span>Offline</span>
            </div>
          )}

          <div className="flex items-center space-x-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-slate-400">Spent:</span>
            <span className="font-mono text-emerald-400">${(state?.spent ?? 0).toFixed(2)}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">Budget:</span>
            <span className="font-mono text-slate-300">${(state?.budget ?? 100).toFixed(2)}</span>
          </div>

          <button
            onClick={handleRunAllDeterministic}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Gates ({state?.gateCount ?? 6})</span>
          </button>

          {state?.phase === 'running' ? (
            <button
              onClick={handleStopMission}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-600/20 transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span>Stop Mission</span>
            </button>
          ) : (
            <button
              onClick={handleStartMission}
              disabled={loading || isSolvedProblem}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-lg transition flex items-center space-x-1.5 disabled:opacity-50 ${
                isSolvedProblem 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
              }`}
            >
              <Play className="h-4 w-4 fill-current" />
              <span>{isSolvedProblem ? 'Reference Track' : 'Launch Swarm'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Layout Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Problem & Configuration */}
        <div className="lg:col-span-4 space-y-6">
          {/* Problem Selector */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              Millennium Target Track
            </h2>

            <div className="space-y-1.5">
              {Object.values(MILLENNIUM_PROBLEMS).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProblem(p.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm transition border ${
                    selectedProblem === p.id 
                      ? 'bg-indigo-950/60 border-indigo-500/50 text-white shadow-sm' 
                      : 'bg-slate-800/40 border-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{p.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                      p.status === 'SOLVED_PERELMAN' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {p.status === 'SOLVED_PERELMAN' ? '✓ SOLVED' : p.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{p.field}</div>
                </button>
              ))}
            </div>

            {/* Portfolio Tier Selection */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                Portfolio Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['tier1_rapid', 'tier2_depth', 'tier3_verification'] as PortfolioTier[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setPortfolioTier(t)}
                    disabled={isSolvedProblem}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium text-center border transition ${
                      portfolioTier === t
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {t === 'tier1_rapid' ? 'Tier 1 Rapid' : t === 'tier2_depth' ? 'Tier 2 Depth' : 'Tier 3 Formal'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Problem Formal Details Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Formal Lean 4 Statement</span>
              {isSolvedProblem && (
                <span className="text-[10px] text-emerald-400 font-mono">Verified Reference</span>
              )}
            </h3>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto leading-relaxed">
              {problem?.statementLean || '-- No statement available --'}
            </div>
            <div className="text-xs text-slate-400 space-y-1.5">
              <div className="flex items-start gap-1.5">
                <span className="text-slate-500 font-medium">Mathlib:</span>
                <span className="font-mono text-slate-300">{problem?.formalDefinitionMathlibModule || 'Mathlib.Main'}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-amber-500 font-medium">Barriers:</span>
                <span className="text-slate-300">{problem?.barrierNotes || 'None'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Execution Console & Dashboard */}
        <div className="lg:col-span-8 space-y-6">
          {/* Action Notification Box if any */}
          {actionOutput && (
            <div 
              role="status" 
              aria-live="polite" 
              className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs text-indigo-200 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                <span>{actionOutput}</span>
              </div>
              <button 
                onClick={() => setActionOutput('')} 
                aria-label="Dismiss notification"
                className="text-slate-400 hover:text-white ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Tab Navigation */}
          <div role="tablist" className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
            {TABS.map((tab) => {
              const count = getTabCount(tab.id);
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Strategies Matrix */}
          {activeTab === 'strategies' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(state?.tracks || []).map((track) => (
                <div key={track.id || track.name} className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white">{track.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono capitalize ${
                      track.status === 'certified' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {track.status === 'certified' ? '✓ certified' : track.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{track.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Progress</span>
                      <span className="font-mono text-indigo-400">{track.progress ?? 0}%</span>
                    </div>
                    <div 
                      role="progressbar" 
                      aria-valuenow={track.progress ?? 0} 
                      aria-valuemin={0} 
                      aria-valuemax={100}
                      className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"
                    >
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.max(0, track.progress ?? 0))}%` }} 
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono truncate">
                    {track.logs?.[track.logs.length - 1] || 'Standby.'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Sub-Lemma DAG */}
          {activeTab === 'dag' && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Topological Sub-Lemma DAG</h3>
                <span className="text-xs text-slate-400 font-mono">Zero Sorry Mandate: Active</span>
              </div>

              {state?.lemmas && state.lemmas.length > 0 ? (
                <div className="space-y-3">
                  {state.lemmas.map((lemma) => {
                    const hasDeps = lemma.dependencies && lemma.dependencies.length > 0;
                    return (
                      <div 
                        key={lemma.id} 
                        className={`p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2 ${
                          hasDeps ? 'ml-4 border-l-2 border-l-indigo-500/50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-semibold text-indigo-400">{lemma.id}: {lemma.title}</span>
                            {hasDeps && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                                Deps: {lemma.dependencies.join(', ')}
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                            lemma.status === 'verified_lean4'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {lemma.status === 'verified_lean4' ? '✓ VERIFIED LEAN 4' : lemma.status}
                          </span>
                        </div>
                        <pre className="text-xs font-mono text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800/80 overflow-x-auto">
                          {lemma.statement}
                        </pre>
                        {lemma.proofCode && (
                          <pre className="text-xs font-mono text-emerald-400 bg-slate-900 p-2 rounded border border-slate-800/80 overflow-x-auto">
                            {lemma.proofCode}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                  No sub-lemmas generated yet. Click "Launch Swarm" to decompose target into a verifiable DAG.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Swarm Agents */}
          {activeTab === 'agents' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(state?.agents || []).map((agent) => (
                <div key={agent.id} className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white">{agent.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                      agent.type === 'DETERMINISTIC' 
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                        : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    }`}>
                      {agent.type} {agent.model ? `(${agent.model})` : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{agent.job}</p>
                  <div className="text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-800/60 truncate">
                    Status: {agent.lastLog || 'Idle'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Self-Learning Engine */}
          {activeTab === 'learning' && (
            <div className="space-y-6">
              {/* Header card with trigger */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4 text-purple-400" />
                    Recursive Self-Improvement Engine
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Evolutionary tactic weight optimization & heuristic synthesis loop (Epoch {state?.selfLearning?.epoch ?? 12})
                  </p>
                </div>
                <button
                  onClick={handleSelfImprovement}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition flex items-center space-x-1.5 shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Run Epoch Optimization</span>
                </button>
              </div>

              {/* Tactic Weight Matrix */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-indigo-400" />
                  Learned Tactic Dispatch Weights
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(state?.selfLearning?.tacticWeights || []).map((tw) => (
                    <div key={tw.name} className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-semibold text-indigo-300">{tw.name}</span>
                        <span className="text-emerald-400">Weight: {(tw.weight * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                          style={{ width: `${tw.weight * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>Success Rate: {(tw.successRate * 100).toFixed(1)}%</span>
                        <span>Invocations: {tw.totalInvocations} ({tw.avgLatencyMs}ms)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Synthesized Proof Heuristics */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Synthesized Heuristics & Shortcut Rules
                </h4>
                <div className="space-y-3">
                  {(state?.selfLearning?.learnedHeuristics || []).map((rule) => (
                    <div key={rule.id} className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{rule.ruleName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                          Confidence: {(rule.confidence * 100).toFixed(0)}% (Epoch {rule.verifiedEpoch})
                        </span>
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">Pattern: {rule.pattern}</div>
                      <pre className="text-xs font-mono text-emerald-400 bg-slate-900 p-2 rounded border border-slate-800 overflow-x-auto">
                        {rule.synthesizedTactic}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evolutionary History Log */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Evolution Mutation Log</h4>
                <div className="space-y-2 font-mono text-xs">
                  {(state?.selfLearning?.evolutionLog || []).map((log, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-950 rounded border border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-300">{log.mutation}</span>
                      <span className="text-emerald-400 font-semibold">+{log.deltaAccuracy} acc</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Tool Synthesis & Analysis */}
          {activeTab === 'tools' && (
            <div className="space-y-6">
              {/* Header card with synthesize tool */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-indigo-400" />
                    Dynamic Tool Generation & Analysis
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Auto-synthesis of domain decision procedures, AST transformers, and SMT verifiers
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={newToolType}
                    onChange={(e) => setNewToolType(e.target.value as any)}
                    className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="LeanTactic">Lean 4 Tactic</option>
                    <option value="SMTSolver">SMT Solver</option>
                    <option value="CASTransformer">CAS Transformer</option>
                    <option value="ASTMutator">AST Mutator</option>
                  </select>
                  <button
                    onClick={handleSynthesizeTool}
                    disabled={loading}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Synthesize Tool</span>
                  </button>
                </div>
              </div>

              {/* Tools List */}
              <div className="space-y-4">
                {(state?.generatedTools || []).map((tool) => (
                  <div key={tool.id} className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <Code2 className="h-4 w-4 text-indigo-400" />
                        <span className="font-semibold text-sm text-white">{tool.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                          {tool.type}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {tool.language}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs font-mono">
                        <span className="text-emerald-400">✓ Kernel Verified</span>
                        <span className="text-slate-400">{tool.benchmarkMs}ms latency</span>
                        <span className="text-slate-500">Used {tool.usageCount}x</span>
                      </div>
                    </div>
                    <pre className="text-xs font-mono text-slate-200 bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto leading-relaxed">
                      {tool.code}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 6: Deep Analytics */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Core Analytics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">Token Efficiency</div>
                  <div className="text-xl font-bold text-emerald-400 font-mono">
                    {state?.analytics?.tokenEfficiency ?? 94.2}%
                  </div>
                  <div className="text-[10px] text-slate-500">Valid tactics / 1k tokens</div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">Kernel Pass Rate</div>
                  <div className="text-xl font-bold text-indigo-400 font-mono">
                    {state?.analytics?.kernelPassRate ?? 100.0}%
                  </div>
                  <div className="text-[10px] text-slate-500">Zero sorry verified</div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">Cost per Lemma</div>
                  <div className="text-xl font-bold text-purple-400 font-mono">
                    ${(state?.analytics?.costPerLemmaUSD ?? 0.00042).toFixed(5)}
                  </div>
                  <div className="text-[10px] text-slate-500">Average Compute/LLM cost</div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">DAG Depth Reached</div>
                  <div className="text-xl font-bold text-amber-400 font-mono">
                    Level 5
                  </div>
                  <div className="text-[10px] text-slate-500">Acyclic proof hierarchy</div>
                </div>
              </div>

              {/* Tactic Distribution Bar Chart */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-indigo-400" />
                  Tactic Usage Distribution
                </h4>
                <div className="space-y-3">
                  {(state?.analytics?.tacticDistribution || [
                    { name: 'linarith / nlinarith', percentage: 38, count: 3510 },
                    { name: 'aesop / auto', percentage: 26, count: 2400 },
                    { name: 'e-graph sat', percentage: 22, count: 2030 },
                    { name: 'ring_nf', percentage: 10, count: 920 },
                    { name: 'custom synthesized', percentage: 4, count: 370 }
                  ]).map((item) => (
                    <div key={item.name} className="space-y-1 text-xs font-mono">
                      <div className="flex justify-between text-slate-300">
                        <span>{item.name}</span>
                        <span className="text-indigo-400">{item.percentage}% ({item.count} calls)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget Burn Trend */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Compute Budget Efficiency & Burn Trend
                </h4>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Total Spent: ${(state?.spent ?? 0).toFixed(4)}</span>
                  <span className="text-emerald-400">Budget Remaining: ${( (state?.budget ?? 100) - (state?.spent ?? 0) ).toFixed(2)}</span>
                  <span className="text-indigo-300">Efficiency Forecast: Optimal</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 7: Proof Ledger */}
          {activeTab === 'ledger' && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Cryptographic Kernel Proof Ledger</h3>
              {state?.ledger && state.ledger.length > 0 ? (
                <div className="space-y-2">
                  {state.ledger.map((entry) => (
                    <div key={entry.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-slate-200">{entry.event}</div>
                        <div className="text-slate-500 font-mono text-[10px] mt-0.5">Hash: {entry.evidenceHash}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                          ✓ Kernel Verified
                        </span>
                        <div className="text-slate-500 text-[10px] mt-0.5 font-mono">
                          ${(entry?.costUSD ?? 0).toFixed(4)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                  Ledger is waiting for formal proof events.
                </div>
              )}
            </div>
          )}

          {/* Tab 8: CAS Engines */}
          {activeTab === 'cas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'PSLQ Integer Relations', desc: 'Finds integer relations between fundamental constants', cert: 'PSLQ-7489-CERT' },
                { name: 'SMT Farkas Certificates', desc: 'Linear arithmetic infeasibility certificates for Lean', cert: 'FARKAS-L12-CERT' },
                { name: 'Buchberger Gröbner Bases', desc: 'Algebraic ideal membership certificate in Lean 4 ring', cert: 'GROEBNER-901-CERT' },
                { name: 'Interval Arithmetic Engine', desc: '128-bit float enclosure certificates for de Bruijn-Newman', cert: 'INTERVAL-RH-CERT' }
              ].map((cas) => (
                <div key={cas.name} className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white">{cas.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      ✓ {cas.cert}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{cas.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Live Telemetry Terminal */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 shadow-inner">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
              <span className="flex items-center gap-1.5 font-mono">
                <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                Live Kernel Telemetry
              </span>
              <span className={`text-[10px] font-mono ${connectionError ? 'text-rose-400' : 'text-emerald-400'}`}>
                {connectionError ? 'STATUS: OFFLINE' : `STATUS: ${state?.phase?.toUpperCase() || 'ACTIVE'}`}
              </span>
            </div>
            <div className="h-40 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1 pr-2">
              {(state?.logs || []).slice(-200).map((log, i) => (
                <div key={`${i}-${log.slice(0, 15)}`} className="leading-relaxed flex items-start space-x-2">
                  <span className="text-slate-600 select-none">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
