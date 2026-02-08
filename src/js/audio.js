let audioCtx = null;

export function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Play silent buffer to unlock audio on iOS
    const buffer = audioCtx.createBuffer(1, 1, 22050);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
}

function ensureContext() {
    if (!audioCtx) return false;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return true;
}

export function playTone(frequency, durationMs, waveform = 'sine', volume = 0.5) {
    if (!ensureContext()) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + durationMs / 1000);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + durationMs / 1000);
}

export function playCountdown(secondsLeft) {
    const tones = {
        3: 440,   // A4 — low
        2: 554,   // C#5 — mid
        1: 659    // E5 — high
    };
    const freq = tones[secondsLeft];
    if (freq) playTone(freq, 120);
}

export function playStepEnd() {
    // Three short pulses at 880Hz (same as start signal)
    playTone(880, 120, 'sine', 0.45);
    setTimeout(() => playTone(880, 120, 'sine', 0.45), 200);
    setTimeout(() => playTone(880, 120, 'sine', 0.45), 400);
}

export function playStepStart() {
    // No separate start sound — step-end pulses serve as transition signal
}

/**
 * Long start signal (~2 seconds) — steady tone, no pitch change.
 */
export function playStartSignal() {
    if (!ensureContext()) return;

    const duration = 1.5;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 — steady pitch

    gainNode.gain.setValueAtTime(0.45, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.45, audioCtx.currentTime + duration * 0.85);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

/**
 * Triumphant fanfare — ascending arpeggio (C-E-G-C) followed by a sustained chord.
 */
export function playVictorySound() {
    if (!ensureContext()) return;

    const notes = [
        { freq: 523, start: 0,    dur: 0.2  },  // C5
        { freq: 659, start: 0.2,  dur: 0.2  },  // E5
        { freq: 784, start: 0.4,  dur: 0.2  },  // G5
        { freq: 1047, start: 0.6, dur: 0.8  },  // C6 — long hold
    ];

    for (const note of notes) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, audioCtx.currentTime + note.start);

        gain.gain.setValueAtTime(0.4, audioCtx.currentTime + note.start);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime + note.start + note.dur * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + note.start + note.dur);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(audioCtx.currentTime + note.start);
        osc.stop(audioCtx.currentTime + note.start + note.dur);
    }
}
