import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';

import Modal from '../ui/Modal';
import CategoryPill from '../ui/CategoryPill';
import CreatureCard from './CreatureCard';
import Gem from '../ui/Gem';
import EmotionTag from '../ui/EmotionTag';
import MoodDots from '../ui/MoodDots';
import { ATTRIBUTES, fmtDate } from '../../theme';

const STATUS_KEYS = ['all', 'deployed', 'idle', 'starred'];
const STATUS_LABELS = { all: 'Total', deployed: 'On planet', idle: 'Idle', starred: 'Starred' };
const PAGE_SIZE = 18;
const GAP = 8;

export default function CreatureManager({
  open,
  onClose,
  monsters,
  onDeploy,
  onRecall,
  onStar,
}) {
  const [status, setStatus] = useState('all');
  const [cat, setCat] = useState('all');
  const [query, setQuery] = useState('');
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [containerW, setContainerW] = useState(0);

  const counts = useMemo(
    () => ({
      all: monsters.length,
      deployed: monsters.filter((m) => m.is_displayed).length,
      idle: monsters.filter((m) => !m.is_displayed).length,
      starred: monsters.filter((m) => m.starred).length,
    }),
    [monsters],
  );

  const filtered = useMemo(() => {
    let list = monsters;
    if (status === 'deployed') list = list.filter((m) => m.is_displayed);
    else if (status === 'idle') list = list.filter((m) => !m.is_displayed);
    else if (status === 'starred') list = list.filter((m) => m.starred);

    if (cat !== 'all') list = list.filter((m) => m.attribute === cat);

    const q = query.trim().toLowerCase();
    if (q) list = list.filter((m) => m.name.toLowerCase().includes(q));

    const sorted = [...list].sort((a, b) => {
      const da = new Date(a.diary?.created_at || 0).getTime();
      const db = new Date(b.diary?.created_at || 0).getTime();
      return sortDesc ? db - da : da - db;
    });
    return sorted;
  }, [monsters, status, cat, query, sortDesc]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const selected = useMemo(
    () => monsters.find((m) => m.id === selectedId) || null,
    [monsters, selectedId],
  );

  const cardW = containerW > 0 ? Math.floor((containerW - GAP * 2) / 3) : 0;

  return (
    <Modal open={open} onClose={onClose} title="Monsters" variant="modal" maxWidth={520}>
      <View style={styles.statusRow}>
        {STATUS_KEYS.map((k) => (
          <Pressable key={k} onPress={() => setStatus(k)} style={styles.statusCol}>
            <Text style={[styles.statusCount, status === k && styles.statusActive]}>
              {counts[k]}
            </Text>
            <Text style={[styles.statusLabel, status === k && styles.statusActive]}>
              {STATUS_LABELS[k]}
            </Text>
            {status === k && <View style={styles.statusUnderline} />}
          </Pressable>
        ))}
      </View>

      <View style={styles.catRow}>
        <CategoryPill cat="all" active={cat === 'all'} onPress={() => setCat('all')} />
        {['A', 'B', 'C', 'D'].map((k) => (
          <CategoryPill
            key={k}
            cat={k}
            active={cat === k}
            onPress={() => setCat(k)}
          />
        ))}
      </View>

      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name"
          placeholderTextColor="rgba(0,0,0,0.35)"
          style={styles.search}
        />
        <Pressable onPress={() => setSortDesc((v) => !v)} style={styles.sortBtn}>
          <Text style={styles.sortText}>{sortDesc ? 'Newest' : 'Oldest'}</Text>
        </Pressable>
      </View>

      <View
        style={styles.gridWrap}
        onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
      >
        {cardW > 0 &&
          Array.from({ length: Math.ceil(pageItems.length / 3) }).map((_, rowIdx) => {
            const rowItems = pageItems.slice(rowIdx * 3, rowIdx * 3 + 3);
            const rowHasSelected = rowItems.some((m) => m.id === selectedId);
            return (
              <View key={`row-${rowIdx}`}>
                <View style={styles.row}>
                  {rowItems.map((m, col) => (
                    <View
                      key={m.id}
                      style={{
                        width: cardW,
                        marginRight: col < 2 ? GAP : 0,
                        marginBottom: GAP,
                      }}
                    >
                      <CreatureCard
                        monster={m}
                        width={cardW}
                        selected={selectedId === m.id}
                        onPress={() =>
                          setSelectedId(selectedId === m.id ? null : m.id)
                        }
                        onStar={() => onStar(m.id)}
                      />
                    </View>
                  ))}
                </View>
                {rowHasSelected && selected && (
                  <DetailPanel
                    selected={selected}
                    onDeploy={onDeploy}
                    onRecall={onRecall}
                    onStar={onStar}
                  />
                )}
              </View>
            );
          })}
        {pageItems.length === 0 && (
          <Text style={styles.empty}>No creatures match.</Text>
        )}
      </View>

      {pageCount > 1 && (
        <View style={styles.paginationRow}>
          <Pressable
            onPress={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            style={[styles.pageBtn, safePage === 0 && styles.pageBtnDisabled]}
          >
            <Text style={styles.pageText}>‹</Text>
          </Pressable>
          <Text style={styles.pageLabel}>
            {safePage + 1} / {pageCount}
          </Text>
          <Pressable
            onPress={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={safePage >= pageCount - 1}
            style={[styles.pageBtn, safePage >= pageCount - 1 && styles.pageBtnDisabled]}
          >
            <Text style={styles.pageText}>›</Text>
          </Pressable>
        </View>
      )}
    </Modal>
  );
}

function DetailPanel({ selected, onDeploy, onRecall, onStar }) {
  return (
    <View style={styles.detail}>
      <View style={styles.detailHeader}>
        <Text style={styles.detailName}>{selected.name}</Text>
        <Gem cat={selected.attribute} size={22} angle={0.55} />
        <Text style={styles.detailGem}>{selected.gem}</Text>
      </View>
      {selected.diary && (
        <>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mood</Text>
            <MoodDots mood={selected.diary.mood_score} cat={selected.attribute} />
          </View>
          {selected.diary.emotions?.length > 0 && (
            <View style={styles.detailEmotions}>
              {selected.diary.emotions.map((e) => (
                <EmotionTag key={e} label={e} cat={selected.attribute} />
              ))}
            </View>
          )}
          <Text style={styles.detailBody}>{selected.diary.content}</Text>
          <Text style={styles.detailDate}>{fmtDate(selected.diary.created_at)}</Text>
        </>
      )}
      <View style={styles.detailActions}>
        {selected.is_displayed ? (
          <Pressable onPress={() => onRecall(selected.id)} style={[styles.actionBtn, styles.recallBtn]}>
            <Text style={styles.actionText}>Recall</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => onDeploy(selected.id)} style={[styles.actionBtn, styles.deployBtn]}>
            <Text style={styles.actionText}>Deploy</Text>
          </Pressable>
        )}
        <Pressable onPress={() => onStar(selected.id)} style={[styles.actionBtn, styles.starBtn]}>
          <Text style={styles.actionText}>{selected.starred ? 'Unstar' : 'Star'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statusCol: { alignItems: 'center', flex: 1, paddingVertical: 6 },
  statusCount: { fontSize: 18, fontWeight: '700', color: '#17171a' },
  statusLabel: { fontSize: 10, color: 'rgba(0,0,0,0.55)', marginTop: 2 },
  statusActive: { color: '#6a60c4' },
  statusUnderline: {
    width: 20, height: 2, backgroundColor: '#6a60c4',
    borderRadius: 1, marginTop: 4,
  },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  search: {
    flex: 1,
    backgroundColor: '#f2f0ea',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    color: '#17171a',
    fontSize: 13,
  },
  sortBtn: {
    marginLeft: 8, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, backgroundColor: '#e2dfd5',
  },
  sortText: { color: '#17171a', fontSize: 12, fontWeight: '600' },
  gridWrap: {},
  row: { flexDirection: 'row' },
  empty: { color: 'rgba(0,0,0,0.5)', fontStyle: 'italic', padding: 12 },
  detail: {
    backgroundColor: '#f8f7f4',
    padding: 12, borderRadius: 12,
    marginTop: 8, marginBottom: 8,
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center' },
  detailName: { fontSize: 15, fontWeight: '700', color: '#17171a', marginRight: 8, flex: 1 },
  detailGem: { color: '#444', fontSize: 12, marginLeft: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  detailLabel: { color: '#444', fontSize: 12, marginRight: 8, fontWeight: '600' },
  detailEmotions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  detailBody: { color: '#17171a', fontSize: 13, marginTop: 8, lineHeight: 18 },
  detailDate: { color: 'rgba(0,0,0,0.5)', fontSize: 11, marginTop: 6 },
  detailActions: { flexDirection: 'row', marginTop: 12 },
  actionBtn: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 10, marginRight: 8,
  },
  deployBtn: { backgroundColor: '#6a60c4' },
  recallBtn: { backgroundColor: '#3a6fa0' },
  starBtn: { backgroundColor: '#e2dfd5' },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  pageBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: '#e2dfd5', borderRadius: 8, marginHorizontal: 8,
  },
  pageBtnDisabled: { opacity: 0.35 },
  pageText: { color: '#17171a', fontSize: 14, fontWeight: '700' },
  pageLabel: { color: '#17171a', fontSize: 12 },
});
