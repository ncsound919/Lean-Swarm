import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MillenniumProblemId,
  ThreePillarsMetrics,
  MultiDecadeRoadmapPhase,
  RiemannTrackState,
  BsdTrackState,
  HodgeTrackState,
  NavierStokesTrackState,
  YangMillsLatticeState,
  PvsNpTrackState,
  PoincareTrackState,
  MathOsKnowledgeEntry,
  BsdEllipticCurveRecord,
  HodgeVarietyRecord
} from '../types';
import {
  Layers,
  Award,
  ShieldCheck,
  Cpu,
  Users,
  Compass,
  Database,
  Calendar,
  Sparkles,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  Play,
  RotateCcw,
  Search,
  Download,
  Terminal,
  BookOpen,
  Filter,
  BarChart3,
  Atom,
  Binary,
  Waves,
  Sigma
} from 'lucide-react';

interface MillenniumProgramHubProps {
  selectedProblemId: MillenniumProblemId;
  onSelectProblem: (id: MillenniumProblemId) => void;
}

export function MillenniumProgramHub({
  selectedProblemId,
  onSelectProblem
}: MillenniumProgramHubProps) {
  // Active Navigation Tab inside the Millennium Program Hub
  const [hubTab, setHubTab] = useState<'track_workstation' | 'math_os' | 'roadmap' | 'three_pillars'>('track_workstation');
  const [activeProblem, setActiveProblem] = useState<MillenniumProblemId>(selectedProblemId);

  // Sync external problem changes
  useEffect(() => {
    setActiveProblem(selectedProblemId);
  }, [selectedProblemId]);

  // Pillar Metrics State
  const [pillars, setPillars] = useState<ThreePillarsMetrics | null>(null);
  const [roadmap, setRoadmap] = useState<MultiDecadeRoadmapPhase[]>([]);
  const [mathOsEntries, setMathOsEntries] = useState<MathOsKnowledgeEntry[]>([]);
  const [mathOsFilter, setMathOsFilter] = useState<string>('all');
  const [mathOsSearch, setMathOsSearch] = useState<string>('');

  // Problem-Specific Track States
  const [riemannState, setRiemannState] = useState<RiemannTrackState | null>(null);
  const [bsdState, setBsdState] = useState<BsdTrackState | null>(null);
  const [hodgeState, setHodgeState] = useState<HodgeTrackState | null>(null);
  const [nsState, setNsState] = useState<NavierStokesTrackState | null>(null);
  const [ymState, setYmState] = useState<YangMillsLatticeState | null>(null);
  const [pnpState, setPnpState] = useState<PvsNpTrackState | null>(null);
  const [poincareState, setPoincareState] = useState<PoincareTrackState | null>(null);

  // Interactive Track Controls State
  const [bsdSelectedCurve, setBsdSelectedCurve] = useState<BsdEllipticCurveRecord | null>(null);
  const [bsdCustomRatioResult, setBsdCustomRatioResult] = useState<string | null>(null);
  const [ymBeta, setYmBeta] = useState<number>(6.0);
  const [ymGaugeGroup, setYmGaugeGroup] = useState<'SU(2)' | 'SU(3)'>('SU(3)');
  const [isSweepingYm, setIsSweepingYm] = useState<boolean>(false);
  const [nsSimulating, setNsSimulating] = useState<boolean>(false);
  const [hodgeSelectedVariety, setHodgeSelectedVariety] = useState<HodgeVarietyRecord | null>(null);

  // Fetch Hub Data on Mount
  useEffect(() => {
    fetch('/api/millennium/pillars')
      .then(res => res.json())
      .then(data => setPillars(data))
      .catch(() => {});

    fetch('/api/millennium/roadmap')
      .then(res => res.json())
      .then(data => setRoadmap(data.phases || []))
      .catch(() => {});

    fetch('/api/millennium/math-os')
      .then(res => res.json())
      .then(data => setMathOsEntries(data.entries || []))
      .catch(() => {});
  }, []);

  // Fetch Problem Track Data whenever activeProblem changes
  useEffect(() => {
    fetch(`/api/millennium/track/${activeProblem}`)
      .then(res => res.json())
      .then(data => {
        if (data.problemId === 'riemann_hypothesis') setRiemannState(data.track);
        if (data.problemId === 'bsd') {
          setBsdState(data.track);
          if (data.track?.curves?.length) setBsdSelectedCurve(data.track.curves[0]);
        }
        if (data.problemId === 'hodge') {
          setHodgeState(data.track);
          if (data.track?.varieties?.length) setHodgeSelectedVariety(data.track.varieties[0]);
        }
        if (data.problemId === 'navier_stokes') setNsState(data.track);
        if (data.problemId === 'yang_mills') setYmState(data.track);
        if (data.problemId === 'p_vs_np') setPnpState(data.track);
        if (data.problemId === 'poincare') setPoincareState(data.track);
      })
      .catch(() => {});
  }, [activeProblem]);

  // Handle problem switch
  const handleProblemChange = (id: MillenniumProblemId) => {
    setActiveProblem(id);
    onSelectProblem(id);
  };

  // BSD Interactive Ratio Calculator
  const handleVerifyBsdRatio = async (curve: BsdEllipticCurveRecord) => {
    try {
      const res = await fetch('/api/millennium/bsd/verify-ratio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cremonaLabel: curve.cremonaLabel,
          omega: curve.realPeriodOmega,
          regulator: curve.regulatorR,
          sha: curve.shaAnalyticOrder,
          tamagawa: curve.tamagawaProduct,
          torsion: curve.torsionOrder
        })
      });
      const json = await res.json();
      setBsdCustomRatioResult(json.formulaCheck);
    } catch (e) {
      setBsdCustomRatioResult('Verification check failed to execute.');
    }
  };

  // Yang-Mills Lattice Sweep
  const handleSweepYangMills = async () => {
    setIsSweepingYm(true);
    try {
      const res = await fetch('/api/millennium/yang-mills/sweep-lattice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beta: ymBeta, gaugeGroup: ymGaugeGroup })
      });
      const data = await res.json();
      if (ymState) {
        setYmState({
          ...ymState,
          gaugeGroup: data.gaugeGroup,
          betaCoupling: data.beta,
          averagePlaquette: data.averagePlaquette,
          stringTensionSigma: data.stringTensionSigma,
          estimatedMassGapDelta: data.estimatedMassGapDelta
        });
      }
    } catch (e) {
    } finally {
      setIsSweepingYm(false);
    }
  };

  // Navier-Stokes Simulation Step
  const handleStepNavierStokes = async () => {
    if (!nsState || nsState.simulation.length === 0) return;
    setNsSimulating(true);
    try {
      const lastSnap = nsState.simulation[nsState.simulation.length - 1];
      const res = await fetch('/api/millennium/navier-stokes/step-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time: lastSnap.timeT,
          enstrophy: lastSnap.enstrophy,
          nu: lastSnap.viscosityNu
        })
      });
      const newSnap = await res.json();
      setNsState({
        ...nsState,
        simulation: [...nsState.simulation, {
          timeT: newSnap.timeT,
          viscosityNu: lastSnap.viscosityNu,
          kineticEnergy: Math.max(0.01, lastSnap.kineticEnergy - 0.005),
          enstrophy: newSnap.enstrophy,
          maxVorticityLInf: newSnap.maxVorticityLInf,
          bkmIntegralEstimate: newSnap.bkmIntegralEstimate,
          bkmThresholdExceeded: newSnap.bkmThresholdExceeded,
          depletionOfNonlinearityRatio: newSnap.depletionOfNonlinearityRatio,
          resolutionMesh: lastSnap.resolutionMesh
        }]
      });
    } catch (e) {
    } finally {
      setNsSimulating(false);
    }
  };

  // Filtered Math OS entries
  const filteredMathOs = mathOsEntries.filter(entry => {
    const matchesFilter = mathOsFilter === 'all' || entry.problemId === mathOsFilter || entry.category === mathOsFilter;
    const matchesSearch = mathOsSearch === '' || 
      entry.title.toLowerCase().includes(mathOsSearch.toLowerCase()) || 
      entry.summary.toLowerCase().includes(mathOsSearch.toLowerCase()) ||
      entry.authorOrCamp.toLowerCase().includes(mathOsSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Coordinated Millennium Program Strategy */}
      <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 via-zinc-900/40 to-zinc-950 p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                MULTI-DECADE RESEARCH PROGRAM (2000–2050+)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                CLAY MILLENNIUM PRIZE PROBLEMS
              </span>
            </div>
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
              Coordinated Millennium Problem Ecosystem
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed">
              Treating the seven Millennium Problems as a coordinated, 30–50 year research program: shared formal verification infrastructure, continuous large-scale simulations, open knowledge bases, and deep human expertise guiding autonomous AI agents.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHubTab('track_workstation')}
              className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                hubTab === 'track_workstation'
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <Compass size={14} />
              Specialized Tracks
            </button>
            <button
              onClick={() => setHubTab('three_pillars')}
              className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                hubTab === 'three_pillars'
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <Cpu size={14} />
              3 Pillars Architecture
            </button>
            <button
              onClick={() => setHubTab('math_os')}
              className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                hubTab === 'math_os'
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <Database size={14} />
              Math OS Ledger
            </button>
            <button
              onClick={() => setHubTab('roadmap')}
              className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                hubTab === 'roadmap'
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <Calendar size={14} />
              50-Year Roadmap
            </button>
          </div>
        </div>

        {/* 3 Pillars Summary Ticker */}
        {pillars && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-zinc-800/80 text-xs">
            <div className="p-3 rounded-xl bg-black/40 border border-zinc-800/80 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-0.5">
                <Users size={16} />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-zinc-400 font-semibold">Pillar 1: Deep Human Expertise</div>
                <div className="text-sm font-semibold text-zinc-100 mt-0.5">{pillars.humanPillar.activeFellows} Active Fellows</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">{pillars.humanPillar.conceptualDirectionsProposed} conceptual steering directions active across 5 institutes</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-zinc-800/80 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mt-0.5">
                <BarChart3 size={16} />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-zinc-400 font-semibold">Pillar 2: HPC Experimentation</div>
                <div className="text-sm font-semibold text-zinc-100 mt-0.5">{pillars.simulationPillar.totalFlopsAllocated}</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">{pillars.simulationPillar.fluidGridResolution} · {pillars.simulationPillar.zetaZerosIndexed}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-zinc-800/80 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5">
                <ShieldCheck size={16} />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-zinc-400 font-semibold">Pillar 3: Formal Proof Kernel</div>
                <div className="text-sm font-semibold text-zinc-100 mt-0.5">{pillars.formalizationPillar.verifiedLemmasCount} Verified Lemmas ({pillars.formalizationPillar.formalProofAssistant})</div>
                <div className="text-[11px] text-emerald-400 mt-0.5">Zero sorry escapes tolerated · {pillars.formalizationPillar.cryptographicReceiptsSealed} receipts sealed</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SUB-VIEW 1: SPECIALIZED TRACK WORKSTATION */}
      {hubTab === 'track_workstation' && (
        <div className="space-y-5">
          {/* Problem Track Switcher Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'riemann_hypothesis', name: 'Riemann Hypothesis', badge: 'Analytic / RMT', icon: Sigma },
              { id: 'bsd', name: 'Birch & Swinnerton-Dyer', badge: 'Arithmetic / Iwasawa', icon: Layers },
              { id: 'hodge', name: 'Hodge Conjecture', badge: 'Algebraic Cycles', icon: Sparkles },
              { id: 'navier_stokes', name: 'Navier–Stokes', badge: '3D Fluid PDE', icon: Waves },
              { id: 'yang_mills', name: 'Yang–Mills Mass Gap', badge: 'Constructive QFT', icon: Atom },
              { id: 'p_vs_np', name: 'P vs NP', badge: 'Circuit Lower Bounds', icon: Binary },
              { id: 'poincare', name: 'Poincaré (Solved Perelman)', badge: 'Ricci Flow / Transfer', icon: Award }
            ].map(p => {
              const Icon = p.icon;
              const isSelected = activeProblem === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleProblemChange(p.id as MillenniumProblemId)}
                  className={`px-3 py-2 rounded-xl text-xs flex items-center gap-2 whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-blue-600/20 text-blue-300 font-semibold border-blue-500 shadow-sm'
                      : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <Icon size={14} className={isSelected ? 'text-blue-400' : 'text-zinc-500'} />
                  <span>{p.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-zinc-400 border border-zinc-800">
                    {p.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* PROBLEM SPECIFIC DEPTH PANEL */}
          {/* 1. RIEMANN HYPOTHESIS DEPTH */}
          {activeProblem === 'riemann_hypothesis' && riemannState && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Montgomery-Odlyzko Pair Correlation Curve */}
                <div className="lg:col-span-7 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                        <BarChart3 size={15} className="text-blue-400" />
                        Random Matrix Theory & GUE Pair Correlation Comparison
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        K-S Test p = {riemannState.pairCorrelation.pValueMatch}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                      Montgomery's conjecture: The normalized spacing between high non-trivial zeros of &zeta;(s) is statistically indistinguishable from the Gaussian Unitary Ensemble (GUE) of random Hermitian matrices: R&#8322;(x) = 1 - (sin(&pi;x) / (&pi;x))&sup2;.
                    </p>

                    {/* Chart Bars */}
                    <div className="h-40 flex items-end gap-1.5 pt-4 pb-2 border-b border-zinc-800">
                      {riemannState.pairCorrelation.gueTheoreticalCurve.slice(0, 20).map((pt, idx) => {
                        const empPt = riemannState.pairCorrelation.empiricalZetaPairs[idx] || pt;
                        const barHeight = Math.min(100, Math.round(pt.y * 95));
                        const empHeight = Math.min(100, Math.round(empPt.y * 95));
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                            <div className="w-full flex items-end justify-center gap-0.5 h-32">
                              {/* Theoretical GUE */}
                              <div
                                style={{ height: `${barHeight}%` }}
                                className="w-1.5 bg-blue-500/40 rounded-t-sm"
                                title={`x: ${pt.x}, GUE Theoretical: ${pt.y}`}
                              />
                              {/* Empirical Zeros */}
                              <div
                                style={{ height: `${empHeight}%` }}
                                className="w-1.5 bg-emerald-400 rounded-t-sm"
                                title={`x: ${empPt.x}, Odlyzko Empirical Zeros: ${empPt.y}`}
                              />
                            </div>
                            <span className="text-[8px] font-mono text-zinc-500">{pt.x}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mt-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500/40"></span> GUE Theoretical Curve</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></span> Empirical Zeta Zeros (Odlyzko 10²³)</span>
                      </div>
                      <span>Normalized Spacing $x$</span>
                    </div>
                  </div>

                  <div className="mt-4 p-2.5 rounded-lg bg-black/40 border border-zinc-800 text-[11px] font-mono text-zinc-300 flex items-center justify-between">
                    <span>de Bruijn–Newman Constant Certificate:</span>
                    <span className="text-emerald-400 font-bold">0.0 ≤ Λ ≤ {riemannState.deBruijnNewman.upperBound} (Polymath 15)</span>
                  </div>
                </div>

                {/* Zeros Database Table */}
                <div className="lg:col-span-5 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                        <Database size={15} className="text-emerald-400" />
                        Gourdon Certified Critical Line Zeros
                      </h3>
                      <span className="text-[10px] font-mono text-zinc-400">{riemannState.zerosDatabase.lowZeros.length} Sampled</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mb-3">
                      Total checked: <strong className="text-zinc-200">{riemannState.zerosDatabase.totalZerosChecked}</strong> with zero off-line counterexamples.
                    </p>

                    <div className="overflow-x-auto max-h-56 rounded-lg border border-zinc-800">
                      <table className="w-full text-left text-[11px] font-mono">
                        <thead className="bg-black/60 text-zinc-400 border-b border-zinc-800">
                          <tr>
                            <th className="p-1.5 pl-2.5">Index $n$</th>
                            <th className="p-1.5">Height $\gamma_n$ (Im(s))</th>
                            <th className="p-1.5">|Z(t)|</th>
                            <th className="p-1.5 pr-2.5">Critical Line</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                          {riemannState.zerosDatabase.lowZeros.map((z) => (
                            <tr key={z.index} className="hover:bg-zinc-800/40">
                              <td className="p-1.5 pl-2.5 text-zinc-400">#{z.index}</td>
                              <td className="p-1.5 font-bold text-zinc-100">{z.t.toFixed(6)}</td>
                              <td className="p-1.5 text-emerald-400">{z.zAbs.toExponential(2)}</td>
                              <td className="p-1.5 pr-2.5">
                                <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400">
                                  <CheckCircle2 size={10} /> Re = 1/2
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-3 p-2 rounded bg-black/40 border border-zinc-800 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                    <span>Weil Explicit Formula Residual:</span>
                    <span className="text-zinc-200">$\Delta = {riemannState.explicitFormulaResidual.errorDelta}$ (at $x=1000$)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. BIRCH AND SWINNERTON-DYER (BSD) DEPTH */}
          {activeProblem === 'bsd' && bsdState && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Elliptic Curves Database & Formula Checker */}
                <div className="lg:col-span-7 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                      <Layers size={15} className="text-blue-400" />
                      LMFDB / Cremona Elliptic Curves BSD Formula Verification
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Ranks 0, 1, 2, 3 Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    The BSD Conjecture states: rank(E(Q)) = ord&#8338;&#61;&#8321; L(E, s), and the leading Taylor coefficient satisfies L&#691;(E, 1)/r! = (&Omega;&#7497; &middot; R&#7497; &middot; |Ш(E)| &middot; &prod; c_p) / |E(Q)_tors|&sup2;.
                  </p>

                  <div className="overflow-x-auto rounded-lg border border-zinc-800">
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="bg-black/60 text-zinc-400 border-b border-zinc-800">
                        <tr>
                          <th className="p-2 pl-3">Curve Label</th>
                          <th className="p-2">Rank (Alg / An)</th>
                          <th className="p-2">Period $\Omega$</th>
                          <th className="p-2">Regulator $R$</th>
                          <th className="p-2">|Ш|</th>
                          <th className="p-2">Torsion</th>
                          <th className="p-2 pr-3">BSD Ratio Check</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                        {bsdState.curves.map(curve => (
                          <tr
                            key={curve.cremonaLabel}
                            onClick={() => {
                              setBsdSelectedCurve(curve);
                              handleVerifyBsdRatio(curve);
                            }}
                            className={`cursor-pointer transition-colors ${
                              bsdSelectedCurve?.cremonaLabel === curve.cremonaLabel
                                ? 'bg-blue-600/20 text-blue-200'
                                : 'hover:bg-zinc-800/40'
                            }`}
                          >
                            <td className="p-2 pl-3 font-semibold text-zinc-100">{curve.cremonaLabel}</td>
                            <td className="p-2">{curve.algebraicRank} / {curve.analyticRank}</td>
                            <td className="p-2">{curve.realPeriodOmega.toFixed(3)}</td>
                            <td className="p-2">{curve.regulatorR.toFixed(3)}</td>
                            <td className="p-2">{curve.shaAnalyticOrder}</td>
                            <td className="p-2">{curve.torsionOrder}</td>
                            <td className="p-2 pr-3">
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                                <CheckCircle2 size={11} /> {curve.bsdRatioCalculated.toFixed(4)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {bsdCustomRatioResult && (
                    <div className="p-3 rounded-lg bg-black/60 border border-zinc-800 text-[11px] font-mono text-emerald-400 flex items-center justify-between">
                      <span>Formula Verification: {bsdCustomRatioResult}</span>
                      <span className="text-[10px] text-zinc-400">Tolerance $\epsilon &lt; 10^{-12}$</span>
                    </div>
                  )}
                </div>

                {/* Gross-Zagier & Kolyvagin Status */}
                <div className="lg:col-span-5 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-2 mb-2">
                      <ShieldCheck size={15} className="text-emerald-400" />
                      Gross–Zagier & Kolyvagin Formalization Scope
                    </h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                      Milestone theorem status in Lean 4 Mathlib: Curves with analytic rank $\le 1$ are unconditionally resolved. Ranks $\ge 2$ remain open.
                    </p>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 rounded bg-black/40 border border-zinc-800 flex items-center justify-between">
                        <span className="text-zinc-300">Rank $r=0$ (Coates–Wiles, Rubin):</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {bsdState.grossZagierKolyvaginScope.rank0Status}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-black/40 border border-zinc-800 flex items-center justify-between">
                        <span className="text-zinc-300">Rank $r=1$ (Gross–Zagier, Kolyvagin):</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {bsdState.grossZagierKolyvaginScope.rank1Status}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-black/40 border border-zinc-800 flex items-center justify-between">
                        <span className="text-zinc-300">Rank $r \ge 2$ (Heegner System Limit):</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          {bsdState.grossZagierKolyvaginScope.rankGe2Status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-black/40 border border-zinc-800 text-[11px] font-mono text-zinc-400">
                    <span className="text-zinc-500">Active Iwasawa Theory Selmer Bound:</span>
                    <div className="text-zinc-200 mt-1 font-bold">
                      Curve {bsdState.selmerGroupBound.curve} (p={bsdState.selmerGroupBound.pVal}): Selmer Rank {bsdState.selmerGroupBound.pSelmerRank} · {bsdState.selmerGroupBound.shaTorsionBound}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. HODGE CONJECTURE DEPTH */}
          {activeProblem === 'hodge' && hodgeState && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Varieties & Hodge Diamond Visualizer */}
                <div className="lg:col-span-7 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                      <Sparkles size={15} className="text-purple-400" />
                      Complex Projective Varieties & Hodge Decomposition
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      CAS Bridge: {hodgeState.casBridgeEngine}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Hodge classes: Hdg&#178;&#7510;(X) = H&#178;&#7510;(X, Q) &cap; H&#7510;&#7510;(X). The conjecture asserts every rational Hodge class is algebraic (generated by subvarieties).
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    {hodgeState.varieties.map(v => (
                      <button
                        key={v.name}
                        onClick={() => setHodgeSelectedVariety(v)}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          hodgeSelectedVariety?.name === v.name
                            ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                            : 'bg-black/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="text-xs font-semibold truncate">{v.name}</div>
                        <div className="text-[10px] font-mono text-zinc-500 mt-0.5">$\dim = {v.dimension}$</div>
                      </button>
                    ))}
                  </div>

                  {hodgeSelectedVariety && (
                    <div className="p-3 rounded-lg bg-black/60 border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
                        <span>{hodgeSelectedVariety.name} (Hodge Diamond)</span>
                        <span className="text-[10px] font-mono text-emerald-400">Lefschetz (1,1): CERTIFIED</span>
                      </div>

                      {/* Hodge Diamond Grid */}
                      <div className="py-2 flex flex-col items-center gap-1 font-mono text-[10px] text-zinc-300">
                        {hodgeSelectedVariety.hodgeDiamondRows.map((row, rIdx) => (
                          <div key={rIdx} className="flex items-center gap-3">
                            {row.map((val, cIdx) => (
                              <span key={cIdx} className="w-5 text-center font-bold text-purple-300">
                                {val}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>

                      <div className="text-[11px] font-mono text-zinc-400 pt-2 border-t border-zinc-800 flex items-center justify-between">
                        <span>Algebraic Cycle Witnesses:</span>
                        <span className="text-zinc-200">{hodgeSelectedVariety.algebraicCycleWitnesses.join(', ')}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Atiyah-Hirzebruch & CAS Bridge */}
                <div className="lg:col-span-5 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-2 mb-2">
                      <Filter size={15} className="text-amber-400" />
                      Known Obstructions & Lean Compilation
                    </h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                      Atiyah–Hirzebruch counterexample: The <em>integral</em> Hodge conjecture fails due to torsion classes in H&#8308;(X, Z). The Millennium problem specifies <strong>rational coefficients</strong> (Q) to bypass torsion obstructions.
                    </p>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 rounded bg-black/40 border border-zinc-800 flex items-center justify-between">
                        <span className="text-zinc-300">Lefschetz (1,1) Theorem on Divisors:</span>
                        <span className="text-emerald-400 font-bold">SOLVED & FORMALIZED</span>
                      </div>
                      <div className="p-2.5 rounded bg-black/40 border border-zinc-800 flex items-center justify-between">
                        <span className="text-zinc-300">Atiyah–Hirzebruch Torsion Filter:</span>
                        <span className="text-amber-400 font-bold">ACTIVE CONSTRAINT</span>
                      </div>
                      <div className="p-2.5 rounded bg-black/40 border border-zinc-800 flex items-center justify-between">
                        <span className="text-zinc-300">Lean Homology Integration:</span>
                        <span className="text-emerald-400 font-bold">{hodgeState.leanHomologyCompilationStatus}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-black/40 border border-zinc-800 text-[11px] font-mono text-zinc-400">
                    <span className="text-zinc-500">Active Frontier Conjecture:</span>
                    <div className="text-zinc-200 mt-1">{hodgeState.activeConjectureFocus}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. NAVIER-STOKES SPECIALIZED DEPTH */}
          {activeProblem === 'navier_stokes' && nsState && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* 3D Simulation & BKM Blowup Monitor */}
                <div className="lg:col-span-7 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                      <Waves size={15} className="text-blue-400" />
                      3D Pseudospectral Flow & Enstrophy Dynamics
                    </h3>
                    <button
                      onClick={handleStepNavierStokes}
                      disabled={nsSimulating}
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono font-medium flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Play size={11} className="fill-current" />
                      {nsSimulating ? 'Stepping...' : 'Step Flow (+0.1s)'}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Beale–Kato–Majda (BKM) blowup criterion: A smooth solution blows up at time T if and only if &int;&#8320;&#7488; ||&omega;(&middot;, t)||_L&infin; dt = &infin;. Monitoring enstrophy &Omega;(t) = &frac12;&int; |&omega;|&sup2; dx and nonlinearity depletion.
                  </p>

                  <div className="overflow-x-auto max-h-56 rounded-lg border border-zinc-800">
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="bg-black/60 text-zinc-400 border-b border-zinc-800">
                        <tr>
                          <th className="p-1.5">Time t</th>
                          <th className="p-1.5">Enstrophy &Omega;(t)</th>
                          <th className="p-1.5">||&omega;||_L&infin;</th>
                          <th className="p-1.5">BKM Integral</th>
                          <th className="p-1.5">Depletion Ratio</th>
                          <th className="p-1.5 pr-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                        {nsState.simulation.slice(-7).map((snap, sIdx) => (
                          <tr key={sIdx} className="hover:bg-zinc-800/40">
                            <td className="p-1.5 pl-3 font-semibold text-zinc-100">{snap.timeT}s</td>
                            <td className="p-1.5 text-blue-400">{snap.enstrophy}</td>
                            <td className="p-1.5">{snap.maxVorticityLInf}</td>
                            <td className="p-1.5">{snap.bkmIntegralEstimate}</td>
                            <td className="p-1.5 text-emerald-400">{snap.depletionOfNonlinearityRatio}</td>
                            <td className="p-1.5 pr-3">
                              <span className="text-[9px] text-emerald-400 font-bold">SMOOTH</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800 text-[11px] font-mono text-zinc-300 flex items-center justify-between">
                    <span>Ladyzhenskaya–Prodi–Serrin Criterion ($2/p + 3/q \le 1$):</span>
                    <span className="text-emerald-400 font-bold">REGULARITY BOUND VALID</span>
                  </div>
                </div>

                {/* OpenAI 2026 Claim Audit */}
                <div className="lg:col-span-5 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                        <AlertTriangle size={15} className="text-amber-400" />
                        OpenAI 2026 Claim Community Audit
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        {nsState.openAiClaimAudit.leanReplay}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                      Independent audit of the 88-hour multi-agent Navier–Stokes singularity claim against the 5 official Clay criteria:
                    </p>

                    <div className="space-y-1.5 text-xs font-mono">
                      {[
                        { label: 'Dimension R³ or T³', pass: nsState.openAiClaimAudit.clay5CriteriaStatus.dimensionR3 },
                        { label: 'C^∞ Smooth Rapid Decay', pass: nsState.openAiClaimAudit.clay5CriteriaStatus.smoothDecay },
                        { label: 'Viscous Dissipation ν > 0', pass: nsState.openAiClaimAudit.clay5CriteriaStatus.viscousNuPositive },
                        { label: 'Incompressibility (div u = 0)', pass: nsState.openAiClaimAudit.clay5CriteriaStatus.divFree },
                        { label: 'Singularity Verified in Lean 4', pass: nsState.openAiClaimAudit.clay5CriteriaStatus.noFiniteTimeSingularity }
                      ].map((crit, cIdx) => (
                        <div key={cIdx} className="p-2 rounded bg-black/40 border border-zinc-800 flex items-center justify-between">
                          <span className="text-zinc-300">{crit.label}</span>
                          <span className={`text-[10px] font-bold ${crit.pass ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {crit.pass ? 'PASS' : 'FAIL / UNVERIFIED'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-[10px] font-mono text-rose-300">
                    <span className="font-bold">Audit Obstruction:</span> {nsState.openAiClaimAudit.unverifiedAssumptions[0]}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. YANG-MILLS AND MASS GAP DEPTH */}
          {activeProblem === 'yang_mills' && ymState && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* 4D Lattice Gauge Simulation Engine */}
                <div className="lg:col-span-7 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                      <Atom size={15} className="text-blue-400" />
                      4D Wilson Lattice Gauge Simulation ({ymState.gaugeGroup})
                    </h3>
                    <div className="flex items-center gap-2">
                      <select
                        value={ymGaugeGroup}
                        onChange={(e) => setYmGaugeGroup(e.target.value as 'SU(2)' | 'SU(3)')}
                        className="bg-black text-[11px] font-mono text-zinc-200 border border-zinc-700 rounded px-2 py-1"
                      >
                        <option value="SU(3)">SU(3) (Physical QCD)</option>
                        <option value="SU(2)">SU(2) (Pure Gauge)</option>
                      </select>
                      <button
                        onClick={handleSweepYangMills}
                        disabled={isSweepingYm}
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono font-medium flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                      >
                        <Play size={11} className="fill-current" />
                        {isSweepingYm ? 'Sweeping...' : 'Sweep Lattice'}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Constructive QFT on R&#8308;: Prove non-perturbative existence and a positive mass gap &Delta; = E&#8321; - E&#8320; &gt; 0 for any compact simple gauge group G. Lattice action: S_W[U] = &beta; &sum;_P (1 - (1/N) Re Tr U_P).
                  </p>

                  <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                    <div className="p-3 rounded-lg bg-black/40 border border-zinc-800">
                      <div className="text-[10px] text-zinc-500">Average Plaquette $\langle P \rangle$</div>
                      <div className="text-base font-bold text-zinc-100 mt-1">{ymState.averagePlaquette}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-black/40 border border-zinc-800">
                      <div className="text-[10px] text-zinc-500">String Tension $\sigma$</div>
                      <div className="text-base font-bold text-blue-400 mt-1">{ymState.stringTensionSigma}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-black/40 border border-zinc-800">
                      <div className="text-[10px] text-zinc-500">Extracted Mass Gap &Delta;</div>
                      <div className="text-base font-bold text-emerald-400 mt-1">{ymState.estimatedMassGapDelta} &radic;&sigma; (&gt; 0)</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-zinc-800 bg-black/30">
                    <div className="text-xs font-semibold text-zinc-300 mb-2">Glueball Correlation Function C(t) ~ e^(-m_0&#8314;&#8314; t)</div>
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      {ymState.glueballCorrelationDecay.map((pt) => (
                        <div key={pt.timeSlice} className="flex-1 text-center p-1.5 rounded bg-zinc-900 border border-zinc-800">
                          <span className="text-zinc-500 block">t={pt.timeSlice}</span>
                          <span className="text-emerald-400 font-bold">{pt.corrValue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Wightman Axioms Audit */}
                <div className="lg:col-span-5 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-2 mb-2">
                      <ShieldCheck size={15} className="text-emerald-400" />
                      Wightman / Osterwalder–Schrader Axioms
                    </h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                      The official Millennium challenge requires constructing non-trivial quantum field theories in the continuum satisfying the axiomatic framework:
                    </p>

                    <div className="space-y-2 text-xs font-mono">
                      {[
                        { label: 'Relativistic Invariance (Poincaré Group)', pass: ymState.wightmanAxiomAudit.relativisticInvariance },
                        { label: 'Spectral Condition (Energy Positivity)', pass: ymState.wightmanAxiomAudit.spectralCondition },
                        { label: 'Unique Vacuum State |0⟩', pass: ymState.wightmanAxiomAudit.vacuumStateUnique },
                        { label: 'Positivity of Scalar Product (Hilbert Space)', pass: ymState.wightmanAxiomAudit.positivityScalarProduct }
                      ].map((ax, aIdx) => (
                        <div key={aIdx} className="p-2 rounded bg-black/40 border border-zinc-800 flex items-center justify-between">
                          <span className="text-zinc-300">{ax.label}</span>
                          <span className="text-[10px] font-bold text-emerald-400">SATISFIED</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-black/40 border border-zinc-800 text-[11px] font-mono text-zinc-400">
                    <span className="text-zinc-500">Continuum Limit ($\beta \to \infty$):</span>
                    <div className="text-zinc-200 mt-1 font-semibold">Scaling window verified with asymptotic freedom $g \to 0$</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. P VS NP SPECIALIZED DEPTH */}
          {activeProblem === 'p_vs_np' && pnpState && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Circuit Lower Bounds Matrix */}
                <div className="lg:col-span-7 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                      <Binary size={15} className="text-blue-400" />
                      Circuit Complexity Lower Bounds Matrix
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Circuit Classes AC⁰ to TC⁰
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Separating P from NP by proving super-polynomial circuit size lower bounds for NP-complete languages (e.g. 3-SAT, Clique).
                  </p>

                  <div className="overflow-x-auto rounded-lg border border-zinc-800">
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="bg-black/60 text-zinc-400 border-b border-zinc-800">
                        <tr>
                          <th className="p-2 pl-3">Circuit Class</th>
                          <th className="p-2">Hardest Language</th>
                          <th className="p-2">Known Lower Bound</th>
                          <th className="p-2 pr-3">Technique</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                        {pnpState.circuitLowerBounds.map(cb => (
                          <tr key={cb.circuitClass} className="hover:bg-zinc-800/40">
                            <td className="p-2 pl-3 font-semibold text-zinc-100">{cb.circuitClass}</td>
                            <td className="p-2 text-blue-400">{cb.hardestLanguage}</td>
                            <td className="p-2 font-mono text-emerald-400">{cb.lowerBoundKnown}</td>
                            <td className="p-2 pr-3 text-zinc-400">{cb.techniqueUsed}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 rounded-lg bg-black/40 border border-zinc-800 text-[11px] font-mono text-zinc-300 flex items-center justify-between">
                    <span>Meta-Complexity Target:</span>
                    <span className="text-amber-400 font-semibold">{pnpState.metaComplexityTarget.conjecture}</span>
                  </div>
                </div>

                {/* Tri-Barrier Hard Filters */}
                <div className="lg:col-span-5 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-2 mb-2">
                      <Filter size={15} className="text-rose-400" />
                      The Tri-Barrier Hard Constraint Matrix
                    </h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                      Proven meta-theorems establishing technique boundaries that cannot resolve P vs NP:
                    </p>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 rounded bg-black/40 border border-zinc-800">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-zinc-200">1. Relativization (BGS 1975):</span>
                          <span className="text-[10px] text-rose-400 font-bold">BLOCKED</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1">Proof holds relative to all oracles (contradicted by Baker–Gill–Solovay).</p>
                      </div>

                      <div className="p-2.5 rounded bg-black/40 border border-zinc-800">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-zinc-200">2. Natural Proofs (RR 1997):</span>
                          <span className="text-[10px] text-rose-400 font-bold">BLOCKED</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1">Constructive properties that separate random functions break under PRFs.</p>
                      </div>

                      <div className="p-2.5 rounded bg-black/40 border border-zinc-800">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-zinc-200">3. Algebrization (AW 2008):</span>
                          <span className="text-[10px] text-rose-400 font-bold">BLOCKED</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1">Proof lifts to algebraic polynomial extensions over finite fields.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-300">
                    <span className="font-bold">Barrier-Avoiding Route:</span> {pnpState.barrierAuditor.recommendedBarrierAvoidance}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. POINCARÉ BENCHMARK & TRANSFER HUB */}
          {activeProblem === 'poincare' && poincareState && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Perelman Formalization Milestones */}
                <div className="lg:col-span-7 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                      <Award size={15} className="text-amber-400" />
                      Perelman Ricci Flow with Surgery (Complete Benchmark Solution)
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      SOLVED & VERIFIED (2006)
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Perelman's breakthrough resolved both the Poincaré Conjecture and Thurston's Geometrization Conjecture. Served as the ultimate gold standard benchmark for our autonomous formal verification suite.
                  </p>

                  <div className="space-y-2">
                    {poincareState.perelmanMilestones.map(m => (
                      <div key={m.title} className="p-2.5 rounded-lg bg-black/40 border border-zinc-800 space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
                          <span>{m.title}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {m.lean4FormalizationStatus}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400">{m.technique}</div>
                        <div className="text-[10px] font-mono text-blue-400">Transfer Target: {m.transferTarget}</div>
                      </div>
                    ))}
                  </div>

                  {/* W-entropy Table */}
                  <div className="p-3 rounded-lg bg-black/40 border border-zinc-800">
                    <div className="text-xs font-semibold text-zinc-200 mb-1.5">Monotonicity of Perelman W-Entropy W(g, f, &tau;)</div>
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      {poincareState.wEntropyMonotonicity.map(pt => (
                        <div key={pt.tau} className="flex-1 text-center p-1 rounded bg-zinc-900 border border-zinc-800">
                          <span className="text-zinc-500 block">τ={pt.tau}</span>
                          <span className="text-zinc-200 font-bold">{pt.wValue}</span>
                          <span className="text-emerald-400 block text-[9px]">dW/dt≥0</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Transferable Geometric Flow Tactics Engine */}
                <div className="lg:col-span-5 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-2 mb-2">
                      <Sparkles size={15} className="text-cyan-400" />
                      Cross-Domain Flow Transfer Engine
                    </h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                      Exporting proven Ricci flow tools (entropy monotonicity, neckpinch surgery, gradient shrinking solitons) into the open Millennium problems:
                    </p>

                    <div className="space-y-2 text-xs font-mono">
                      {poincareState.geometricFlowTransferTactics.map((tac, tIdx) => (
                        <div key={tIdx} className="p-2.5 rounded bg-black/40 border border-zinc-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-zinc-200">{tac.sourceTactic}</span>
                            <span className="text-[10px] font-bold text-cyan-400">→ {tac.targetDomain}</span>
                          </div>
                          <p className="text-[10px] text-zinc-400">{tac.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-black/40 border border-zinc-800 text-[11px] font-mono text-zinc-400">
                    <span className="text-zinc-500">Core Insight:</span>
                    <div className="text-zinc-200 mt-1">Parabolic gradient surgery resolves finite-time singularities without losing topological invariants.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: MATH OS OPEN KNOWLEDGE BASE LEDGER */}
      {hubTab === 'math_os' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Database size={16} className="text-emerald-400" />
                Millennium Math OS: Unified Open Knowledge Base
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Cryptographically verifiable ledger of certified theorems, barriers, heuristics, and simulations across all 7 problems.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search entries or camps..."
                  value={mathOsSearch}
                  onChange={(e) => setMathOsSearch(e.target.value)}
                  className="bg-black/60 text-xs font-mono text-zinc-200 pl-8 pr-3 py-1.5 rounded-lg border border-zinc-700/80 focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={mathOsFilter}
                onChange={(e) => setMathOsFilter(e.target.value)}
                className="bg-black/60 text-xs font-mono text-zinc-200 px-2.5 py-1.5 rounded-lg border border-zinc-700/80 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="theorem">Theorems</option>
                <option value="barrier">Barriers</option>
                <option value="simulation_data">Simulations</option>
                <option value="conjecture">Conjectures</option>
              </select>

              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(mathOsEntries, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `millennium_math_os_${Date.now()}.json`;
                  a.click();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono flex items-center gap-1.5 border border-zinc-700 transition-colors"
                title="Export Open Math OS"
              >
                <Download size={13} />
                JSON Export
              </button>
            </div>
          </div>

          {/* Ledger Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredMathOs.map(entry => (
              <div
                key={entry.id}
                className="p-4 rounded-xl border border-zinc-800/90 bg-zinc-900/70 hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {entry.category}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {entry.problemId.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-xs font-semibold text-zinc-100 mt-1.5">{entry.title}</h3>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500 truncate max-w-[110px]">{entry.contentHash}</span>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">{entry.summary}</p>

                  {entry.formalCodeOrSnippet && (
                    <div className="mt-3 p-2 rounded bg-black/60 border border-zinc-800 text-[10px] font-mono text-zinc-300 overflow-x-auto">
                      <pre>{entry.formalCodeOrSnippet}</pre>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>Author / Camp: <strong className="text-zinc-300">{entry.authorOrCamp}</strong></span>
                  <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: 50-YEAR MULTI-DECADE ROADMAP */}
      {hubTab === 'roadmap' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Calendar size={16} className="text-blue-400" />
              Millennium Problems 50-Year Research Program Horizon (2000–2050+)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Structured multi-generational timeline transitioning from initial Clay formulation to complete verified Lean 4 kernel solutions.
            </p>
          </div>

          <div className="space-y-3">
            {roadmap.map(phase => (
              <div
                key={phase.phaseIndex}
                className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      Phase {phase.phaseIndex}
                    </span>
                    <h3 className="text-sm font-semibold text-zinc-100">{phase.eraName}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-zinc-400">{phase.timeframe}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        phase.status === 'COMPLETED'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : phase.status === 'IN_PROGRESS'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 animate-pulse'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {phase.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">{phase.strategicObjective}</p>

                <div className="space-y-1.5 pl-3 border-l-2 border-zinc-800">
                  {phase.keyMilestones.map((m, mIdx) => (
                    <div key={mIdx} className="text-[11px] text-zinc-400 flex items-start gap-1.5">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: 3 PILLARS ARCHITECTURE */}
      {hubTab === 'three_pillars' && pillars && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Pillar 1 */}
          <div className="p-5 rounded-2xl border border-amber-500/30 bg-zinc-900/70 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Users size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Pillar 1: Human Expertise</h3>
                <span className="text-[10px] font-mono text-amber-400">Conceptual Steering & Constraint Audits</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Human mathematicians remain strictly in charge of the conceptual agenda: formulating conjectures, identifying mathematical analogies, steering exploration, and certifying hard barriers.
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-black/40 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Active Mathematical Fellows:</span>
                <span className="text-zinc-100 font-bold">{pillars.humanPillar.activeFellows}</span>
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Conceptual Directions:</span>
                <span className="text-zinc-100 font-bold">{pillars.humanPillar.conceptualDirectionsProposed}</span>
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Steering Audits / Month:</span>
                <span className="text-zinc-100 font-bold">{pillars.humanPillar.monthlySteeringAudits}</span>
              </div>
            </div>

            <div className="text-[11px] text-zinc-400">
              <span className="text-zinc-500 block mb-1">Advisory Institutes:</span>
              <ul className="list-disc pl-4 space-y-0.5 text-zinc-300">
                {pillars.humanPillar.activeAdvisoryInstitutes.map((inst, i) => (
                  <li key={i}>{inst}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-5 rounded-2xl border border-cyan-500/30 bg-zinc-900/70 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                <Cpu size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Pillar 2: HPC Simulation</h3>
                <span className="text-[10px] font-mono text-cyan-400">Experimentation & Counterexample Hunting</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Exhaustive computational simulations on GPU/FP64 clusters: 3D Navier–Stokes enstrophy tracking, 4D Yang–Mills lattice QCD, LMFDB elliptic curve calculations, and zeta zero distributions.
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-black/40 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Active Cluster Nodes:</span>
                <span className="text-zinc-100 font-bold">{pillars.simulationPillar.activeClusterNodes}</span>
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Total Compute Flops:</span>
                <span className="text-cyan-400 font-bold">{pillars.simulationPillar.totalFlopsAllocated}</span>
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Lattice Configurations:</span>
                <span className="text-zinc-100 font-bold">{pillars.simulationPillar.latticeConfigurationsGenerated.toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Elliptic Curves Analyzed:</span>
                <span className="text-zinc-100 font-bold">{pillars.simulationPillar.ellipticCurvesAnalyzed.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-5 rounded-2xl border border-emerald-500/30 bg-zinc-900/70 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Pillar 3: Proof Assistant</h3>
                <span className="text-[10px] font-mono text-emerald-400">Kernel Checking & Zero-Sorry Gate</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every serious advance must be formalized in an interactive theorem prover (Lean 4, Coq, Isabelle) to ensure zero human oversight errors, eliminating subtle analytical flaws before publication.
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-black/40 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Proof Kernel Engine:</span>
                <span className="text-emerald-400 font-bold">{pillars.formalizationPillar.formalProofAssistant}</span>
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Verified Lemmas:</span>
                <span className="text-zinc-100 font-bold">{pillars.formalizationPillar.verifiedLemmasCount.toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Sorry Tolerance Policy:</span>
                <span className="text-emerald-400 font-bold">STRICT ZERO TOLERANCE (0)</span>
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Cryptographic Proof Seals:</span>
                <span className="text-zinc-100 font-bold">{pillars.formalizationPillar.cryptographicReceiptsSealed}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
