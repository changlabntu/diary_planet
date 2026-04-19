import { ATTRIBUTES, seededRand } from './theme';

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

export function generateCreature(diary, gem, { id } = {}) {
  const rand = seededRand(`diary-${diary.id}-gem-${gem.value}`);
  const name = NAMES[Math.floor(rand() * NAMES.length)];
  const { color, torsoColor } = pickColors(diary.attribute, diary.mood_score, rand);
  const emotionCount = diary.emotions?.length ?? 0;
  const rarity =
    diary.mood_score === 5 && emotionCount >= 3 && rand() > 0.7
      ? 'rare'
      : 'common';
  return {
    id,
    diary_id: diary.id,
    name,
    color,
    torsoColor,
    gem: gem.value,
    rarity,
    pat_count: 0,
    is_displayed: false,
    starred: false,
  };
}
