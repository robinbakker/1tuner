import { useCallback, useRef } from 'preact/hooks';
import { settingsState } from '~/store/signals/settings';

export const useNoise = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const startNoise = useCallback(() => {
    if (noiseSourceRef.current || settingsState.value.disableReconnectNoise) {
      return; // Noise is already playing or reconnect noise is disabled
    }
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const audioContext = audioContextRef.current;

    // Create a buffer with random noise
    const bufferSize = audioContext.sampleRate * 1; // 1 second of audio
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // Generate random noise
    }

    // Create a buffer source
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Create a gain node to control the volume
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.1; // Set the volume (0.1 = 10% of full volume)

    // Connect the noise source to the gain node, then to the destination
    noiseSource.connect(gainNode);
    gainNode.connect(audioContext.destination);

    noiseSource.start();

    noiseSourceRef.current = noiseSource;
    gainNodeRef.current = gainNode;
  }, [settingsState.value.disableReconnectNoise]);

  const stopNoise = useCallback(() => {
    if (noiseSourceRef.current) {
      noiseSourceRef.current.stop();
      noiseSourceRef.current.disconnect();
      noiseSourceRef.current = null;
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  return {
    startNoise,
    stopNoise,
  };
};
