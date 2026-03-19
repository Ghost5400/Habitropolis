// SoundManager — handles ambient music and UI sound effects
// Uses Web Audio API to generate sounds procedurally (zero cost, no external files needed)

class SoundManager {
  constructor() {
    this.audioContext = null;
    this.ambientSource = null;
    this.ambientGain = null;
    this.masterGain = null;
    this.isAmbientPlaying = false;
    this.isMuted = false;
    this.ambientVolume = 0.15;
    this.sfxVolume = 0.3;

    // Load preferences from localStorage
    const prefs = localStorage.getItem('habitropolis_sound_prefs');
    if (prefs) {
      const parsed = JSON.parse(prefs);
      this.isMuted = parsed.muted ?? false;
      this.ambientVolume = parsed.ambientVolume ?? 0.15;
      this.sfxVolume = parsed.sfxVolume ?? 0.3;
    }
  }

  init() {
    if (this.audioContext) return;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this.isMuted ? 0 : 1;
    this.masterGain.connect(this.audioContext.destination);
  }

  savePrefs() {
    localStorage.setItem('habitropolis_sound_prefs', JSON.stringify({
      muted: this.isMuted,
      ambientVolume: this.ambientVolume,
      sfxVolume: this.sfxVolume,
    }));
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 1, this.audioContext.currentTime, 0.1);
    }
    this.savePrefs();
    return this.isMuted;
  }

  // === AMBIENT MUSIC ===
  // Creates a dreamy, calming ambient loop using oscillators
  startAmbient() {
    this.init();
    if (this.isAmbientPlaying) return;

    this.ambientGain = this.audioContext.createGain();
    this.ambientGain.gain.value = this.ambientVolume;
    this.ambientGain.connect(this.masterGain);

    // Create slow, dreamy pads
    const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
    this.ambientOscillators = [];

    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const oscGain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      // Slow volume modulation for an evolving pad sound
      oscGain.gain.value = 0;
      const now = this.audioContext.currentTime;
      oscGain.gain.setTargetAtTime(0.06, now + i * 0.8, 1.5);

      // Add subtle detuning for warmth
      const lfo = this.audioContext.createOscillator();
      const lfoGain = this.audioContext.createGain();
      lfo.frequency.value = 0.15 + i * 0.05;
      lfoGain.gain.value = 1.5;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      osc.connect(oscGain);
      oscGain.connect(this.ambientGain);
      osc.start();

      this.ambientOscillators.push({ osc, oscGain, lfo, lfoGain });
    });

    this.isAmbientPlaying = true;
  }

  stopAmbient() {
    if (!this.isAmbientPlaying || !this.ambientOscillators) return;

    const now = this.audioContext.currentTime;
    this.ambientOscillators.forEach(({ osc, oscGain, lfo }) => {
      oscGain.gain.setTargetAtTime(0, now, 0.5);
      osc.stop(now + 2);
      lfo.stop(now + 2);
    });

    this.ambientOscillators = null;
    this.isAmbientPlaying = false;
  }

  // === SOUND EFFECTS ===

  // Generic click sound — light and satisfying
  playClick() {
    this.init();
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Success / complete sound — ascending chime
  playSuccess() {
    this.init();
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const t = now + i * 0.12;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.5, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  // Coin earn sound — sparkly rising tone
  playCoinEarn() {
    this.init();
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const t = now + i * 0.06;
      osc.frequency.setValueAtTime(1200 + i * 200, t);
      osc.frequency.exponentialRampToValueAtTime(800 + i * 200, t + 0.15);

      gain.gain.setValueAtTime(this.sfxVolume * 0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  }

  // Purchase / spend coins sound — descending tone
  playPurchase() {
    this.init();
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);

    gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Error / fail sound — low buzz
  playError() {
    this.init();
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.setValueAtTime(130, now + 0.1);

    gain.gain.setValueAtTime(this.sfxVolume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Navigation tap — soft click
  playNav() {
    this.init();
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.06);

    gain.gain.setValueAtTime(this.sfxVolume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }
}

// Singleton instance
const soundManager = new SoundManager();
export default soundManager;
