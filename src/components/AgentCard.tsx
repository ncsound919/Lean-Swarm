import { motion } from 'motion/react';
import { Agent } from '../types';
import { Bot, Cpu, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  key?: string | number;
}

export function AgentCard({ agent }: AgentCardProps) {
  const isAI = agent.type === 'AI';

  return (
    <motion.div
      layout
      className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/80 shadow-md flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${isAI ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              {isAI ? <Bot size={16} /> : <Cpu size={16} />}
            </div>
            <div>
              <h3 className="font-semibold text-xs text-zinc-100">{agent.name}</h3>
              <p className="text-[10px] font-mono text-zinc-400 uppercase">{agent.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {agent.status === 'working' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="text-blue-400"
              >
                <Loader2 size={14} />
              </motion.div>
            )}
            {agent.status === 'verified' && (
              <CheckCircle2 size={14} className="text-emerald-400" />
            )}
            {agent.status === 'idle' && <div className="w-2 h-2 rounded-full bg-zinc-700" />}
            {agent.status === 'error' && <AlertCircle size={14} className="text-rose-400" />}
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              #{agent.tasksCompleted}
            </span>
          </div>
        </div>
        
        <p className="text-[11px] text-zinc-400 mb-2.5 line-clamp-2 leading-relaxed">{agent.job}</p>
      </div>

      <div>
        <div className="p-2 rounded bg-black/60 border border-zinc-800 font-mono text-[10px] text-emerald-400 break-all h-11 overflow-hidden flex items-center">
          <span className="line-clamp-2">{agent.lastLog || 'Awaiting dispatch...'}</span>
        </div>
        {agent.model && (
          <div className="mt-1.5 text-[9px] text-zinc-500 font-mono">
            Model: {agent.model}
          </div>
        )}
      </div>
    </motion.div>
  );
}
