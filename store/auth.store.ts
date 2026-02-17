import { create } from "zustand";
import { persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import { createClient } from "@/lib/supabase/client";
import { logError } from "@/lib/utils/error-logger";
import { isAbortError } from "@/lib/utils/is-abort-error";

export type UserStatus = "online" | "idle" | "dnd" | "offline" | "invisible";

export interface User {
	id: string;
	email: string;
	username: string;
	displayName: string;
	avatar: string;
	bio?: string;
	status: UserStatus;
	accountType: "standard" | "parent" | "teen";
	createdAt: Date;
	settings: UserSettings;
}

interface UserSettings {
	theme: "dark" | "light" | "system";
	notifications: boolean;
	reducedMotion: boolean;
}

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	isInitializing: boolean;
	error: string | null;
	failedLoginAttempts: number;
	lockoutUntil: number | null;

	// Pending signup data (stored between signUp and email confirmation)
	pendingSignup: SignupData | null;

	// Actions
	login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
	signUpWithEmail: (data: SignupData) => Promise<boolean>;
	resendConfirmationEmail: (email: string) => Promise<boolean>;
	completeSignup: () => Promise<boolean>;
	logout: () => Promise<void>;
	deleteAccount: (password: string) => Promise<boolean>;
	clearError: () => void;
	updateUser: (updates: Partial<User>) => void;
	checkAuth: () => Promise<void>;
	initAuthListener: () => () => void;
	setPendingSignup: (data: SignupData | null) => void;
	resetPassword: (email: string) => Promise<boolean>;
	updatePassword: (newPassword: string) => Promise<boolean>;
}

interface SignupData {
	email: string;
	username: string;
	password: string;
	accountType: "standard" | "parent" | "teen";
	parentEmail?: string;
}

function profileToUser(profile: Record<string, unknown>, email: string): User {
	return {
		id: profile.id as string,
		email,
		username: profile.username as string,
		displayName: (profile.display_name as string) || (profile.username as string),
		avatar: (profile.avatar_url as string) || "",
		bio: (profile.bio as string) || "",
		status: (profile.status as UserStatus) || "online",
		accountType: (profile.account_type as User["accountType"]) || "standard",
		createdAt: new Date(profile.created_at as string),
		settings: {
			theme: "dark",
			notifications: true,
			reducedMotion: false,
		},
	};
}

export const useAuthStore = create<AuthState>()(
	conditionalDevtools(
		persist(
			(set, get) => ({
				user: null,
				isAuthenticated: false,
				isLoading: false,
				isInitializing: true,
				error: null,
				failedLoginAttempts: 0,
				lockoutUntil: null,
				pendingSignup: null,

				login: async (email, password, rememberMe = false) => {
					set({ isLoading: true, error: null });

					const { failedLoginAttempts, lockoutUntil } = get();

					// Check lockout
					if (lockoutUntil && Date.now() < lockoutUntil) {
						const remainingSec = Math.ceil((lockoutUntil - Date.now()) / 1000);
						set({
							isLoading: false,
							error: `Too many failed attempts. Try again in ${remainingSec} seconds.`,
						});
						return false;
					}

					// Exponential backoff: 0s, 2s, 4s, 8s, 16s, 32s max
					if (failedLoginAttempts > 0) {
						const delay = Math.min(2 ** failedLoginAttempts * 1000, 32_000);
						await new Promise((r) => setTimeout(r, delay));
					}

					try {
						// CRITICAL: Set rememberMe flag BEFORE creating Supabase client
						// This ensures the client uses the correct storage (localStorage vs sessionStorage)
						if (rememberMe) {
							localStorage.setItem("bedrock-remember-me", "true");
						} else {
							localStorage.setItem("bedrock-remember-me", "false");
						}

						const supabase = createClient();
						// Race login against 15s timeout to prevent infinite loading
						const { data, error } = await Promise.race([
							supabase.auth.signInWithPassword({ email, password }),
							new Promise<{ data: { user: null; session: null }; error: { message: string } }>((resolve) =>
								setTimeout(() => resolve({
									data: { user: null, session: null },
									error: { message: "Login timed out. Please check your connection and try again." },
								}), 15000),
							),
						]);

						if (error) {
							const newAttempts = failedLoginAttempts + 1;
							const lockout = newAttempts >= 5 ? Date.now() + 15 * 60 * 1000 : null;
							set({
								isLoading: false,
								error: error.message,
								failedLoginAttempts: newAttempts,
								lockoutUntil: lockout,
							});
							return false;
						}

						if (data.user) {
							const { data: profile } = await Promise.race([
								supabase
									.from("profiles")
									.select("*")
									.eq("id", data.user.id)
									.single(),
								new Promise<{ data: null }>((resolve) =>
									setTimeout(() => resolve({ data: null }), 5000),
								),
							]);

							if (profile) {

								set({
									user: profileToUser(profile, email),
									isAuthenticated: true,
									isLoading: false,
									isInitializing: false,
									failedLoginAttempts: 0,
									lockoutUntil: null,
								});
								return true;
							}
						}

						set({ isLoading: false, error: "Profile not found" });
						return false;
					} catch (err) {
						logError("AUTH", err);
						const newAttempts = failedLoginAttempts + 1;
						const lockout = newAttempts >= 5 ? Date.now() + 15 * 60 * 1000 : null;
						set({
							isLoading: false,
							isInitializing: false,
							error: err instanceof Error ? err.message : "Login failed",
							failedLoginAttempts: newAttempts,
							lockoutUntil: lockout,
						});
						return false;
					}
			},

			// Step 1: Register via server-side route handler.
			// The server generates the PKCE code_verifier, stores it encrypted in an
			// httpOnly cookie (__bedrock_pkce), and calls Supabase REST directly.
			// This fixes email confirmation in Tor/private browsing where
			// localStorage/sessionStorage is unavailable between page loads.
			signUpWithEmail: async (data) => {
				set({ isLoading: true, error: null });

				try {
					const response = await fetch("/api/auth/signup", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							email: data.email,
							password: data.password,
							username: data.username,
							accountType: data.accountType,
							parentEmail: data.parentEmail,
						}),
					});

					const result = await response.json().catch(() => ({}));

					if (!response.ok) {
						const message =
							response.status === 429
								? "Too many signup attempts. Please wait before trying again."
								: response.status === 409
									? "Username is already taken"
									: (result.error as string | undefined) || "Signup failed";
						set({ isLoading: false, error: message });
						return false;
					}

					// Store pending signup data for the "check your email" screen.
					// Also needed for resend (provides credentials to re-call the signup route).
					set({ pendingSignup: data, isLoading: false });
					return true;
				} catch (err) {
					set({
						isLoading: false,
						error: err instanceof Error ? err.message : "Signup failed",
					});
					return false;
				}
		},

			// Resend the confirmation email.
			// Re-POSTs to /api/auth/signup using stored credentials.
			// Supabase treats a repeat signup for an unconfirmed email as a resend,
			// generating a new code linked to our new PKCE verifier (fresh cookie set).
			// The old email link is automatically invalidated.
			resendConfirmationEmail: async (_email) => {
				set({ isLoading: true, error: null });

				try {
					// pendingSignup survives page refresh via Zustand persist (partialize includes it).
					const pendingSignup = get().pendingSignup;
					if (!pendingSignup) {
						set({
							isLoading: false,
							error: "Please restart the signup process",
						});
						return false;
					}

					const response = await fetch("/api/auth/signup", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							email: pendingSignup.email,
							password: pendingSignup.password,
							username: pendingSignup.username,
							accountType: pendingSignup.accountType,
							parentEmail: pendingSignup.parentEmail,
						}),
					});

					const result = await response.json().catch(() => ({}));

					if (!response.ok) {
						const message =
							response.status === 429
								? "Too many requests. Please wait before resending."
								: (result.error as string | undefined) || "Resend failed";
						set({ isLoading: false, error: message });
						return false;
					}

					set({ isLoading: false });
					return true;
				} catch (err) {
					set({
						isLoading: false,
						error: err instanceof Error ? err.message : "Resend failed",
					});
					return false;
				}
		},

				// Called after the user clicks the confirmation link and lands on /auth/callback.
				// The callback route exchanges the code for a session and creates the profile.
				// This method is for checking auth state from the client after redirect.
				completeSignup: async () => {
					set({ isLoading: true, error: null });

					try {
						const supabase = createClient();
						const {
							data: { user },
						} = await supabase.auth.getUser();

						if (!user) {
							set({ isLoading: false, error: "Not authenticated" });
							return false;
						}

						// Fetch profile (created by the callback route)
						const { data: profile } = await supabase
							.from("profiles")
							.select("*")
							.eq("id", user.id)
							.single();

						if (profile) {
							set({
								user: profileToUser(profile, user.email || ""),
								isAuthenticated: true,
								isLoading: false,
								isInitializing: false,
								pendingSignup: null,
							});
							return true;
						}

						// Profile might not exist yet — create it from pending data
						const pendingSignup = get().pendingSignup;
						const username =
							pendingSignup?.username ||
							user.user_metadata?.username ||
							user.email?.split("@")[0] ||
							`user_${user.id.slice(0, 8)}`;
						const accountType =
							pendingSignup?.accountType ||
							user.user_metadata?.account_type ||
							"standard";

						const { error: profileError } = await supabase
							.from("profiles")
							.insert({
								id: user.id,
								username,
								display_name: username,
								account_type: accountType,
							});

						if (profileError && !profileError.message.includes("duplicate")) {
							set({ isLoading: false, error: profileError.message });
							return false;
						}

						set({
							user: {
								id: user.id,
								email: user.email || "",
								username,
								displayName: username,
								avatar: "",
								status: "online",
								accountType: accountType as User["accountType"],
								createdAt: new Date(),
								settings: {
									theme: "dark",
									notifications: true,
									reducedMotion: false,
								},
							},
							isAuthenticated: true,
							isLoading: false,
							isInitializing: false,
							pendingSignup: null,
						});
						return true;
					} catch (err) {
						logError("AUTH", err);
						set({ isLoading: false, isInitializing: false, error: err instanceof Error ? err.message : "Signup completion failed" });
						return false;
					}
			},

				logout: async () => {
					try {
						const supabase = createClient();
						await supabase.auth.signOut();
					} catch {
						// Server invalidation failed — continue with local cleanup
					}

					// Force-clear Supabase auth tokens from both storages.
					// This handles the case where signOut() failed silently
					// (network error, stale client, etc.)
					for (const storage of [localStorage, sessionStorage]) {
						const keysToRemove: string[] = [];
						for (let i = 0; i < storage.length; i++) {
							const key = storage.key(i);
							if (key && (key.startsWith("sb-") || key.startsWith("supabase"))) {
								keysToRemove.push(key);
							}
						}
						for (const key of keysToRemove) {
							storage.removeItem(key);
						}
					}

					localStorage.removeItem("bedrock-remember-me");
					localStorage.removeItem("bedrock-init-attempts");
					set({
						user: null,
						isAuthenticated: false,
						isInitializing: false,
						error: null,
						pendingSignup: null,
					});
				},

				deleteAccount: async (password) => {
					set({ isLoading: true, error: null });

					try {
						const response = await fetch("/api/account/delete", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ password }),
						});

						if (!response.ok) {
							const data = await response.json().catch(() => ({}));
							const message =
								response.status === 403
									? "Incorrect password"
									: response.status === 401
										? "Session expired. Please log in again."
										: data.error || "Account deletion failed";
							set({ isLoading: false, error: message });
							return false;
						}

						// Clear all local state
						localStorage.clear();
						sessionStorage.clear();

						set({
							user: null,
							isAuthenticated: false,
							isLoading: false,
							isInitializing: false,
							error: null,
							pendingSignup: null,
							failedLoginAttempts: 0,
							lockoutUntil: null,
						});

						return true;
					} catch (err) {
						logError("AUTH", err);
						set({ isLoading: false, error: "Account deletion failed" });
						return false;
					}
				},

				clearError: () => set({ error: null }),

				updateUser: async (updates) => {
					const current = get().user;
					if (!current) return;

					set({ user: { ...current, ...updates } });

					try {
						const supabase = createClient();
						const profileUpdates: Record<string, unknown> = {};
						if (updates.username !== undefined) profileUpdates.username = updates.username;
						if (updates.displayName !== undefined) profileUpdates.display_name = updates.displayName;
						if (updates.avatar !== undefined) profileUpdates.avatar_url = updates.avatar;
						if (updates.status !== undefined) profileUpdates.status = updates.status;
						if (updates.bio !== undefined) profileUpdates.bio = updates.bio;

						if (Object.keys(profileUpdates).length > 0) {
							await supabase.from("profiles").update(profileUpdates).eq("id", current.id);
						}
					} catch (err) {
						logError("AUTH", err);
						// Revert optimistic update on error
						set({ user: current });
					}
			},

				resetPassword: async (email) => {
				set({ isLoading: true, error: null });

				try {
					const supabase = createClient();
					const redirectTo = `${window.location.origin}/auth/callback?next=/auth/reset-password`;

					if (process.env.NODE_ENV === "development") {
						console.log("[AUTH DEBUG] resetPassword called", { email, redirectTo });
					}

					const { error } = await supabase.auth.resetPasswordForEmail(email, {
						redirectTo,
					});

					if (process.env.NODE_ENV === "development") {
						console.log("[AUTH DEBUG] resetPassword response", { error: error?.message ?? null });
					}

					if (error) {
						set({ isLoading: false, error: error.message });
						return false;
					}

					set({ isLoading: false });
					return true;
				} catch (err) {
					logError("AUTH", err);
					set({ isLoading: false, error: err instanceof Error ? err.message : "Password reset failed" });
					return false;
				}
			},

			updatePassword: async (newPassword) => {
				set({ isLoading: true, error: null });

				try {
					const supabase = createClient();
					const { error } = await supabase.auth.updateUser({ password: newPassword });

					if (error) {
						set({ isLoading: false, error: error.message });
						return false;
					}

					set({ isLoading: false });
					return true;
				} catch (err) {
					logError("AUTH", err);
					set({ isLoading: false, error: err instanceof Error ? err.message : "Password update failed" });
					return false;
				}
			},

			setPendingSignup: (data) => set({ pendingSignup: data }),

				// Checks Supabase for a valid session. No client-side gatekeeping —
				// proxy.ts refreshes the session cookie on every request, so if
				// getUser() returns a user the session is valid.
				checkAuth: async () => {
					const AUTH_TIMEOUT = 5000;
					try {
						const supabase = createClient();

						// Race getUser against a short timeout. Timeouts RESOLVE with
						// null instead of rejecting — a timeout means "unknown auth
						// state" which we treat as "not authenticated", not a crash.
						const { data: { user } } = await Promise.race([
							supabase.auth.getUser(),
							new Promise<{ data: { user: null } }>((resolve) =>
								setTimeout(() => resolve({ data: { user: null } }), AUTH_TIMEOUT),
							),
						]);

						if (user) {
							const { data: profile } = await Promise.race([
								supabase
									.from("profiles")
									.select("*")
									.eq("id", user.id)
									.single(),
								new Promise<{ data: null }>((resolve) =>
									setTimeout(() => resolve({ data: null }), AUTH_TIMEOUT),
								),
							]);

							if (profile) {
								set({
									user: profileToUser(profile, user.email || ""),
									isAuthenticated: true,
									isLoading: false,
									isInitializing: false,
								});
								return;
							}
						}
				} catch (err) {
					// Auth check failed — preserve persisted session if available
					if (!isAbortError(err)) {
						logError("AUTH", err);
					}
					const current = get();
					if (current.isAuthenticated && current.user) {
						set({ isInitializing: false });
						return;
					}
					if (isAbortError(err)) {
						set({ isInitializing: false });
						return;
					}
				}

				set({ user: null, isAuthenticated: false, isLoading: false, isInitializing: false });
			},

				// Sets up a Supabase auth state change listener. Returns an
				// unsubscribe function for cleanup.
				initAuthListener: () => {
					const supabase = createClient();
					const {
						data: { subscription },
					} = supabase.auth.onAuthStateChange(async (event, session) => {
						try {
							if (event === "SIGNED_OUT" || !session) {
							set({
								user: null,
								isAuthenticated: false,
								isInitializing: false,
							});
						} else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
							if (session.user) {
									// Skip redundant profile fetch if login() already set
									// the user with the same ID. Prevents extra re-renders
									// during the login→transition→navigate flow.
									const current = get();
									if (current.isAuthenticated && current.user?.id === session.user.id) {
										if (current.isInitializing) {
											set({ isInitializing: false });
										}
										return;
									}

									const { data: profile } = await supabase
										.from("profiles")
										.select("*")
										.eq("id", session.user.id)
										.single();

									if (profile) {
										set({
											user: profileToUser(profile, session.user.email || ""),
											isAuthenticated: true,
											isInitializing: false,
										});
									}
								}
							}
						} catch {
							// Auth state change failed (AbortError, network, etc.) — keep current state
						}
					});

					return () => subscription.unsubscribe();
				},
			}),
			{
				name: "bedrock-auth",
				version: 1,
				migrate: (persistedState: unknown, version: number) => {
					const state = persistedState as Record<string, unknown>;
					if (version === 0) {
						// v0 -> v1: Add status field to existing user objects
						const user = state.user as Record<string, unknown> | null;
						if (user && !user.status) {
							user.status = "online";
						}
					}
					return state as ReturnType<typeof Object>;
				},
				partialize: (state) => ({
					user: state.user,
					isAuthenticated: state.isAuthenticated,
					pendingSignup: state.pendingSignup,
					failedLoginAttempts: state.failedLoginAttempts,
					lockoutUntil: state.lockoutUntil,
					// isInitializing is intentionally NOT persisted —
					// it always starts as true on fresh page loads
				}),
			},
		),
		{ name: "AuthStore" },
	),
);

export type { SignupData };
