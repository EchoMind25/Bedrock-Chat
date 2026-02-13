import { create } from "zustand";
import { persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";

interface ParentDashboardState {
	isSidebarCollapsed: boolean;
	isMobileSidebarOpen: boolean;
	onboardingComplete: boolean;
	onboardingStep: number;
	selectedDateRange: "7d" | "14d" | "30d" | "90d" | "custom";
	customDateStart: string | null;
	customDateEnd: string | null;
	activityTypeFilter: string[];
	darkMode: boolean;

	toggleSidebar: () => void;
	toggleMobileSidebar: () => void;
	closeMobileSidebar: () => void;
	setOnboardingComplete: () => void;
	setOnboardingStep: (step: number) => void;
	setDateRange: (range: ParentDashboardState["selectedDateRange"]) => void;
	setCustomDateRange: (start: string, end: string) => void;
	setActivityTypeFilter: (filters: string[]) => void;
	toggleDarkMode: () => void;
}

export const useParentDashboardStore = create<ParentDashboardState>()(
	conditionalDevtools(
		persist(
			(set) => ({
				isSidebarCollapsed: false,
				isMobileSidebarOpen: false,
				onboardingComplete: false,
				onboardingStep: 0,
				selectedDateRange: "7d",
				customDateStart: null,
				customDateEnd: null,
				activityTypeFilter: [],
				darkMode: false,

				toggleSidebar: () =>
					set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
				toggleMobileSidebar: () =>
					set((s) => ({ isMobileSidebarOpen: !s.isMobileSidebarOpen })),
				closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
				setOnboardingComplete: () => set({ onboardingComplete: true }),
				setOnboardingStep: (step) => set({ onboardingStep: step }),
				setDateRange: (range) => set({ selectedDateRange: range }),
				setCustomDateRange: (start, end) =>
					set({ customDateStart: start, customDateEnd: end }),
				setActivityTypeFilter: (filters) =>
					set({ activityTypeFilter: filters }),
				toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
			}),
			{
				name: "bedrock-parent-dashboard",
				partialize: (state) => ({
					isSidebarCollapsed: state.isSidebarCollapsed,
					onboardingComplete: state.onboardingComplete,
					darkMode: state.darkMode,
					selectedDateRange: state.selectedDateRange,
				}),
			},
		),
		{ name: "ParentDashboardStore" },
	),
);
