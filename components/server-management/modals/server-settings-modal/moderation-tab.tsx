"use client";

import { useState, useEffect } from "react";
import { Tabs } from "../../../ui/tabs/tabs";
import { AutoModSettingsForm } from "../../moderation/automod-settings";
import { BanList } from "../../moderation/ban-list";
import { AuditLogList } from "../../moderation/audit-log-list";
import { useServerManagementStore } from "../../../../store/server-management.store";
import type { Server } from "../../../../lib/types/server";
import type { AutoModSettings } from "../../../../lib/types/moderation";
import { DEFAULT_AUTOMOD_SETTINGS } from "../../../../lib/types/moderation";

interface ModerationTabProps {
  server: Server;
  onAutoModUpdate: (settings: AutoModSettings) => void;
}

export function ModerationTab({ server, onAutoModUpdate }: ModerationTabProps) {
  const loadBans = useServerManagementStore((s) => s.loadBans);
  const getBansByServer = useServerManagementStore((s) => s.getBansByServer);
  const unbanUser = useServerManagementStore((s) => s.unbanUser);
  const loadAuditLog = useServerManagementStore((s) => s.loadAuditLog);
  const getAuditLogByServer = useServerManagementStore((s) => s.getAuditLogByServer);

  const [activeTab, setActiveTab] = useState("automod");
  const [autoModSettings, setAutoModSettings] = useState<AutoModSettings>(
    server.settings?.autoMod || DEFAULT_AUTOMOD_SETTINGS,
  );

  // Load data on mount
  useEffect(() => {
    loadBans(server.id);
    loadAuditLog(server.id);
  }, [server.id]);

  const bans = getBansByServer(server.id);
  const auditLogs = getAuditLogByServer(server.id);

  const handleAutoModChange = (updates: Partial<AutoModSettings>) => {
    const newSettings = { ...autoModSettings, ...updates };
    setAutoModSettings(newSettings);
    onAutoModUpdate(newSettings);
  };

  const handleUnban = async (userId: string) => {
    await unbanUser(server.id, userId);
  };

  const tabs = [
    { id: "automod", label: "AutoMod" },
    { id: "bans", label: "Bans", count: bans.length },
    { id: "audit", label: "Audit Log" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-100 mb-1">Moderation</h3>
        <p className="text-sm text-slate-300">
          Manage moderation settings, bans, and view server activity
        </p>
      </div>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="pills"
      />

      <div className="min-h-[400px] glass-card rounded-xl p-5">
        {activeTab === "automod" && (
          <AutoModSettingsForm
            settings={autoModSettings}
            onChange={handleAutoModChange}
          />
        )}

        {activeTab === "bans" && <BanList bans={bans} onUnban={handleUnban} />}

        {activeTab === "audit" && <AuditLogList logs={auditLogs} />}
      </div>
    </div>
  );
}
