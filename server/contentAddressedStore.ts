import crypto from 'crypto';

export interface StoredArtifact {
  hash: string;
  type: 'LEAN_SRC' | 'CAS_CERT' | 'DAG_SPEC' | 'KERNEL_RECEIPT';
  content: string;
  metadata: Record<string, any>;
  createdAt: number;
}

export class ContentAddressedStore {
  private artifacts: Map<string, StoredArtifact> = new Map();

  public computeHash(content: string): string {
    return crypto.createHash('sha256').update(content.trim(), 'utf8').digest('hex');
  }

  public put(type: StoredArtifact['type'], content: string, metadata: Record<string, any> = {}): StoredArtifact {
    const hash = this.computeHash(content);
    const artifact: StoredArtifact = {
      hash,
      type,
      content,
      metadata,
      createdAt: Date.now()
    };
    this.artifacts.set(hash, artifact);
    return artifact;
  }

  public get(hash: string): StoredArtifact | undefined {
    return this.artifacts.get(hash);
  }

  public has(hash: string): boolean {
    return this.artifacts.has(hash);
  }

  public list(): StoredArtifact[] {
    return Array.from(this.artifacts.values());
  }
}

export const globalCAS = new ContentAddressedStore();
