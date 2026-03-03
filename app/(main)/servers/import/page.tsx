"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useImportStore } from "@/store/import.store";
import { MethodSelect } from "@/components/import/method-select";
import { JsonUploadFlow } from "@/components/import/json-upload-flow";
import { GuidedWizard } from "@/components/import/guided-wizard";
import { ImportSuccess } from "@/components/import/import-success";

const spring = { type: "spring" as const, stiffness: 260, damping: 25, mass: 1 };

export default function ImportPage() {
  const method = useImportStore((s) => s.method);
  const createdServerId = useImportStore((s) => s.createdServerId);
  const reset = useImportStore((s) => s.reset);

  // Reset store when unmounting
  useEffect(() => {
    return () => {
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Determine which view to show
  const view = createdServerId
    ? "success"
    : method === "json"
      ? "json"
      : method === "guided"
        ? "guided"
        : "select";

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header — hidden on success */}
        {view !== "success" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="mb-8"
          >
            <h1 className="text-2xl font-bold text-white">Import Server</h1>
            <p className="text-sm text-white/60 mt-1">
              Bring your community structure to Bedrock. No messages, no user
              data — just channels, roles, and categories.
            </p>
          </motion.div>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          {view === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={spring}
            >
              <MethodSelect />
            </motion.div>
          )}

          {view === "json" && (
            <motion.div
              key="json"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={spring}
            >
              <JsonUploadFlow />
            </motion.div>
          )}

          {view === "guided" && (
            <motion.div
              key="guided"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={spring}
            >
              <GuidedWizard />
            </motion.div>
          )}

          {view === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={spring}
            >
              <ImportSuccess />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
