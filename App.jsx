import React, { useMemo, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

import { BG, MAX_DEPLOYED, fmtDate } from './theme';
import {
  createEgg,
  hatchMonster,
  sendMonster,
  applyReply,
} from './generateCreature';
import diariesSeed from './data/diaries.json';
import monstersSeed from './data/monsters.json';
import { listReadable, drawRandom } from './data/pool';

import BottomNav from './components/nav/BottomNav';
import PlanetScreen from './components/planet/PlanetScreen';
import DiaryCalendar from './components/diary/DiaryCalendar';
import DiaryWriter from './components/diary/DiaryWriter';
import DiarySheet from './components/diary/DiarySheet';
import DiaryConversationSheet from './components/diary/DiaryConversationSheet';
import CreatureManager from './components/creatures/CreatureManager';
import JournalReaderSheet from './components/journal/JournalReaderSheet';

export default function App() {
  const [navKey, setNavKey] = useState('planet');
  const [monsters, setMonsters] = useState(monstersSeed);
  const [diaries, setDiaries] = useState(diariesSeed);
  const [toast, setToast] = useState(null);
  const [writerOpen, setWriterOpen] = useState(false);
  const [selectedDiaryId, setSelectedDiaryId] = useState(null);
  const [diarySheetSource, setDiarySheetSource] = useState('planet');
  const [conversationDiaryId, setConversationDiaryId] = useState(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [planetMode, setPlanetMode] = useState('slingshot');
  const [role, setRole] = useState('author');
  const [readerJournal, setReaderJournal] = useState(null);

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
        dateLabel: d ? fmtDate(d.created_at) : '',
        seed: m.id * 9301 + (m.diary_id || 0) * 49297,
      };
    });

    const calendarDiaries = diaries.map((d) => {
      const m = monsterByDiaryId.get(d.id);
      return {
        ...d,
        monster: m || null,
        hatched: m?.state === 'hatched',
      };
    });

    return { enrichedMonsters, calendarDiaries };
  }, [monsters, diaries]);

  const deploy = useCallback((id) => {
    const target = monsters.find((m) => m.id === id);
    if (!target || target.state !== 'hatched') return;
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

  const sendJournal = useCallback((diaryId) => {
    setMonsters((prev) =>
      prev.map((m) => (m.diary_id === diaryId && m.state === 'egg' ? sendMonster(m) : m)),
    );
  }, []);

  const replyToJournal = useCallback((journal, reply) => {
    if (!journal) return;
    setMonsters((prev) =>
      prev.map((m) => (m.diary_id === journal.id && m.state === 'sent' ? applyReply(m, reply) : m)),
    );
  }, []);

  const hatch = useCallback((diaryId) => {
    const diary = diaries.find((d) => d.id === diaryId);
    if (!diary) return;
    setMonsters((prev) => {
      const target = prev.find((m) => m.diary_id === diaryId && m.state === 'replied');
      if (!target) return prev;
      const deployedCount = prev.filter((m) => m.is_displayed).length;
      const canDeploy = deployedCount < MAX_DEPLOYED;
      const hatched = hatchMonster(target, diary);
      if (!canDeploy) showToast('Planet is full — hatched to idle');
      return prev.map((m) =>
        m.id === target.id ? { ...hatched, is_displayed: canDeploy } : m,
      );
    });
  }, [diaries, showToast]);

  const writeDiary = useCallback((entry) => {
    const nextDiaryId = diaries.reduce((max, d) => Math.max(max, d.id), 0) + 1;
    const newDiary = { id: nextDiaryId, created_at: new Date().toISOString(), ...entry };
    const nextMonsterId = monsters.reduce((max, m) => Math.max(max, m.id), 0) + 1;
    setDiaries((prev) => [...prev, newDiary]);
    setMonsters((prev) => [...prev, createEgg(newDiary, { id: nextMonsterId })]);
    return nextDiaryId;
  }, [diaries, monsters]);

  const updateDiary = useCallback((diaryId, updates) => {
    setDiaries((prev) => prev.map((d) => (d.id === diaryId ? { ...d, ...updates } : d)));
  }, []);

  const drawReaderJournal = useCallback(() => {
    const list = listReadable(diaries, monsters);
    if (list.length === 0) {
      showToast('Nothing to read yet — send one from your planet first');
      return;
    }
    const picked = drawRandom(list, readerJournal?.id);
    if (!picked) {
      showToast('No other journals to read');
      return;
    }
    setReaderJournal(picked);
  }, [diaries, monsters, readerJournal, showToast]);

  const openPeerMode = useCallback(() => {
    const list = listReadable(diaries, monsters);
    if (list.length === 0) {
      showToast('Nothing to read yet — send one from your planet first');
      return;
    }
    const picked = drawRandom(list, null);
    if (!picked) return;
    setReaderJournal(picked);
    setRole('reader');
  }, [diaries, monsters, showToast]);

  const exitPeerMode = useCallback(() => {
    setReaderJournal(null);
    setRole('author');
  }, []);

  const submitReaderReply = useCallback((journal, reply) => {
    replyToJournal(journal, reply);
  }, [replyToJournal]);

  const selectedDiary = useMemo(
    () => calendarDiaries.find((d) => d.id === selectedDiaryId) || null,
    [calendarDiaries, selectedDiaryId],
  );

  const conversationDiary = useMemo(
    () => calendarDiaries.find((d) => d.id === conversationDiaryId) || null,
    [calendarDiaries, conversationDiaryId],
  );

  const openDiaryFromMonster = useCallback((monster) => {
    if (!monster) return;
    setDiarySheetSource('planet');
    setSelectedDiaryId(monster.diary_id);
  }, []);

  const handlePlanetMenuSelect = useCallback((key) => {
    if (key === 'monsters') setManagerOpen(true);
    else if (key === 'reader') openPeerMode();
  }, [openPeerMode]);

  const renderScreen = () => {
    switch (navKey) {
      case 'planet':
        return (
          <PlanetScreen
            monsters={enrichedMonsters}
            onSelectCreature={openDiaryFromMonster}
            onOpenManager={() => setManagerOpen(true)}
            onMenuSelect={handlePlanetMenuSelect}
            mode={planetMode}
            onModeChange={setPlanetMode}
          />
        );
      case 'calendar':
        return (
          <DiaryCalendar
            diaries={calendarDiaries}
            onSelectDiary={(d) => {
              setDiarySheetSource('calendar');
              setSelectedDiaryId(d.id);
            }}
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
            {role === 'author' && (
              <BottomNav
                navKey={navKey}
                onChange={setNavKey}
                onWritePress={() => setWriterOpen(true)}
              />
            )}
          </View>
          <DiaryWriter
            open={writerOpen}
            onClose={() => setWriterOpen(false)}
            onSubmit={(entry) => {
              const newId = writeDiary(entry);
              setWriterOpen(false);
              setConversationDiaryId(newId);
            }}
          />
          <DiarySheet
            open={!!selectedDiary}
            onClose={() => setSelectedDiaryId(null)}
            diary={selectedDiary}
            monster={selectedDiary?.monster || null}
            onSendOut={(diaryId) => {
              sendJournal(diaryId);
              setSelectedDiaryId(null);
            }}
            onHatch={(diaryId) => {
              hatch(diaryId);
              setSelectedDiaryId(null);
            }}
            onRecall={recall}
            onUpdateDiary={updateDiary}
            source={diarySheetSource}
          />
          <DiaryConversationSheet
            open={!!conversationDiary}
            onClose={() => setConversationDiaryId(null)}
            diary={conversationDiary}
            monster={conversationDiary?.monster || null}
            onSave={() => setConversationDiaryId(null)}
            onSendOut={() => {
              if (!conversationDiary) return;
              sendJournal(conversationDiary.id);
              setConversationDiaryId(null);
              showToast('Sent out — waiting for a reply');
            }}
          />
          <CreatureManager
            open={managerOpen}
            onClose={() => setManagerOpen(false)}
            monsters={enrichedMonsters}
            onDeploy={deploy}
            onRecall={recall}
            onStar={star}
          />
          <JournalReaderSheet
            open={role === 'reader' && !!readerJournal}
            journal={readerJournal}
            onClose={exitPeerMode}
            onSubmit={(reply) => {
              if (!readerJournal) return;
              submitReaderReply(readerJournal, reply);
              exitPeerMode();
              showToast('Sent your reply back');
            }}
            onReadAnother={() => drawReaderJournal()}
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
