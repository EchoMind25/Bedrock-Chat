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
  const {
    loadBans,
    getBansByServer,
    unbanUser,
    loadAuditLog,
    getAuditLogByServer,
  } = useServerManagementStore();

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
        <h3 className="text-lg font-semibold mb-2">Moderation</h3>
        <p className="text-sm text-white/60">
          Manage moderation settings, bans, and view server activity
        </p>
      </div>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="pills"
      />

      <div className="min-h-[400px]">
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
