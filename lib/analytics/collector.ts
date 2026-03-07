/**
 * Core analytics event collector.
 *
 * Design principles:
 * - Zero PII: no user IDs, emails, IPs, or fingerprinting
 * - Anonymous session token (rotating, sessionStorage only)
 * - Batched sends via navigator.sendBeacon / fetch fallback
 * - Fail-silent: dropped events never degrade UX
 * - Client-only: never runs in SSR
 * - Age-tier aware for COPPA compliance
 */

import {
	type AgeTier,
	type AnalyticsEvent,
	type BatchPayload,
	type ErrorType,
	FEATURE_EVENTS,
	type FeatureEventKey,
} from "./events";
import { getDeviceCategory, getViewportBucket, sanitizePath } from "./sanitize";

export interface CollectorConfig {
	endpoint: string;
	batchSize?: number;
	flushInterval?: number;
	ageTier: AgeTier;
	/** Called at flush time to check if analytics is enabled (consent). */
	getEnabled: () => boolean;
}

const SESSION_TOKEN_KEY = "bedrock_analytics_session";
const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_FLUSH_INTERVAL_MS = 10_000;

export class AnalyticsCollector {
	private readonly endpoint: string;
	private readonly batchSize: number;
	private readonly flushInterval: number;
	private readonly ageTier: AgeTier;
	private readonly getEnabled: () => boolean;

	private queue: AnalyticsEvent[] = [];
	private sessionToken: string | null = null;
	private flushTimer: ReturnType<typeof setInterval> | null = null;
	private previousPath: string | null = null;
	private consecutiveFailures = 0;
	private static readonly MAX_CONSECUTIVE_FAILURES = 3;

	constructor(config: CollectorConfig) {
		this.endpoint = config.endpoint;
		this.batchSize = config.batchSize ?? DEFAULT_BATCH_SIZE;
		this.flushInterval = config.flushInterval ?? DEFAULT_FLUSH_INTERVAL_MS;
		this.ageTier = config.ageTier;
		this.getEnabled = config.getEnabled;

		if (typeof window === "undefined") return;

		this.sessionToken = this.getOrCreateSessionToken();
		this.startFlushTimer();
		this.track({ event_type: "session", event_name: "session_start" });
	}

	private getOrCreateSessionToken(): string {
		try {
			const existing = sessionStorage.getItem(SESSION_TOKEN_KEY);
			if (existing) return existing;
			const token = crypto.randomUUID();
			sessionStorage.setItem(SESSION_TOKEN_KEY, token);
			return token;
		} catch {
			// sessionStorage blocked (e.g. private mode in some browsers) — generate ephemeral token
			return crypto.randomUUID();
		}
	}

	private isCollectionAllowed(eventType: string): boolean {
		// under_13: no collection whatsoever
		if (this.ageTier === "under_13") return false;
		// unknown: minimal (page_view and session only)
		if (this.ageTier === "unknown" || this.ageTier === "teen_13_15") {
			return eventType === "page_view" || eventType === "session";
		}
		return true;
	}

	/** Track a generic event. Respects age tier and consent. */
	track(event: Omit<AnalyticsEvent, "timestamp">): void {
		if (typeof window === "undefined") return;
		if (!this.isCollectionAllowed(event.event_type)) return;

		const currentPath = sanitizePath(window.location.pathname);
		const enriched: AnalyticsEvent = {
			...event,
			page_path: event.page_path ?? currentPath,
			referrer_path: event.referrer_path ?? (this.previousPath ?? undefined),
			timestamp: new Date().toISOString(),
		};

		this.queue.push(enriched);

		if (this.queue.length >= this.batchSize) {
			this.flush();
		}
	}

	/** Track a page view. Call on every route change. */
	trackPageView(path: string, referrerPath?: string): void {
		const sanitized = sanitizePath(path);
		const sanitizedReferrer = referrerPath ? sanitizePath(referrerPath) : this.previousPath ?? undefined;

		this.track({
			event_type: "page_view",
			event_name: "page_view",
			page_path: sanitized,
			referrer_path: sanitizedReferrer ?? undefined,
		});

		this.previousPath = sanitized;
	}

	/** Track a feature interaction using the canonical FEATURE_EVENTS catalog. */
	trackFeature(key: FeatureEventKey, extraData?: Record<string, string | number | boolean>): void {
		const def = FEATURE_EVENTS[key];
		this.track({
			event_type: "feature_use",
			event_name: def.name,
			event_data: { category: def.category, ...extraData },
		});
	}

	/** Track a performance metric. duration_ms is required. */
	trackPerformance(name: string, durationMs: number, isError = false): void {
		this.track({
			event_type: "performance",
			event_name: name,
			event_data: { duration_ms: durationMs, is_error: isError },
		});
	}

	/** Track a JavaScript or API error. Sanitized automatically. */
	trackError(type: ErrorType, message: string, stack?: string): void {
		// Truncate and sanitize message — never log full stack with data
		const safeMessage = message.slice(0, 200).replace(/[\w.+-]+@[\w.+-]+/g, "[email]");
		const safeStack = stack
			? stack
					.slice(0, 1000)
					.replace(/\?[^\s]*/g, "") // strip query params from file URLs
					.replace(/at\s+\S+\s+\(/g, "at (") // strip function names
			: undefined;

		this.track({
			event_type: "error",
			event_name: type,
			event_data: {
				error_message: safeMessage,
				...(safeStack ? { error_stack: safeStack } : {}),
			},
		});
	}

	/** Flush the queue immediately. Called on visibilitychange and timer. */
	flush(): void {
		if (typeof window === "undefined") return;
		if (!this.getEnabled()) {
			this.queue = [];
			return;
		}
		if (this.queue.length === 0) return;
		if (!this.sessionToken) return;

		// Stop retrying after repeated failures to avoid flooding console/network
		if (this.consecutiveFailures >= AnalyticsCollector.MAX_CONSECUTIVE_FAILURES) {
			this.queue = [];
			return;
		}

		const payload: BatchPayload = {
			session_token: this.sessionToken,
			device_category: getDeviceCategory(),
			viewport_bucket: getViewportBucket(),
			events: this.queue.splice(0), // atomic drain
		};

		const body = JSON.stringify(payload);

		// Use fetch as primary — errors are catchable and won't spam the console.
		// Only fall back to sendBeacon on page unload (visibilitychange handler).
		if (document.visibilityState === "hidden" && navigator.sendBeacon) {
			navigator.sendBeacon(this.endpoint, new Blob([body], { type: "application/json" }));
		} else {
			this.sendViaFetch(body);
		}
	}

	private sendViaFetch(body: string): void {
		fetch(this.endpoint, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body,
			keepalive: true,
		}).then((res) => {
			if (res.ok || res.status === 204) {
				this.consecutiveFailures = 0;
			} else {
				this.consecutiveFailures++;
			}
		}).catch(() => {
			this.consecutiveFailures++;
			// Fail silently — analytics must never degrade UX
		});
	}

	private startFlushTimer(): void {
		this.flushTimer = setInterval(() => {
			this.flush();
		}, this.flushInterval);
	}

	destroy(): void {
		if (this.flushTimer !== null) {
			clearInterval(this.flushTimer);
			this.flushTimer = null;
		}
		this.flush(); // final flush on cleanup
	}

	getSessionToken(): string | null {
		return this.sessionToken;
	}
}
