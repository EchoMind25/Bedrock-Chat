"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Mic, Headphones, ChevronDown, Sparkles } from "lucide-react";
import { useVoiceStore } from "@/store/voice.store";
import { supportsNoiseCancellation, getAudioEnhancementMethod, getBrowserName } from "@/lib/utils/browser";
import { Button } from "@/components/ui/button/button";
import { SettingsSection } from "../settings-section";

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

// Cache permission state and devices to avoid repeated getUserMedia calls
let permissionCacheTimestamp = 0;
let cachedInputDevices: AudioDevice[] | null = null;
let cachedOutputDevices: AudioDevice[] | null = null;
const PERMISSION_CACHE_TTL = 30000;

export function VoiceTab() {
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
	const [permissionGranted, setPermissionGranted] = useState(false);

	const noiseCancellationEnabled = useVoiceStore((s) => s.noiseCancellationEnabled);
	const setNoiseCancellation = useVoiceStore((s) => s.setNoiseCancellation);
	const testIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Enumerate audio devices with caching
	useEffect(() => {
		async function loadDevices() {
			try {
				const now = Date.now();
				if (
					cachedInputDevices &&
					cachedOutputDevices &&
					now - permissionCacheTimestamp < PERMISSION_CACHE_TTL
				) {
					setInputDevices(cachedInputDevices);
					setOutputDevices(cachedOutputDevices);
					setPermissionGranted(true);
					return;
				}

				let hasPermission = false;

				try {
					const permStatus = await navigator.permissions.query({
						name: "microphone" as PermissionName,
					});
					if (permStatus.state === "granted") {
						hasPermission = true;
						setPermissionGranted(true);
					} else if (permStatus.state === "denied") {
						return;
					}
				} catch {
					// permissions.query not supported
				}

				if (!hasPermission) {
					const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
					stream.getTracks().forEach((t) => t.stop());
					setPermissionGranted(true);
				}

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

				cachedInputDevices = inputs;
				cachedOutputDevices = outputs;
				permissionCacheTimestamp = Date.now();
				setInputDevices(inputs);
				setOutputDevices(outputs);
			} catch {
				// Permission denied or no devices — keep defaults
			}
		}
		loadDevices();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Simulate microphone input level
	useEffect(() => {
		const interval = setInterval(() => {
			setInputMeterLevel(Math.random() * inputVolume);
		}, 100);
		return () => clearInterval(interval);
	}, [inputVolume]);

	// Cleanup test interval on unmount
	useEffect(() => {
		return () => {
			if (testIntervalRef.current) {
				clearInterval(testIntervalRef.current);
			}
		};
	}, []);

	const handleTest = () => {
		setIsTesting(true);
		let level = 0;
		const interval = setInterval(() => {
			level += 5;
			setOutputMeterLevel(Math.min(level, outputVolume));
			if (level >= 100) {
				clearInterval(interval);
				testIntervalRef.current = null;
				setTimeout(() => {
					setOutputMeterLevel(0);
					setIsTesting(false);
				}, 500);
			}
		}, 50);
		testIntervalRef.current = interval;
	};

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold text-white">Voice & Audio</h1>
				<p className="text-slate-400 text-sm mt-1">Configure your audio devices and settings</p>
			</div>

			<SettingsSection title="Input Device">
				<div className="space-y-3">
					<label className="flex items-center gap-2 text-sm font-medium text-slate-200">
						<Mic className="w-4 h-4" />
						Microphone
					</label>
					<DeviceDropdown devices={inputDevices} value={inputDevice} onChange={setInputDevice} />
					<div className="space-y-1">
						<div className="flex items-center justify-between">
							<span className="text-sm text-slate-300">Input Volume</span>
							<span className="text-sm text-slate-400">{inputVolume}%</span>
						</div>
						<VolumeSlider value={inputVolume} onChange={setInputVolume} meterLevel={inputMeterLevel} />
					</div>
				</div>
			</SettingsSection>

			<SettingsSection title="Output Device">
				<div className="space-y-3">
					<label className="flex items-center gap-2 text-sm font-medium text-slate-200">
						<Headphones className="w-4 h-4" />
						Speakers
					</label>
					<DeviceDropdown devices={outputDevices} value={outputDevice} onChange={setOutputDevice} />
					<div className="space-y-1">
						<div className="flex items-center justify-between">
							<span className="text-sm text-slate-300">Output Volume</span>
							<span className="text-sm text-slate-400">{outputVolume}%</span>
						</div>
						<VolumeSlider value={outputVolume} onChange={setOutputVolume} meterLevel={outputMeterLevel} />
					</div>
					<Button variant="secondary" size="sm" onClick={handleTest} disabled={isTesting} className="w-full">
						{isTesting ? "Testing..." : "Test Output"}
					</Button>
				</div>
			</SettingsSection>

			<SettingsSection title="Audio Enhancement">
				<div className="space-y-3">
					<label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
						<div className="flex-1">
							<div className="flex items-center gap-2">
								<Sparkles className="w-4 h-4 text-purple-400" />
								<span className="text-sm font-medium text-slate-200">Noise Cancellation</span>
								{noiseCancellationEnabled && (
									<span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
										Active
									</span>
								)}
							</div>
							<p className="text-xs text-slate-400 mt-1">
								{getAudioEnhancementMethod() === "daily-co" && "Browser-native noise cancellation (Daily.co)"}
								{getAudioEnhancementMethod() === "rnnoise" && "Client-side RNNoise processing (WASM)"}
								{getAudioEnhancementMethod() === "none" && `Not supported in ${getBrowserName()}`}
							</p>
						</div>
						<input
							type="checkbox"
							checked={noiseCancellationEnabled}
							onChange={(e) => setNoiseCancellation(e.target.checked)}
							disabled={getAudioEnhancementMethod() === "none"}
							className="w-4 h-4 rounded accent-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
						/>
					</label>

					<div className="flex items-start gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
						<svg className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
						</svg>
						<div>
							<p className="text-xs text-purple-300 font-medium">Privacy-First Processing</p>
							<p className="text-xs text-purple-400/80 mt-1">
								{getAudioEnhancementMethod() === "daily-co" && "Processed by your browser's native WebRTC pipeline. No audio data sent to third-party servers."}
								{getAudioEnhancementMethod() === "rnnoise" && "100% client-side processing using Web Audio API. Your audio never leaves your device."}
								{getAudioEnhancementMethod() === "none" && "Audio enhancement requires Chrome, Edge, Brave, Firefox, or Safari."}
							</p>
						</div>
					</div>
				</div>
			</SettingsSection>
		</div>
	);
}

// --- Internal sub-components ---

function DeviceDropdown({ devices, value, onChange }: { devices: AudioDevice[]; value: string; onChange: (v: string) => void }) {
	const [isOpen, setIsOpen] = useState(false);
	const selectedDevice = devices.find((d) => d.id === value);

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-left flex items-center justify-between hover:bg-white/10 transition-colors"
			>
				<span className="text-sm text-slate-200">{selectedDevice?.name}</span>
				<ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
			</button>

			{isOpen && (
				<motion.div
					className="absolute top-full left-0 right-0 mt-2 bg-[oklch(0.14_0.02_250)] border border-white/10 rounded-xl shadow-xl overflow-hidden z-10"
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={springConfig}
				>
					{devices.map((device) => (
						<button
							key={device.id}
							type="button"
							onClick={() => { onChange(device.id); setIsOpen(false); }}
							className={`w-full px-4 py-3 text-left text-sm hover:bg-white/10 transition-colors ${
								device.id === value ? "bg-primary/10 text-primary" : "text-slate-200"
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

function VolumeSlider({ value, onChange, meterLevel }: { value: number; onChange: (v: number) => void; meterLevel: number }) {
	return (
		<div className="space-y-2">
			<input
				type="range"
				min="0"
				max="100"
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
					[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
					[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
				style={{
					background: `linear-gradient(to right, oklch(0.7 0.2 250) 0%, oklch(0.7 0.2 250) ${value}%, oklch(0.2 0.02 250 / 0.5) ${value}%, oklch(0.2 0.02 250 / 0.5) 100%)`,
				}}
			/>
			<div className="h-2 bg-white/10 rounded-full overflow-hidden">
				<motion.div
					className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400"
					style={{ width: `${meterLevel}%` }}
					transition={{ type: "spring", stiffness: 300, damping: 30 }}
				/>
			</div>
		</div>
	);
}
