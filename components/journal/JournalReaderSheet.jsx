import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import Modal from '../ui/Modal';
import CategoryPill from '../ui/CategoryPill';
import Gem from '../ui/Gem';
import MoodDots from '../ui/MoodDots';
import EmotionTag from '../ui/EmotionTag';
import { GEMS, fmtDate } from '../../theme';

export default function JournalReaderSheet({
  open,
  journal,
  onClose,
  onSubmit,
  onReadAnother,
}) {
  const [pickerCat, setPickerCat] = useState('A');
  const [selectedGem, setSelectedGem] = useState(null);
  const [comment, setComment] = useState('');
  const [gridW, setGridW] = useState(0);

  useEffect(() => {
    if (open && journal) {
      setPickerCat('A');
      setSelectedGem(null);
      setComment('');
    }
  }, [open, journal?.id]);

  if (!journal) return null;

  const gemList = GEMS[pickerCat] || [];
  const canSubmit = !!selectedGem;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      cat: selectedGem.cat,
      value: selectedGem.value,
      comment: comment.trim() ? comment.trim() : null,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="sheet"
      sheetStyle={{ backgroundColor: 'rgba(14,7,38,0.97)', marginBottom: 0, paddingBottom: 14 }}
      backdropStyle={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={20}
      >
        <Text style={styles.title}>Someone sent you their journal</Text>
        <Text style={styles.hint}>
          Read it, then choose a gem that fits. Your gem becomes their creature's soul.
        </Text>

        <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyScrollContent}>
          <Text style={styles.date}>{fmtDate(journal.created_at)}</Text>
          <Text style={styles.body}>{journal.content}</Text>
          {journal.emotions?.length > 0 && (
            <View style={styles.emotionRow}>
              {journal.emotions.map((e) => (
                <EmotionTag key={e} label={e} cat="U" />
              ))}
            </View>
          )}
          <View style={styles.moodRow}>
            <Text style={styles.sectionLabel}>Mood</Text>
            <MoodDots mood={journal.mood_score} cat="U" />
          </View>
        </ScrollView>

        <Text style={styles.sectionLabel}>Pick a category</Text>
        <View style={styles.catRow}>
          {['A', 'B', 'C', 'D'].map((k) => (
            <CategoryPill
              key={k}
              cat={k}
              active={pickerCat === k}
              onPress={() => setPickerCat(k)}
            />
          ))}
        </View>

        <View
          style={styles.gemGrid}
          onLayout={(e) => setGridW(e.nativeEvent.layout.width)}
        >
          {gridW > 0 &&
            gemList.map((g, idx) => {
              const isSel =
                selectedGem && selectedGem.cat === pickerCat && selectedGem.value === g;
              const cellW = Math.floor(gridW / 3);
              return (
                <Pressable
                  key={g}
                  onPress={() => setSelectedGem({ cat: pickerCat, value: g })}
                  style={({ pressed }) => [
                    styles.gemCell,
                    { width: cellW },
                    isSel && styles.gemCellSel,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Gem cat={pickerCat} size={30} angle={0.5 + idx * 0.07} />
                  <Text style={styles.gemCellText}>{g}</Text>
                </Pressable>
              );
            })}
        </View>

        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Say something back (optional)…"
          placeholderTextColor="rgba(255,255,255,0.35)"
          multiline
          style={styles.commentInput}
        />

        <View style={styles.actionRow}>
          <Pressable
            onPress={onReadAnother}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.skipBtn,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.skipText}>Read another</Text>
          </Pressable>
          <Pressable
            disabled={!canSubmit}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.sendBtn,
              {
                opacity: !canSubmit ? 0.4 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={styles.sendText}>
              {selectedGem ? `Send ${selectedGem.value}` : 'Pick a gem'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  title: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 4 },
  hint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  bodyScroll: { maxHeight: 220, marginBottom: 8 },
  bodyScrollContent: { paddingBottom: 4 },
  date: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 6 },
  body: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  emotionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
    marginRight: 8,
  },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  gemGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  gemCell: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 6,
  },
  gemCellSel: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  gemCellText: { color: '#fff', fontSize: 11, marginTop: 4 },
  commentInput: {
    marginTop: 10,
    minHeight: 60,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: 13,
    textAlignVertical: 'top',
  },
  actionRow: { flexDirection: 'row', marginTop: 14 },
  actionBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: 8,
  },
  skipText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  sendBtn: { backgroundColor: '#6a60c4' },
  sendText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
