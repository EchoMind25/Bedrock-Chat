/**
 * RNNoise Audio Processor for Safari/Firefox
 *
 * Provides client-side noise suppression using Mozilla's RNNoise algorithm
 * when browser-native noise cancellation is not available (non-Chromium browsers).
 *
 * Privacy-first: All audio processing happens locally using Web Audio API.
 * No audio data is sent to external servers.
 */

import { RnnoiseWorkletNode, loadRnnoise } from '@sapphi-red/web-noise-suppressor';

export class RNNoiseProcessor {
  private audioContext: AudioContext | null = null;
  private workletNode: RnnoiseWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  private inputStream: MediaStream | null = null;
  private wasmBinary: ArrayBuffer | null = null;
  private isInitialized = false;

  /**
   * Initializes the RNNoise audio worklet and sets up the processing pipeline
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('[RNNoise] Already initialized');
      return;
    }

    try {
      console.info('[Privacy Audit] Initializing RNNoise processor (client-side WASM) at', new Date().toISOString());

      // Create AudioContext with optimal sample rate for voice
      this.audioContext = new AudioContext({
        sampleRate: 48000, // RNNoise requires 48kHz sample rate
        latencyHint: 'interactive', // Optimize for low latency
      });

      // Load RNNoise WASM binary
      this.wasmBinary = await loadRnnoise({
        url: '/audio-worklets/rnnoise.wasm',
        simdUrl: '/audio-worklets/rnnoise_simd.wasm'
      });

      // Register worklet processor
      await this.audioContext.audioWorklet.addModule('/audio-worklets/rnnoiseWorklet.js');

      console.info('[RNNoise] Audio worklet loaded successfully');
      this.isInitialized = true;
    } catch (error) {
      console.error('[RNNoise] Failed to initialize:', error);
      throw new Error('Failed to initialize RNNoise processor');
    }
  }

  /**
   * Processes an input media stream through RNNoise and returns the enhanced stream
   *
   * @param inputStream - Raw microphone input stream
   * @returns Enhanced media stream with noise suppression applied
   */
  async process(inputStream: MediaStream): Promise<MediaStream> {
    if (!this.isInitialized || !this.audioContext || !this.wasmBinary) {
      throw new Error('RNNoise processor not initialized. Call initialize() first.');
    }

    try {
      // Store input stream reference for cleanup
      this.inputStream = inputStream;

      // Create source from input stream's audio track
      const audioTrack = inputStream.getAudioTracks()[0];
      if (!audioTrack) {
        throw new Error('No audio track found in input stream');
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(
        new MediaStream([audioTrack])
      );

      // Create RNNoise worklet node
      this.workletNode = new RnnoiseWorkletNode(this.audioContext, {
        wasmBinary: this.wasmBinary,
        maxChannels: 2 // Support stereo (though microphones are usually mono)
      });

      // Create destination to output processed audio
      this.destinationNode = this.audioContext.createMediaStreamDestination();

      // Connect the audio processing pipeline:
      // Input → RNNoise Worklet → Destination
      this.sourceNode.connect(this.workletNode);
      this.workletNode.connect(this.destinationNode);

      console.info('[Privacy Audit] RNNoise processing active - audio processed locally (Web Audio API)', {
        timestamp: new Date().toISOString(),
        sampleRate: this.audioContext.sampleRate,
        latency: this.audioContext.baseLatency,
        channels: 2
      });

      // Return the processed stream
      return this.destinationNode.stream;
    } catch (error) {
      console.error('[RNNoise] Failed to process stream:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Cleans up all audio nodes and resources
   */
  cleanup(): void {
    try {
      // Disconnect and destroy worklet node
      if (this.workletNode) {
        this.workletNode.destroy(); // Package provides destroy() method
        this.workletNode.disconnect();
        this.workletNode = null;
      }

      // Disconnect source node
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }

      // Disconnect destination node
      if (this.destinationNode) {
        this.destinationNode.disconnect();
        this.destinationNode = null;
      }

      // Stop input stream tracks
      if (this.inputStream) {
        this.inputStream.getTracks().forEach((track) => track.stop());
        this.inputStream = null;
      }

      // Close audio context
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
        this.audioContext = null;
      }

      this.wasmBinary = null;
      this.isInitialized = false;

      console.info('[Privacy Audit] RNNoise processor cleaned up at', new Date().toISOString());
    } catch (error) {
      console.error('[RNNoise] Error during cleanup:', error);
    }
  }

  /**
   * Gets the current state of the processor
   */
  getState(): {
    isInitialized: boolean;
    audioContextState?: AudioContextState;
    sampleRate?: number;
  } {
    return {
      isInitialized: this.isInitialized,
      audioContextState: this.audioContext?.state,
      sampleRate: this.audioContext?.sampleRate,
    };
  }
}

/**
 * Singleton instance for easier management
 * Only one RNNoise processor should be active at a time
 */
let rnnoiseInstance: RNNoiseProcessor | null = null;

export function getRNNoiseProcessor(): RNNoiseProcessor {
  if (!rnnoiseInstance) {
    rnnoiseInstance = new RNNoiseProcessor();
  }
  return rnnoiseInstance;
}

export function destroyRNNoiseProcessor(): void {
  if (rnnoiseInstance) {
    rnnoiseInstance.cleanup();
    rnnoiseInstance = null;
  }
}
