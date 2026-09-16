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
    } else if (soundName === 'daily_complete') {
      // Shimmering completion chord: 4 harmonic tones (C5, E5, G5, C6)
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.04 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.36);
      });
    } else if (soundName === 'daily_undo') {
      // Soft descending uncheck tone: G4 -> E4
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(392.0, now);
      osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.15);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.19);
    } else if (soundName === 'quest_item_complete') {
      // Crisp confirmation tone: A5
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880.0, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } else if (soundName === 'quest_milestone') {
      // Triumphant two-tone chime: F#5 -> A5
      const freqs = [739.99, 880.0];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.26);
      });
    } else if (soundName === 'quest_complete') {
      // Grand heroic fanfare arpeggio: D5, F#5, A5, D6
      const freqs = [587.33, 739.99, 880.0, 1174.66];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.22, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.46);
      });
    } else if (soundName === 'shop_purchase') {
      // Golden coin shimmer: bright dual chime (B5 -> E6)
      const freqs = [987.77, 1318.51];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.04 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.31);
      });
    } else if (soundName === 'shop_insufficient_gold') {
      // Dull error buzz: low pitch drop (130Hz -> 90Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130.81, now);
      osc.frequency.exponentialRampToValueAtTime(90.0, now + 0.18);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.21);
    } else if (soundName === 'level_up') {
      // Epic triumphant level-up fanfare: ascending major arpeggio (C5, E5, G5, C6, E6)
      const notes = [
        { freq: 523.25, time: 0, dur: 0.5 },
        { freq: 659.25, time: 0.08, dur: 0.55 },
        { freq: 783.99, time: 0.16, dur: 0.6 },
        { freq: 1046.5, time: 0.24, dur: 0.75 },
        { freq: 1318.51, time: 0.32, dur: 0.9 },
      ];

      notes.forEach(({ freq, time, dur }) => {
        // Bright lead oscillator
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0, now + time);
        gain.gain.linearRampToValueAtTime(0.24, now + time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur + 0.01);

        // Sub harmonic oscillator for depth
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();

        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(freq / 2, now + time);

        subGain.gain.setValueAtTime(0, now + time);
        subGain.gain.linearRampToValueAtTime(0.12, now + time + 0.03);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + time + dur * 0.8);

        subOsc.connect(subGain);
        subGain.connect(ctx.destination);

        subOsc.start(now + time);
        subOsc.stop(now + time + dur * 0.8 + 0.01);
      });
    } else if (soundName === 'mana_refill') {
      // Soft mystical crystal chime: gentle ascending pure sine waves (A4 -> C#5 -> E5 -> A5)
      const notes = [
        { freq: 440.0, time: 0, dur: 0.6 },
        { freq: 554.37, time: 0.09, dur: 0.65 },
        { freq: 659.25, time: 0.18, dur: 0.7 },
        { freq: 880.0, time: 0.27, dur: 0.9 },
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0, now + time);
        gain.gain.linearRampToValueAtTime(0.12, now + time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur + 0.01);
      });
    }
  } catch (err) {
    // Audio playback is non-blocking and fails gracefully if blocked by browser policy
    console.debug('[Audio] Playback ignored:', err);
  }
}

/**
 * React hook interface matching specification `useSound(soundName)`
 *
 * @param {'habit_positive' | 'habit_negative' | 'daily_complete' | 'daily_undo' | 'quest_item_complete' | 'quest_milestone' | 'quest_complete' | 'shop_purchase' | 'shop_insufficient_gold' | 'level_up' | 'mana_refill'} soundName
 * @returns {() => void} Function to play the sound
 */
export function useSound(soundName) {
  return () => playSound(soundName);
}
