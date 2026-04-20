import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';

import CreatureAvatar from '../ui/CreatureAvatar';
import EggIcon from '../ui/EggIcon';
import MoodDots from '../ui/MoodDots';
import EmotionTag from '../ui/EmotionTag';
import Gem from '../ui/Gem';
import { ATTRIBUTES, BG, EGG_NAME, badge, fmtDate } from '../../theme';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const STATE_RANK = { replied: 0, hatched: 1, egg: 2, sent: 2 };

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfMonth(y, m) { return new Date(y, m, 1).getDay(); }

export default function DiaryCalendar({ diaries, onSelectDiary }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [containerW, setContainerW] = useState(0);

  const byDay = useMemo(() => {
    const map = new Map();
    for (const d of diaries) {
      const dt = new Date(d.created_at);
      if (dt.getFullYear() !== viewYear || dt.getMonth() !== viewMonth) continue;
      const k = dt.getDate();
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(d);
    }
    return map;
  }, [diaries, viewYear, viewMonth]);

  const entriesThisMonth = useMemo(
    () =>
      diaries
        .filter((d) => {
          const dt = new Date(d.created_at);
          return dt.getFullYear() === viewYear && dt.getMonth() === viewMonth;
        })
        .sort((a, b) => {
          const ra = STATE_RANK[a.monster?.state] ?? 2;
          const rb = STATE_RANK[b.monster?.state] ?? 2;
          if (ra !== rb) return ra - rb;
          return new Date(b.created_at) - new Date(a.created_at);
        }),
    [diaries, viewYear, viewMonth],
  );

  const totalDays = daysInMonth(viewYear, viewMonth);
  const leading = firstDayOfMonth(viewYear, viewMonth);
  const cells = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  const cellW = containerW > 0 ? Math.floor(containerW / 7) : 0;

  const prevMonth = () => {
    let y = viewYear, m = viewMonth - 1;
    if (m < 0) { m = 11; y -= 1; }
    setViewYear(y); setViewMonth(m);
  };
  const nextMonth = () => {
    let y = viewYear, m = viewMonth + 1;
    if (m > 11) { m = 0; y += 1; }
    setViewYear(y); setViewMonth(m);
  };

  const isToday = (d) =>
    d &&
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === d;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 70 }}>
      <View style={styles.headerRow}>
        <Pressable onPress={prevMonth} hitSlop={8} style={styles.navBtn}>
          <Text style={styles.navText}>‹</Text>
        </Pressable>
        <Text style={styles.monthLabel}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Text>
        <Pressable onPress={nextMonth} hitSlop={8} style={styles.navBtn}>
          <Text style={styles.navText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.dayLabelRow}>
        {DAY_LABELS.map((l, i) => (
          <View key={i} style={styles.dayLabelCell}>
            <Text style={styles.dayLabelText}>{l}</Text>
          </View>
        ))}
      </View>

      <View
        style={styles.grid}
        onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
      >
        {cellW > 0 &&
          cells.map((d, i) => {
            if (d === null) {
              return <View key={i} style={{ width: cellW, height: cellW }} />;
            }
            const entries = byDay.get(d) || [];
            const previews = entries.slice(0, 3);
            const isTodayCell = isToday(d);
            return (
              <Pressable
                key={i}
                onPress={() => entries[0] && onSelectDiary(entries[0])}
                style={[
                  styles.dayCell,
                  { width: cellW, height: cellW },
                  isTodayCell && styles.today,
                ]}
              >
                <Text
                  style={[
                    styles.dayNum,
                    entries.length > 0 && styles.dayNumActive,
                  ]}
                >
                  {d}
                </Text>
                <View style={styles.previewRow}>
                  {previews.map((p) =>
                    p.hatched && p.monster ? (
                      <CreatureAvatar
                        key={p.id}
                        color={p.monster.color}
                        torsoColor={p.monster.torsoColor}
                        size={14}
                      />
                    ) : (
                      <EggIcon
                        key={p.id}
                        size={10}
                        color={ATTRIBUTES.U.hi}
                        pending={p.monster?.state === 'sent'}
                        ready={p.monster?.state === 'replied'}
                      />
                    ),
                  )}
                </View>
              </Pressable>
            );
          })}
      </View>

      <Text style={styles.listTitle}>
        {entriesThisMonth.length} entries this month
      </Text>
      <View style={styles.list}>
        {entriesThisMonth.map((d) => (
          <EntryRow key={d.id} diary={d} onPress={() => onSelectDiary(d)} />
        ))}
        {entriesThisMonth.length === 0 && (
          <Text style={styles.empty}>Nothing logged this month.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const SHAKE_LEG_SHORT = 117; // was 350 — 3× faster
const SHAKE_LEG_LONG = 233;  // was 700 — 3× faster
const SHAKE_CYCLE_MS = SHAKE_LEG_SHORT + SHAKE_LEG_LONG + SHAKE_LEG_SHORT;
const REST_CYCLES = 2;
const SHAKE_CYCLES = 2;

function SwingEgg({ active, children }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) {
      anim.stopAnimation();
      anim.setValue(0);
      return undefined;
    }
    const shakeCycle = () => [
      Animated.timing(anim, {
        toValue: 1,
        duration: SHAKE_LEG_SHORT,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: -1,
        duration: SHAKE_LEG_LONG,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 0,
        duration: SHAKE_LEG_SHORT,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ];
    const steps = [];
    for (let i = 0; i < SHAKE_CYCLES; i++) steps.push(...shakeCycle());
    steps.push(Animated.delay(SHAKE_CYCLE_MS * REST_CYCLES));
    const loop = Animated.loop(Animated.sequence(steps));
    loop.start();
    return () => loop.stop();
  }, [active, anim]);

  const rotate = anim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-10deg', '10deg'],
  });
  return <Animated.View style={{ transform: [{ rotate }] }}>{children}</Animated.View>;
}

function EntryRow({ diary, onPress }) {
  const state = diary.monster?.state || 'egg';
  const hatched = state === 'hatched';
  // Don't leak attribute pre-hatch, even if it's already set on a replied egg.
  const cat = hatched ? diary.monster.attribute : 'U';
  const b = badge(cat);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
    >
      <View style={styles.rowLeft}>
        {hatched && diary.monster ? (
          <CreatureAvatar
            color={diary.monster.color}
            torsoColor={diary.monster.torsoColor}
            size={36}
          />
        ) : (
          <SwingEgg active={state === 'replied'}>
            <EggIcon
              size={28}
              color={ATTRIBUTES.U.hi}
              pending={state === 'sent'}
              ready={state === 'replied'}
            />
          </SwingEgg>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.rowHead}>
          <Text style={styles.rowName} numberOfLines={1}>
            {diary.monster?.name || EGG_NAME}
          </Text>
          {hatched && (
            <View style={[styles.rowPill, { backgroundColor: b.bg }]}>
              <Text style={[styles.rowPillText, { color: b.color }]}>
                {ATTRIBUTES[cat]?.label}
              </Text>
            </View>
          )}
          {hatched && diary.monster?.gem && (
            <View style={styles.rowGemPill}>
              <Gem cat={cat} size={12} angle={0.5} />
              <Text style={styles.rowGemText}>{diary.monster.gem}</Text>
            </View>
          )}
        </View>
        <View style={styles.rowMeta}>
          <Text style={styles.rowDate}>{fmtDate(diary.created_at)}</Text>
          {diary.emotions?.slice(0, 2).map((e) => (
            <EmotionTag key={e} label={e} cat={cat} />
          ))}
        </View>
        <View style={{ marginTop: 4 }}>
          <MoodDots mood={diary.mood_score} cat={cat} dotSize={5} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG.DARK },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  navBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  navText: { color: '#fff', fontSize: 18 },
  monthLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
  dayLabelRow: { flexDirection: 'row', paddingHorizontal: 8 },
  dayLabelCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  dayLabelText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  dayCell: {
    alignItems: 'center',
    paddingTop: 4,
    borderRadius: 6,
  },
  today: { backgroundColor: 'rgba(106,96,196,0.2)' },
  dayNum: { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
  dayNumActive: { color: '#fff', fontWeight: '600' },
  previewRow: { flexDirection: 'row', marginTop: 2, minHeight: 16 },
  listTitle: {
    color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600',
    paddingHorizontal: 16, paddingTop: 18, paddingBottom: 8,
  },
  list: { paddingHorizontal: 12 },
  row: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    marginBottom: 8,
  },
  rowLeft: { width: 44, alignItems: 'center', justifyContent: 'center' },
  rowHead: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  rowName: { color: '#fff', fontSize: 13, fontWeight: '600', marginRight: 6, maxWidth: 120 },
  rowPill: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 999, marginRight: 6,
  },
  rowPillText: { fontSize: 10, fontWeight: '600' },
  rowGemPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6, paddingVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
  },
  rowGemText: { color: '#fff', fontSize: 10, marginLeft: 4 },
  rowMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 4 },
  rowDate: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginRight: 8 },
  empty: { color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', padding: 16 },
});
