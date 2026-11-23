// Ember Court — tiny synthesised sounds via WebAudio. No audio files.
let ctx = null;

export function ensureAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, dur, type, vol, when = 0) {
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playSfx(name, muted) {
  if (muted) return;
  if (name === 'select') tone(660, 0.08, 'sine', 0.12);
  else if (name === 'play') {
    tone(392, 0.1, 'triangle', 0.15);
    tone(523, 0.14, 'triangle', 0.15, 0.07);
  } else if (name === 'hit') {
    tone(180, 0.16, 'sawtooth', 0.14);
    tone(90, 0.2, 'square', 0.1, 0.02);
  } else if (name === 'end') tone(330, 0.12, 'sine', 0.12);
  else if (name === 'start') {
    tone(523, 0.12, 'triangle', 0.14);
    tone(659, 0.12, 'triangle', 0.14, 0.09);
    tone(784, 0.2, 'triangle', 0.14, 0.18);
  }
}
