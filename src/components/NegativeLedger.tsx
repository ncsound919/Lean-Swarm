import { NegativeResult } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Ban, Zap, FileWarning } from 'lucide-react';

interface NegativeLedgerProps {
  ledger: NegativeResult[];
}

export function NegativeLedger({ ledger }: NegativeLedgerProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white/80 uppercase tracking-widest flex items-center gap-2">
          <Ban size={14} /> Negative-Result Ledger
        </h2>
        <span className="text-[10px] text-white/40">{ledger.length} ENTRIES</span>
      </div>
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
        <AnimatePresence initial={false}>
          {ledger.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-red-400/90"
            >
              <div className="flex items-center gap-2 mb-1">
                {entry.failureType === 'counterexample' ? <Zap size={12} /> : <FileWarning size={12} />}
                <span className="text-[10px] font-bold uppercase tracking-tighter">
                  {entry.failureType.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                <span className="opacity-60 italic">{entry.lemmaId}:</span> {entry.details}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {ledger.length === 0 && (
          <div className="text-center py-8 text-white/20 italic text-xs">
            No failures recorded. Kernel is clean.
          </div>
        )}
      </div>
    </div>
  );
}
