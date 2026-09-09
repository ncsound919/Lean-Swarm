import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Cpu,
  Layers,
  Search,
  CheckCircle,
  Play,
  RotateCcw,
  Sparkles,
  Database,
  Calculator,
  Terminal,
  Code2,
  FileCode,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
  HelpCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';

interface SmtResult {
  solver: string;
  logic: string;
  status: 'sat' | 'unsat' | 'unknown' | 'timeout';
  model?: Record<string, string | number>;
  unsatCore?: string[];
  proofSteps?: string[];
  executionTimeMs: number;
  smtLibOutput: string;
}

interface CasResult {
  engine: string;
  inputExpression: string;
  operation: string;
  resultLatex: string;
  resultPlain: string;
  steps: string[];
  lean4Equivalent?: string;
  executionTimeMs: number;
}

interface AtpResult {
  prover: string;
  status: string;
  proofLength: number;
  inferences: string[];
  tptpProofOutput: string;
  lean4ReconstructionTactic: string;
  executionTimeMs: number;
}

interface AstResult {
  declarationsCount: number;
  tacticsCount: number;
  identifiers: string[];
  typeAnnotations: string[];
  syntaxErrors: string[];
  executionTimeMs: number;
}

interface MathlibItem {
  name: string;
  signature: string;
  module: string;
  docstring: string;
  tags: string[];
  proofKind: string;
  dependencies: string[];
}

interface HammerResult {
  synthesizedLeanTactic: string;
  confidence: number;
  requiredImports: string[];
  kernelCheckPass: boolean;
  explanation: string;
}

interface OpenSourceToolsPanelProps {
  onInjectCodeToKernel?: (code: string) => void;
}

export const OpenSourceToolsPanel: React.FC<OpenSourceToolsPanelProps> = ({ onInjectCodeToKernel }) => {
  const [activeTab, setActiveTab] = useState<'smt' | 'cas' | 'atp' | 'ast' | 'mathlib' | 'hammer'>('smt');

  // SMT State
  const [smtFormula, setSmtFormula] = useState<string>(
    '(set-logic QF_LRA)\n(declare-const x Real)\n(declare-const y Real)\n(assert (> x 0))\n(assert (> y 0))\n(assert (= (+ x y) 10))\n(assert (= (- x y) 2))\n(check-sat)\n(get-model)'
  );
  const [smtLogic, setSmtLogic] = useState<'QF_LRA' | 'QF_NRA' | 'QF_BV' | 'AUFLIA' | 'ALL'>('QF_LRA');
  const [smtSolver, setSmtSolver] = useState<'z3' | 'cvc5'>('z3');
  const [smtResult, setSmtResult] = useState<SmtResult | null>(null);
  const [isSolvingSmt, setIsSolvingSmt] = useState(false);

  // CAS State
  const [casExpr, setCasExpr] = useState<string>('sin(x)^2 + cos(x)^2 + exp(I * x)');
  const [casOp, setCasOp] = useState<'simplify' | 'expand' | 'factor' | 'differentiate' | 'integrate' | 'taylor_series' | 'groebner_basis' | 'matrix_spectrum'>('differentiate');
  const [casVar, setCasVar] = useState<string>('x');
  const [casResult, setCasResult] = useState<CasResult | null>(null);
  const [isEvaluatingCas, setIsEvaluatingCas] = useState(false);

  // ATP State
  const [tptpInput, setTptpInput] = useState<string>(
    'fof(c1, axiom, ![X, Y]: (mul(X, Y) = mul(Y, X))).\nfof(c2, conjecture, ![A, B]: (mul(A, B) = mul(B, A))).'
  );
  const [atpProver, setAtpProver] = useState<'vampire' | 'eprover'>('vampire');
  const [atpResult, setAtpResult] = useState<AtpResult | null>(null);
  const [isProvingAtp, setIsProvingAtp] = useState(false);

  // AST State
  const [astSource, setAstSource] = useState<string>(
    'import Mathlib.Analysis.Calculus.Deriv.Basic\n\ntheorem sample_diff (x : ℝ) : deriv (fun t => t * t) x = 2 * x := by\n  simp [deriv_mul]\n  ring'
  );
  const [astResult, setAstResult] = useState<AstResult | null>(null);
  const [isParsingAst, setIsParsingAst] = useState(false);

  // Mathlib Search State
  const [mathlibQuery, setMathlibQuery] = useState<string>('continuous');
  const [mathlibTag, setMathlibTag] = useState<string>('all');
  const [mathlibResults, setMathlibResults] = useState<MathlibItem[]>([]);
  const [isSearchingMathlib, setIsSearchingMathlib] = useState(false);

  // Hammer State
  const [hammerGoal, setHammerGoal] = useState<string>('⊢ ∀ (x y : ℝ), x ≤ y → y ≤ z → x ≤ z');
  const [hammerUnsatCore, setHammerUnsatCore] = useState<string>('le_trans, le_refl');
  const [hammerResult, setHammerResult] = useState<HammerResult | null>(null);
  const [isReconstructingHammer, setIsReconstructingHammer] = useState(false);

  // Initial load
  useEffect(() => {
    handleSearchMathlib('continuous', 'all');
  }, []);

  // Handlers
  const handleSolveSmt = async () => {
    setIsSolvingSmt(true);
    try {
      const res = await axios.post('/api/ostools/smt-solve', {
        formulaSmtLib: smtFormula,
        logic: smtLogic,
        solver: smtSolver
      });
      setSmtResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSolvingSmt(false);
    }
  };

  const handleEvaluateCas = async () => {
    setIsEvaluatingCas(true);
    try {
      const res = await axios.post('/api/ostools/cas-eval', {
        expression: casExpr,
        operation: casOp,
        variable: casVar
      });
      setCasResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluatingCas(false);
    }
  };

  const handleProveAtp = async () => {
    setIsProvingAtp(true);
    try {
      const res = await axios.post('/api/ostools/atp-prove', {
        problemTptp: tptpInput,
        prover: atpProver
      });
      setAtpResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProvingAtp(false);
    }
  };

  const handleParseAst = async () => {
    setIsParsingAst(true);
    try {
      const res = await axios.post('/api/ostools/ast-parse', {
        leanSource: astSource
      });
      setAstResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsParsingAst(false);
    }
  };

  const handleSearchMathlib = async (q: string, tag: string) => {
    setIsSearchingMathlib(true);
    try {
      const res = await axios.get(`/api/ostools/mathlib-search?q=${encodeURIComponent(q)}&tag=${encodeURIComponent(tag)}`);
      setMathlibResults(res.data?.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingMathlib(false);
    }
  };

  const handleReconstructHammer = async () => {
    setIsReconstructingHammer(true);
    try {
      const res = await axios.post('/api/ostools/hammer-reconstruct', {
        goalType: hammerGoal,
        smtUnsatCore: hammerUnsatCore.split(',').map(s => s.trim()).filter(Boolean),
        atpInferences: []
      });
      setHammerResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsReconstructingHammer(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-5 shadow-2xl text-zinc-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Wrench size={20} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Open Source Formal & Mathematical Tools Suite
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Z3 / CVC5 / SymPy / Vampire / Mathlib4 / LeanHammer
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Deterministic SMT solvers, symbolic computer algebra, first-order equational provers, and Lean 4 AST inspectors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            6 Engines Integrated
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-800 pb-2 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab('smt')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'smt' ? 'bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/40' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Cpu size={14} className="text-blue-400" />
          Z3 & CVC5 SMT Solvers
        </button>

        <button
          onClick={() => setActiveTab('cas')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'cas' ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Calculator size={14} className="text-amber-400" />
          SymPy / SageMath CAS
        </button>

        <button
          onClick={() => setActiveTab('atp')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'atp' ? 'bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/40' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles size={14} className="text-purple-400" />
          Vampire / E First-Order ATP
        </button>

        <button
          onClick={() => setActiveTab('ast')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'ast' ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Code2 size={14} className="text-emerald-400" />
          Tree-sitter Lean AST Inspector
        </button>

        <button
          onClick={() => setActiveTab('mathlib')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'mathlib' ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Database size={14} className="text-cyan-400" />
          Mathlib4 Semantic RAG Index
        </button>

        <button
          onClick={() => setActiveTab('hammer')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'hammer' ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/40' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Zap size={14} className="text-rose-400" />
          LeanHammer Auto-Reconstructor
        </button>
      </div>

      {/* -------------------------------------------------------------------------- */}
      {/* 1. SMT SOLVERS (Z3 & CVC5) */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'smt' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">SMT-LIB2 Formula / Benchmark</label>
                <div className="flex items-center gap-2">
                  <select
                    value={smtLogic}
                    onChange={(e) => setSmtLogic(e.target.value as any)}
                    className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] font-mono text-zinc-300"
                  >
                    <option value="QF_LRA">QF_LRA (Linear Real Arithmetic)</option>
                    <option value="QF_NRA">QF_NRA (Non-Linear Real Arithmetic)</option>
                    <option value="QF_BV">QF_BV (Bitvectors)</option>
                    <option value="AUFLIA">AUFLIA (Arrays + Linear Int)</option>
                  </select>

                  <select
                    value={smtSolver}
                    onChange={(e) => setSmtSolver(e.target.value as any)}
                    className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] font-mono text-zinc-300"
                  >
                    <option value="z3">Z3 v4.13</option>
                    <option value="cvc5">CVC5 v1.2</option>
                  </select>
                </div>
              </div>

              <textarea
                value={smtFormula}
                onChange={(e) => setSmtFormula(e.target.value)}
                rows={8}
                className="w-full bg-black/60 border border-zinc-800 rounded-lg p-3 font-mono text-xs text-blue-300 focus:outline-none focus:border-blue-500"
              />

              <button
                onClick={handleSolveSmt}
                disabled={isSolvingSmt}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-blue-900/30"
              >
                <Play size={14} />
                Execute {smtSolver.toUpperCase()} Check-Sat
              </button>
            </div>

            {/* SMT Results */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-300">Solver Output & Unsat Core</label>

              {smtResult ? (
                <div className="space-y-2 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-black/80 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 font-bold">{smtResult.solver}</span>
                      <span className="text-[10px] text-zinc-500">{smtResult.executionTimeMs}ms</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          smtResult.status === 'unsat'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        Status: {smtResult.status.toUpperCase()}
                      </span>
                      <span className="text-[11px] text-zinc-400">Logic: {smtResult.logic}</span>
                    </div>

                    <pre className="text-[11px] text-zinc-300 bg-zinc-950 p-2 rounded border border-zinc-900 overflow-x-auto">
                      {smtResult.smtLibOutput}
                    </pre>
                  </div>

                  {smtResult.unsatCore && smtResult.unsatCore.length > 0 && (
                    <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        Unsat Core Clauses (Refutation Base)
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-emerald-400 text-[11px]">
                        {smtResult.unsatCore.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 text-center text-xs text-zinc-500">
                  Click Execute to run Z3 or CVC5 against the SMT-LIB2 formula.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* 2. SYMBOLIC CAS (SYMPY & SAGEMATH) */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'cas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Mathematical Expression</label>
                <input
                  type="text"
                  value={casExpr}
                  onChange={(e) => setCasExpr(e.target.value)}
                  className="w-full bg-black/60 border border-zinc-800 rounded-lg p-2.5 font-mono text-xs text-amber-300 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. sin(x)^2 + cos(x)^2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Symbolic Operation</label>
                  <select
                    value={casOp}
                    onChange={(e) => setCasOp(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-300 font-mono"
                  >
                    <option value="differentiate">Differentiate (d/dx)</option>
                    <option value="integrate">Integrate (∫ dx)</option>
                    <option value="taylor_series">Taylor Series Expansion</option>
                    <option value="simplify">Simplify & Canonicalize</option>
                    <option value="groebner_basis">Groebner Basis (Polynomial Ideal)</option>
                    <option value="factor">Polynomial Factorization</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Target Variable</label>
                  <input
                    type="text"
                    value={casVar}
                    onChange={(e) => setCasVar(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-300 font-mono"
                    placeholder="x"
                  />
                </div>
              </div>

              <button
                onClick={handleEvaluateCas}
                disabled={isEvaluatingCas}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-amber-900/30"
              >
                <Calculator size={14} />
                Evaluate Symbolic CAS
              </button>
            </div>

            {/* CAS Results */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-300">Symbolic Result & Lean 4 Equivalent</label>

              {casResult ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-black/80 border border-zinc-800 font-mono text-xs space-y-2">
                    <div className="text-amber-400 font-bold text-sm">{casResult.resultPlain}</div>
                    <div className="text-zinc-500 text-[10px]">LaTeX: {casResult.resultLatex}</div>
                  </div>

                  {casResult.lean4Equivalent && (
                    <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-1">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Generated Lean 4 Tactic Bridge
                      </div>
                      <pre className="text-xs font-mono text-emerald-300 bg-black/50 p-2 rounded border border-zinc-800">
                        {casResult.lean4Equivalent}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 text-center text-xs text-zinc-500">
                  Select an operation and click Evaluate to compute symbolic results.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* 3. FIRST-ORDER ATP (VAMPIRE & E-PROVER) */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'atp' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">TPTP Format Equational Problem</label>
                <select
                  value={atpProver}
                  onChange={(e) => setAtpProver(e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] font-mono text-zinc-300"
                >
                  <option value="vampire">Vampire 4.9</option>
                  <option value="eprover">E Prover 3.1</option>
                </select>
              </div>

              <textarea
                value={tptpInput}
                onChange={(e) => setTptpInput(e.target.value)}
                rows={7}
                className="w-full bg-black/60 border border-zinc-800 rounded-lg p-3 font-mono text-xs text-purple-300 focus:outline-none focus:border-purple-500"
              />

              <button
                onClick={handleProveAtp}
                disabled={isProvingAtp}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-purple-900/30"
              >
                <Play size={14} />
                Run {atpProver.toUpperCase()} Superposition Refutation
              </button>
            </div>

            {/* ATP Output */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-300">CNF Refutation Proof & Lean Translation</label>

              {atpResult ? (
                <div className="space-y-2 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-black/80 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-400 font-bold">{atpResult.prover}</span>
                      <span className="text-emerald-400 font-bold">{atpResult.status}</span>
                    </div>

                    <pre className="text-[11px] text-zinc-300 bg-zinc-950 p-2 rounded border border-zinc-900 overflow-x-auto max-h-36">
                      {atpResult.tptpProofOutput}
                    </pre>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Synthesized Lean 4 Proof
                    </div>
                    <pre className="text-emerald-300 text-xs bg-black/50 p-2 rounded">
                      {atpResult.lean4ReconstructionTactic}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 text-center text-xs text-zinc-500">
                  Run Vampire or E Prover to generate a formal refutation trace.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* 4. TREE-SITTER LEAN 4 AST INSPECTOR */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'ast' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-300 block">Lean 4 Code for AST Tokenization</label>
              <textarea
                value={astSource}
                onChange={(e) => setAstSource(e.target.value)}
                rows={7}
                className="w-full bg-black/60 border border-zinc-800 rounded-lg p-3 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
              />

              <button
                onClick={handleParseAst}
                disabled={isParsingAst}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-900/30"
              >
                <Code2 size={14} />
                Parse Syntax Tree (Tree-sitter)
              </button>
            </div>

            {/* AST Inspector Output */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-300">Syntax Tree Metrics & Scoped Identifiers</label>

              {astResult ? (
                <div className="space-y-3 font-mono text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-black/60 border border-zinc-800">
                      <div className="text-[10px] text-zinc-500">Declarations</div>
                      <div className="text-base font-bold text-emerald-400">{astResult.declarationsCount}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/60 border border-zinc-800">
                      <div className="text-[10px] text-zinc-500">Tactic Steps</div>
                      <div className="text-base font-bold text-blue-400">{astResult.tacticsCount}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Identifiers Found</div>
                    <div className="flex flex-wrap gap-1">
                      {astResult.identifiers.map((id, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-zinc-800 text-emerald-300 text-[11px]">
                          {id}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 text-center text-xs text-zinc-500">
                  Parse source to view AST tokens and declaration types.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* 5. MATHLIB4 SEMANTIC RAG INDEX */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'mathlib' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-3 text-zinc-500" />
              <input
                type="text"
                value={mathlibQuery}
                onChange={(e) => {
                  setMathlibQuery(e.target.value);
                  handleSearchMathlib(e.target.value, mathlibTag);
                }}
                placeholder="Search 100k+ Mathlib4 theorems by name, signature, or keyword..."
                className="w-full bg-black/60 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <select
              value={mathlibTag}
              onChange={(e) => {
                setMathlibTag(e.target.value);
                handleSearchMathlib(mathlibQuery, e.target.value);
              }}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300"
            >
              <option value="all">All Domains</option>
              <option value="analysis">Analysis & Calculus</option>
              <option value="bsd">BSD / Elliptic Curves</option>
              <option value="hodge">Hodge / Algebraic Geometry</option>
              <option value="navier_stokes">Navier-Stokes / PDE</option>
              <option value="riemann">Riemann / Complex</option>
              <option value="topology">Topology</option>
              <option value="p_vs_np">P vs NP / Computability</option>
            </select>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {mathlibResults.map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-black/50 border border-zinc-800/90 hover:border-cyan-500/50 transition-all space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-300">{item.name}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{item.module}</span>
                </div>

                <div className="text-xs font-mono text-zinc-300 bg-zinc-950 p-1.5 rounded border border-zinc-900">
                  {item.signature}
                </div>

                <p className="text-[11px] text-zinc-400">{item.docstring}</p>

                <div className="flex items-center gap-1.5 pt-1">
                  {item.tags.map((t, i) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* 6. LEANHAMMER AUTO-RECONSTRUCTOR */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'hammer' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Target Lean 4 Goal</label>
                <input
                  type="text"
                  value={hammerGoal}
                  onChange={(e) => setHammerGoal(e.target.value)}
                  className="w-full bg-black/60 border border-zinc-800 rounded-lg p-2.5 font-mono text-xs text-rose-300 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">External SMT Unsat Core / ATP Lemmas</label>
                <input
                  type="text"
                  value={hammerUnsatCore}
                  onChange={(e) => setHammerUnsatCore(e.target.value)}
                  className="w-full bg-black/60 border border-zinc-800 rounded-lg p-2.5 font-mono text-xs text-zinc-300 focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                onClick={handleReconstructHammer}
                disabled={isReconstructingHammer}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-rose-900/30"
              >
                <Zap size={14} />
                Reconstruct Lean 4 Kernel Proof
              </button>
            </div>

            {/* Hammer Results */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-300">Synthesized Kernel Term & Confidence</label>

              {hammerResult ? (
                <div className="space-y-2 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-black/80 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-rose-400 font-bold">LeanHammer Synthesis</span>
                      <span className="text-emerald-400 font-bold">{(hammerResult.confidence * 100).toFixed(0)}% Confidence</span>
                    </div>

                    <pre className="text-emerald-300 bg-zinc-950 p-2.5 rounded border border-zinc-900">
                      {hammerResult.synthesizedLeanTactic}
                    </pre>

                    <p className="text-[11px] text-zinc-400 font-sans">{hammerResult.explanation}</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 text-center text-xs text-zinc-500">
                  Click Reconstruct to synthesize a certified Lean 4 tactic term from external solver inferences.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
