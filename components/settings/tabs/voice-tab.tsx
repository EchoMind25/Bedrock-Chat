"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Mic, Headphones, ChevronDown, Sparkles } from "lucide-react";
import { useVoiceStore } from "@/store/voice.store";
import { useSettingsStore } from "@/store/settings.store";
import { supportsNoiseCancellation, getAudioEnhancementMethod, getBrowserName } from "@/lib/utils/browser";
import { Button } from "@/components/ui/button/button";
import { Toggle } from "@/components/ui/toggle/toggle";
import { SettingsSection } from "../settings-section";
import { SettingsRow } from "../settings-row";

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
	const [inputMeterLevel, setInputMeterLevel] = useState(0);
	const [outputMeterLevel, setOutputMeterLevel] = useState(0);
	const [isMicTesting, setIsMicTesting] = useState(false);
	const [isOutputTesting, setIsOutputTesting] = useState(false);
	const [micError, setMicError] = useState<string | null>(null);
	const [showPermissionModal, setShowPermissionModal] = useState(false);

	// DB-backed settings
	const settings = useSettingsStore((s) => s.settings);
	const updateSettings = useSettingsStore((s) => s.updateSettings);

	// Voice store (also sync noise cancellation)
	const noiseCancellationEnabled = useVoiceStore((s) => s.noiseCancellationEnabled);
	const setNoiseCancellation = useVoiceStore((s) => s.setNoiseCancellation);

	// Derive values from settings store (with defaults)
	const inputDevice = settings?.input_device ?? "default";
	const outputDevice = settings?.output_device ?? "default";
	const inputVolume = settings?.input_volume ?? 100;
	const outputVolume = settings?.output_volume ?? 100;

	const setInputDevice = (id: string) => updateSettings({ input_device: id === "default" ? null : id });
	const setOutputDevice = (id: string) => updateSettings({ output_device: id === "default" ? null : id });
	const setInputVolume = (v: number) => updateSettings({ input_volume: v });
	const setOutputVolume = (v: number) => updateSettings({ output_volume: v });

	const handleNoiseSuppression = (enabled: boolean) => {
		setNoiseCancellation(enabled); // Voice store (localStorage)
		updateSettings({ noise_suppression: enabled }); // DB
	};

	// Refs for mic test cleanup
	const streamRef = useRef<MediaStream | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	const isMicTestingRef = useRef(false);
	const outputIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
					return;
				}

				let hasPermission = false;

				try {
					const permStatus = await navigator.permissions.query({
						name: "microphone" as PermissionName,
					});
					if (permStatus.state === "granted") {
						hasPermission = true;
					} else if (permStatus.state === "denied") {
						return;
					}
				} catch {
					// permissions.query not supported
				}

				if (!hasPermission) {
					const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
					stream.getTracks().forEach((t) => t.stop());
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

	// Stop mic test — cleanup all audio resources
	const stopMicTest = useCallback(() => {
		isMicTestingRef.current = false;
		if (animationFrameRef.current) {
			cancelAnimationFrame(animationFrameRef.current);
			animationFrameRef.current = null;
		}
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}
		if (audioContextRef.current) {
			audioContextRef.current.close().catch(() => {});
			audioContextRef.current = null;
		}
		setIsMicTesting(false);
		setInputMeterLevel(0);
	}, []);

	// Start real mic analysis pipeline
	const startMicAnalysis = useCallback(async () => {
		setShowPermissionModal(false);
		setMicError(null);

		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
				},
			});

			const audioContext = new AudioContext();
			const source = audioContext.createMediaStreamSource(stream);
			const analyser = audioContext.createAnalyser();
			analyser.fftSize = 256;
			analyser.smoothingTimeConstant = 0.5;
			source.connect(analyser);

			streamRef.current = stream;
			audioContextRef.current = audioContext;
			isMicTestingRef.current = true;
			setIsMicTesting(true);

			const dataArray = new Uint8Array(analyser.frequencyBinCount);

			const updateLevel = () => {
				if (!isMicTestingRef.current) return;

				analyser.getByteFrequencyData(dataArray);

				// RMS calculation for perceptually accurate volume
				let sum = 0;
				for (let i = 0; i < dataArray.length; i++) {
					sum += dataArray[i] * dataArray[i];
				}
				const rms = Math.sqrt(sum / dataArray.length);
				const normalizedLevel = Math.min(100, Math.round((rms / 128) * 100));

				setInputMeterLevel(normalizedLevel);
				animationFrameRef.current = requestAnimationFrame(updateLevel);
			};

			animationFrameRef.current = requestAnimationFrame(updateLevel);
		} catch (err) {
			if (err instanceof DOMException && err.name === "NotAllowedError") {
				setMicError("Microphone access denied. Enable it in your browser settings (click the lock icon in the address bar).");
			} else {
				setMicError("Failed to access microphone. Check your device connections.");
			}
			setIsMicTesting(false);
		}
	}, []);

	// Test microphone with permission-first flow
	const handleTestMicrophone = useCallback(async () => {
		if (isMicTesting) {
			stopMicTest();
			return;
		}

		setMicError(null);

		// Check current permission state
		let permissionState: PermissionState = "prompt";
		try {
			const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
			permissionState = status.state;
		} catch {
			// Firefox doesn't support permissions.query for microphone
			permissionState = "prompt";
		}

		if (permissionState === "denied") {
			setMicError("Microphone access is blocked. Enable it in your browser settings (click the lock icon in the address bar).");
			return;
		}

		if (permissionState === "prompt") {
			setShowPermissionModal(true);
			return;
		}

		// Permission already granted
		await startMicAnalysis();
	}, [isMicTesting, stopMicTest, startMicAnalysis]);

	// Output test
	const handleTestOutput = () => {
		setIsOutputTesting(true);
		let level = 0;
		const interval = setInterval(() => {
			level += 5;
			setOutputMeterLevel(Math.min(level, outputVolume));
			if (level >= 100) {
				clearInterval(interval);
				outputIntervalRef.current = null;
				setTimeout(() => {
					setOutputMeterLevel(0);
					setIsOutputTesting(false);
				}, 500);
			}
		}, 50);
		outputIntervalRef.current = interval;
	};

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			stopMicTest();
			if (outputIntervalRef.current) {
				clearInterval(outputIntervalRef.current);
			}
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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
						<VolumeSlider value={inputVolume} onChange={setInputVolume} meterLevel={isMicTesting ? inputMeterLevel : 0} />
					</div>
					{/* Mic test button and status */}
					<Button
						variant="secondary"
						size="sm"
						onClick={handleTestMicrophone}
						className="w-full"
					>
						{isMicTesting ? "Stop Test" : "Test Microphone"}
					</Button>
					{isMicTesting && (
						<p className="text-xs text-slate-400">
							{inputMeterLevel > 5 ? "Microphone is working" : "Speak to test your microphone..."}
						</p>
					)}
					{micError && (
						<p className="text-xs text-red-400">{micError}</p>
					)}
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
					<Button variant="secondary" size="sm" onClick={handleTestOutput} disabled={isOutputTesting} className="w-full">
						{isOutputTesting ? "Testing..." : "Test Output"}
					</Button>
				</div>
			</SettingsSection>

			<SettingsSection title="Audio Enhancement">
				<div className="space-y-3">
					<label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
						<div className="flex-1">
							<div className="flex items-center gap-2">
								<Sparkles className="w-4 h-4 text-purple-400" />
								<span className="text-sm font-medium text-slate-200">Noise Suppression</span>
								{(settings?.noise_suppression ?? noiseCancellationEnabled) && (
									<span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
										Active
									</span>
								)}
							</div>
							<p className="text-xs text-slate-400 mt-1">
								{getAudioEnhancementMethod() === "browser-native" && "Browser-native noise cancellation (WebRTC)"}
								{getAudioEnhancementMethod() === "rnnoise" && "Client-side RNNoise processing (WASM)"}
								{getAudioEnhancementMethod() === "none" && `Not supported in ${getBrowserName()}`}
							</p>
						</div>
						<input
							type="checkbox"
							checked={settings?.noise_suppression ?? noiseCancellationEnabled}
							onChange={(e) => handleNoiseSuppression(e.target.checked)}
							disabled={getAudioEnhancementMethod() === "none"}
							className="w-4 h-4 rounded accent-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
						/>
					</label>

					<SettingsRow label="Echo Cancellation" description="Reduce echo from speakers being picked up by your microphone">
						<Toggle
							checked={settings?.echo_cancellation ?? true}
							onChange={(e) => updateSettings({ echo_cancellation: e.target.checked })}
						/>
					</SettingsRow>

					<div className="flex items-start gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
						<svg className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
						</svg>
						<div>
							<p className="text-xs text-purple-300 font-medium">Privacy-First Processing</p>
							<p className="text-xs text-purple-400/80 mt-1">
								{getAudioEnhancementMethod() === "browser-native" && "Processed by your browser's native WebRTC pipeline. No audio data sent to third-party servers."}
								{getAudioEnhancementMethod() === "rnnoise" && "100% client-side processing using Web Audio API. Your audio never leaves your device."}
								{getAudioEnhancementMethod() === "none" && "Audio enhancement requires Chrome, Edge, Brave, Firefox, or Safari."}
							</p>
						</div>
					</div>
				</div>
			</SettingsSection>

			{/* Microphone Permission Modal */}
			{showPermissionModal && (
				<MicPermissionModal
					onAllow={startMicAnalysis}
					onDeny={() => setShowPermissionModal(false)}
				/>
			)}
		</div>
	);
}

// --- Internal sub-components ---

function MicPermissionModal({ onAllow, onDeny }: { onAllow: () => void; onDeny: () => void }) {
	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs">
			<motion.div
				className="bg-[oklch(0.14_0.02_250)] border border-white/10 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl"
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ type: "spring", stiffness: 260, damping: 20 }}
			>
				<div className="flex items-center gap-3 mb-4">
					<div className="p-2 rounded-lg bg-primary/10">
						<Mic className="w-5 h-5 text-primary" />
					</div>
					<h3 className="text-lg font-semibold text-white">Microphone Access</h3>
				</div>
				<p className="text-sm text-slate-300 mb-2">
					Bedrock Chat needs access to your microphone to test audio input.
				</p>
				<p className="text-xs text-slate-400 mb-6">
					Audio is analyzed locally on your device and is never recorded or sent anywhere.
				</p>
				<div className="flex gap-3">
					<Button variant="primary" size="sm" onClick={onAllow} className="flex-1">
						Allow Access
					</Button>
					<Button variant="ghost" size="sm" onClick={onDeny} className="flex-1">
						Not Now
					</Button>
				</div>
			</motion.div>
		</div>
	);
}

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
			<div className="relative h-3 w-full rounded-full bg-white/10 overflow-hidden">
				<div
					className="h-full rounded-full transition-all duration-100 ease-out"
					style={{
						width: `${meterLevel}%`,
						background: meterLevel < 40
							? "linear-gradient(90deg, #22c55e, #4ade80)"
							: meterLevel < 75
								? "linear-gradient(90deg, #22c55e, #eab308)"
								: "linear-gradient(90deg, #22c55e, #eab308, #ef4444)",
					}}
				/>
			</div>
		</div>
	);
}
