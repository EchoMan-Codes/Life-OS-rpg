/**
 * Web Audio API synthesizer for native, zero-dependency RPG sound effects.
 * Preloaded, zero-latency, zero external asset 404 risk.
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a synthesized sound effect.
 *
 * @param {'habit_positive' | 'habit_negative'} soundName
 */
export function playSound(soundName) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (soundName === 'habit_positive') {
      // Crystal arpeggio chime: 3 ascending tones (E5, G#5, B5)
      const freqs = [659.25, 830.61, 987.77];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.26);
      });
    } else if (soundName === 'habit_negative') {
      // Warning thud: low dual-oscillator sawtooth + triangle with rapid decay
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(146.83, now); // D3
      osc.frequency.exponentialRampToValueAtTime(73.42, now + 0.2); // Pitch drop to D2

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.23);
    }
  } catch (err) {
    // Audio playback is non-blocking and fails gracefully if blocked by browser policy
    console.debug('[Audio] Playback ignored:', err);
  }
}

/**
 * React hook interface matching specification `useSound(soundName)`
 *
 * @param {'habit_positive' | 'habit_negative'} soundName
 * @returns {() => void} Function to play the sound
 */
export function useSound(soundName) {
  return () => playSound(soundName);
}
