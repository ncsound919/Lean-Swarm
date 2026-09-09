import fs from 'fs';
import path from 'path';

export function testSecurityConfigs(): { passed: boolean; message: string } {
  const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  // Check firebase-applet-config.json
  if (fs.existsSync(firebaseConfigPath)) {
    const raw = fs.readFileSync(firebaseConfigPath, 'utf8');
    const parsed = JSON.parse(raw);

    if (parsed.private_key || parsed.privateKey || parsed.client_email || parsed.clientEmail) {
      return { 
        passed: false, 
        message: 'Security Violation: private_key or client_email found in firebase-applet-config.json!' 
      };
    }
  }

  // Check .env.example
  if (fs.existsSync(envExamplePath)) {
    const content = fs.readFileSync(envExamplePath, 'utf8');
    // Ensure no real secrets are leaked in .env.example
    const dangerousPatterns = [/AIza[0-9A-Za-z-_]{35}/, /ghp_[0-9A-Za-z]{36}/, /sk-[0-9A-Za-z]{32}/];
    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        return { 
          passed: false, 
          message: 'Security Violation: Live secret token pattern detected in .env.example!' 
        };
      }
    }
  }

  return { 
    passed: true, 
    message: 'Security & Configs Gate PASSED: Verified zero service-account credentials and clean placeholders.' 
  };
}
