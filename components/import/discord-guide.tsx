"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const spring = { type: "spring" as const, stiffness: 260, damping: 20, mass: 1 };

interface GuideStep {
  title: string;
  description: string;
  tip?: string;
}

const EXPORT_STEPS: GuideStep[] = [
  {
    title: "1. Request your Discord data export",
    description:
      'Open Discord desktop or web app. Go to User Settings (gear icon) → Privacy & Safety → scroll down to "Request All of My Data" and click the button. Discord will email you a download link within a few days.',
    tip: "The email comes from noreply@discord.com — check your spam folder if you don't see it.",
  },
  {
    title: "2. Download and upload the ZIP file",
    description:
      "Once you receive the email, download the ZIP file. Don't extract it — upload the whole .zip file directly using the upload button below.",
  },
  {
    title: "3. Select your server",
    description:
      "We'll show you a list of servers from the export. Select the one you want to recreate in Bedrock. Only the server name is imported — no messages, no user data.",
    tip: "Discord's data export only includes server names, not channel or role details. You'll enter those manually in the next steps.",
  },
];

const MANUAL_STEPS: GuideStep[] = [
  {
    title: "1. Open your Discord server settings",
    description:
      "Right-click your server icon in Discord and select \"Server Settings\", or click the server name at the top of the channel list and select \"Server Settings\".",
  },
  {
    title: "2. Note your channels and categories",
    description:
      "Go to the \"Channels\" section in Server Settings. Write down or screenshot your category names and the channels within each category. Note which channels are text, voice, or announcement type.",
    tip: 'Channel names in Discord are lowercase-hyphenated (like "general-chat"). Bedrock uses the same format.',
  },
  {
    title: "3. Note your roles",
    description:
      "Go to the \"Roles\" section. Write down each role name, its color, and which permissions it has. Pay attention to which role is the default for new members (usually @everyone equivalent).",
  },
  {
    title: "4. Come back and fill in the form",
    description:
      "Return to this wizard and enter your server structure in the guided form. We'll handle the rest — creating categories, channels, and roles in Bedrock to match your Discord setup.",
  },
];

export function DiscordGuide() {
  const [activeTab, setActiveTab] = useState<"export" | "manual">("export");

  const steps = activeTab === "export" ? EXPORT_STEPS : MANUAL_STEPS;

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      {/* Tab header */}
      <div className="flex border-b border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("export")}
          className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
            activeTab === "export"
              ? "bg-blue-500/10 text-blue-300 border-b-2 border-blue-500"
              : "text-white/40 hover:text-white/60 hover:bg-white/5"
          }`}
        >
          Use Discord Data Export
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
            activeTab === "manual"
              ? "bg-blue-500/10 text-blue-300 border-b-2 border-blue-500"
              : "text-white/40 hover:text-white/60 hover:bg-white/5"
          }`}
        >
          Copy Manually
        </button>
      </div>

      {/* Steps */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={spring}
          className="p-4 space-y-4"
        >
          {steps.map((step, i) => (
            <div key={i} className="space-y-1.5">
              <h4 className="text-sm font-medium text-white/80">
                {step.title}
              </h4>
              <p className="text-xs text-white/50 leading-relaxed">
                {step.description}
              </p>
              {step.tip && (
                <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <svg
                    className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-[11px] text-blue-300/70">{step.tip}</p>
                </div>
              )}
            </div>
          ))}

          {/* Privacy notice */}
          <div className="pt-3 border-t border-white/5">
            <div className="flex items-start gap-2">
              <svg
                className="w-4 h-4 text-green-400 shrink-0 mt-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-[11px] text-green-300/70">
                <strong>Privacy:</strong> We never access Discord&apos;s API.
                {activeTab === "export"
                  ? " The ZIP file is processed entirely in your browser — nothing is uploaded to our servers. Only the server name you select is used."
                  : " You control exactly what information you enter. No automated data collection occurs."}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
