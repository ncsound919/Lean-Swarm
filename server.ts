import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { globalOrchestrator } from './server/orchestrator';
import { globalCompiler } from './server/kernelCertificateCompiler';
import { globalForceMultipliers } from './server/creativeForceMultipliers';
import { globalGitHubBridge } from './server/githubSwarmBridge';
import { runPSLQ, generateFarkasCertificate, runBuchberger, verifyDeBruijnNewmanBound } from './server/deterministicEngines';

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

  // --- Swarm API Endpoints ---
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  app.get('/api/swarm/state', (_req, res) => {
    res.json(globalOrchestrator.getState());
  });

  app.post('/api/swarm/start', async (req, res) => {
    const { problemId, portfolioTier } = req.body;
    try {
      const state = await globalOrchestrator.runFullMission(problemId, portfolioTier);
      res.json({ success: true, message: 'Swarm mission completed successfully', state });
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

  app.post('/api/swarm/synthesize-tool', (req, res) => {
    try {
      const { name, type } = req.body || {};
      const state = globalOrchestrator.synthesizeTool(name, type);
      res.json({ success: true, message: 'Tool generated and verified successfully', state });
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
