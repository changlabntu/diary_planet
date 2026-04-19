export const ATTRIBUTES = {
  A: { label: 'Self',     hi: '#CECBF6', mid: '#7F77DD', lo: '#3C3489' },
  B: { label: 'Relation', hi: '#F4C0D1', mid: '#D4537E', lo: '#72243E' },
  C: { label: 'Achieve',  hi: '#9FE1CB', mid: '#1D9E75', lo: '#085041' },
  D: { label: 'Meaning',  hi: '#FAC775', mid: '#BA7517', lo: '#633806' },
  _: { label: '',         hi: '#D3D1C7', mid: '#888780', lo: '#444441' },
};

export const GEMS = {
  A: ['Humility', 'Prudence', 'Passion', 'Openness', 'Growth', 'Rationality'],
  B: ['Care', 'Kindness', 'Forgiveness', 'Generosity', 'Genuineness', 'Faithfulness'],
  C: ['Creativity', 'Curiosity', 'Judgement', 'Bravery', 'Perseverance', 'Diligence'],
  D: ['Beauty', 'Gratitude', 'Hope', 'Spirituality', 'Wisdom', 'Justice'],
};

export const BG = {
  DEEP:    '#02030c',
  DARK:    '#07031a',
  CARD:    '#17171a',
  SHEET:   '#0e0726',
  NAV:     'rgba(4,4,14,0.97)',
  GROUND0: '#2a3a18',
  GROUND1: '#0e1208',
  SURFACE: '#ffffff',
  MUTED:   '#f8f7f4',
};

export const MAX_DEPLOYED = 7;

const clamp01 = (x) => Math.max(0, Math.min(1, x));

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  const to = (n) => Math.round(clamp01(n / 255) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function lighten(hex, t) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({
    r: r + (255 - r) * t,
    g: g + (255 - g) * t,
    b: b + (255 - b) * t,
  });
}

export function darken(hex, t) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({ r: r * (1 - t), g: g * (1 - t), b: b * (1 - t) });
}

const tiers = (cat) => ATTRIBUTES[cat] || ATTRIBUTES._;

export function badge(cat) {
  const t = tiers(cat);
  return { bg: t.lo, color: t.hi };
}

export function cardBg(cat) {
  const t = tiers(cat);
  return { inner: lighten(t.hi, 0.2), outer: t.mid };
}

export function pillActive(cat) {
  const t = tiers(cat);
  return { bg: t.lo, color: t.hi };
}

export function pillIdle(cat) {
  const t = tiers(cat);
  return { bg: t.hi, color: t.lo, border: t.mid };
}

export function palette(cat) {
  const t = tiers(cat);
  return [t.mid, t.hi, darken(t.lo, 0.2), lighten(t.hi, 0.4), lighten(t.lo, 0.2)];
}

const ATTR_LABEL_TO_KEY = { Self: 'A', Relation: 'B', Achieve: 'C', Meaning: 'D' };

export function attrToCat(attr) {
  if (!attr) return null;
  if (ATTR_LABEL_TO_KEY[attr]) return ATTR_LABEL_TO_KEY[attr];
  if (ATTRIBUTES[attr]) return attr;
  return null;
}

export function getAttrStyle(cat) {
  return badge(cat);
}

export function fmtDate(iso) {
  const d = new Date(iso);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function seededRand(seed) {
  let s;
  if (typeof seed === 'string') {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    s = (h >>> 0) || 1;
  } else {
    s = (seed | 0) || 1;
  }
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
