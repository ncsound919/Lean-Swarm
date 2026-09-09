export interface MarketPrediction {
  trackId: string;
  probability: number;
  totalBetsUSD: number;
  activeStakers: number;
}

export interface ProverContender {
  name: string;
  elo: number;
  proofsGenerated: number;
  wins: number;
}

export class CreativeForceMultipliers {
  private predictions: Map<string, MarketPrediction> = new Map();
  private contenders: Map<string, ProverContender> = new Map();

  constructor() {
    this.initPredictions();
    this.initContenders();
  }

  private initPredictions() {
    this.predictions.set('S4_MONOTONIC_BOUNDS', { trackId: 'S4_MONOTONIC_BOUNDS', probability: 0.88, totalBetsUSD: 1420.50, activeStakers: 42 });
    this.predictions.set('S2_RECURSIVE_DAG', { trackId: 'S2_RECURSIVE_DAG', probability: 0.74, totalBetsUSD: 980.00, activeStakers: 28 });
    this.predictions.set('S8_BARRIER_AWARE_ROUTING', { trackId: 'S8_BARRIER_AWARE_ROUTING', probability: 0.96, totalBetsUSD: 2350.00, activeStakers: 65 });
  }

  private initContenders() {
    this.contenders.set('Aesop Tactic Synthesizer', { name: 'Aesop Tactic Synthesizer', elo: 1850, proofsGenerated: 34, wins: 28 });
    this.contenders.set('E-Graph Equality Engine', { name: 'E-Graph Equality Engine', elo: 1790, proofsGenerated: 21, wins: 17 });
    this.contenders.set('PSLQ Non-Existence Oracle', { name: 'PSLQ Non-Existence Oracle', elo: 1920, proofsGenerated: 19, wins: 18 });
  }

  public getPredictions(): MarketPrediction[] {
    return Array.from(this.predictions.values());
  }

  public getContenders(): ProverContender[] {
    return Array.from(this.contenders.values());
  }

  public proofGolf(leanSource: string): { originalLength: number; compressedLength: number; savedPercentage: number } {
    const originalLength = leanSource.length;
    const compressed = leanSource
      .replace(/\s+/g, ' ')
      .replace(/by\s+exact\s+/g, '')
      .replace(/;\s*trivial/g, '');
    const compressedLength = compressed.length;
    const savedPercentage = Math.round(((originalLength - compressedLength) / (originalLength || 1)) * 100);
    return { originalLength, compressedLength, savedPercentage: Math.max(0, savedPercentage) };
  }
}

export const globalForceMultipliers = new CreativeForceMultipliers();
