"use client";

// A short two-note chime (C5 -> E5) synthesized with the Web Audio API — no
// bundled audio asset to source, license, or host. Silently no-ops if the
// browser blocks/lacks Web Audio; the sound is a nice-to-have, not required.
export function playSuccessSound() {
  try {
    const AudioContextCtor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextCtor();
    const now = ctx.currentTime;

    for (const [i, freq] of [523.25, 659.25].entries()) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;

      const start = now + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);

      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.35);
    }

    setTimeout(() => ctx.close(), 600);
  } catch {
    // Ignore — Web Audio unavailable or blocked.
  }
}
