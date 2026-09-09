import { useState } from 'react';
import { Terminal, Play, Loader2, CheckCircle2, XCircle, Copy, ShieldCheck, Hash } from 'lucide-react';

export function LeanKernelTerminal() {
  const [sourceCode, setSourceCode] = useState<string>(`-- Verified Lean 4 Kernel Scratchpad
-- Real execution gate: /root/.elan/bin/lean (Lean 4.16.0)
theorem add_comm_demo (a b : Nat) : a + b = b + a :=
  Nat.add_comm a b
`);
  const [allowSorry, setAllowSorry] = useState<boolean>(false);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  const runKernel = async () => {
    setIsCompiling(true);
    try {
      const res = await fetch('/api/lean/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: sourceCode, allowSorry })
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({
        success: false,
        exitCode: 1,
        stderr: e.message || 'Compilation failure',
        stdout: '',
        proofHash: '',
        hasSorry: false,
        compileTimeMs: 0
      });
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/80 space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-emerald-400" />
          <h3 className="text-xs font-semibold text-zinc-200">
            Deterministic Lean 4 Kernel Gate (v4.16.0)
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Real Executable
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={allowSorry}
              onChange={(e) => setAllowSorry(e.target.checked)}
              className="rounded bg-zinc-800 border-zinc-700"
            />
            <span>Allow Sorry (Testing Only)</span>
          </label>
          <button
            onClick={runKernel}
            disabled={isCompiling}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
          >
            {isCompiling ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} className="fill-current" />}
            Compile in Kernel
          </button>
        </div>
      </div>

      <textarea
        value={sourceCode}
        onChange={(e) => setSourceCode(e.target.value)}
        rows={6}
        className="w-full p-3 rounded-lg bg-black/80 border border-zinc-800 font-mono text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 resize-y"
        placeholder="Enter Lean 4 code to verify against kernel..."
      />

      {result && (
        <div className="p-3.5 rounded-lg bg-black/90 border border-zinc-800 space-y-2 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              {result.success ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold text-xs">
                  <CheckCircle2 size={14} /> KERNEL VERIFIED (EXIT 0)
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1 font-bold text-xs">
                  <XCircle size={14} /> REJECTED (EXIT {result.exitCode})
                </span>
              )}
              {result.hasSorry && (
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px]">
                  SORRY_DETECTED
                </span>
              )}
            </div>

            <div className="text-[10px] text-zinc-400 flex items-center gap-3">
              <span>Time: <strong>{result.compileTimeMs}ms</strong></span>
              <span>Kernel: <strong>{result.leanVersion || 'Lean 4.16.0'}</strong></span>
            </div>
          </div>

          {result.proofHash && (
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
              <Hash size={11} className="text-zinc-500" />
              <span>Artifact Hash:</span>
              <span className="text-zinc-300 font-bold select-all">{result.proofHash}</span>
            </div>
          )}

          {result.stdout && (
            <div className="text-[11px] text-emerald-400/90 whitespace-pre-wrap max-h-32 overflow-y-auto">
              {result.stdout}
            </div>
          )}

          {result.stderr && (
            <div className="text-[11px] text-rose-400/90 whitespace-pre-wrap max-h-32 overflow-y-auto">
              {result.stderr}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
