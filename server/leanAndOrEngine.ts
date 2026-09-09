import crypto from 'crypto';

export interface LeanGoalNode {
  id: string;
  target: string;
  hypotheses: string[];
  goal_fingerprint: string;
  isSolved: boolean;
  parentGoalId?: string;
  subGoals: string[];
  proofTactic?: string;
}

export class LeanAndOrSearchGraph {
  private goals: Map<string, LeanGoalNode> = new Map();

  public createGoal(target: string, hypotheses: string[] = []): LeanGoalNode {
    const normTarget = target.trim().replace(/\s+/g, ' ');
    const normHyps = hypotheses.map(h => h.trim()).sort().join(';');
    const goal_fingerprint = crypto.createHash('sha256').update(`${normTarget}::${normHyps}`).digest('hex').slice(0, 16);
    const id = `g_${goal_fingerprint.slice(0, 8)}`;

    const node: LeanGoalNode = {
      id,
      target: normTarget,
      hypotheses,
      goal_fingerprint,
      isSolved: false,
      subGoals: []
    };
    this.goals.set(id, node);
    return node;
  }

  public getGoal(id: string): LeanGoalNode | undefined {
    return this.goals.get(id);
  }

  public applyTactic(goalId: string, tactic: string, resultingSubgoals: Array<{ target: string; hypotheses: string[] }>): boolean {
    const goal = this.goals.get(goalId);
    if (!goal) return false;

    goal.proofTactic = tactic;
    if (resultingSubgoals.length === 0) {
      goal.isSolved = true;
    } else {
      for (const sub of resultingSubgoals) {
        const subNode = this.createGoal(sub.target, sub.hypotheses);
        subNode.parentGoalId = goalId;
        goal.subGoals.push(subNode.id);
      }
    }
    return true;
  }

  public isGraphSolved(rootId: string): boolean {
    const root = this.goals.get(rootId);
    if (!root) return false;
    if (root.isSolved) return true;
    if (root.subGoals.length === 0) return false;
    return root.subGoals.every(subId => this.isGraphSolved(subId));
  }
}
