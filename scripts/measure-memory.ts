/**
 * Memory measurement protocol for Bedrock Chat.
 *
 * Requires Playwright: pnpm add -D @playwright/test
 * Run: pnpm exec playwright test scripts/measure-memory.ts
 *
 * Measures JS heap at key points in the user journey and reports
 * whether the app stays within the <100MB RAM budget.
 *
 * IMPORTANT: Fill in the login credentials and data-testid selectors
 * below before running.
 */

import { test, chromium } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Fill in test credentials
const TEST_EMAIL = process.env.TEST_EMAIL || "test@example.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "testpassword";

test("Memory measurement protocol", async () => {
	const browser = await chromium.launch({ headless: false });
	const context = await browser.newContext();
	const page = await context.newPage();

	// Enable CDP for memory measurement
	const client = await context.newCDPSession(page);

	const results: { label: string; usedMB: number; totalMB: number }[] = [];

	async function measureHeap(label: string): Promise<number> {
		// Force GC before measuring for consistent results
		await client.send("HeapProfiler.collectGarbage");
		await page.waitForTimeout(500);

		const metrics = await client.send("Performance.getMetrics");
		const jsHeap = metrics.metrics.find(
			(m: { name: string }) => m.name === "JSHeapUsedSize",
		);
		const totalHeap = metrics.metrics.find(
			(m: { name: string }) => m.name === "JSHeapTotalSize",
		);
		const usedMB =
			Math.round(((jsHeap?.value ?? 0) / 1024 / 1024) * 10) / 10;
		const totalMB =
			Math.round(((totalHeap?.value ?? 0) / 1024 / 1024) * 10) / 10;

		results.push({ label, usedMB, totalMB });
		console.log(`[MEMORY] ${label}: Used=${usedMB}MB, Total=${totalMB}MB`);
		return jsHeap?.value ?? 0;
	}

	try {
		// 1. Login page baseline
		await page.goto(`${BASE_URL}/login`);
		await page.waitForLoadState("networkidle");
		await measureHeap("Login page (baseline)");

		// 2. Login
		await page.fill('[name="email"], [type="email"]', TEST_EMAIL);
		await page.fill('[name="password"], [type="password"]', TEST_PASSWORD);
		await page.click('button[type="submit"]');
		await page.waitForTimeout(3000); // Wait for auth + redirect
		await measureHeap("After login");

		// 3. Wait for app to stabilize
		await page.waitForTimeout(2000);
		await measureHeap("App stabilized");

		// 4. Navigate between 6 channels (triggers LRU eviction at 5)
		// Uses keyboard/click navigation — fill in actual selectors
		for (let i = 0; i < 6; i++) {
			// Try clicking channel items in the sidebar
			const channels = page.locator(
				'button:has-text("#"), [data-channel-id]',
			);
			const count = await channels.count();
			if (count > i) {
				await channels.nth(i % count).click();
				await page.waitForTimeout(1500);
			}
		}
		await measureHeap("After 6 channel switches (LRU eviction)");

		// 5. Open settings modal
		// Try common triggers
		const settingsButton = page.locator(
			'[aria-label*="Settings"], [aria-label*="settings"]',
		);
		if ((await settingsButton.count()) > 0) {
			await settingsButton.first().click();
			await page.waitForTimeout(1000);
			await measureHeap("Settings modal open");
			// Close
			await page.keyboard.press("Escape");
		}

		// 6. Idle measurement — check for memory leaks
		const beforeIdle = await measureHeap("Before 30s idle");
		await page.waitForTimeout(30000);
		const afterIdle = await measureHeap("After 30s idle");
		const growthBytes = afterIdle - beforeIdle;
		const growthMB = Math.round((growthBytes / 1024 / 1024) * 100) / 100;
		console.log(
			`\n[MEMORY] Idle growth: ${growthMB}MB — ${growthBytes > 512 * 1024 ? "POTENTIAL LEAK" : "STABLE"}`,
		);

		// 7. Summary
		console.log("\n=== MEMORY MEASUREMENT SUMMARY ===");
		console.log("─".repeat(55));
		for (const r of results) {
			const status = r.usedMB < 100 ? "PASS" : "FAIL";
			console.log(
				`  ${r.label.padEnd(35)} ${String(r.usedMB).padStart(6)}MB  [${status}]`,
			);
		}
		console.log("─".repeat(55));

		const maxUsed = Math.max(...results.map((r) => r.usedMB));
		console.log(
			`\n[BUDGET] Peak JS Heap: ${maxUsed}MB — Target: <100MB — ${maxUsed < 100 ? "PASS" : "FAIL"}`,
		);
		console.log(`[BUDGET] Idle growth: ${growthMB}MB — Target: <0.5MB — ${Math.abs(growthMB) < 0.5 ? "PASS" : "INVESTIGATE"}`);
	} finally {
		await browser.close();
	}
});
