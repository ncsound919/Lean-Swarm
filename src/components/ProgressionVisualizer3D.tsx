import React, { useEffect, useRef, useState } from 'react';
import { 
  Brain, 
  Activity, 
  Gauge, 
  Zap, 
  Sparkles, 
  Compass, 
  Layers, 
  CheckCircle, 
  TrendingUp, 
  Flame, 
  ShieldAlert, 
  Award,
  ChevronRight
} from 'lucide-react';
import { OrchestratorState } from '../types';

interface ProgressionVisualizer3DProps {
  state: OrchestratorState | null;
}

interface Node3D {
  id: string;
  name: string;
  type: 'sector' | 'system' | 'learning';
  progress: number;
  x: number;
  y: number;
  z: number;
  color: string;
  details: string;
  agents: string[];
  milestone: string;
}

interface Edge3D {
  from: string;
  to: string;
  color: string;
  dashOffset: number;
  pulseSpeed: number;
}

export const ProgressionVisualizer3D: React.FC<ProgressionVisualizer3DProps> = ({ state }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<Node3D | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  
  // Camera angles
  const anglesRef = useRef({ x: 0.5, y: 0.8 });
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Node & Edge state definitions
  const [nodes, setNodes] = useState<Node3D[]>([]);
  const [edges, setEdges] = useState<Edge3D[]>([]);

  // Initialize the 3D network nodes
  useEffect(() => {
    // Math Sectors
    const sectors: Node3D[] = [
      { 
        id: 'rh', 
        name: 'Riemann Hypothesis', 
        type: 'sector', 
        progress: state?.subproblemResults?.find(r => r.domain === 'analytic_nt')?.verified ? 100 : (state?.tracks?.find(t => t.id === 'S4_MONOTONIC_BOUNDS')?.progress ?? 42), 
        x: 0, 
        y: 150, 
        z: 0, 
        color: '#38bdf8', 
        details: 'Analytic Number Theory & Zeta Zero-Free Regions', 
        agents: ['prover', 'galois_conjecturer'],
        milestone: 'Verified explicit zero-free region σ ≥ 1 - 0.055373 / log(|t|+2)'
      },
      { 
        id: 'ns', 
        name: 'Navier-Stokes', 
        type: 'sector', 
        progress: state?.subproblemResults?.find(r => r.domain === 'pde')?.verified ? 100 : (state?.tracks?.find(t => t.id === 'S3_COUNTEREXAMPLE_PROBER')?.progress ?? 31), 
        x: 130, 
        y: 50, 
        z: 70, 
        color: '#fb7185', 
        details: 'Nonlinear PDE & Global Attractor Smoothness', 
        agents: ['prober', 'falsifier_probe'],
        milestone: 'Proved conditional Serrin / Beale-Kato-Majda non-blowup criteria'
      },
      { 
        id: 'ym', 
        name: 'Yang-Mills Mass Gap', 
        type: 'sector', 
        progress: state?.subproblemResults?.find(r => r.domain === 'qft')?.verified ? 100 : (state?.tracks?.find(t => t.id === 'S5_ANALOG_TOY_MODELS')?.progress ?? 24), 
        x: 100, 
        y: -70, 
        z: 120, 
        color: '#c084fc', 
        details: 'Quantum Field Theory & Non-Perturbative Mass Gap', 
        agents: ['decomposer', 'type_synthesizer'],
        milestone: 'Formalized instanton moduli spaces with Buchberger algorithm'
      },
      { 
        id: 'pnp', 
        name: 'P vs NP Class', 
        type: 'sector', 
        progress: state?.subproblemResults?.find(r => r.domain === 'tcs')?.verified ? 100 : (state?.tracks?.find(t => t.id === 'S8_BARRIER_AWARE_ROUTING')?.progress ?? 15), 
        x: -100, 
        y: -70, 
        z: 120, 
        color: '#facc15', 
        details: 'Computational Complexity Lower Bounds & Barriers', 
        agents: ['barrier_auditor', 'asymptotic_decider'],
        milestone: 'Checked circuit lower bounds with e-graph term rewriting'
      },
      { 
        id: 'bsd', 
        name: 'BSD Conjecture', 
        type: 'sector', 
        progress: state?.subproblemResults?.find(r => r.domain === 'arithmetic_ag')?.verified ? 100 : (state?.tracks?.find(t => t.id === 'S2_RECURSIVE_DAG')?.progress ?? 35), 
        x: -130, 
        y: 50, 
        z: 70, 
        color: '#fb923c', 
        details: 'Arithmetic Algebraic Geometry & Tate-Shafarevich Groups', 
        agents: ['prover', 'tactic_optimizer'],
        milestone: 'Computed BSD invariants using high-precision PSLQ algorithms'
      },
      { 
        id: 'hodge', 
        name: 'Hodge Cohomology', 
        type: 'sector', 
        progress: state?.subproblemResults?.find(r => r.domain === 'complex_ag')?.verified ? 100 : (state?.tracks?.find(t => t.id === 'S7_ADVERSARIAL_CONJECTURE')?.progress ?? 28), 
        x: 0, 
        y: -120, 
        z: -100, 
        color: '#2dd4bf', 
        details: 'Complex Algebraic Geometry & Rational Cycles', 
        agents: ['decomposer', 'librarian'],
        milestone: 'Validated Hodge classes on specific compact Kähler manifolds'
      },
    ];

    // Core System/Learning Engines
    const systems: Node3D[] = [
      { id: 'mcts', name: 'MCTS Hyper-Tree', type: 'system', progress: 88, x: 50, y: 0, z: -50, color: '#a7f3d0', details: 'Monte Carlo Tree Search & Selection Mechanics', agents: ['proxy_analyst'], milestone: 'Selection tree depth optimized to level 14' },
      { id: 'self_learn', name: 'Self-Learning Optimizer', type: 'learning', progress: state?.selfLearning?.learnedHeuristics ? Math.min(99, 45 + state.selfLearning.learnedHeuristics.length * 10) : 86, x: -50, y: 0, z: -50, color: '#ec4899', details: 'Recursive Rule Synthesis & Weight Optimization', agents: ['claim_auditor'], milestone: 'Autonomous weights converged with high confidence' },
    ];

    const allNodes = [...sectors, ...systems];
    setNodes(allNodes);

    // Connecting paths representing developmental links
    const connectionEdges: Edge3D[] = [
      { from: 'mcts', to: 'rh', color: 'rgba(56, 189, 248, 0.4)', dashOffset: 0, pulseSpeed: 0.08 },
      { from: 'mcts', to: 'ns', color: 'rgba(251, 113, 133, 0.4)', dashOffset: 2, pulseSpeed: 0.06 },
      { from: 'mcts', to: 'ym', color: 'rgba(192, 132, 252, 0.4)', dashOffset: 4, pulseSpeed: 0.09 },
      { from: 'self_learn', to: 'pnp', color: 'rgba(250, 204, 21, 0.4)', dashOffset: 1, pulseSpeed: 0.05 },
      { from: 'self_learn', to: 'bsd', color: 'rgba(251, 146, 60, 0.4)', dashOffset: 3, pulseSpeed: 0.07 },
      { from: 'self_learn', to: 'hodge', color: 'rgba(45, 212, 191, 0.4)', dashOffset: 5, pulseSpeed: 0.08 },
      { from: 'self_learn', to: 'mcts', color: 'rgba(236, 72, 153, 0.4)', dashOffset: 0, pulseSpeed: 0.12 },
    ];
    setEdges(connectionEdges);
  }, [state]);

  // Main 3D projection rendering engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      const parent = containerRef.current;
      if (!parent) return;
      canvas.width = parent.clientWidth * 0.64; // Scale size relative to layout
      canvas.height = 420;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Interactive mouse controls
    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) {
        // Detect hover over projected 2D coordinates
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        let foundHover: Node3D | null = null;
        for (const n of nodes) {
          // Project n to screen coordinates
          const screenPos = project3D(n.x, n.y, n.z, canvas.width, canvas.height);
          const dist = Math.hypot(screenPos.x - mouseX, screenPos.y - mouseY);
          if (dist < 22) {
            foundHover = n;
            break;
          }
        }
        if (foundHover) {
          setHoveredNode(foundHover);
        }
        return;
      }
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;

      anglesRef.current.y += dx * 0.007;
      anglesRef.current.x += dy * 0.007;

      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Function to project 3D point (X,Y,Z) onto 2D screenspace
    const project3D = (x: number, y: number, z: number, width: number, height: number) => {
      // Rotation matrices
      const cosX = Math.cos(anglesRef.current.x);
      const sinX = Math.sin(anglesRef.current.x);
      const cosY = Math.cos(anglesRef.current.y);
      const sinY = Math.sin(anglesRef.current.y);

      // Y-axis rotation
      let x1 = x * cosY - z * sinY;
      let z1 = x * sinY + z * cosY;

      // X-axis rotation
      let y2 = y * cosX - z1 * sinX;
      let z2 = y * sinX + z1 * cosX;

      // Perspective divide & scale
      const fov = 380;
      const distance = 420;
      const scale = fov / (distance + z2);

      return {
        x: width / 2 + x1 * scale,
        y: height / 2 - y2 * scale,
        z: z2, // Z-depth for depth sorting
        scale
      };
    };

    // Render loop
    const render = () => {
      // Auto rotate if not dragging
      if (isRotating && !isDragging.current) {
        anglesRef.current.y += 0.004;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Background Space Grid Mesh
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      const gridCount = 6;
      const gridSize = 250;
      for (let i = -gridCount; i <= gridCount; i++) {
        const step = (gridSize / gridCount) * i;
        const p1 = project3D(-gridSize, -120, step, canvas.width, canvas.height);
        const p2 = project3D(gridSize, -120, step, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        const p3 = project3D(step, -120, -gridSize, canvas.width, canvas.height);
        const p4 = project3D(step, -120, gridSize, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.stroke();
      }

      // 2. Draw Developmental Links / Edges (pulsing data flows)
      edges.forEach((edge) => {
        const fromNode = nodes.find((n) => n.id === edge.from);
        const toNode = nodes.find((n) => n.id === edge.to);
        if (!fromNode || !toNode) return;

        const p1 = project3D(fromNode.x, fromNode.y, fromNode.z, canvas.width, canvas.height);
        const p2 = project3D(toNode.x, toNode.y, toNode.z, canvas.width, canvas.height);

        // Drawing the continuous connecting track line
        ctx.strokeStyle = edge.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Animate a flowing data laser-dash
        edge.dashOffset = (edge.dashOffset + edge.pulseSpeed) % 1;
        const dashX = p1.x + (p2.x - p1.x) * edge.dashOffset;
        const dashY = p1.y + (p2.y - p1.y) * edge.dashOffset;

        ctx.fillStyle = fromNode.color;
        ctx.beginPath();
        ctx.arc(dashX, dashY, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Draw Nodes (Depth Sorted)
      const sortedNodes = [...nodes]
        .map((n) => ({ ...n, proj: project3D(n.x, n.y, n.z, canvas.width, canvas.height) }))
        .sort((a, b) => b.proj.z - a.proj.z);

      sortedNodes.forEach((n) => {
        const { x, y, scale } = n.proj;
        const radius = (n.type === 'sector' ? 15 : 12) * scale;

        const isHovered = hoveredNode?.id === n.id;
        if (isHovered) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, radius + 7, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = n.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * n.progress) / 100);
        ctx.stroke();

        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(x, y, radius - 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(9, 10 * scale)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(n.progress)}%`, x, y);

        ctx.fillStyle = 'rgba(241, 245, 249, 0.9)';
        ctx.font = `bold ${Math.max(9, 10 * scale)}px monospace`;
        ctx.fillText(n.name, x, y + radius + 15);
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [nodes, edges, hoveredNode, isRotating]);

  // Calculated high-level insights for the state
  const totalTasks = state?.agents?.reduce((acc, a) => acc + a.tasksCompleted, 0) ?? 45;
  const selfHealCount = state?.supervisor?.repairsThisHour ?? 3;
  const activeHeuristics = state?.selfLearning?.learnedHeuristics?.length ?? 6;

  // Derive top critical breakthrough sector
  const sortedSectors = [...nodes].filter(n => n.type === 'sector').sort((a, b) => b.progress - a.progress);
  const leadingSector = sortedSectors[0];
  const bottleneckSector = sortedSectors[sortedSectors.length - 1];

  return (
    <div className="space-y-6">
      
      {/* Upper Grid: 3D Canvas Visualizer + Dynamic Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" ref={containerRef}>
        
        {/* 3D Visualizer Card */}
        <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden relative flex flex-col justify-between p-5 min-h-[460px]">
          
          <div className="flex items-center justify-between z-10">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-sky-400" />
                Spatially Projected Swarm Progression (3D Orbit)
              </h4>
              <p className="text-xs text-slate-400">
                Hold drag to orbit the camera. Hover or tap nodes to audit sector milestones.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRotating(!isRotating)}
                className={`text-xs font-mono px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-colors ${
                  isRotating
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20'
                    : 'bg-slate-800/85 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Activity className={`h-3.5 w-3.5 ${isRotating ? 'animate-pulse' : ''}`} />
                {isRotating ? 'Rotating ON' : 'Paused'}
              </button>
            </div>
          </div>

          {/* The 3D Render Canvas */}
          <div className="flex-1 flex items-center justify-center relative my-2">
            <canvas ref={canvasRef} className="block cursor-grab active:cursor-grabbing max-w-full" />
            
            {/* Legend Overlay */}
            <div className="absolute bottom-2 left-2 flex items-center gap-3.5 bg-slate-950/80 border border-slate-800/60 p-2.5 rounded-lg text-[10px] font-mono">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                <span>Sector Target</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-pink-500" />
                <span>Learning Node</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>System Node</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Multi-Sector Progress & Analytics Sideboard */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          
          {/* Dynamic Insight Metric Counters */}
          <div className="bg-slate-900/65 border border-slate-800 rounded-xl p-4.5 space-y-4 shadow-lg">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Swarm Progress Insights
            </h4>

            {/* Insight Stats Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 space-y-0.5">
                <span className="text-[10px] text-slate-500 font-mono">Completed Runs</span>
                <div className="text-xl font-bold text-white font-mono">{totalTasks}</div>
                <div className="text-[9px] text-slate-400">Agent subproblems solved</div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 space-y-0.5">
                <span className="text-[10px] text-slate-500 font-mono">Autonomous Heuristics</span>
                <div className="text-xl font-bold text-pink-400 font-mono">{activeHeuristics} Wired</div>
                <div className="text-[9px] text-slate-400">Injected into self-learning</div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 space-y-0.5">
                <span className="text-[10px] text-slate-500 font-mono">Supervised Heals</span>
                <div className="text-xl font-bold text-emerald-400 font-mono">{selfHealCount} Runs</div>
                <div className="text-[9px] text-slate-400">Weaknesses auto-resolved</div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 space-y-0.5">
                <span className="text-[10px] text-slate-500 font-mono">Recombination Score</span>
                <div className="text-xl font-bold text-amber-400 font-mono">
                  {state?.recombinationData?.minedGeneCount ?? 4} Genes
                </div>
                <div className="text-[9px] text-slate-400">Mined from cross-crossovers</div>
              </div>
            </div>

            {/* Critical Targets Summary */}
            <div className="space-y-2 pt-1 border-t border-slate-800/50">
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-sky-400" /> Leading Sector:
                </span>
                <span className="text-white font-bold">{leadingSector?.name ?? 'Riemann Hypothesis'}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-500" /> Target Bottleneck:
                </span>
                <span className="text-white font-bold">{bottleneckSector?.name ?? 'P vs NP Class'}</span>
              </div>
            </div>
          </div>

          {/* Node Inspector Context Panel */}
          {hoveredNode ? (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4.5 space-y-3.5 shadow-xl flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-950 border border-slate-850 text-slate-400">
                    {hoveredNode.type.toUpperCase()}
                  </span>
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hoveredNode.color }} />
                </div>

                <div className="space-y-1 mt-3">
                  <h5 className="text-sm font-bold text-white leading-snug">{hoveredNode.name}</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">{hoveredNode.details}</p>
                </div>

                {/* Milestone Detail */}
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-850 space-y-1 text-xs mt-3">
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold font-mono">Verified Milestone achieved</div>
                  <p className="text-slate-300 font-mono text-[11px]">{hoveredNode.milestone}</p>
                </div>
              </div>

              {/* Progress Slider Bar */}
              <div className="space-y-1.5 mt-3 pt-2 border-t border-slate-800/40">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-mono">Progression Status</span>
                  <span className="font-mono font-bold text-white" style={{ color: hoveredNode.color }}>
                    {hoveredNode.progress.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${hoveredNode.progress}%`, backgroundColor: hoveredNode.color }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3 flex-1 min-h-[220px]">
              <Compass className="h-7 w-7 text-slate-600 animate-spin-slow" />
              <div className="space-y-1">
                <p className="text-xs text-slate-400 font-medium">No Node Highlighted</p>
                <p className="text-[10px] text-slate-500 max-w-xs">
                  Highlight, hover, or click any 3D orbital node on the mesh grid to inspect its real-time development metrics, subproblem milestones, and verified outcomes.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lower Dashboard Section: Fully Visible Sector Progression & Target Milestone Audit */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800/60 pb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-pink-400" />
              Mathematical Sector Progression & Breakthrough Audit
            </h3>
            <p className="text-xs text-slate-400">
              Complete diagnostic status of each active sector, detailed progress trackers, and direct links to active swarm agents.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5" /> Synchronized with Lean Kernel
          </span>
        </div>

        {/* Detailed Sector Progress Bar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.filter(n => n.type === 'sector').map((sector) => (
            <div 
              key={sector.id} 
              className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3.5 hover:border-slate-700 transition-all duration-300 relative group overflow-hidden"
              onMouseEnter={() => setHoveredNode(sector)}
            >
              <div className="absolute top-0 left-0 h-1 w-full" style={{ backgroundColor: sector.color }} />
              
              {/* Header Title / Progress Number */}
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white font-mono">{sector.name}</h4>
                  <span className="text-[10px] text-slate-400 font-sans block truncate max-w-[200px]">{sector.details}</span>
                </div>
                <span className="text-xs font-mono font-bold" style={{ color: sector.color }}>
                  {sector.progress.toFixed(0)}%
                </span>
              </div>

              {/* Progress Slider (Full Color representation) */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                  <div 
                    className="h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                    style={{ width: `${sector.progress}%`, backgroundColor: sector.color }}
                  />
                </div>
              </div>

              {/* Key Achieved Milestone */}
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-850 space-y-1 text-xs">
                <div className="text-[9px] text-slate-500 uppercase font-mono flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-emerald-400" /> Verified Milestone
                </div>
                <p className="text-slate-300 font-mono text-[10px] leading-relaxed line-clamp-2">
                  {sector.milestone}
                </p>
              </div>

              {/* Connected Swarm Sub-Agents */}
              <div className="flex justify-between items-center text-[10px] pt-1">
                <span className="text-slate-500 font-mono">Assigned Agents</span>
                <div className="flex gap-1">
                  {sector.agents.map(a => (
                    <span key={a} className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300 font-mono text-[9px] border border-slate-850">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
