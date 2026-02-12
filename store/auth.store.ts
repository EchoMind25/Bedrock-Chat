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

	// Actions
	login: (email: string, password: string) => Promise<boolean>;
	signup: (data: SignupData) => Promise<boolean>;
	logout: () => Promise<void>;
	clearError: () => void;
	updateUser: (updates: Partial<User>) => void;
	checkAuth: () => Promise<void>;
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

				signup: async (data) => {
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

						const { data: authData, error } = await supabase.auth.signUp({
							email: data.email,
							password: data.password,
						});

						if (error) {
							set({ isLoading: false, error: error.message });
							return false;
						}

						if (authData.user) {
							const { error: profileError } = await supabase
								.from("profiles")
								.insert({
									id: authData.user.id,
									username: data.username,
									display_name: data.username,
									account_type: data.accountType,
								});

							if (profileError) {
								set({ isLoading: false, error: profileError.message });
								return false;
							}

							const user: User = {
								id: authData.user.id,
								email: data.email,
								username: data.username,
								displayName: data.username,
								avatar: "",
								accountType: data.accountType,
								createdAt: new Date(),
								settings: {
									theme: "dark",
									notifications: true,
									reducedMotion: false,
								},
							};

							set({ user, isAuthenticated: true, isLoading: false });
							return true;
						}

						set({ isLoading: false });
						return false;
					} catch (err) {
						set({
							isLoading: false,
							error: err instanceof Error ? err.message : "Signup failed",
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
					set({ user: null, isAuthenticated: false, error: null });
				},

				clearError: () => set({ error: null }),

				updateUser: (updates) => {
					const current = get().user;
					if (current) {
						set({ user: { ...current, ...updates } });
					}
				},

				checkAuth: async () => {
					try {
						const supabase = createClient();
						const {
							data: { session },
						} = await supabase.auth.getSession();

						if (session?.user) {
							const { data: profile } = await supabase
								.from("profiles")
								.select("*")
								.eq("id", session.user.id)
								.single();

							if (profile) {
								set({
									user: profileToUser(profile, session.user.email || ""),
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
