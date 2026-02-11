"use client";

import { useState, useEffect } from "react";
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

  // Update parent on changes
  useEffect(() => {
    onChange({
      name,
      description,
      icon,
      banner,
    });
  }, [name, description, icon, banner]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Server Overview</h3>
        <p className="text-sm text-white/60 mb-6">
          Customize your server's appearance and basic information.
        </p>
      </div>

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

      <div className="grid grid-cols-2 gap-4">
        <ImageUpload
          label="Server Icon"
          value={icon}
          onChange={setIcon}
          aspectRatio="square"
          placeholder="Upload server icon"
        />

        <ImageUpload
          label="Server Banner"
          value={banner}
          onChange={setBanner}
          aspectRatio="banner"
          placeholder="Upload server banner"
        />
      </div>

      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <p className="text-sm text-blue-200">
          <strong>Tip:</strong> Your server icon will appear in the server list, while the banner
          will be displayed at the top of your server.
        </p>
      </div>
    </div>
  );
}
