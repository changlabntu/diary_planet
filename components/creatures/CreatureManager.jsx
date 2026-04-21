import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';

import Modal from '../ui/Modal';
import CategoryPill from '../ui/CategoryPill';
import CreatureCard from './CreatureCard';
import GiftSymbol from '../ui/GiftSymbol';
import EmotionTag from '../ui/EmotionTag';
import MoodDots from '../ui/MoodDots';
import { ATTRIBUTES, EGG_NAME, fmtDate } from '../../theme';

const STATUS_KEYS = ['all', 'deployed', 'idle', 'starred'];
const STATUS_LABELS = { all: 'Total', deployed: 'On planet', idle: 'Idle', starred: 'Starred' };
const PAGE_SIZE = 20;
const GAP = 6;
const COLS = 4;
const ACCENT = ATTRIBUTES.A.mid;
const DEPLOY_COLOR = ATTRIBUTES.A.mid;
const RECALL_COLOR = ATTRIBUTES.C.mid;
const SORT_OPTIONS = ['deployed', 'newest', 'oldest'];
const SORT_LABELS = { deployed: 'Deployed', newest: 'Newest', oldest: 'Oldest' };

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
  const [sortBy, setSortBy] = useState('deployed');
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [containerW, setContainerW] = useState(0);
  const [showEggs, setShowEggs] = useState(false);

  const eggCount = useMemo(
    () => monsters.filter((m) => m.state !== 'hatched').length,
    [monsters],
  );

  const visible = useMemo(
    () => (showEggs ? monsters : monsters.filter((m) => m.state === 'hatched')),
    [monsters, showEggs],
  );

  const counts = useMemo(
    () => ({
      all: visible.length,
      deployed: visible.filter((m) => m.is_displayed).length,
      idle: visible.filter((m) => !m.is_displayed).length,
      starred: visible.filter((m) => m.starred).length,
    }),
    [visible],
  );

  const attrCounts = useMemo(() => {
    const c = { A: 0, B: 0, C: 0, D: 0, U: 0 };
    for (const m of visible) if (c[m.attribute] != null) c[m.attribute]++;
    return c;
  }, [visible]);

  const filtered = useMemo(() => {
    let list = visible;
    if (status === 'deployed') list = list.filter((m) => m.is_displayed);
    else if (status === 'idle') list = list.filter((m) => !m.is_displayed);
    else if (status === 'starred') list = list.filter((m) => m.starred);

    if (cat !== 'all') list = list.filter((m) => m.attribute === cat);

    const q = query.trim().toLowerCase();
    if (q) list = list.filter((m) => m.name?.toLowerCase().includes(q));

    const sorted = [...list].sort((a, b) => {
      if (sortBy === 'deployed' && a.is_displayed !== b.is_displayed) {
        return a.is_displayed ? -1 : 1;
      }
      const da = new Date(a.diary?.created_at || 0).getTime();
      const db = new Date(b.diary?.created_at || 0).getTime();
      return sortBy === 'oldest' ? da - db : db - da;
    });
    return sorted;
  }, [visible, status, cat, query, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const selected = useMemo(
    () => monsters.find((m) => m.id === selectedId) || null,
    [monsters, selectedId],
  );

  const cardW = containerW > 0 ? Math.floor((containerW - GAP * (COLS - 1)) / COLS) : 0;

  return (
    <Modal open={open} onClose={onClose} title="Monsters" variant="sheet">
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
            label={`${ATTRIBUTES[k].label} (${attrCounts[k]})`}
            onPress={() => setCat(k)}
          />
        ))}
        {showEggs && (
          <CategoryPill
            cat="U"
            active={cat === 'U'}
            label={`${ATTRIBUTES.U.label} (${attrCounts.U})`}
            onPress={() => setCat('U')}
          />
        )}
      </View>

      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name"
          placeholderTextColor="rgba(255,255,255,0.4)"
          style={styles.search}
        />
        <Pressable
          onPress={() => {
            setShowEggs((v) => {
              const next = !v;
              if (!next && cat === 'U') setCat('all');
              return next;
            });
          }}
          style={[styles.sortBtn, showEggs && styles.toggleActive]}
        >
          <Text style={styles.sortText}>
            {showEggs ? `Hide eggs` : `Show eggs${eggCount ? ` (${eggCount})` : ''}`}
          </Text>
        </Pressable>
        <Pressable
          onPress={() =>
            setSortBy((s) => SORT_OPTIONS[(SORT_OPTIONS.indexOf(s) + 1) % SORT_OPTIONS.length])
          }
          style={styles.sortBtn}
        >
          <Text style={styles.sortText}>{SORT_LABELS[sortBy]}</Text>
        </Pressable>
      </View>

      <View
        style={styles.gridWrap}
        onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
      >
        {cardW > 0 &&
          Array.from({ length: Math.ceil(pageItems.length / COLS) }).map((_, rowIdx) => {
            const rowItems = pageItems.slice(rowIdx * COLS, rowIdx * COLS + COLS);
            const rowHasSelected = rowItems.some((m) => m.id === selectedId);
            return (
              <View key={`row-${rowIdx}`}>
                <View style={styles.row}>
                  {rowItems.map((m, col) => (
                    <View
                      key={m.id}
                      style={{
                        width: cardW,
                        marginRight: col < COLS - 1 ? GAP : 0,
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
  const state = selected.state;
  const hatched = state === 'hatched';
  const displayCat = hatched ? selected.attribute : 'U';
  const hintByState = {
    egg: 'Send this out from the diary to start hatching',
    sent: 'Awaiting a response from a reader',
    replied: 'Ready to hatch — open the diary to reveal',
  };
  return (
    <View style={styles.detail}>
      <View style={styles.detailHeader}>
        <Text style={styles.detailName}>{selected.name || EGG_NAME}</Text>
        {hatched && (
          <>
            <GiftSymbol
              shape={selected.gift_shape}
              cat={displayCat}
              size={22}
              angle={0.55}
            />
            <Text style={styles.detailGift}>{selected.gift}</Text>
          </>
        )}
      </View>
      {selected.diary && (
        <>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mood</Text>
            <MoodDots mood={selected.diary.mood_score} cat={displayCat} />
          </View>
          {selected.diary.emotions?.length > 0 && (
            <View style={styles.detailEmotions}>
              {selected.diary.emotions.map((e) => (
                <EmotionTag key={e} label={e} cat={displayCat} />
              ))}
            </View>
          )}
          <Text style={styles.detailBody}>{selected.diary.content}</Text>
          <Text style={styles.detailDate}>{fmtDate(selected.diary.created_at)}</Text>
        </>
      )}
      <View style={styles.detailActions}>
        {!hatched ? (
          <View style={[styles.actionBtn, styles.eggHint]}>
            <Text style={styles.eggHintText}>{hintByState[state] || hintByState.egg}</Text>
          </View>
        ) : selected.is_displayed ? (
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
  statusCount: { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.92)' },
  statusLabel: { fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  statusActive: { color: ACCENT },
  statusUnderline: {
    width: 20, height: 2, backgroundColor: ACCENT,
    borderRadius: 1, marginTop: 4,
  },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  search: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    color: '#fff',
    fontSize: 13,
  },
  sortBtn: {
    marginLeft: 8, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)',
  },
  toggleActive: { backgroundColor: ACCENT },
  sortText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  gridWrap: {},
  row: { flexDirection: 'row' },
  empty: { color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', padding: 12 },
  detail: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 12, borderRadius: 12,
    marginTop: 8, marginBottom: 8,
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center' },
  detailName: { fontSize: 15, fontWeight: '700', color: '#fff', marginRight: 8, flex: 1 },
  detailGift: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginLeft: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  detailLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginRight: 8, fontWeight: '600' },
  detailEmotions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  detailBody: { color: '#fff', fontSize: 13, marginTop: 8, lineHeight: 18 },
  detailDate: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 6 },
  detailActions: { flexDirection: 'row', marginTop: 12 },
  actionBtn: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 10, marginRight: 8,
  },
  deployBtn: { backgroundColor: DEPLOY_COLOR },
  recallBtn: { backgroundColor: RECALL_COLOR },
  starBtn: { backgroundColor: 'rgba(255,255,255,0.12)' },
  eggHint: { backgroundColor: 'rgba(255,255,255,0.06)' },
  eggHintText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontStyle: 'italic' },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  pageBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, marginHorizontal: 8,
  },
  pageBtnDisabled: { opacity: 0.35 },
  pageText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  pageLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
});
