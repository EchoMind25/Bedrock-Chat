import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";

interface UIState {
	// Sidebar states
	isServerListCollapsed: boolean;
	isChannelListCollapsed: boolean;

	// Mobile responsiveness
	isMobile: boolean;
	isMobileMenuOpen: boolean;

	// Theme
	theme: "dark" | "light";

	// Actions
	toggleServerList: () => void;
	toggleChannelList: () => void;
	setMobile: (isMobile: boolean) => void;
	toggleMobileMenu: () => void;
	setTheme: (theme: "dark" | "light") => void;
}

export const useUIStore = create<UIState>()(
	conditionalDevtools(
		persist(
			(set) => ({
				// Initial state
				isServerListCollapsed: false,
				isChannelListCollapsed: false,
				isMobile: false,
				isMobileMenuOpen: false,
				theme: "dark",

				// Actions
				toggleServerList: () =>
					set((state) => ({
						isServerListCollapsed: !state.isServerListCollapsed,
					})),

				toggleChannelList: () =>
					set((state) => ({
						isChannelListCollapsed: !state.isChannelListCollapsed,
					})),

				setMobile: (isMobile) => set({ isMobile }),

				toggleMobileMenu: () =>
					set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

				setTheme: (theme) => set({ theme }),
			}),
			{
				name: "bedrock-ui",
				partialize: (state) => ({
					theme: state.theme,
					isServerListCollapsed: state.isServerListCollapsed,
					isChannelListCollapsed: state.isChannelListCollapsed,
				}),
			}
		),
		{ name: "UIStore" }
	)
);
