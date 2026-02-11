import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import { faker } from "@faker-js/faker";

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
	logout: () => void;
	clearError: () => void;
	updateUser: (updates: Partial<User>) => void;
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
	parentEmail?: string; // Required if teen
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

					// Simulate network delay (800-1500ms)
					await new Promise((r) =>
						setTimeout(r, 50 + Math.random() * 100),
					);

					// Mock validation
					if (!email.includes("@")) {
						set({
							isLoading: false,
							error: "Invalid email format",
						});
						return false;
					}

					if (password.length < 6) {
						set({
							isLoading: false,
							error: "Password must be at least 6 characters",
						});
						return false;
					}

					// Generate mock user
					const user: User = {
						id: faker.string.uuid(),
						email,
						username: email.split("@")[0],
						displayName: faker.person.fullName(),
						avatar: faker.image.avatar(),
						accountType: "standard",
						createdAt: new Date(),
						settings: {
							theme: "dark",
							notifications: true,
							reducedMotion: false,
						},
					};

					set({ user, isAuthenticated: true, isLoading: false });
					return true;
				},

				signup: async (data) => {
					set({ isLoading: true, error: null });

					await new Promise((r) =>
						setTimeout(r, 50 + Math.random() * 100),
					);

					// Mock validation
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

					const user: User = {
						id: faker.string.uuid(),
						email: data.email,
						username: data.username,
						displayName: data.username,
						avatar: faker.image.avatar(),
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
				},

				logout: () => {
					set({ user: null, isAuthenticated: false, error: null });
				},

				clearError: () => set({ error: null }),

				updateUser: (updates) => {
					const current = get().user;
					if (current) {
						set({ user: { ...current, ...updates } });
					}
				},

				// Dev mode: Instantly create and log in a user
				devLogin: () => {
					const user: User = {
						id: faker.string.uuid(),
						email: "dev@bedrock.chat",
						username: "developer",
						displayName: "Dev User",
						avatar: faker.image.avatar(),
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

				// Dev mode: Login as parent
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

				// Dev mode: Login as teen
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
