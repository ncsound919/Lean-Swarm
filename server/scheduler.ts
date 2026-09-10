import { LeanSwarmOrchestrator, globalOrchestrator } from './orchestrator';

export type SSEClientCallback = (event: string, data: any) => void;

export class SwarmScheduler {
  private orchestrator: LeanSwarmOrchestrator;
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private intervalMs: number;
  private sseClients: Set<SSEClientCallback> = new Set();
  private llmCircuitBroken: boolean = false;
  private consecutiveLLMErrors: number = 0;

  constructor(orchestrator: LeanSwarmOrchestrator, intervalMs: number = 4000) {
    this.orchestrator = orchestrator;
    this.intervalMs = intervalMs;
  }

  public registerSSEClient(callback: SSEClientCallback): () => void {
    this.sseClients.add(callback);
    return () => {
      this.sseClients.delete(callback);
    };
  }

  private broadcast(event: string, data: any) {
    for (const client of this.sseClients) {
      try {
        client(event, data);
      } catch (err) {
        this.sseClients.delete(client);
      }
    }
  }

  public start(): boolean {
    if (this.isRunning) return true;
    this.isRunning = true;
    console.log(`[SCHEDULER] Swarm Heartbeat Daemon started (Tick interval: ${this.intervalMs}ms).`);
    
    this.timer = setInterval(async () => {
      await this.tick();
    }, this.intervalMs);

    // Initial tick immediately
    this.tick().catch(err => console.error('[SCHEDULER] Tick error:', err));
    return true;
  }

  public stop(): boolean {
    if (!this.isRunning) return false;
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[SCHEDULER] Swarm Heartbeat Daemon stopped.');
    return true;
  }

  public isAutonomousRunning(): boolean {
    return this.isRunning;
  }

  public isCircuitBroken(): boolean {
    return this.llmCircuitBroken;
  }

  public async tick(): Promise<void> {
    if (!this.isRunning) return;

    try {
      // Execute Conductor tick
      const tickSummary = await this.orchestrator.runConductorTick();
      const state = this.orchestrator.getState();

      // Broadcast live SSE state & tick payload
      this.broadcast('swarm_tick', {
        timestamp: Date.now(),
        tickSummary,
        phase: state.phase,
        lemmasCount: state.lemmas.length,
        ledgerCount: state.ledger.length,
        spent: state.spent,
        lastLog: state.logs[state.logs.length - 1]
      });

      this.broadcast('state_update', state);
    } catch (err: any) {
      console.error('[SCHEDULER] Error during autonomous tick:', err);
      this.consecutiveLLMErrors++;
      if (this.consecutiveLLMErrors >= 3) {
        this.llmCircuitBroken = true;
        console.warn('[SCHEDULER CIRCUIT BREAKER] Tripped! Fallback to 100% deterministic engines.');
      }
    }
  }
}

export const globalScheduler = new SwarmScheduler(globalOrchestrator, 4000);
