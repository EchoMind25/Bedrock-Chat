"use client";

import { Modal } from "../ui/modal/modal";
import { Button } from "../ui/button";
import { motion } from "motion/react";
import { Volume2, Mic, Headphones, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

interface VoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AudioDevice {
  id: string;
  name: string;
}

const springConfig = {
  type: "spring" as const,
  stiffness: 260,
  damping: 20,
  mass: 1,
};

export function VoiceSettings({ isOpen, onClose }: VoiceSettingsProps) {
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([
    { id: "default", name: "Default" },
  ]);
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([
    { id: "default", name: "Default" },
  ]);
  const [inputDevice, setInputDevice] = useState("default");
  const [outputDevice, setOutputDevice] = useState("default");
  const [inputVolume, setInputVolume] = useState(80);
  const [outputVolume, setOutputVolume] = useState(70);
  const [inputMeterLevel, setInputMeterLevel] = useState(0);
  const [outputMeterLevel, setOutputMeterLevel] = useState(0);
  const [isTesting, setIsTesting] = useState(false);

  // Enumerate real audio devices from the browser
  useEffect(() => {
    if (!isOpen) return;

    async function loadDevices() {
      try {
        // Request permission to access media devices
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();

        const inputs: AudioDevice[] = [{ id: "default", name: "Default" }];
        const outputs: AudioDevice[] = [{ id: "default", name: "Default" }];

        for (const device of devices) {
          if (device.kind === "audioinput" && device.deviceId !== "default") {
            inputs.push({ id: device.deviceId, name: device.label || `Microphone ${inputs.length}` });
          } else if (device.kind === "audiooutput" && device.deviceId !== "default") {
            outputs.push({ id: device.deviceId, name: device.label || `Speaker ${outputs.length}` });
          }
        }

        setInputDevices(inputs);
        setOutputDevices(outputs);
      } catch {
        // Permission denied or no devices available - keep defaults
      }
    }

    loadDevices();
  }, [isOpen]);

  // Simulate microphone input level
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const randomLevel = Math.random() * inputVolume;
      setInputMeterLevel(randomLevel);
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, inputVolume]);

  const handleTest = () => {
    setIsTesting(true);

    let level = 0;
    const interval = setInterval(() => {
      level += 5;
      setOutputMeterLevel(Math.min(level, outputVolume));
      if (level >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setOutputMeterLevel(0);
          setIsTesting(false);
        }, 500);
      }
    }, 50);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Voice Settings"
      description="Configure your audio devices and settings"
      size="lg"
      footer={
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Input Device */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Mic className="w-4 h-4" />
            Input Device
          </label>
          <DeviceDropdown
            devices={inputDevices}
            value={inputDevice}
            onChange={setInputDevice}
          />
        </div>

        {/* Input Volume */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Input Volume</label>
            <span className="text-sm text-slate-400">{inputVolume}%</span>
          </div>
          <VolumeSlider
            value={inputVolume}
            onChange={setInputVolume}
            meterLevel={inputMeterLevel}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-border/50" />

        {/* Output Device */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Headphones className="w-4 h-4" />
            Output Device
          </label>
          <DeviceDropdown
            devices={outputDevices}
            value={outputDevice}
            onChange={setOutputDevice}
          />
        </div>

        {/* Output Volume */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Output Volume</label>
            <span className="text-sm text-slate-400">{outputVolume}%</span>
          </div>
          <VolumeSlider
            value={outputVolume}
            onChange={setOutputVolume}
            meterLevel={outputMeterLevel}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTest}
            disabled={isTesting}
            className="w-full"
          >
            {isTesting ? "Testing..." : "Test Output"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface DeviceDropdownProps {
  devices: AudioDevice[];
  value: string;
  onChange: (value: string) => void;
}

function DeviceDropdown({ devices, value, onChange }: DeviceDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDevice = devices.find((d) => d.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-xl text-left flex items-center justify-between hover:bg-muted/70 transition-colors"
      >
        <span className="text-sm text-foreground">{selectedDevice?.name}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <motion.div
          className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl overflow-hidden z-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springConfig}
        >
          {devices.map((device) => (
            <button
              key={device.id}
              type="button"
              onClick={() => {
                onChange(device.id);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left text-sm hover:bg-muted/50 transition-colors ${
                device.id === value ? "bg-primary/10 text-primary" : "text-foreground"
              }`}
            >
              {device.name}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}

interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
  meterLevel: number;
}

function VolumeSlider({ value, onChange, meterLevel }: VolumeSliderProps) {
  return (
    <div className="space-y-2">
      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-muted/50 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-primary
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-all
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-primary
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:transition-all
            [&::-moz-range-thumb]:hover:scale-110"
          style={{
            background: `linear-gradient(to right, oklch(0.7 0.2 250) 0%, oklch(0.7 0.2 250) ${value}%, oklch(0.2 0.02 250 / 0.5) ${value}%, oklch(0.2 0.02 250 / 0.5) 100%)`,
          }}
        />
      </div>

      {/* Level Meter */}
      <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400"
          style={{
            width: `${meterLevel}%`,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        />
      </div>
    </div>
  );
}
