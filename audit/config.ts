import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(): Record<string, string> {
  const envPath = join(__dirname, '.env.audit');

  if (!existsSync(envPath)) {
    console.error(
      '\nMissing audit/.env.audit — copy .env.audit.example and fill in credentials.\n'
    );
    process.exit(1);
  }

  const env: Record<string, string> = {};
  readFileSync(envPath, 'utf-8')
    .split('\n')
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx === -1) return;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      env[key] = value;
    });

  return env;
}

const env = loadEnv();

if (!env.AUDIT_EMAIL || !env.AUDIT_PASSWORD) {
  console.error('\nAUDIT_EMAIL and AUDIT_PASSWORD must be set in audit/.env.audit\n');
  process.exit(1);
}

export const config = {
  baseUrl: (env.AUDIT_BASE_URL || 'https://bedrockchat.com').replace(/\/$/, ''),
  email: env.AUDIT_EMAIL,
  password: env.AUDIT_PASSWORD,
  parentEmail: env.AUDIT_PARENT_EMAIL || null,
  parentPassword: env.AUDIT_PARENT_PASSWORD || null,
  /** Remote debugging port Playwright will use — must match --remote-debugging-port arg */
  cdpPort: parseInt(env.AUDIT_CDP_PORT || '9222', 10),
};
