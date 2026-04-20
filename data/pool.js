// Local mock for the peer-assigned hatch flow.
// The reader draws only from the author's own diaries whose matching monster
// is in state='sent'. There are no seeded peer journals — in this build the
// "peer" is always the same user acting through the reader role.

export function listReadable(diaries, monsters) {
  const byDiaryId = new Map(monsters.map((m) => [m.diary_id, m]));
  const out = [];
  for (const d of diaries) {
    const m = byDiaryId.get(d.id);
    if (m && m.state === 'sent') out.push(d);
  }
  return out;
}

export function drawRandom(list, excludeId = null) {
  const pool = excludeId == null ? list : list.filter((j) => j.id !== excludeId);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
