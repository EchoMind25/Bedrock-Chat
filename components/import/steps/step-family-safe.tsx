"use client";

import { motion } from "motion/react";
import { useImportStore } from "@/store/import.store";

const spring = { type: "spring" as const, stiffness: 260, damping: 20, mass: 1 };

export function StepFamilySafe() {
  const familySafe = useImportStore((s) => s.familySafe);
  const setFamilySafe = useImportStore((s) => s.setFamilySafe);
  const nextGuidedStep = useImportStore((s) => s.nextGuidedStep);
  const prevGuidedStep = useImportStore((s) => s.prevGuidedStep);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Will teens be in this server?
        </h2>
        <p className="text-sm text-white/50 mt-1">
          Family-safe servers have additional protections including content
          filtering, NSFW channel blocking, and parental monitoring support.
        </p>
      </div>

      {/* Toggle options */}
      <div className="grid gap-4 sm:grid-cols-2">
        <motion.button
          type="button"
          onClick={() => setFamilySafe(true)}
          aria-pressed={familySafe}
          className={`p-5 rounded-xl border-2 text-left transition-colors min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary ${
            familySafe
              ? "border-green-500 bg-green-500/10"
              : "border-white/10 hover:border-white/20 hover:bg-white/5"
          }`}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          transition={spring}
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${familySafe ? "bg-green-500/20" : "bg-white/10"}`}>
              <svg className={`w-5 h-5 ${familySafe ? "text-green-400" : "text-white/40"}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M9.661 2.237a.75.75 0 01.678 0 17.745 17.745 0 006.38 2.393.75.75 0 01.627.74v3.288c0 4.678-2.834 8.141-6.98 9.985a.75.75 0 01-.632 0C5.517 16.798 2.683 13.355 2.683 8.658V5.37a.75.75 0 01.627-.74 17.745 17.745 0 006.38-2.393z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-white">Yes, family-safe</h3>
              <p className="text-xs text-white/50 mt-1">
                NSFW channels blocked, content filtering enabled, parental
                controls available
              </p>
            </div>
          </div>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => setFamilySafe(false)}
          aria-pressed={!familySafe}
          className={`p-5 rounded-xl border-2 text-left transition-colors min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary ${
            !familySafe
              ? "border-blue-500 bg-blue-500/10"
              : "border-white/10 hover:border-white/20 hover:bg-white/5"
          }`}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          transition={spring}
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${!familySafe ? "bg-blue-500/20" : "bg-white/10"}`}>
              <svg className={`w-5 h-5 ${!familySafe ? "text-blue-400" : "text-white/40"}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-white">No, adults only</h3>
              <p className="text-xs text-white/50 mt-1">
                Standard community server without additional content
                restrictions
              </p>
            </div>
          </div>
        </motion.button>
      </div>

      {familySafe && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="p-4 rounded-lg bg-green-500/10 border border-green-500/20"
        >
          <p className="text-xs text-green-300">
            Family-safe mode enables COPPA-compliant protections. Parents can
            monitor teen activity, NSFW content is blocked, and all channels
            require age-appropriate content.
          </p>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <motion.button
          type="button"
          onClick={prevGuidedStep}
          className="px-5 py-2.5 text-sm font-medium rounded-lg border border-white/10 text-white/70 hover:bg-white/5 transition-colors min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={spring}
        >
          Back
        </motion.button>
        <motion.button
          type="button"
          onClick={nextGuidedStep}
          className="px-5 py-2.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors min-h-[44px] touch-manipulation focus-visible:outline-2 focus-visible:outline-primary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={spring}
        >
          Next
        </motion.button>
      </div>
    </div>
  );
}
