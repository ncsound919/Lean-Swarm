import { Lemma } from '../types';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, Clock, Search, Code } from 'lucide-react';

interface LemmaNodeProps {
  lemma: Lemma;
  key?: string | number;
}

export function LemmaNode({ lemma }: LemmaNodeProps) {
  const statusColors = {
    pending: 'border-white/10 text-white/40',
    probing: 'border-amber-500/50 text-amber-400 bg-amber-500/5',
    proving: 'border-blue-500/50 text-blue-400 bg-blue-500/5',
    verified: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10',
    failed: 'border-red-500/50 text-red-400 bg-red-500/5',
  };

  const Icons = {
    pending: Clock,
    probing: Search,
    proving: Code,
    verified: CheckCircle2,
    failed: XCircle,
  };

  const StatusIcon = Icons[lemma.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 rounded-lg border transition-colors ${statusColors[lemma.status]}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <StatusIcon size={16} />
          <span className="text-sm font-medium">{lemma.title}</span>
        </div>
        <div className="text-[10px] uppercase tracking-widest opacity-60">
          {lemma.status}
        </div>
      </div>
      
      {lemma.proofHash && (
        <div className="mt-2 pt-2 border-t border-white/5 font-mono text-[9px] opacity-40">
          HASH: {lemma.proofHash.substring(0, 16)}...
        </div>
      )}
    </motion.div>
  );
}
