import React, { useMemo, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

import { BG, MAX_DEPLOYED, fmtDate } from './theme';
import { generateCreature } from './generateCreature';
import diariesSeed from './data/diaries.json';
import monstersSeed from './data/monsters.json';

import BottomNav from './components/nav/BottomNav';
import PlanetScreen from './components/planet/PlanetScreen';
import DiaryCalendar from './components/diary/DiaryCalendar';
import DiaryWriter from './components/diary/DiaryWriter';
import DiarySheet from './components/diary/DiarySheet';
import CreatureManager from './components/creatures/CreatureManager';

export default function App() {
  const [navKey, setNavKey] = useState('planet');
  const [monsters, setMonsters] = useState(monstersSeed);
  const [diaries, setDiaries] = useState(diariesSeed);
  const [toast, setToast] = useState(null);
  const [writerOpen, setWriterOpen] = useState(false);
  const [selectedDiaryId, setSelectedDiaryId] = useState(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [planetMode, setPlanetMode] = useState('slingshot');

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const { enrichedMonsters, calendarDiaries } = useMemo(() => {
    const diaryById = new Map(diaries.map((d) => [d.id, d]));
    const monsterByDiaryId = new Map(monsters.map((m) => [m.diary_id, m]));

    const enrichedMonsters = monsters.map((m) => {
      const d = diaryById.get(m.diary_id);
      return {
        ...m,
        diary: d,
        attribute: d?.attribute ?? null,
        dateLabel: d ? fmtDate(d.created_at) : '',
        seed: m.id * 9301 + (m.diary_id || 0) * 49297,
      };
    });

    const calendarDiaries = diaries.map((d) => {
      const m = monsterByDiaryId.get(d.id);
      return { ...d, monster: m || null, hatched: !!m };
    });

    return { enrichedMonsters, calendarDiaries };
  }, [monsters, diaries]);

  const deploy = useCallback((id) => {
    const deployedCount = monsters.filter((m) => m.is_displayed).length;
    if (deployedCount >= MAX_DEPLOYED) {
      showToast('Planet is full — recall one first');
      return;
    }
    setMonsters((prev) => prev.map((m) => (m.id === id ? { ...m, is_displayed: true } : m)));
  }, [monsters, showToast]);

  const recall = useCallback((id) => {
    setMonsters((prev) => prev.map((m) => (m.id === id ? { ...m, is_displayed: false } : m)));
  }, []);

  const star = useCallback((id) => {
    setMonsters((prev) => prev.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m)));
  }, []);

  const hatch = useCallback((diaryId, gem) => {
    const diary = diaries.find((d) => d.id === diaryId);
    if (!diary) return;
    setMonsters((prev) => {
      const deployedCount = prev.filter((m) => m.is_displayed).length;
      const nextId = prev.reduce((max, m) => Math.max(max, m.id), 0) + 1;
      const canDeploy = deployedCount < MAX_DEPLOYED;
      const creature = generateCreature(diary, gem, { id: nextId });
      if (!canDeploy) showToast('Planet is full — hatched to idle');
      return [...prev, { ...creature, is_displayed: canDeploy }];
    });
  }, [diaries, showToast]);

  const writeDiary = useCallback((entry) => {
    setDiaries((prev) => {
      const nextId = prev.reduce((max, d) => Math.max(max, d.id), 0) + 1;
      return [...prev, { id: nextId, created_at: new Date().toISOString(), ...entry }];
    });
  }, []);

  const updateDiary = useCallback((diaryId, updates) => {
    setDiaries((prev) => prev.map((d) => (d.id === diaryId ? { ...d, ...updates } : d)));
  }, []);

  const selectedDiary = useMemo(
    () => calendarDiaries.find((d) => d.id === selectedDiaryId) || null,
    [calendarDiaries, selectedDiaryId],
  );

  const openDiaryFromMonster = useCallback((monster) => {
    if (!monster) return;
    setSelectedDiaryId(monster.diary_id);
  }, []);

  const renderScreen = () => {
    switch (navKey) {
      case 'planet':
        return (
          <PlanetScreen
            monsters={enrichedMonsters}
            onSelectCreature={openDiaryFromMonster}
            onOpenManager={() => setManagerOpen(true)}
            mode={planetMode}
            onModeChange={setPlanetMode}
          />
        );
      case 'calendar':
        return (
          <DiaryCalendar
            diaries={calendarDiaries}
            onSelectDiary={(d) => setSelectedDiaryId(d.id)}
          />
        );
      default:
        return (
          <View style={styles.stub}>
            <Text style={styles.stubText}>{navKey} (not implemented)</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaView style={styles.root} edges={['top']}>
          <View style={styles.screen}>
            {renderScreen()}
            <BottomNav
              navKey={navKey}
              onChange={setNavKey}
              onWritePress={() => setWriterOpen(true)}
            />
          </View>
          <DiaryWriter
            open={writerOpen}
            onClose={() => setWriterOpen(false)}
            onSubmit={(entry) => {
              writeDiary(entry);
              setWriterOpen(false);
            }}
          />
          <DiarySheet
            open={!!selectedDiary}
            onClose={() => setSelectedDiaryId(null)}
            diary={selectedDiary}
            monster={selectedDiary?.monster || null}
            onHatch={hatch}
            onRecall={recall}
            onUpdateDiary={updateDiary}
            showTopOverlay={navKey === 'calendar'}
          />
          <CreatureManager
            open={managerOpen}
            onClose={() => setManagerOpen(false)}
            monsters={enrichedMonsters}
            onDeploy={deploy}
            onRecall={recall}
            onStar={star}
          />
          {toast && (
            <View style={styles.toast} pointerEvents="none">
              <Text style={styles.toastText}>{toast}</Text>
            </View>
          )}
          <StatusBar style="light" />
        </SafeAreaView>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG.DEEP },
  screen: { flex: 1 },
  stub: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG.DEEP },
  stubText: { color: 'rgba(255,255,255,0.55)', fontSize: 16 },
  toast: {
    position: 'absolute', bottom: 80, left: 20, right: 20,
    backgroundColor: 'rgba(0,0,0,0.82)', padding: 12, borderRadius: 12, alignItems: 'center',
  },
  toastText: { color: '#fff', fontSize: 13 },
});
