// Seven-slot scales keyed to A.
// Minor: A natural minor (A B C D E F G) — white keys, somber.
// Major: A major (A B C# D E F# G#) — same letter names, sharps give a brighter mood.
export const CHIME_NOTES_MINOR = [
  440.0, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99,
];
export const CHIME_NOTES_MAJOR = [
  440.0, 493.88, 554.37, 587.33, 659.25, 739.99, 830.61,
];

// Back-compat default (minor). Prefer the explicit constants in new callers.
export const CHIME_NOTES = CHIME_NOTES_MINOR;

// Secret-mode melody. Each collision in 'secret' mode plays the next note in
// this sequence (wrapping at the end). Independent of which monster was hit.
// Note names use octave suffixes — octaves chosen for smooth voice leading
// from the user's note-only input.
const NOTE_FREQS = {
  A3: 220.00,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  'F#4': 369.99, G4: 392.00, 'G#4': 415.30,
  A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, 'C#5': 554.37, D5: 587.33, E5: 659.25, F5: 698.46, 'F#5': 739.99,
};
const SECRET_SONG_NAMES0 = [
  'F#4','F#4','F#4','F#4',
  'F#4','G4','A4','B4','B4',
  'G4','A4','B4','C#5','D5','D5','D5','D5','C#5','A4',
  'B4','E5','E5','E5',
  'A4','B4','E5','E5','E5','D5','F#5','E5',
  'B4','A4','B4','D5','D5','D5','B4','D5','A4','B4',
  'A4','B4','E5','D5','E5','D5','E5','F#5',
  'D5','B4','D5','A4',
  'Bb4','G4','A4','A4',
  'G4','A4','Bb4',
  'A4','G4','G4',
  'A4','Bb4','C5',
  'Bb4','A4','Bb4',
  'C5','D5','E5','F5','E5','D5',
];

const SECRET_SONG_NAMES = [
  'D4','C4','C4',
  'E4','F#4','G#4','A4','B4','C5',
  'B4','A4','A4','A4',
  'A4','A4','G4','F4','E4','D4',
  'F4','E4','E4','D4',
  'C4','E4','D4','A3',
  'C4','E4','E4',
  'D4','C4','C4',
  'E4','F#4','G#4','A4','B4','C5',
  'B4','A4','A4','A4',
  'A4','A4','G4','F4','E4','D4',
  'F4','E4','E4','D4',
  'C4','E4','D4','A3',
  'C4','E4','E4',
  'E4','E4',
  'A4','B4','C5','B4','A4',
  'B4','A4','G4','A4',
  'E4',
  'E4','E4',
  'A4','B4','C5','B4','A4',
  'B4','A4','G4','B4',
  'C5','G4','F4','E4',
];

export const SECRET_SONG = SECRET_SONG_NAMES.map((n) => NOTE_FREQS[n]);

let ctx = null;

function getCtx() {
  if (ctx) return ctx;
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

// Bell-ish chime: sine fundamental + two inharmonic partials.
// Each partial has its own exponential decay; higher partials fade faster
// so the sound opens bright and settles into a pure low tone, like a real tube.
// Safe to call rapidly — each call spawns independent oscillator nodes, so hits naturally overlap.
const ATTACK = 0.006;     // s — quick mallet-like onset
const TOTAL_TAIL = 4.5;   // s — time until the fundamental has faded to silence
const PEAK = 0.35;        // master peak gain

export function playChime(freq) {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  const t = c.currentTime;

  const out = c.createGain();
  out.connect(c.destination);
  out.gain.setValueAtTime(PEAK, t);

  // mult: frequency ratio; gain: initial level; tail: how long *this* partial takes to fade.
  // Higher partials decay faster — matches physical bells/chimes.
  const partials = [
    { mult: 1.0,  gain: 1.00, tail: TOTAL_TAIL },
    { mult: 2.01, gain: 0.28, tail: TOTAL_TAIL * 0.45 },
    { mult: 3.02, gain: 0.10, tail: TOTAL_TAIL * 0.22 },
  ];

  for (const p of partials) {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq * p.mult;

    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(p.gain, t + ATTACK);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ATTACK + p.tail);

    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + ATTACK + p.tail + 0.05);
  }
}
