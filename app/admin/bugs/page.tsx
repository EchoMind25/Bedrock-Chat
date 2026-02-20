"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

interface BugReport {
  id: string;
  product: string;
  description: string;
  severity: "blocker" | "major" | "minor";
  status: "new" | "in-progress" | "resolved" | "wont-fix" | "duplicate";
  username: string | null;
  user_id: string | null;
  created_at: string;
}

const SEVERITY_BADGE: Record<string, { variant: "danger" | "warning" | "primary"; label: string }> = {
  blocker: { variant: "danger", label: "Blocker" },
  major: { variant: "warning", label: "Major" },
  minor: { variant: "primary", label: "Minor" },
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  "in-progress": "In Progress",
  resolved: "Resolved",
  "wont-fix": "Won't Fix",
  duplicate: "Duplicate",
};

const STATUS_COLORS: Record<string, string> = {
  new: "text-blue-400",
  "in-progress": "text-yellow-400",
  resolved: "text-green-400",
  "wont-fix": "text-slate-400",
  duplicate: "text-slate-500",
};

const PRODUCTS = ["all", "bedrock-chat", "quoteflow", "echosafe"];
const STATUSES = ["all", "new", "in-progress", "resolved", "wont-fix", "duplicate"];
const SEVERITIES = ["all", "blocker", "major", "minor"];

export default function BugListPage() {
  const router = useRouter();
  const [reports, setReports] = useState<BugReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterProduct, setFilterProduct] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("bug_reports")
        .select("id, product, description, severity, status, username, user_id, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error("[BugDashboard] Failed to load reports:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (filterProduct !== "all" && r.product !== filterProduct) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterSeverity !== "all" && r.severity !== filterSeverity) return false;
      return true;
    });
  }, [reports, filterProduct, filterStatus, filterSeverity]);

  // Stats
  const stats = useMemo(() => {
    const open = reports.filter((r) => !["resolved", "wont-fix", "duplicate"].includes(r.status));
    return {
      total: open.length,
      blockers: open.filter((r) => r.severity === "blocker").length,
      major: open.filter((r) => r.severity === "major").length,
      minor: open.filter((r) => r.severity === "minor").length,
    };
  }, [reports]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Bug Reports</h2>
        <p className="text-sm text-slate-400 mt-1">All products &middot; {reports.length} total</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Open Bugs" value={stats.total} color="text-white" />
        <StatCard label="Blockers" value={stats.blockers} color="text-red-400" />
        <StatCard label="Major" value={stats.major} color="text-yellow-400" />
        <StatCard label="Minor" value={stats.minor} color="text-blue-400" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <FilterSelect
          label="Product"
          value={filterProduct}
          options={PRODUCTS}
          onChange={setFilterProduct}
        />
        <FilterSelect
          label="Status"
          value={filterStatus}
          options={STATUSES}
          onChange={setFilterStatus}
        />
        <FilterSelect
          label="Severity"
          value={filterSeverity}
          options={SEVERITIES}
          onChange={setFilterSeverity}
        />
        <button
          type="button"
          onClick={fetchReports}
          className="ml-auto px-3 py-1.5 text-sm text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/50 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          No bug reports match the current filters.
        </div>
      ) : (
        <div className="border border-slate-800/50 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Severity</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Product</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Description</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Reporter</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((report) => {
                const sev = SEVERITY_BADGE[report.severity];
                const isNew = report.status === "new";
                return (
                  <motion.tr
                    key={report.id}
                    onClick={() => router.push(`/admin/bugs/${report.id}`)}
                    className={cn(
                      "border-b border-slate-800/30 cursor-pointer transition-colors",
                      isNew
                        ? "bg-primary/5 hover:bg-primary/10"
                        : "hover:bg-slate-800/30"
                    )}
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.1 }}
                  >
                    <td className="px-4 py-3">
                      <Badge variant={sev.variant} pulse={isNew}>
                        {sev.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-mono text-xs">{report.product}</td>
                    <td className="px-4 py-3 text-slate-200 max-w-xs truncate">
                      {isNew && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mr-2 mb-px" />}
                      {report.description.slice(0, 80)}
                      {report.description.length > 80 && "..."}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{report.username || "Anonymous"}</td>
                    <td className={cn("px-4 py-3 font-medium", STATUS_COLORS[report.status])}>
                      {STATUS_LABELS[report.status]}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(report.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-4">
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p className={cn("text-2xl font-bold mt-1", color)}>{value}</p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-slate-500 font-medium">{label}:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt === "all" ? `All` : opt.charAt(0).toUpperCase() + opt.slice(1).replace("-", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}
