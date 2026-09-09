import { motion } from 'motion/react';
import { StrategyTrack, StrategyId } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Flame, 
  ShieldCheck, 
  Play, 
  Cpu, 
  Target,
  Layers,
  ArrowRight
} from 'lucide-react';

interface StrategyTracksViewProps {
  tracks: StrategyTrack[];
  onTriggerStrategy: (id: StrategyId) => void;
  isRunning: boolean;
}

export function StrategyTracksView({ tracks, onTriggerStrategy, isRunning }: StrategyTracksViewProps) {
  const getStatusBadge = (status: StrategyTrack['status']) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 size={11} /> COMPLETED</span>;
      case 'running':
        return <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse"><Flame size={11} /> ACTIVE TRACK</span>;
      case 'barrier_blocked':
        return <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20"><AlertTriangle size={11} /> BARRIER BLOCKED</span>;
      case 'diverged':
        return <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20"><AlertTriangle size={11} /> DIVERGED / DEAD END</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700"><Clock size={11} /> IDLE STANDBY</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Layers size={16} className="text-blue-400" />
            Parallel Strategy Taxonomy (8 Attack Tracks)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Autonomous execution tracks with independent objective functions and deterministic verification gates.
          </p>
        </div>
        <div className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
          Deterministic Gates: Lean 4 Kernel · BGS/RR/AW · Bound Certificates
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {tracks.map((track) => (
          <motion.div
            key={track.id}
            layout
            className="p-4 rounded-xl border border-zinc-800/90 bg-zinc-900/60 hover:border-zinc-700 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold border border-zinc-700">
                      {track.id.split('_')[0]}
                    </span>
                    <h3 className="text-xs font-semibold text-zinc-100">{track.name}</h3>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{track.description}</p>
                </div>
                {getStatusBadge(track.status)}
              </div>

              {/* Objective Function */}
              <div className="mt-3 p-2 rounded bg-black/40 border border-zinc-800/80 space-y-1 text-[10px] font-mono">
                <div className="flex items-start gap-1.5 text-zinc-300">
                  <Target size={12} className="text-blue-400 shrink-0 mt-0.5" />
                  <span className="text-zinc-400">Objective:</span>
                  <span className="text-zinc-200">{track.objectiveFunction}</span>
                </div>
                <div className="flex items-start gap-1.5 text-zinc-300">
                  <ShieldCheck size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-zinc-400">Deterministic Gate:</span>
                  <span className="text-emerald-400/90">{track.deterministicComponent}</span>
                </div>
              </div>

              {/* Progress bar and metrics */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
                  <span>{track.currentMetricLabel || 'Track Progress'}: <strong className="text-zinc-200">{track.currentMetricValue || '0%'}</strong></span>
                  <span>{track.progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${track.progressPercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                <Cpu size={12} className="text-zinc-500" />
                <span>Agents: {track.activeAgents.join(', ')}</span>
                {track.artifactsGenerated > 0 && (
                  <span className="ml-1 text-emerald-400">({track.artifactsGenerated} artifacts)</span>
                )}
              </div>
              <button
                onClick={() => onTriggerStrategy(track.id)}
                disabled={isRunning}
                className="px-2.5 py-1 text-[11px] font-mono font-medium rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
              >
                <Play size={10} className="fill-current" />
                Trigger Track
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
