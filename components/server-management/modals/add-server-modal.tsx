"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Modal } from "../../ui/modal/modal";
import { useServerManagementStore } from "../../../store/server-management.store";
import { CreateServerModal } from "./create-server-modal";
import { JoinServerSearch } from "./join-server-search";

type AddServerView = "choose" | "create" | "join";

export function AddServerModal() {
  const isAddServerOpen = useServerManagementStore((state) => state.isAddServerOpen);
  const closeAddServer = useServerManagementStore((state) => state.closeAddServer);
  const openCreateServer = useServerManagementStore((state) => state.openCreateServer);
  const [view, setView] = useState<AddServerView>("choose");

  const handleClose = () => {
    closeAddServer();
    setTimeout(() => setView("choose"), 300);
  };

  const handleCreateClick = () => {
    // Close this modal and open the dedicated create server modal
    handleClose();
    setTimeout(() => openCreateServer(), 350);
  };

  const handleJoinSuccess = () => {
    handleClose();
  };

  return (
    <>
      <Modal
        isOpen={isAddServerOpen}
        onClose={handleClose}
        title={view === "choose" ? "Add a Server" : view === "join" ? "Find a Server" : ""}
        description={
          view === "choose"
            ? "Create your own server or join an existing one"
            : view === "join"
            ? "Search for public servers or use an invite code"
            : undefined
        }
        size="md"
      >
        <AnimatePresence mode="wait">
          {view === "choose" && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {/* Create Server Button */}
              <button
                type="button"
                onClick={handleCreateClick}
                className="w-full p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">Create My Own</h3>
                    <p className="text-sm text-blue-100">Start your own community</p>
                  </div>
                  <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Join Server Button */}
              <button
                type="button"
                onClick={() => setView("join")}
                className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group text-left border border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">Join a Server</h3>
                    <p className="text-sm text-white/50">Find and join existing communities</p>
                  </div>
                  <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Privacy Notice */}
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex gap-2">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-xs text-white/40">
                    Your privacy is protected. Server owners control who can discover and join their communities.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {view === "join" && (
            <motion.div
              key="join"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Back button */}
              <button
                type="button"
                onClick={() => setView("choose")}
                className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors mb-4"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm">Back</span>
              </button>

              <JoinServerSearch onSuccess={handleJoinSuccess} />
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>

      {/* The CreateServerModal is rendered separately and controlled by its own store state */}
      <CreateServerModal />
    </>
  );
}
