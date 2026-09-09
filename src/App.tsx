import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  RotateCcw, 
  Terminal, 
  Database, 
  ShieldCheck, 
  Activity,
  Layers,
  Search,
  BookOpen,
  ChevronRight,
  LogIn,
  LogOut,
  User as UserIcon,
  ShieldAlert,
  TrendingDown,
  Filter,
  Award,
  Cpu,
  Flame,
  ExternalLink,
  Sparkles,
  GitFork,
  Compass,
  Bot,
  Wrench,
  Binary
} from 'lucide-react';
import { 
  Agent, 
  Lemma, 
  NegativeResult, 
  OrchestratorState, 
  MillenniumProblemId, 
  PortfolioTier,
  StrategyId 
} from './types';
import { INITIAL_STATE, MILLENNIUM_PROBLEMS } from './constants';
import { AgentCard } from './components/AgentCard';
import { LemmaNode } from './components/LemmaNode';
import { NegativeLedger } from './components/NegativeLedger';
import { StrategyTracksView } from './components/StrategyTracksView';
import { NavierStokesAuditPanel } from './components/NavierStokesAuditPanel';
import { MeasurableProxyPanel } from './components/MeasurableProxyPanel';
import { BarrierMatrixPanel } from './components/BarrierMatrixPanel';
import { LeanKernelTerminal } from './components/LeanKernelTerminal';
import { BenchmarkBenchPanel } from './components/BenchmarkBenchPanel';
import { DeterministicCorePanel } from './components/DeterministicCorePanel';
import { ProcessOraclePanel } from './components/ProcessOraclePanel';
import { AndOrGraphPanel } from './components/AndOrGraphPanel';
import { McheFrontierPanel } from './components/McheFrontierPanel';
import { MillenniumProgramHub } from './components/MillenniumProgramHub';
import { LlamaLocalEnginePanel } from './components/LlamaLocalEnginePanel';
import { OpenSourceToolsPanel } from './components/OpenSourceToolsPanel';
import { KernelCertificateCompilerPanel } from './components/KernelCertificateCompilerPanel';
import { auth, loginWithGoogle, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';

export default function App() {
  const [state, setState] = useState<OrchestratorState>(INITIAL_STATE);
  const [selectedProblemId, setSelectedProblemId] = useState<MillenniumProblemId>('riemann_hypothesis');
  const [activeTab, setActiveTab] = useState<
    'millennium_program' | 'kernel_compiler' | 'llama_local' | 'os_tools' | 'frontier_mche' | 'tracks' | 'and_or_graph' | 'deterministic_core' | 'process_oracle' | 'ns_audit' | 'proxy' | 'barriers' | 'dag' | 'kernel' | 'bench'
  >('millennium_program');
  const [isRunning, setIsRunning] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeSwarmId, setActiveSwarmId] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Current problem metadata
  const currentProblem = MILLENNIUM_PROBLEMS[selectedProblemId] || MILLENNIUM_PROBLEMS.riemann_hypothesis;

  // Auth Listener
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
  }, []);

  // WebSocket Listener
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'STATE_UPDATE') {
          if (msg.state.id) setActiveSwarmId(msg.state.id);
          setState(prev => ({
            ...prev,
            ...msg.state,
            tracks: msg.state.tracks || prev.tracks,
            agents: msg.state.agents || prev.agents,
            lemmas: msg.state.lemmas || prev.lemmas,
            ledger: msg.state.ledger || prev.ledger,
            logs: msg.state.logs || prev.logs,
            proxyData: msg.state.proxyData || prev.proxyData,
            barrierAudits: msg.state.barrierAudits || prev.barrierAudits,
            claimAudits: msg.state.claimAudits || prev.claimAudits,
            backlogStatus: msg.state.backlogStatus || prev.backlogStatus,
            alwaysOnJobs: msg.state.alwaysOnJobs || prev.alwaysOnJobs,
            latestPslqResults: msg.state.latestPslqResults || prev.latestPslqResults,
            latestEGraphEquivalences: msg.state.latestEGraphEquivalences || prev.latestEGraphEquivalences,
            latestRamanujanIdentities: msg.state.latestRamanujanIdentities || prev.latestRamanujanIdentities,
            latestMutations: msg.state.latestMutations || prev.latestMutations,
            latestDagBridges: msg.state.latestDagBridges || prev.latestDagBridges,
            ladderReports: msg.state.ladderReports || prev.ladderReports,
            latestProcessOracleEval: msg.state.latestProcessOracleEval || prev.latestProcessOracleEval
          }));
          setIsRunning(msg.state.phase === 'executing' || msg.state.phase === 'decomposing');
        }
      } catch (e) {}
    };

    setSocket(ws);
    return () => ws.close();
  }, []);

  // Firestore Swarm Sync
  useEffect(() => {
    if (!activeSwarmId || !user) return;

    const swarmRef = doc(db, 'swarms', activeSwarmId);
    const unsubSwarm = onSnapshot(swarmRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setState(prev => ({ ...prev, ...data }));
        setIsRunning(data.phase === 'executing' || data.phase === 'decomposing');
      }
    });

    const lemmasRef = collection(db, 'swarms', activeSwarmId, 'lemmas');
    const unsubLemmas = onSnapshot(lemmasRef, (snapshot) => {
      const lemmas = snapshot.docs.map(doc => doc.data() as Lemma);
      if (lemmas.length > 0) setState(prev => ({ ...prev, lemmas }));
    });

    const logsRef = query(collection(db, 'swarms', activeSwarmId, 'logs'), orderBy('timestamp', 'asc'));
    const unsubLogs = onSnapshot(logsRef, (snapshot) => {
      const logs = snapshot.docs.map(doc => doc.data().message);
      if (logs.length > 0) setState(prev => ({ ...prev, logs }));
    });

    return () => {
      unsubSwarm();
      unsubLemmas();
      unsubLogs();
    };
  }, [activeSwarmId, user]);

  const handleProblemChange = (problemId: MillenniumProblemId) => {
    setSelectedProblemId(problemId);
    const meta = MILLENNIUM_PROBLEMS[problemId] || MILLENNIUM_PROBLEMS.riemann_hypothesis;
    setState(prev => ({
      ...prev,
      problemId,
      targetTheorem: meta.title,
      targetStatement: meta.formalStatementLean,
      activePortfolioTier: meta.recommendedTier,
      activeStrategies: meta.bestFitStrategies
    }));

    // Switch to problem-appropriate default tab
    if (problemId === 'navier_stokes') setActiveTab('ns_audit');
    else if (problemId === 'riemann_hypothesis') setActiveTab('proxy');
    else if (problemId === 'p_vs_np') setActiveTab('barriers');
    else setActiveTab('tracks');
  };

  const handleTierChange = (tier: PortfolioTier) => {
    setState(prev => ({ ...prev, activePortfolioTier: tier }));
  };

  const startMission = (specificStrategy?: StrategyId) => {
    const swarmId = `swarm_${Date.now()}`;
    setActiveSwarmId(swarmId);
    setIsRunning(true);

    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify({
        type: 'START_SWARM',
        swarmId,
        uid: user ? user.uid : 'anon_mathematician',
        problemId: selectedProblemId,
        portfolioTier: state.activePortfolioTier,
        strategyId: specificStrategy
      }));
    }
  };

  const triggerSingleStrategy = (strategyId: StrategyId) => {
    startMission(strategyId);
  };

  const resetState = () => {
    setState(INITIAL_STATE);
    setIsRunning(false);
    setActiveSwarmId(null);
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [state.logs]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      {/* Top Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-white uppercase">Lean Swarm Orchestrator</h1>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  KERNEL 4.16.0
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Deterministic Verification Shell · 8 Strategy Taxonomy · Clay Millennium Problems
              </p>
            </div>
          </div>

          {/* Problem Selector & Tier Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Millennium Problem Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              <span className="text-[10px] font-mono text-zinc-400 px-2 uppercase font-bold">Target:</span>
              <select
                value={selectedProblemId}
                onChange={(e) => handleProblemChange(e.target.value as MillenniumProblemId)}
                className="bg-black/60 text-xs text-zinc-100 font-medium rounded px-2.5 py-1 border border-zinc-700/80 focus:outline-none focus:border-blue-500"
              >
                {Object.values(MILLENNIUM_PROBLEMS).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.prizeAmount})
                  </option>
                ))}
              </select>
            </div>

            {/* Portfolio Tier Selector */}
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-[11px] font-mono">
              <button
                onClick={() => handleTierChange('tier1_infra')}
                className={`px-2 py-1 rounded transition-colors ${state.activePortfolioTier === 'tier1_infra' ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
                title="Tier 1: Infrastructure as Output (Autoformalization)"
              >
                T1: Infra
              </button>
              <button
                onClick={() => handleTierChange('tier2_proxy')}
                className={`px-2 py-1 rounded transition-colors ${state.activePortfolioTier === 'tier2_proxy' ? 'bg-blue-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
                title="Tier 2: Measurable Progress (RH proxy bounds)"
              >
                T2: Proxy
              </button>
              <button
                onClick={() => handleTierChange('tier3_audit')}
                className={`px-2 py-1 rounded transition-colors ${state.activePortfolioTier === 'tier3_audit' ? 'bg-amber-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
                title="Tier 3: High-Value Audit Work (Navier-Stokes OpenAI Claim Verification)"
              >
                T3: Audit
              </button>
              <button
                onClick={() => handleTierChange('tier4_moonshot')}
                className={`px-2 py-1 rounded transition-colors ${state.activePortfolioTier === 'tier4_moonshot' ? 'bg-purple-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
                title="Tier 4: Moonshot Tracks (Full Statement Proof Search)"
              >
                T4: Moonshot
              </button>
            </div>
          </div>

          {/* Controls: Start Swarm, Auth, Reset */}
          <div className="flex items-center gap-3 justify-end">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-mono text-zinc-400 uppercase">Spent / Budget</span>
              <div className="text-xs font-mono font-semibold text-emerald-400">
                ${state.spent.toFixed(2)} / ${state.budget.toFixed(2)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => startMission()}
                disabled={isRunning}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                <Play size={13} className="fill-current" />
                {isRunning ? 'Swarm Running...' : 'Start Swarm Mission'}
              </button>

              <button
                onClick={resetState}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Reset State"
              >
                <RotateCcw size={14} />
              </button>

              {user ? (
                <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
                  <span className="text-[11px] font-mono text-zinc-400 max-w-[90px] truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <button onClick={() => auth.signOut()} title="Sign out" className="text-zinc-400 hover:text-zinc-200">
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={loginWithGoogle}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogIn size={13} />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Millennium Problem Overview Sub-Header */}
        <div className="border-t border-zinc-800/80 bg-black/40 px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="font-semibold text-zinc-200">{currentProblem.title}</span>
              <span className="text-[10px] font-mono text-zinc-400">Clay Prize: {currentProblem.prizeAmount} ({currentProblem.clayPrizeYear})</span>
              <a
                href={currentProblem.clayOfficialDocUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
              >
                Official Formulation <ExternalLink size={10} />
              </a>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
              <span className="text-zinc-500">Objective:</span>
              <span className="text-zinc-300 max-w-xl truncate">{currentProblem.activeObjective}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-zinc-800/60 bg-zinc-950/90 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1800px] mx-auto flex items-center gap-1 overflow-x-auto py-1.5 text-xs font-medium">
            <button
              onClick={() => setActiveTab('millennium_program')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors ${activeTab === 'millennium_program' ? 'bg-blue-600/25 text-blue-300 font-semibold border border-blue-500/50 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <Compass size={13} className="text-blue-400" />
              Millennium Program Hub (7 Tracks & 3 Pillars)
            </button>

            <button
              onClick={() => setActiveTab('kernel_compiler')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors ${activeTab === 'kernel_compiler' ? 'bg-emerald-600/25 text-emerald-300 font-semibold border border-emerald-500/50 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <Binary size={13} className="text-emerald-400" />
              Kernel-Certificate Compiler (Conductor Loop)
            </button>

            <button
              onClick={() => setActiveTab('llama_local')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors ${activeTab === 'llama_local' ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <Bot size={13} className="text-emerald-400" />
              Llama Local Models (Ollama / vLLM)
            </button>

            <button
              onClick={() => setActiveTab('os_tools')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors ${activeTab === 'os_tools' ? 'bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/40 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <Wrench size={13} className="text-blue-400" />
              Open Source Tools (Z3 / CAS / ATP / RAG)
            </button>

            <button
              onClick={() => setActiveTab('frontier_mche')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors ${activeTab === 'frontier_mche' ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <Flame size={13} className="text-amber-400" />
              MCHE & 5-Camp Frontier Synthesis
            </button>

            <button
              onClick={() => setActiveTab('and_or_graph')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors ${activeTab === 'and_or_graph' ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <GitFork size={13} className="text-cyan-400" />
              AND–OR Graph & Factorization (LeanTree)
            </button>

            <button
              onClick={() => setActiveTab('tracks')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors ${activeTab === 'tracks' ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <Layers size={13} />
              8-Strategy Taxonomy
            </button>

            <button
              onClick={() => setActiveTab('deterministic_core')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors ${activeTab === 'deterministic_core' ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/20' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <Cpu size={13} className="text-emerald-400" />
              Deterministic Core & Ladder
            </button>

            <button
              onClick={() => setActiveTab('process_oracle')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors ${activeTab === 'process_oracle' ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <Sparkles size={13} className="text-indigo-400" />
              Process Oracle & GRPO
            </button>

            <button
              onClick={() => setActiveTab('ns_audit')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors ${activeTab === 'ns_audit' ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/20' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <ShieldAlert size={13} className="text-amber-400" />
              Navier–Stokes OpenAI Audit (Tier 3)
            </button>

            <button
              onClick={() => setActiveTab('proxy')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors ${activeTab === 'proxy' ? 'bg-blue-500/15 text-blue-400 font-semibold border border-blue-500/20' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <TrendingDown size={13} />
              Measurable Proxy Tracks (RH $\Lambda \le 0.178$)
            </button>

            <button
              onClick={() => setActiveTab('barriers')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors ${activeTab === 'barriers' ? 'bg-rose-500/15 text-rose-400 font-semibold border border-rose-500/20' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <Filter size={13} />
              Barrier-Aware Routing (BGS/RR/AW)
            </button>

            <button
              onClick={() => setActiveTab('dag')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors ${activeTab === 'dag' ? 'bg-purple-500/15 text-purple-300 font-semibold border border-purple-500/20' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <Layers size={13} />
              Lemma DAG ({state.lemmas.length})
            </button>

            <button
              onClick={() => setActiveTab('kernel')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors ${activeTab === 'kernel' ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/20' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <Terminal size={13} />
              Lean 4 Kernel Terminal
            </button>

            <button
              onClick={() => setActiveTab('bench')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors ${activeTab === 'bench' ? 'bg-purple-500/15 text-purple-300 font-semibold border border-purple-500/20' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <Award size={13} />
              ProblemBench Harness
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-12 gap-6">
        {/* Left Column: Swarm Agents (3 cols) */}
        <section className="col-span-12 lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Activity size={14} className="text-blue-400" />
              Autonomous Agent Swarm
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              {state.agents.length} Specialized Units
            </span>
          </div>

          <div className="grid gap-2.5">
            {state.agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </section>

        {/* Center Column: Active Tab Workstation (6 cols) */}
        <section className="col-span-12 lg:col-span-6 space-y-6">
          {activeTab === 'millennium_program' && (
            <MillenniumProgramHub
              selectedProblemId={selectedProblemId}
              onSelectProblem={(id) => setSelectedProblemId(id)}
            />
          )}

          {activeTab === 'kernel_compiler' && (
            <KernelCertificateCompilerPanel />
          )}

          {activeTab === 'llama_local' && (
            <LlamaLocalEnginePanel />
          )}

          {activeTab === 'os_tools' && (
            <OpenSourceToolsPanel />
          )}

          {activeTab === 'frontier_mche' && (
            <McheFrontierPanel />
          )}

          {activeTab === 'and_or_graph' && (
            <AndOrGraphPanel initialRun={state.latestTheoremRun} />
          )}

          {activeTab === 'tracks' && (
            <StrategyTracksView
              tracks={state.tracks}
              onTriggerStrategy={triggerSingleStrategy}
              isRunning={isRunning}
            />
          )}

          {activeTab === 'deterministic_core' && (
            <DeterministicCorePanel
              latestPslq={state.latestPslqResults}
              latestEGraph={state.latestEGraphEquivalences}
              latestRamanujan={state.latestRamanujanIdentities}
              latestMutations={state.latestMutations}
              latestDagBridges={state.latestDagBridges}
              ladderReports={state.ladderReports}
              backlogStatus={state.backlogStatus}
              alwaysOnJobs={state.alwaysOnJobs}
            />
          )}

          {activeTab === 'process_oracle' && (
            <ProcessOraclePanel
              initialEvaluation={state.latestProcessOracleEval}
            />
          )}

          {activeTab === 'ns_audit' && (
            <NavierStokesAuditPanel
              auditData={state.claimAudits && state.claimAudits[0]}
            />
          )}

          {activeTab === 'proxy' && (
            <MeasurableProxyPanel
              proxyData={state.proxyData}
            />
          )}

          {activeTab === 'barriers' && (
            <BarrierMatrixPanel
              barrierAudits={state.barrierAudits}
            />
          )}

          {activeTab === 'dag' && (
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/70 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-200">
                    Strategy 2: Recursive Lemma Decomposition DAG
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Target: {state.targetTheorem}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 bg-black/40 px-2 py-0.5 rounded border border-zinc-800">
                  {state.lemmas.length} Topological Nodes
                </span>
              </div>

              {state.lemmas.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                  <BookOpen size={36} className="mx-auto mb-2 text-zinc-600" />
                  <p className="text-xs font-mono">No sub-lemmas decomposed yet.</p>
                  <button
                    onClick={() => triggerSingleStrategy('S2_RECURSIVE_DECOMP')}
                    className="mt-3 px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white font-mono"
                  >
                    Trigger Strategy 2 (Decomposition)
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <AnimatePresence>
                    {state.lemmas.map((lemma) => (
                      <LemmaNode key={lemma.id} lemma={lemma} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {activeTab === 'kernel' && (
            <LeanKernelTerminal />
          )}

          {activeTab === 'bench' && (
            <BenchmarkBenchPanel benchmarks={state.benchmarkTracks} />
          )}

          {/* Orchestrator Logs Terminal (Always visible in center column) */}
          <div className="rounded-xl border border-zinc-800 bg-black/90 p-4 flex flex-col h-[280px]">
            <div className="flex items-center justify-between mb-2 text-zinc-400 border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-emerald-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  Deterministic Shell State Machine Logs
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                {state.logs.length} transitions recorded
              </span>
            </div>

            <div
              ref={logContainerRef}
              className="flex-1 overflow-y-auto font-mono text-[11px] space-y-1 pr-2 scrollbar-thin scrollbar-thumb-zinc-800"
            >
              {state.logs.map((log, i) => (
                <div key={i} className="text-zinc-300 leading-relaxed">
                  <span className="text-emerald-500 select-none mr-1.5">$</span>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column: Negative Results Ledger & Substrate (3 cols) */}
        <section className="col-span-12 lg:col-span-3 space-y-6">
          {/* Negative Ledger */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/70">
            <NegativeLedger ledger={state.ledger} />
          </div>

          {/* Knowledge Substrate & Library Corpus */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/70 space-y-3.5">
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Database size={14} className="text-blue-400" />
              Content-Addressed Substrate
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="font-semibold">Mathlib4 Index</span>
                  <span className="text-[10px] font-mono text-emerald-400">94k+ theorems</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Local Lean 4.16.0 mathlib environment typechecker ready for imports.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="font-semibold">arXiv Literature Gateway</span>
                  <span className="text-[10px] font-mono text-blue-400">XML Provenance</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Deterministic arXiv ingestion extracting titles, abstracts, and hashes.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="font-semibold">Deterministic Kernel</span>
                  <span className="text-[10px] font-mono text-emerald-400">/root/.elan/bin/lean</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Zero LLMs in the verification gate. All artifacts compiled by Lean kernel.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
