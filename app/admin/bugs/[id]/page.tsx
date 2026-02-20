"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/stores/toast-store";
import { cn } from "@/lib/utils/cn";

interface BugReport {
  id: string;
  product: string;
  description: string;
  steps_to_reproduce: string;
  severity: "blocker" | "major" | "minor";
  console_errors: string | null;
  screenshot_url: string | null;
  current_route: string | null;
  app_version: string | null;
  user_agent: string | null;
  viewport: string | null;
  user_id: string | null;
  username: string | null;
  status: "new" | "in-progress" | "resolved" | "wont-fix" | "duplicate";
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

const SEVERITY_BADGE: Record<string, { variant: "danger" | "warning" | "primary"; label: string }> = {
  blocker: { variant: "danger", label: "Blocker" },
  major: { variant: "warning", label: "Major" },
  minor: { variant: "primary", label: "Minor" },
};

const STATUSES = ["new", "in-progress", "resolved", "wont-fix", "duplicate"] as const;

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  "in-progress": "In Progress",
  resolved: "Resolved",
  "wont-fix": "Won't Fix",
  duplicate: "Duplicate",
};

export default function BugDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [report, setReport] = useState<BugReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showFullScreenshot, setShowFullScreenshot] = useState(false);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("bug_reports")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setReport(data);
      setStatus(data.status);
      setResolutionNotes(data.resolution_notes || "");
    } catch (err) {
      console.error("[BugDetail] Failed to load report:", err);
      toast.error("Failed to load bug report");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleSave = useCallback(async () => {
    if (!report) return;
    setIsSaving(true);

    try {
      const supabase = createClient();
      const updates: Record<string, unknown> = {
        status,
        resolution_notes: resolutionNotes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      // Set resolved_at when transitioning to a terminal status
      if (["resolved", "wont-fix", "duplicate"].includes(status) && !report.resolved_at) {
        updates.resolved_at = new Date().toISOString();
      }
      // Clear resolved_at if moving back to active status
      if (["new", "in-progress"].includes(status)) {
        updates.resolved_at = null;
      }

      const { error } = await supabase
        .from("bug_reports")
        .update(updates)
        .eq("id", report.id);

      if (error) throw error;

      toast.success("Bug report updated");
      fetchReport();
    } catch (err) {
      console.error("[BugDetail] Save failed:", err);
      toast.error("Failed to update report");
    } finally {
      setIsSaving(false);
    }
  }, [report, status, resolutionNotes, fetchReport]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20 text-slate-500">
        Bug report not found.
      </div>
    );
  }

  const sev = SEVERITY_BADGE[report.severity];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push("/admin/bugs")}
        className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors mb-4"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        Back to all reports
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant={sev.variant}>{sev.label}</Badge>
            <span className="text-xs text-slate-500 font-mono">{report.product}</span>
            <span className="text-xs text-slate-600">{report.id.slice(0, 8)}</span>
          </div>
          <p className="text-xs text-slate-500">
            Reported by <span className="text-slate-300">{report.username || "Anonymous"}</span>
            {" on "}
            {new Date(report.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Section title="Description">
            <p className="text-slate-200 whitespace-pre-wrap text-sm leading-relaxed">{report.description}</p>
          </Section>

          {/* Steps to reproduce */}
          <Section title="Steps to Reproduce">
            <p className="text-slate-200 whitespace-pre-wrap text-sm leading-relaxed">{report.steps_to_reproduce}</p>
          </Section>

          {/* Console errors */}
          {report.console_errors && (
            <Section title="Console Errors">
              <pre className="text-xs text-red-300 bg-slate-900/80 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap">
                {report.console_errors}
              </pre>
            </Section>
          )}

          {/* Screenshot */}
          {report.screenshot_url && (
            <Section title="Screenshot">
              <div
                className="relative rounded-lg overflow-hidden border border-slate-700/30 cursor-pointer"
                onClick={() => setShowFullScreenshot(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setShowFullScreenshot(true);
                  }
                }}
              >
                <img
                  src={report.screenshot_url}
                  alt="Bug screenshot"
                  className="w-full max-h-64 object-cover object-top"
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="text-white/0 hover:text-white/80 text-sm font-medium transition-colors">Click to enlarge</span>
                </div>
              </div>
            </Section>
          )}

          {/* Management */}
          <Section title="Management">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary w-full appearance-none cursor-pointer"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              <Textarea
                id="resolution-notes"
                label="Resolution Notes"
                placeholder="Document what was done to resolve this bug..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={4}
              />

              <Button
                variant="primary"
                onClick={handleSave}
                loading={isSaving}
              >
                Save Changes
              </Button>
            </div>
          </Section>
        </div>

        {/* Sidebar metadata */}
        <div className="space-y-4">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Metadata</h3>

            <MetaRow label="Route" value={report.current_route} />
            <MetaRow label="App Version" value={report.app_version} />
            <MetaRow label="Viewport" value={report.viewport} />
            <MetaRow label="User ID" value={report.user_id} mono />
            <MetaRow label="User Agent" value={report.user_agent} small />
          </div>

          <div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Timestamps</h3>

            <MetaRow label="Created" value={formatDate(report.created_at)} />
            <MetaRow label="Updated" value={formatDate(report.updated_at)} />
            <MetaRow label="Resolved" value={report.resolved_at ? formatDate(report.resolved_at) : null} />
          </div>
        </div>
      </div>

      {/* Full-size screenshot modal */}
      {showFullScreenshot && report.screenshot_url && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setShowFullScreenshot(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter") {
              setShowFullScreenshot(false);
            }
          }}
        >
          <img
            src={report.screenshot_url}
            alt="Full size bug screenshot"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-white mb-3">{title}</h3>
      {children}
    </div>
  );
}

function MetaRow({ label, value, mono, small }: { label: string; value: string | null | undefined; mono?: boolean; small?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] text-slate-500 font-medium uppercase">{label}</p>
      <p className={cn(
        "text-slate-300 mt-0.5 break-all",
        mono && "font-mono",
        small ? "text-[10px]" : "text-xs"
      )}>
        {value}
      </p>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
