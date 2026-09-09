import fs from 'fs';
import path from 'path';
import { contentAddressedStore } from '../server/contentAddressedStore';

function stripLeanComments(content: string): string {
  // Remove block comments /- ... -/
  let stripped = content.replace(/\/-[\s\S]*?-\//g, '');
  // Remove line comments -- ...
  stripped = stripped.replace(/--.*$/gm, '');
  return stripped;
}

export function testLeanIntegrityGate(): { passed: boolean; message: string; checkedFiles: number } {
  const filesToScan: { name: string; content: string }[] = [];

  // 1. Root file
  const rootLean = path.join(process.cwd(), 'LeanSwarmOrchestrator.lean');
  if (fs.existsSync(rootLean)) {
    filesToScan.push({ name: 'LeanSwarmOrchestrator.lean', content: fs.readFileSync(rootLean, 'utf8') });
  }

  // 2. Track directory
  const trackDir = path.join(process.cwd(), 'LeanSwarmOrchestrator');
  if (fs.existsSync(trackDir)) {
    const trackFiles = fs.readdirSync(trackDir).filter(f => f.endsWith('.lean'));
    for (const f of trackFiles) {
      filesToScan.push({
        name: `LeanSwarmOrchestrator/${f}`,
        content: fs.readFileSync(path.join(trackDir, f), 'utf8')
      });
    }
  }

  // 3. Content-Addressed Store certificates
  const casArtifacts = contentAddressedStore.list();
  for (const artifact of casArtifacts) {
    filesToScan.push({
      name: `CAS:${artifact.metadata.id} (${artifact.hash.slice(0, 8)})`,
      content: artifact.content
    });
  }

  let totalFiles = filesToScan.length;
  const violations: string[] = [];

  for (const item of filesToScan) {
    const codeOnly = stripLeanComments(item.content);

    // Check forbidden patterns in Lean code body
    const forbiddenTokens = ['sorry', 'admit', 'native_decide'];
    for (const token of forbiddenTokens) {
      const regex = new RegExp(`\\b${token}\\b`, 'g');
      if (regex.test(codeOnly)) {
        violations.push(`${item.name} contains unverified code token: '${token}'`);
      }
    }

    // Check for empty body / trivial placeholders
    if (item.content.trim().length < 30) {
      violations.push(`${item.name} is suspiciously short (${item.content.trim().length} bytes)`);
    }
  }

  if (violations.length > 0) {
    return {
      passed: false,
      message: `Lean Integrity Gate FAILED with ${violations.length} violations:\n${violations.join('\n')}`,
      checkedFiles: totalFiles
    };
  }

  return {
    passed: true,
    message: `Lean Integrity Gate PASSED: Verified ${totalFiles} Lean tracks & CAS certificates with 0 'sorry' or forbidden escapes in executable code.`,
    checkedFiles: totalFiles
  };
}
