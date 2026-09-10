import crypto from 'crypto';
import { SeededRNG } from './seededRNG';

export { SeededRNG };

export interface MCTSNode {
  id: string;
  visits: number;
  value: number;
  children: MCTSNode[];
  parent?: MCTSNode;
  tactic: string;
}

export class MonteCarloHyperTree {
  private root: MCTSNode;
  private rng: SeededRNG;

  constructor(seed: number = 42) {
    this.rng = new SeededRNG(seed);
    this.root = {
      id: 'root',
      visits: 0,
      value: 0,
      children: [],
      tactic: 'initial'
    };
  }

  public getRoot(): MCTSNode {
    return this.root;
  }

  public selectUCT(node: MCTSNode, c: number = 1.414): MCTSNode {
    if (node.children.length === 0) return node;
    let bestChild = node.children[0];
    let bestScore = -Infinity;

    for (const child of node.children) {
      if (child.visits === 0) return child;
      const exploitation = child.value / child.visits;
      const exploration = c * Math.sqrt(Math.log(node.visits) / child.visits);
      const score = exploitation + exploration;
      if (score > bestScore) {
        bestScore = score;
        bestChild = child;
      }
    }
    return this.selectUCT(bestChild, c);
  }

  public expand(node: MCTSNode, tactics: string[]): MCTSNode {
    for (const tac of tactics) {
      const child: MCTSNode = {
        id: `node_${crypto.createHash('sha256').update(tac + this.rng.next()).digest('hex').slice(0, 8)}`,
        visits: 0,
        value: 0,
        children: [],
        parent: node,
        tactic: tac
      };
      node.children.push(child);
    }
    return node.children[0];
  }

  public backpropagate(node: MCTSNode, reward: number): void {
    let curr: MCTSNode | undefined = node;
    while (curr) {
      curr.visits += 1;
      curr.value += reward;
      curr = curr.parent;
    }
  }

  public runSearch(iterations: number = 50): MCTSNode {
    const candidateTactics = ['intro x', 'simp', 'ring', 'linarith', 'omega', 'exact trivial'];
    for (let i = 0; i < iterations; i++) {
      const selected = this.selectUCT(this.root);
      const leaf = selected.children.length === 0 ? this.expand(selected, candidateTactics) : selected;
      const reward = this.rng.next() > 0.3 ? 1.0 : 0.0;
      this.backpropagate(leaf, reward);
    }
    return this.root;
  }
}
