import { type Page } from '@playwright/test';
import { config } from './config.js';

/**
 * Authenticates with Bedrock Chat using the standard login form.
 *
 * Login form specifics (from components/login/login-form.tsx):
 * - Identifier input: id="identifier", accepts username or email
 * - Password input: id="password"
 * - Submit button: text = "Enter Bedrock"
 * - After auth: nav[aria-label="Servers"] appears
 *
 * PRIVACY: Standard login form only. No token injection, no Supabase direct access.
 * Uses a dedicated test account — not real user data.
 */
export async function authenticate(
  page: Page,
  credentials: { email: string; password: string } = {
    email: config.email,
    password: config.password,
  },
): Promise<void> {
  console.log(`  Authenticating as ${credentials.email}...`);

  await page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle' });

  // Fill identifier (username or email)
  const identifierInput = page.locator('#identifier').first();
  await identifierInput.waitFor({ state: 'visible', timeout: 15000 });
  await identifierInput.fill(credentials.email);

  // Fill password
  await page.locator('#password').fill(credentials.password);

  // Submit
  await page.locator('button:has-text("Enter Bedrock"), button[type="submit"]').first().click();

  // Wait for navigation away from login page
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 });

  // Wait for authenticated app shell (server list nav)
  await page
    .waitForSelector('nav[aria-label="Servers"], [data-testid="server-list"]', {
      timeout: 20000,
    })
    .catch(() => page.waitForSelector('main', { timeout: 10000 }));

  console.log('  Authenticated successfully');
}

/**
 * Discovers serverId, channelId (text), and voiceChannelId from the live app.
 * Navigates to the first server and inspects channel links.
 *
 * Bedrock Chat URL patterns:
 * - Text channels: /servers/[serverId]/[channelId]
 * - Voice channels: /channels/[serverId]/voice/[channelId]
 */
export async function discoverRouteParams(page: Page): Promise<{
  serverId: string | null;
  channelId: string | null;
  voiceChannelId: string | null;
}> {
  console.log('  Discovering route parameters...');

  let serverId: string | null = null;
  let channelId: string | null = null;
  let voiceChannelId: string | null = null;

  // Find any server link in the server list sidebar
  // The server list nav contains links to /servers/[serverId]/[channelId]
  const serverLink = page
    .locator('nav[aria-label="Servers"] a[href*="/servers/"]')
    .first();

  try {
    const href = await serverLink.getAttribute('href', { timeout: 5000 });
    if (href) {
      const match = href.match(/\/servers\/([^/]+)\/([^/]+)/);
      if (match) {
        serverId = match[1];
        channelId = match[2];
      }
    }
  } catch {
    // Server list may use buttons rather than links — try clicking the first server
    const serverBtn = page
      .locator('nav[aria-label="Servers"] button, nav[aria-label="Servers"] [role="button"]')
      .first();

    try {
      await serverBtn.click({ timeout: 5000 });
      await page.waitForTimeout(1500);

      // Now check the URL
      const url = new URL(page.url());
      const pathMatch = url.pathname.match(/\/servers\/([^/]+)\/([^/]+)/);
      if (pathMatch) {
        serverId = pathMatch[1];
        channelId = pathMatch[2];
      }
    } catch {
      console.warn('  Could not find server — server/voice routes will be skipped.');
    }
  }

  if (serverId) {
    // Navigate to server to find voice channel links
    await page.goto(`${config.baseUrl}/servers/${serverId}/${channelId || ''}`, {
      waitUntil: 'networkidle',
    });
    await page.waitForTimeout(1500);

    // Look for voice channel links (pattern: /channels/[serverId]/voice/[channelId])
    const voiceLinks = page.locator(
      'nav[aria-label="Channels"] a[href*="/voice/"], a[href*="/voice/"]',
    );

    try {
      const href = await voiceLinks.first().getAttribute('href', { timeout: 3000 });
      if (href) {
        const match = href.match(/\/channels\/[^/]+\/voice\/([^/]+)/);
        if (match) voiceChannelId = match[1];
      }
    } catch {
      console.warn('  Could not find voice channel link.');
    }
  }

  console.log(
    `  Server: ${serverId ?? 'none'} | Channel: ${channelId ?? 'none'} | Voice: ${voiceChannelId ?? 'none'}`,
  );

  return { serverId, channelId, voiceChannelId };
}
