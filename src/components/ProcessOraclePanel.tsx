import { useState, useEffect } from 'react';
import {
  ProcessOracleEvaluation,
  ProcessOraclePreset,
  TacticStepResult,
  ProcessFailureSeverity
} from '../types';
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Skull,
  HelpCircle,
  Terminal,
  Cpu,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Award,
  Zap,
  BookOpen,
  Split,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface ProcessOraclePanelProps {
  initialEvaluation?: ProcessOracleEvaluation;
}

export function ProcessOraclePanel({ initialEvaluation }: ProcessOraclePanelProps) {
  const [presets, setPresets] = useState<ProcessOraclePreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset_valid_and_comm');
  const [theoremDecl, setTheoremDecl] = useState<string>(
    'theorem and_comm (p q : Prop) (h : p ∧ q) : q ∧ p'
  );
  const [proofBody, setProofBody] = useState<string>('constructor\nexact h.2\nexact h.1');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<ProcessOracleEvaluation | null>(
    initialEvaluation || null
  );
  const [expandedStepIndex, setExpandedStepIndex] = useState<number | null>(null);
  const [showReplTerminal, setShowReplTerminal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'steps' | 'grpo' | 'taxonomy' | 'repl'>('steps');

  // Load presets on mount
  useEffect(() => {
    fetch('/api/oracle/presets')
      .then(res => res.json())
      .then(data => {
        if (data.presets && Array.isArray(data.presets)) {
          setPresets(data.presets);
        }
      })
      .catch(err => console.error('Failed to load presets:', err));
  }, []);

  // Run initial evaluation if none provided
  useEffect(() => {
    if (!evaluation) {
      handleRunEvaluation(theoremDecl, proofBody);
    }
  }, []);

  const handleSelectPreset = (preset: ProcessOraclePreset) => {
    setSelectedPresetId(preset.id);
    setTheoremDecl(preset.theoremDecl);
    setProofBody(preset.proofBody);
    handleRunEvaluation(preset.theoremDecl, preset.proofBody);
  };

  const handleRunEvaluation = async (declToUse?: string, bodyToUse?: string) => {
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/oracle/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theoremDecl: declToUse || theoremDecl,
          proofBody: bodyToUse || proofBody
        })
      });
      const data: ProcessOracleEvaluation = await res.json();
      setEvaluation(data);
    } catch (e) {
      console.error('Process Oracle evaluation failed:', e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const getSeverityBadge = (severity: ProcessFailureSeverity) => {
    switch (severity) {
      case 'kernel_confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <CheckCircle2 size={12} className="text-cyan-400" />
            Kernel Confirmed (+2.0)
          </span>
        );
      case 'subgoal':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <TrendingDown size={12} className="text-emerald-400" />
            Subgoal Discharge (+0.5·Δ)
          </span>
        );
      case 'neutral':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-zinc-700/50 text-zinc-300 border border-zinc-600/40">
            <TrendingUp size={12} className="text-zinc-400" />
            Neutral Progression (+0.1)
          </span>
        );
      case 'tactic_error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <AlertTriangle size={12} className="text-amber-400" />
            Elaboration Failure (-0.5)
          </span>
        );
      case 'syntax_error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-orange-500/15 text-orange-300 border border-orange-500/30">
            <XCircle size={12} className="text-orange-400" />
            Syntax Error (-1.0)
          </span>
        );
      case 'escape':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <Skull size={12} className="text-rose-400" />
            Escape Bypass (-2.0 Kill)
          </span>
        );
      case 'timeout':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <HelpCircle size={12} className="text-purple-400" />
            Deterministic Gas (-1.0)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-zinc-800 text-zinc-400">
            Unknown
          </span>
        );
    }
  };

  const getRewardColor = (val: number) => {
    if (val > 1.0) return 'text-cyan-400 font-bold';
    if (val > 0) return 'text-emerald-400 font-semibold';
    if (val < -1.5) return 'text-rose-400 font-bold';
    return 'text-amber-400 font-semibold';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950/40 border border-zinc-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="text-indigo-400" size={20} />
              <h2 className="text-lg font-bold text-zinc-100">
                Lean 4 Symbolic Process Oracle & GRPO Reward Engine
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded-full">
                ProcessVerified RL
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
              Provides dense, step-by-step symbolic supervision directly via the Lean REPL interactive protocol
              (<code className="text-indigo-300">lake exe repl</code>). Replaces opaque learned reward models
              with rigorous type-theoretic state reductions, first-error propagation, and first-token GRPO credit assignment.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-lg text-right">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Process Reward</div>
              <div className={`text-base font-mono ${evaluation ? getRewardColor(evaluation.totalProcessReward) : 'text-zinc-300'}`}>
                {evaluation ? (evaluation.totalProcessReward >= 0 ? `+${evaluation.totalProcessReward.toFixed(2)}` : evaluation.totalProcessReward.toFixed(2)) : '0.00'}
              </div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-lg text-right">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Outcome Bonus</div>
              <div className={`text-base font-mono ${evaluation?.outcomeVerified ? 'text-cyan-400 font-bold' : 'text-zinc-500'}`}>
                {evaluation?.outcomeVerified ? '+2.00 (Q.E.D.)' : '0.00'}
              </div>
            </div>
          </div>
        </div>

        {/* Preset Selector Bar */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5 mr-1">
            <Sparkles size={13} className="text-indigo-400" />
            Preset Proof Scenarios:
          </span>
          {presets.map(p => {
            const isSelected = p.id === selectedPresetId;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`px-2.5 py-1 rounded text-xs transition-colors border ${
                  isSelected
                    ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50 font-medium'
                    : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                {p.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Editor & Evaluation Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <BookOpen size={14} className="text-indigo-400" />
                Theorem Declaration
              </label>
              <span className="text-[11px] font-mono text-zinc-500">proofState: 0 root</span>
            </div>
            <input
              type="text"
              value={theoremDecl}
              onChange={e => setTheoremDecl(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
              placeholder="theorem foo (x : Nat) : x + 0 = x"
            />

            <div className="flex items-center justify-between mt-4 mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Layers size={14} className="text-emerald-400" />
                Tactic Stream Candidate ($T_1, T_2, \dots, T_k$)
              </label>
              <span className="text-[11px] text-zinc-500">Separated by lines or semicolons</span>
            </div>
            <textarea
              rows={6}
              value={proofBody}
              onChange={e => setProofBody(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500 leading-relaxed resize-none"
              placeholder="intro h&#10;constructor&#10;exact h.2&#10;exact h.1"
            />

            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-zinc-500">
                {evaluation?.durationMs !== undefined && (
                  <span>Evaluated in <strong className="text-zinc-300">{evaluation.durationMs} ms</strong></span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const activePreset = presets.find(p => p.id === selectedPresetId);
                    if (activePreset) {
                      setTheoremDecl(activePreset.theoremDecl);
                      setProofBody(activePreset.proofBody);
                    }
                  }}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  Reset
                </button>
                <button
                  onClick={() => handleRunEvaluation()}
                  disabled={isEvaluating}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow"
                >
                  <Play size={12} />
                  {isEvaluating ? 'Evaluating...' : 'Run Process Oracle'}
                </button>
              </div>
            </div>
          </div>

          {/* First Error Propagation Rule Callout */}
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2 mb-2">
              <Zap size={14} className="text-amber-400" />
              First-Error Propagation Invariant
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-2">
              Once an error occurs at step <code className="text-zinc-200 font-mono">j</code>, the local proof context is corrupted. Downstream tactics executed in invalid states receive automatic cascading penalties:
            </p>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-center text-xs font-mono text-amber-300">
              ∀ k ≥ j, &nbsp; R_process(T_k) = min(R_process(T_j), -1.0)
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">
              Empirical research (DeepSeek-Prover, STP-Lean) proves that removing first-error propagation causes severe policy degradation by diffusing positive/negative rewards into corrupted states.
            </p>
          </div>
        </div>

        {/* Right Column: Execution Summary & Results */}
        <div className="lg:col-span-6 space-y-4">
          {evaluation && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${evaluation.outcomeVerified ? 'bg-cyan-500/20 text-cyan-300' : (evaluation.firstErrorStep !== undefined ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300')}`}>
                    {evaluation.outcomeVerified ? <CheckCircle2 size={18} /> : (evaluation.firstErrorStep !== undefined ? <XCircle size={18} /> : <AlertTriangle size={18} />)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">
                      {evaluation.outcomeVerified ? 'Symbolically Verified Proof' : (evaluation.firstErrorStep !== undefined ? 'Proof Sequence Rejected' : 'Incomplete Proof State')}
                    </h3>
                    <div className="text-[11px] text-zinc-400">
                      {evaluation.summaryText}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metric grid */}
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-2.5">
                  <div className="text-[10px] uppercase text-zinc-500">Tactics Evaluated</div>
                  <div className="text-base font-bold text-zinc-200 font-mono mt-0.5">{evaluation.tacticSteps.length}</div>
                </div>
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-2.5">
                  <div className="text-[10px] uppercase text-zinc-500">First Error Step</div>
                  <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
                    {evaluation.firstErrorStep !== undefined ? `Step ${evaluation.firstErrorStep}` : 'None (0)'}
                  </div>
                </div>
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-2.5">
                  <div className="text-[10px] uppercase text-zinc-500">Net Process Reward</div>
                  <div className={`text-base font-bold font-mono mt-0.5 ${getRewardColor(evaluation.totalProcessReward)}`}>
                    {evaluation.totalProcessReward >= 0 ? `+${evaluation.totalProcessReward.toFixed(2)}` : evaluation.totalProcessReward.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Failure Taxonomy Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2 mb-3">
              <Award size={14} className="text-cyan-400" />
              Process Reward Shaping Taxonomy
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-2.5 flex items-start justify-between">
                <div>
                  <div className="font-semibold text-rose-300">Escape Bypass</div>
                  <div className="text-[11px] text-zinc-500">sorry, admit, native_decide</div>
                </div>
                <span className="font-mono font-bold text-rose-400">-2.0 (Kill)</span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-2.5 flex items-start justify-between">
                <div>
                  <div className="font-semibold text-orange-300">Syntax / Parse Error</div>
                  <div className="text-[11px] text-zinc-500">expected '...', unclosed syntax</div>
                </div>
                <span className="font-mono font-bold text-orange-400">-1.0</span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-2.5 flex items-start justify-between">
                <div>
                  <div className="font-semibold text-amber-300">Elaboration Failure</div>
                  <div className="text-[11px] text-zinc-500">type mismatch, unknown identifier</div>
                </div>
                <span className="font-mono font-bold text-amber-400">-0.5</span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-2.5 flex items-start justify-between">
                <div>
                  <div className="font-semibold text-zinc-300">Neutral Progression</div>
                  <div className="text-[11px] text-zinc-500">valid tactic, goal count unchanged</div>
                </div>
                <span className="font-mono font-bold text-zinc-300">+0.1</span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-2.5 flex items-start justify-between">
                <div>
                  <div className="font-semibold text-emerald-300">Subgoal Discharge</div>
                  <div className="text-[11px] text-zinc-500">reduced open goals (N → M)</div>
                </div>
                <span className="font-mono font-bold text-emerald-400">+0.5·(N-M)</span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-2.5 flex items-start justify-between">
                <div>
                  <div className="font-semibold text-cyan-300">Kernel Confirmed</div>
                  <div className="text-[11px] text-zinc-500">open goals = 0, zero sorry</div>
                </div>
                <span className="font-mono font-bold text-cyan-400">+2.0 (Terminal)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation for Detailed Inspection */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow">
        <div className="flex border-b border-zinc-800 bg-zinc-950 px-3 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('steps')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'steps'
                ? 'bg-zinc-900 text-indigo-300 border-t border-x border-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers size={13} />
            Step-by-Step Tactic Verification Trace ({evaluation?.tacticSteps.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('grpo')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'grpo'
                ? 'bg-zinc-900 text-emerald-300 border-t border-x border-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap size={13} />
            GRPO First-Token Credit Allocation Matrix ({evaluation?.tokenCredits.length || 0} tokens)
          </button>
          <button
            onClick={() => setActiveTab('repl')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'repl'
                ? 'bg-zinc-900 text-amber-300 border-t border-x border-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal size={13} />
            Lean REPL JSON Stream Protocol
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {/* TAB 1: Step-by-Step Tactic Trace */}
          {activeTab === 'steps' && (
            <div className="space-y-3">
              {(!evaluation || evaluation.tacticSteps.length === 0) ? (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  No tactics evaluated yet. Click "Run Process Oracle" to begin.
                </div>
              ) : (
                evaluation.tacticSteps.map((step: TacticStepResult) => {
                  const isExpanded = expandedStepIndex === step.stepIndex;
                  const isCascaded = step.cascadedFromStep !== undefined;

                  return (
                    <div
                      key={step.stepIndex}
                      className={`border rounded-xl transition-all ${
                        isCascaded
                          ? 'bg-zinc-950/40 border-rose-950/50 opacity-75'
                          : (step.valid
                              ? 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                              : 'bg-rose-950/20 border-rose-900/50')
                      }`}
                    >
                      <div
                        onClick={() => setExpandedStepIndex(isExpanded ? null : step.stepIndex)}
                        className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="font-mono text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                            T_{step.stepIndex}
                          </div>
                          <div>
                            <div className="font-mono text-xs font-semibold text-zinc-200 flex items-center gap-2">
                              <span>{step.tactic}</span>
                              {isCascaded && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  Cascaded from Step {step.cascadedFromStep}
                                </span>
                              )}
                            </div>
                            {step.errorMessage && (
                              <div className="text-[11px] text-rose-400 mt-0.5 font-mono">
                                {step.errorMessage}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Diagnostic class badge */}
                          {getSeverityBadge(step.severity)}

                          {/* Goals Transition */}
                          <div className="flex items-center gap-1.5 text-xs font-mono bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800/80">
                            <span className="text-zinc-400">{step.goalsBefore} goal{step.goalsBefore !== 1 ? 's' : ''}</span>
                            <ArrowRight size={11} className="text-zinc-600" />
                            <span className={step.goalsAfter === 0 ? 'text-cyan-400 font-bold' : (step.goalsAfter < step.goalsBefore ? 'text-emerald-400 font-bold' : 'text-zinc-300')}>
                              {step.goalsAfter} goal{step.goalsAfter !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {/* Step Reward */}
                          <div className={`text-xs font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800 ${getRewardColor(step.scalarReward)}`}>
                            {step.scalarReward >= 0 ? `+${step.scalarReward.toFixed(2)}` : step.scalarReward.toFixed(2)}
                          </div>

                          <div className="text-zinc-500">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded REPL JSON details */}
                      {isExpanded && (
                        <div className="p-3 border-t border-zinc-800 bg-zinc-950/90 space-y-2">
                          <div className="text-[11px] uppercase font-mono tracking-wider text-zinc-500">
                            Lean REPL JSON State Transition
                          </div>
                          <pre className="bg-black/60 p-2.5 rounded border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto">
                            {JSON.stringify({
                              step: step.stepIndex,
                              tactic: step.tactic,
                              severity: step.severity,
                              goalsBefore: step.goalsBefore,
                              goalsRemaining: step.goalsAfter,
                              scalarReward: step.scalarReward,
                              replDiagnostic: step.replResponse
                            }, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: GRPO First-Token Credit Allocation Matrix */}
          {activeTab === 'grpo' && (
            <div className="space-y-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={16} className="text-emerald-400" />
                  <h4 className="text-xs font-bold text-zinc-200">First-Token Credit Rule for Group Relative Policy Optimization</h4>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  In GRPO training of reasoning models, distributing step rewards evenly across all tokens of a tactic string
                  dilutes policy gradients across boilerplate, syntax punctuation, and whitespace.
                  The Process Oracle places the entire scalar advantage <code className="text-emerald-300 font-mono">A_process,i</code> exclusively on the <strong className="text-zinc-200">first token</strong> of tactic <code className="text-emerald-300 font-mono">T_i</code>:
                </p>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 my-2 text-center text-xs font-mono text-emerald-300">
                  A_{`{i, t}`} = A_{`{outcome, i, t}`} + 𝟏&#123;t = first(T_i)&#125; · A_{`{process, i}`}
                </div>
                <p className="text-[11px] text-zinc-500">
                  This perfectly aligns the reinforcement policy gradient with the autoregressive decision boundary where the tactic was selected.
                </p>
              </div>

              {/* Token Table */}
              <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] font-mono border-b border-zinc-800">
                    <tr>
                      <th className="px-3 py-2.5">Token Index</th>
                      <th className="px-3 py-2.5">Token String</th>
                      <th className="px-3 py-2.5">Tactic Span</th>
                      <th className="px-3 py-2.5">First-Token Anchor?</th>
                      <th className="px-3 py-2.5 text-right">Process Adv (A_proc)</th>
                      <th className="px-3 py-2.5 text-right">Outcome (A_out)</th>
                      <th className="px-3 py-2.5 text-right">Total GRPO Adv (A_total)</th>
                      <th className="px-3 py-2.5 text-right text-zinc-500">Diluted Baseline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/50 font-mono">
                    {(!evaluation || evaluation.tokenCredits.length === 0) ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-center text-zinc-500">
                          No token credits generated. Run the evaluation to view GRPO advantage distribution.
                        </td>
                      </tr>
                    ) : (
                      evaluation.tokenCredits.map(tok => {
                        return (
                          <tr
                            key={tok.tokenIdx}
                            className={`transition-colors ${
                              tok.isTacticFirstToken
                                ? 'bg-indigo-950/20 hover:bg-indigo-950/40'
                                : 'hover:bg-zinc-800/40'
                            }`}
                          >
                            <td className="px-3 py-2 text-zinc-500">t_{tok.tokenIdx}</td>
                            <td className="px-3 py-2 font-bold text-zinc-200">
                              <span className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                                {tok.tokenText}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-zinc-400">T_{tok.tacticIndex ?? 0}</td>
                            <td className="px-3 py-2">
                              {tok.isTacticFirstToken ? (
                                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                                  FIRST_TOKEN (1)
                                </span>
                              ) : (
                                <span className="text-[10px] text-zinc-500">0 (Dilution Prevented)</span>
                              )}
                            </td>
                            <td className={`px-3 py-2 text-right ${getRewardColor(tok.processAdvantage)}`}>
                              {tok.processAdvantage >= 0 ? `+${tok.processAdvantage.toFixed(3)}` : tok.processAdvantage.toFixed(3)}
                            </td>
                            <td className="px-3 py-2 text-right text-cyan-400">
                              {tok.outcomeAdvantage > 0 ? `+${tok.outcomeAdvantage.toFixed(3)}` : '0.000'}
                            </td>
                            <td className={`px-3 py-2 text-right font-bold ${getRewardColor(tok.totalAdvantage)}`}>
                              {tok.totalAdvantage >= 0 ? `+${tok.totalAdvantage.toFixed(3)}` : tok.totalAdvantage.toFixed(3)}
                            </td>
                            <td className="px-3 py-2 text-right text-zinc-500 line-through">
                              {tok.dilutedBaselineAdvantage >= 0 ? `+${tok.dilutedBaselineAdvantage.toFixed(3)}` : tok.dilutedBaselineAdvantage.toFixed(3)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Lean REPL JSON Stream Protocol */}
          {activeTab === 'repl' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Direct interaction trace using official <code className="text-indigo-300">lean-repl</code> protocol over stdin/stdout</span>
                <span className="font-mono text-zinc-500">{evaluation?.replLog.length || 0} protocol lines</span>
              </div>
              <div className="bg-black/80 rounded-xl p-4 border border-zinc-800 font-mono text-xs overflow-x-auto max-h-96 space-y-1">
                {(!evaluation || evaluation.replLog.length === 0) ? (
                  <div className="text-zinc-600">No active REPL logs.</div>
                ) : (
                  evaluation.replLog.map((line, idx) => {
                    let color = 'text-zinc-300';
                    if (line.startsWith('[REPL IN]')) color = 'text-indigo-400 font-medium';
                    if (line.startsWith('[REPL OUT]')) color = 'text-cyan-300';
                    if (line.includes('error') || line.includes('SKIPPED') || line.includes('Prohibited')) color = 'text-rose-400';
                    return (
                      <div key={idx} className={color}>
                        {line}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
