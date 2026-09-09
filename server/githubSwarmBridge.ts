import crypto from 'crypto';

export interface GitHubIssueLeaf {
  id: string;
  issueNumber: number;
  title: string;
  branch: string;
  statementLean: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'PR_SUBMITTED' | 'CLOSED_VERIFIED';
  provenanceHash: string;
}

export class GitHubSwarmBridge {
  private issues: Map<string, GitHubIssueLeaf> = new Map();
  private issueCounter = 100;

  public createLeafIssue(leafId: string, title: string, statementLean: string): GitHubIssueLeaf {
    const issueNumber = ++this.issueCounter;
    const branch = `leaf/${leafId.toLowerCase().replace(/[^a-z0-9_]/g, '-')}`;
    const provenanceHash = crypto.createHash('sha256').update(`${leafId}:${statementLean}`).digest('hex');

    const issue: GitHubIssueLeaf = {
      id: leafId,
      issueNumber,
      title: `[SUB-LEMMA] ${title}`,
      branch,
      statementLean,
      status: 'OPEN',
      provenanceHash
    };
    this.issues.set(leafId, issue);
    return issue;
  }

  public get(leafId: string): GitHubIssueLeaf | undefined {
    return this.issues.get(leafId);
  }

  public list(): GitHubIssueLeaf[] {
    return Array.from(this.issues.values());
  }

  public closeVerified(leafId: string): boolean {
    const issue = this.issues.get(leafId);
    if (!issue) return false;
    issue.status = 'CLOSED_VERIFIED';
    return true;
  }
}

export const globalGitHubBridge = new GitHubSwarmBridge();
