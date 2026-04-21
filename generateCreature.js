import { ATTRIBUTES, EGG_COLOR, seededRand } from './theme';

const NAMES = [
  'Lumie', 'Pippa', 'Zorb', 'Nix', 'Mox', 'Fen', 'Biscuit', 'Pogo',
  'Tulu', 'Wobb', 'Kiri', 'Bop', 'Mim', 'Dex', 'Yoli', 'Grub',
  'Flan', 'Noodle', 'Pebble', 'Tato', 'Sprite', 'Gus', 'Mochi', 'Quill',
];

function pickColors(cat, mood, rand) {
  const a = ATTRIBUTES[cat] || ATTRIBUTES._;
  const body = mood >= 4 ? a.hi : mood <= 2 ? a.lo : a.mid;
  const torso = rand() > 0.5 ? a.hi : a.mid;
  return { color: body, torsoColor: torso };
}

export function createEgg(diary, { id } = {}) {
  return {
    id,
    diary_id: diary.id,
    state: 'egg',
    name: null,
    attribute: 'U',
    color: EGG_COLOR,
    torsoColor: EGG_COLOR,
    gift: null,
    gift_shape: null,
    rarity: null,
    reply_comment: null,
    replied_at: null,
    pat_count: 0,
    is_displayed: false,
    starred: false,
  };
}

export function sendMonster(monster) {
  return { ...monster, state: 'sent' };
}

export function applyReply(monster, { cat, virtue, comment, shape }) {
  return {
    ...monster,
    state: 'replied',
    attribute: cat,
    gift: virtue,
    gift_shape: shape ?? null,
    reply_comment: comment ?? null,
    replied_at: new Date().toISOString(),
  };
}

export function hatchMonster(monster, diary) {
  const rand = seededRand(`diary-${diary.id}-gift-${monster.gift}`);
  const name = NAMES[Math.floor(rand() * NAMES.length)];
  const { color, torsoColor } = pickColors(monster.attribute, diary.mood_score, rand);
  const emotionCount = diary.emotions?.length ?? 0;
  const rarity =
    diary.mood_score === 5 && emotionCount >= 3 && rand() > 0.7
      ? 'rare'
      : 'common';
  return {
    ...monster,
    state: 'hatched',
    name,
    color,
    torsoColor,
    rarity,
  };
}
