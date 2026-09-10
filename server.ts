import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { globalOrchestrator } from './server/orchestrator';
import { globalCompiler } from './server/kernelCertificateCompiler';
import { globalForceMultipliers } from './server/creativeForceMultipliers';
import { globalGitHubBridge } from './server/githubSwarmBridge';
import { runPSLQ, generateFarkasCertificate, runBuchberger, verifyDeBruijnNewmanBound } from './server/deterministicEngines';
import { globalScheduler } from './server/scheduler';

dotenv.config();

process.on('unhandledRejection', (reason) => {
  console.warn('Unhandled Promise Rejection caught safely:', reason);
});

process.on('uncaughtException', (err) => {
  console.warn('Uncaught Exception caught safely:', err);
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  const PORT = 3000;

  // Start background scheduler heartbeat on boot
  globalScheduler.start();

  // --- Swarm Health & State API Endpoints ---
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now(), schedulerRunning: globalScheduler.isAutonomousRunning() });
  });

  app.get('/api/swarm/state', (_req, res) => {
    res.json(globalOrchestrator.getState());
  });

  // --- Server-Sent Events (SSE) Stream ---
  app.get('/api/swarm/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ timestamp: Date.now(), state: globalOrchestrator.getState() })}\n\n`);

    const unregister = globalScheduler.registerSSEClient((event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    });

    req.on('close', () => {
      unregister();
    });
  });

  // --- DAG & Leaf Split Endpoints ---
  const handleLeafSplit = (req: express.Request, res: express.Response) => {
    const lemmaId = req.params.id;
    try {
      const subLemmas = globalOrchestrator.splitLeafNode(lemmaId);
      res.json({ success: true, lemmaId, subLemmas, state: globalOrchestrator.getState() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  app.post('/leaves/:id/split', handleLeafSplit);
  app.post('/api/leaves/:id/split', handleLeafSplit);

  const handleGetDag = (req: express.Request, res: express.Response) => {
    const problemId = req.params.problem || globalOrchestrator.getState().problemId;
    const state = globalOrchestrator.getState();
    res.json({
      problemId,
      targetTheorem: state.targetTheorem,
      lemmas: state.lemmas,
      totalLemmas: state.lemmas.length
    });
  };

  app.get('/dag/:problem', handleGetDag);
  app.get('/api/dag/:problem', handleGetDag);

  const handleGetLedger = (_req: express.Request, res: express.Response) => {
    const state = globalOrchestrator.getState();
    res.json({
      ledger: state.ledger,
      totalEntries: state.ledger.length,
      spent: state.spent,
      budget: state.budget
    });
  };

  app.get('/ledger', handleGetLedger);
  app.get('/api/ledger', handleGetLedger);

  // --- Mission & Controls ---
  app.post('/api/swarm/start', async (req, res) => {
    const { problemId, portfolioTier } = req.body;
    try {
      const state = await globalOrchestrator.runFullMission(problemId, portfolioTier);
      res.json({ success: true, message: 'Swarm mission launched successfully', state });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/swarm/stop', (_req, res) => {
    try {
      const state = globalOrchestrator.stopMission();
      res.json({ success: true, message: 'Swarm mission stopped', state });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/swarm/self-improve', (_req, res) => {
    try {
      const state = globalOrchestrator.triggerSelfImprovement();
      res.json({ success: true, message: 'Self-improvement epoch completed', state });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/swarm/self-improve/evolve', (_req, res) => {
    try {
      const state = globalOrchestrator.triggerSelfImprovement();
      res.json({ success: true, message: 'Cross-system evolutionary learning cycle executed', state });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/swarm/self-improve/heuristics', (_req, res) => {
    const state = globalOrchestrator.getState();
    res.json({ heuristics: state.selfLearning?.learnedHeuristics || [] });
  });

  app.get('/api/swarm/self-improve/weaknesses', (_req, res) => {
    const state = globalOrchestrator.getState();
    res.json({
      detectedWeaknesses: state.selfLearning?.detectedWeaknesses || [],
      remediationLog: state.selfLearning?.remediationLog || [],
      autoRemediationStats: state.selfLearning?.autoRemediationStats || null
    });
  });

  app.get('/api/swarm/subproblem/results', (_req, res) => {
    const state = globalOrchestrator.getState();
    res.json({
      subproblemResults: state.subproblemResults || []
    });
  });

  app.post('/api/swarm/subproblem/run', (req, res) => {
    try {
      const { domain, parameters } = req.body || {};
      const newState = globalOrchestrator.executeSubproblemWorkflow(domain, { parameters });
      const latestResult = newState.subproblemResults?.[0];
      res.json({
        success: true,
        message: `Executed subproblem workflow for domain: ${domain || 'default'}`,
        result: latestResult,
        state: newState
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/swarm/self-improve/diagnose', (_req, res) => {
    try {
      const state = globalOrchestrator.diagnoseAndRemediateShortcomings();
      res.json({
        success: true,
        message: 'Completed automated shortcoming diagnosis & self-healing remediation pass',
        state
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/swarm/self-improve/promote-tool', (req, res) => {
    try {
      const { heuristicId } = req.body || {};
      const state = globalOrchestrator.getState();
      const heuristic = state.selfLearning?.learnedHeuristics.find(h => h.id === heuristicId);
      if (!heuristic) {
        return res.status(404).json({ success: false, error: 'Heuristic not found' });
      }
      const newState = globalOrchestrator.promoteHeuristicToTool(heuristicId);
      res.json({ success: true, message: `Promoted heuristic ${heuristic.ruleName} to verified tool`, state: newState });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/swarm/synthesize-tool', (req, res) => {
    try {
      const { name, type } = req.body || {};
      const state = globalOrchestrator.synthesizeTool(name, type);
      res.json({ success: true, message: 'Tool generated and verified successfully', state });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- Healing Supervisor Endpoints ---
  app.get('/api/swarm/supervisor/status', (_req, res) => {
    try {
      const supervisor = globalOrchestrator.getSupervisorStatus();
      res.json({ success: true, supervisor });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/swarm/supervisor/step', async (_req, res) => {
    try {
      const supervisor = await globalOrchestrator.triggerSupervisorStep();
      res.json({ success: true, message: 'Supervisor step executed', supervisor });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/swarm/supervisor/mode', (req, res) => {
    try {
      const { mode } = req.body || {};
      if (!mode) return res.status(400).json({ success: false, error: 'mode is required' });
      const supervisor = globalOrchestrator.setSupervisorRunMode(mode);
      res.json({ success: true, message: `Supervisor mode set to ${mode}`, supervisor });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/swarm/verify-all', (_req, res) => {
    const compileSummary = globalCompiler.compileAll();
    const dagAcyclic = globalCompiler.verifyDagAcyclic();
    res.json({
      allPassed: compileSummary.zeroSorryAll && dagAcyclic,
      compileSummary,
      dagAcyclic
    });
  });

  // --- Autonomous Scheduler Controls ---
  app.post('/api/scheduler/start', (_req, res) => {
    globalScheduler.start();
    res.json({ success: true, running: globalScheduler.isAutonomousRunning() });
  });

  app.post('/api/scheduler/stop', (_req, res) => {
    globalScheduler.stop();
    res.json({ success: true, running: globalScheduler.isAutonomousRunning() });
  });

  app.get('/api/scheduler/status', (_req, res) => {
    res.json({
      running: globalScheduler.isAutonomousRunning(),
      circuitBroken: globalScheduler.isCircuitBroken()
    });
  });

  app.get('/api/swarm/predictions', (_req, res) => {
    res.json({ predictions: globalForceMultipliers.getPredictions() });
  });

  app.get('/api/swarm/contenders', (_req, res) => {
    res.json({ contenders: globalForceMultipliers.getContenders() });
  });

  app.get('/api/swarm/github-issues', (_req, res) => {
    res.json({ issues: globalGitHubBridge.list() });
  });

  // --- Deterministic CAS API ---
  app.post('/api/cas/pslq', (req, res) => {
    const { vector } = req.body;
    const result = runPSLQ(vector || [1, -2, 1]);
    res.json(result);
  });

  app.post('/api/cas/farkas', (req, res) => {
    const { A, b } = req.body;
    const cert = generateFarkasCertificate(A || [[1, 1]], b || [1]);
    res.json(cert);
  });

  app.post('/api/cas/buchberger', (req, res) => {
    const { generators } = req.body;
    const result = runBuchberger(generators || ['x^2 + y^2 - 1']);
    res.json(result);
  });

  app.post('/api/cas/interval', (req, res) => {
    const { bound } = req.body;
    const result = verifyDeBruijnNewmanBound(bound || 0.1787854);
    res.json(result);
  });

  // --- Vite & Static Handling ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lean Swarm Orchestrator running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
