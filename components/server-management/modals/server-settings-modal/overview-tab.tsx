"use client";

import { useState, useEffect, useRef } from "react";
import { Input, Textarea } from "../../../ui/input/input";
import { ImageUpload } from "../../file-upload/image-upload";
import type { Server } from "../../../../lib/types/server";

interface OverviewTabProps {
  server: Server;
  onChange: (updates: Partial<Server>) => void;
}

export function OverviewTab({ server, onChange }: OverviewTabProps) {
  const [name, setName] = useState(server.name);
  const [description, setDescription] = useState(server.description || "");
  const [icon, setIcon] = useState<string | null>(server.icon);
  const [banner, setBanner] = useState<string | null>(server.banner || null);

  // Update parent on changes (skip initial render to avoid infinite loop)
  const isInitialRender = useRef(true);
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    onChange({
      name,
      description,
      icon,
      banner,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- onChange is intentionally excluded to prevent infinite re-renders
  }, [name, description, icon, banner]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-100 mb-1">Server Overview</h3>
        <p className="text-sm text-slate-300">
          Customize your server&apos;s appearance and basic information.
        </p>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-6">
        <Input
          label="Server Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Awesome Server"
          maxLength={100}
          helperText={`${name.length}/100 characters`}
        />

        <Textarea
          label="Description (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what your server is about..."
          maxLength={500}
          helperText={`${description.length}/500 characters`}
          rows={3}
        />
      </div>

      <div className="glass-card rounded-xl p-6">
        <h4 className="text-sm font-semibold text-slate-200 mb-4">Server Branding</h4>
        <div className="grid grid-cols-2 gap-4">
          <ImageUpload
            label="Server Icon"
            value={icon}
            onChange={setIcon}
            serverId={server.id}
            imageType="logo"
            aspectRatio="square"
            placeholder="Upload server icon"
          />

          <ImageUpload
            label="Server Banner"
            value={banner}
            onChange={setBanner}
            serverId={server.id}
            imageType="banner"
            aspectRatio="banner"
            placeholder="Upload server banner"
          />
        </div>
      </div>

      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <p className="text-sm text-blue-300">
          <strong className="text-blue-200">Tip:</strong> Your server icon will appear in the server list, while the banner
          will be displayed at the top of your server.
        </p>
      </div>
    </div>
  );
}
