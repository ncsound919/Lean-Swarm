import fs from 'fs';
import path from 'path';

function stripLeanComments(content: string): string {
  // Remove block comments /- ... -/
  let stripped = content.replace(/\/-[\s\S]*?-\//g, '');
  // Remove line comments -- ...
  stripped = stripped.replace(/--.*$/gm, '');
  return stripped;
}

export function testLeanIntegrityGate(): { passed: boolean; message: string; checkedFiles: number } {
  const dirsToScan = [
    path.join(process.cwd(), 'LeanSwarmOrchestrator'),
    path.join(process.cwd(), '.lean_artifacts')
  ];

  let totalFiles = 0;
  const violations: string[] = [];

  for (const dir of dirsToScan) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.lean'));
    for (const file of files) {
      totalFiles++;
      const fullPath = path.join(dir, file);
      const rawContent = fs.readFileSync(fullPath, 'utf8');
      const codeOnly = stripLeanComments(rawContent);

      // Check forbidden patterns in Lean code body
      const forbiddenTokens = ['sorry', 'admit', 'native_decide'];
      for (const token of forbiddenTokens) {
        const regex = new RegExp(`\\b${token}\\b`, 'g');
        if (regex.test(codeOnly)) {
          violations.push(`${file} contains unverified code token: '${token}'`);
        }
      }

      // Check for empty body / trivial placeholders
      if (rawContent.trim().length < 30) {
        violations.push(`${file} is suspiciously short (${rawContent.trim().length} bytes)`);
      }
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
    message: `Lean Integrity Gate PASSED: Verified ${totalFiles} Lean files with 0 'sorry' or forbidden escapes in executable code.`,
    checkedFiles: totalFiles
  };
}
