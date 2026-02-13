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
	isMobileServerListOpen: boolean;
	isMobileChannelListOpen: boolean;

	// Theme
	theme: "dark" | "light";

	// Idle detection (set by main layout, read by components)
	isIdle: boolean;

	// Portal transition state
	isPortalTransitioning: boolean;
	portalTargetServerId: string | null;
	portalSourceColor: string | null;
	portalTargetColor: string | null;

	// Actions
	toggleServerList: () => void;
	toggleChannelList: () => void;
	setMobile: (isMobile: boolean) => void;
	toggleMobileMenu: () => void;
	setMobileServerListOpen: (isOpen: boolean) => void;
	setMobileChannelListOpen: (isOpen: boolean) => void;
	closeMobileSidebars: () => void;
	setTheme: (theme: "dark" | "light") => void;
	setIdle: (isIdle: boolean) => void;
	startPortalTransition: (
		targetServerId: string,
		sourceColor: string,
		targetColor: string,
	) => void;
	endPortalTransition: () => void;
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
				isMobileServerListOpen: false,
				isMobileChannelListOpen: false,
				theme: "dark",
				isIdle: false,
				isPortalTransitioning: false,
				portalTargetServerId: null,
				portalSourceColor: null,
				portalTargetColor: null,

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

				setMobileServerListOpen: (isOpen) =>
					set({ isMobileServerListOpen: isOpen }),

				setMobileChannelListOpen: (isOpen) =>
					set({ isMobileChannelListOpen: isOpen }),

				closeMobileSidebars: () =>
					set({
						isMobileServerListOpen: false,
						isMobileChannelListOpen: false,
					}),

				setTheme: (theme) => set({ theme }),

				setIdle: (isIdle) => set({ isIdle }),

				startPortalTransition: (targetServerId, sourceColor, targetColor) =>
					set({
						isPortalTransitioning: true,
						portalTargetServerId: targetServerId,
						portalSourceColor: sourceColor,
						portalTargetColor: targetColor,
					}),

				endPortalTransition: () =>
					set({
						isPortalTransitioning: false,
						portalTargetServerId: null,
						portalSourceColor: null,
						portalTargetColor: null,
					}),
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
