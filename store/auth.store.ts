import { create } from "zustand";
import { persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import { createClient } from "@/lib/supabase/client";

export type UserStatus = "online" | "idle" | "dnd" | "offline";

export interface User {
	id: string;
	email: string;
	username: string;
	displayName: string;
	avatar: string;
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

	// Pending signup data (stored between signUp and email confirmation)
	pendingSignup: SignupData | null;

	// Actions
	login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
	signUpWithEmail: (data: SignupData) => Promise<boolean>;
	resendConfirmationEmail: (email: string) => Promise<boolean>;
	completeSignup: () => Promise<boolean>;
	logout: () => Promise<void>;
	clearError: () => void;
	updateUser: (updates: Partial<User>) => void;
	checkAuth: () => Promise<void>;
	initAuthListener: () => () => void;
	setPendingSignup: (data: SignupData | null) => void;
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
				pendingSignup: null,

				login: async (email, password, rememberMe = false) => {
					set({ isLoading: true, error: null });

					try {
						// CRITICAL: Set rememberMe flag BEFORE creating Supabase client
						// This ensures the client uses the correct storage (localStorage vs sessionStorage)
						if (rememberMe) {
							localStorage.setItem("bedrock-remember-me", "true");
						} else {
							localStorage.setItem("bedrock-remember-me", "false");
						}

						const supabase = createClient();
						const { data, error } = await supabase.auth.signInWithPassword({
							email,
							password,
						});

						if (error) {
							set({ isLoading: false, error: error.message });
							return false;
						}

						if (data.user) {
							const { data: profile } = await supabase
								.from("profiles")
								.select("*")
								.eq("id", data.user.id)
								.single();

							if (profile) {

								set({
									user: profileToUser(profile, email),
									isAuthenticated: true,
									isLoading: false,
									isInitializing: false,
								});
								return true;
							}
						}

						set({ isLoading: false, error: "Profile not found" });
						return false;
					} catch (err) {
						set({
							isLoading: false,
							error: err instanceof Error ? err.message : "Login failed",
						});
						return false;
					}
				},

				// Step 1: Register with Supabase — sends a confirmation email with a magic link
				signUpWithEmail: async (data) => {
					set({ isLoading: true, error: null });

					try {
						const supabase = createClient();

						if (data.username.length < 3) {
							set({
								isLoading: false,
								error: "Username must be at least 3 characters",
							});
							return false;
						}

						if (data.accountType === "teen" && !data.parentEmail) {
							set({
								isLoading: false,
								error: "Parent email required for teen accounts",
							});
							return false;
						}

						// Check if username is already taken
						const { data: existingUser } = await supabase
							.from("profiles")
							.select("id")
							.ilike("username", data.username)
							.maybeSingle();

						if (existingUser) {
							set({ isLoading: false, error: "Username is already taken" });
							return false;
						}

						// Call signUp — sends confirmation email with a magic link.
						// The emailRedirectTo tells Supabase where to redirect after
						// the user clicks the confirmation link.
						const { data: authData, error } = await supabase.auth.signUp({
							email: data.email,
							password: data.password,
							options: {
								emailRedirectTo: `${window.location.origin}/auth/callback`,
								data: {
									username: data.username,
									account_type: data.accountType,
								},
							},
						});

						if (error) {
							set({ isLoading: false, error: error.message });
							return false;
						}

						// If identities is empty, the email is already registered.
						if (authData.user && authData.user.identities?.length === 0) {
							set({
								isLoading: false,
								error: "An account with this email already exists",
							});
							return false;
						}

						// Store pending signup data for the confirmation screen
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

				// Resend the confirmation email
				resendConfirmationEmail: async (email) => {
					set({ isLoading: true, error: null });

					try {
						const supabase = createClient();
						const { error } = await supabase.auth.resend({
							type: "signup",
							email,
							options: {
								emailRedirectTo: `${window.location.origin}/auth/callback`,
							},
						});

						if (error) {
							set({ isLoading: false, error: error.message });
							return false;
						}

						set({ isLoading: false });
						return true;
					} catch (err) {
						set({
							isLoading: false,
							error: err instanceof Error ? err.message : "Failed to resend email",
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
						set({
							isLoading: false,
							error: err instanceof Error ? err.message : "Signup completion failed",
						});
						return false;
					}
				},

				logout: async () => {
					try {
						const supabase = createClient();
						await supabase.auth.signOut();
					} catch {
						// Ignore signout errors
					}
					localStorage.removeItem("bedrock-remember-me");
					set({
						user: null,
						isAuthenticated: false,
						isInitializing: false,
						error: null,
						pendingSignup: null,
					});
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

						if (Object.keys(profileUpdates).length > 0) {
							await supabase.from("profiles").update(profileUpdates).eq("id", current.id);
						}
					} catch (err) {
						console.error("Error updating profile:", err);
					}
				},

				setPendingSignup: (data) => set({ pendingSignup: data }),

				// Checks Supabase for a valid session. No client-side gatekeeping —
				// proxy.ts refreshes the session cookie on every request, so if
				// getUser() returns a user the session is valid.
				checkAuth: async () => {
					try {
						const supabase = createClient();

						// Timeout prevents infinite loading if Supabase is unreachable
						const timeout = new Promise<never>((_, reject) =>
							setTimeout(() => reject(new Error("Auth check timed out")), 8000),
						);

						const { data: { user } } = await Promise.race([
							supabase.auth.getUser(),
							timeout,
						]);

						if (user) {
							const { data: profile } = await Promise.race([
								supabase
									.from("profiles")
									.select("*")
									.eq("id", user.id)
									.single(),
								timeout,
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
					} catch {
						// Auth check failed or timed out
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
						if (event === "SIGNED_OUT" || !session) {
							set({
								user: null,
								isAuthenticated: false,
								isInitializing: false,
							});
						} else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
							if (session.user) {
								try {
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
								} catch {
									// Profile fetch failed, keep current state
								}
							}
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
					// isInitializing is intentionally NOT persisted —
					// it always starts as true on fresh page loads
				}),
			},
		),
		{ name: "AuthStore" },
	),
);

export type { SignupData };
