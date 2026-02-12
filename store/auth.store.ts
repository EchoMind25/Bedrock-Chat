import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import { createClient } from "@/lib/supabase/client";

export interface User {
	id: string;
	email: string;
	username: string;
	displayName: string;
	avatar: string;
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
	error: string | null;

	// Pending signup data (stored between signUp and OTP verify)
	pendingSignup: SignupData | null;

	// Actions
	login: (email: string, password: string) => Promise<boolean>;
	signUpWithEmail: (data: SignupData) => Promise<boolean>;
	verifyOtp: (email: string, token: string) => Promise<boolean>;
	createProfile: (data: SignupData) => Promise<boolean>;
	logout: () => Promise<void>;
	clearError: () => void;
	updateUser: (updates: Partial<User>) => void;
	checkAuth: () => Promise<void>;
	setPendingSignup: (data: SignupData | null) => void;
	// Dev mode: Quick login without credentials
	devLogin: () => void;
	devLoginParent: () => void;
	devLoginTeen: () => void;
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
				error: null,
				pendingSignup: null,

				login: async (email, password) => {
					set({ isLoading: true, error: null });

					try {
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

				// Step 1: Register with Supabase and trigger OTP email
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

						// Call signUp — this sends the OTP email
						const { data: authData, error } = await supabase.auth.signUp({
							email: data.email,
							password: data.password,
							options: {
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

						// Supabase returns a user with an `identities` array.
						// If identities is empty, the email is already registered.
						if (authData.user && authData.user.identities?.length === 0) {
							set({
								isLoading: false,
								error: "An account with this email already exists",
							});
							return false;
						}

						// Store pending signup data for after OTP verification
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

				// Step 2: Verify the 6-digit OTP code from the email
				verifyOtp: async (email, token) => {
					set({ isLoading: true, error: null });

					try {
						const supabase = createClient();
						const { data, error } = await supabase.auth.verifyOtp({
							email,
							token,
							type: "signup",
						});

						if (error) {
							set({ isLoading: false, error: error.message });
							return false;
						}

						if (data.session && data.user) {
							// OTP verified — user now has a valid session
							const pendingSignup = get().pendingSignup;
							if (pendingSignup) {
								const profileCreated = await get().createProfile(pendingSignup);
								if (!profileCreated) {
									return false;
								}
							}

							// Fetch the created profile
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
									pendingSignup: null,
								});
								return true;
							}

							// Profile might have been created by the database trigger
							// Use the pending data to build the user object
							if (pendingSignup) {
								set({
									user: {
										id: data.user.id,
										email,
										username: pendingSignup.username,
										displayName: pendingSignup.username,
										avatar: "",
										accountType: pendingSignup.accountType,
										createdAt: new Date(),
										settings: {
											theme: "dark",
											notifications: true,
											reducedMotion: false,
										},
									},
									isAuthenticated: true,
									isLoading: false,
									pendingSignup: null,
								});
								return true;
							}
						}

						set({ isLoading: false, error: "Verification failed" });
						return false;
					} catch (err) {
						set({
							isLoading: false,
							error: err instanceof Error ? err.message : "Verification failed",
						});
						return false;
					}
				},

				// Create profile in the profiles table (called after OTP verification)
				createProfile: async (data) => {
					try {
						const supabase = createClient();
						const { data: { user } } = await supabase.auth.getUser();

						if (!user) {
							set({ error: "No authenticated user found" });
							return false;
						}

						const { error: profileError } = await supabase
							.from("profiles")
							.insert({
								id: user.id,
								username: data.username,
								display_name: data.username,
								account_type: data.accountType,
							});

						if (profileError) {
							// Ignore duplicate key errors (profile may exist from DB trigger)
							if (!profileError.message.includes("duplicate")) {
								set({ isLoading: false, error: profileError.message });
								return false;
							}
						}

						return true;
					} catch (err) {
						set({
							isLoading: false,
							error: err instanceof Error ? err.message : "Profile creation failed",
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
					set({ user: null, isAuthenticated: false, error: null, pendingSignup: null });
				},

				clearError: () => set({ error: null }),

				updateUser: (updates) => {
					const current = get().user;
					if (current) {
						set({ user: { ...current, ...updates } });
					}
				},

				setPendingSignup: (data) => set({ pendingSignup: data }),

				checkAuth: async () => {
					try {
						const supabase = createClient();
						const {
							data: { user },
						} = await supabase.auth.getUser();

						if (user) {
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
								});
								return;
							}
						}
					} catch {
						// Auth check failed
					}

					set({ user: null, isAuthenticated: false, isLoading: false });
				},

				devLogin: () => {
					const user: User = {
						id: "dev-user-001",
						email: "dev@bedrock.chat",
						username: "developer",
						displayName: "Dev User",
						avatar: "",
						accountType: "standard",
						createdAt: new Date(),
						settings: {
							theme: "dark",
							notifications: true,
							reducedMotion: false,
						},
					};
					set({ user, isAuthenticated: true, isLoading: false, error: null });
				},

				devLoginParent: () => {
					const user: User = {
						id: "parent-1",
						email: "parent@bedrock.chat",
						username: "concerned_parent",
						displayName: "Sarah Johnson",
						avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=parent1",
						accountType: "parent",
						createdAt: new Date("2025-01-15"),
						settings: {
							theme: "dark",
							notifications: true,
							reducedMotion: false,
						},
					};
					set({ user, isAuthenticated: true, isLoading: false, error: null });
				},

				devLoginTeen: () => {
					const user: User = {
						id: "teen-1",
						email: "teen1@bedrock.chat",
						username: "alex_cool",
						displayName: "Alex Johnson",
						avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=teen1",
						accountType: "teen",
						createdAt: new Date("2026-01-20"),
						settings: {
							theme: "dark",
							notifications: true,
							reducedMotion: false,
						},
					};
					set({ user, isAuthenticated: true, isLoading: false, error: null });
				},
			}),
			{
				name: "bedrock-auth",
				partialize: (state) => ({
					user: state.user,
					isAuthenticated: state.isAuthenticated,
				}),
			},
		),
		{ name: "AuthStore" },
	),
);

export type { SignupData };
