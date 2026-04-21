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
import Sphere from '../ui/Sphere';
import MoodDots from '../ui/MoodDots';
import EmotionTag from '../ui/EmotionTag';
import { VIRTUES, fmtDate } from '../../theme';

export default function JournalReaderSheet({
  open,
  journal,
  onClose,
  onSubmit,
  onReadAnother,
}) {
  const [pickerCat, setPickerCat] = useState('A');
  const [selectedGift, setSelectedGift] = useState(null);
  const [selectedShape, setSelectedShape] = useState(null);
  const [comment, setComment] = useState('');
  const [gridW, setGridW] = useState(0);

  useEffect(() => {
    if (open && journal) {
      setPickerCat('A');
      setSelectedGift(null);
      setSelectedShape(null);
      setComment('');
    }
  }, [open, journal?.id]);

  if (!journal) return null;

  const virtueList = VIRTUES[pickerCat] || [];
  const canSubmit = !!selectedGift && !!selectedShape;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      cat: selectedGift.cat,
      virtue: selectedGift.virtue,
      shape: selectedShape,
      comment: comment.trim() ? comment.trim() : null,
    });
  };

  const sendLabel = !selectedShape
    ? 'Pick a shape'
    : !selectedGift
      ? 'Pick a gift'
      : `Send ${selectedGift.virtue}`;

  const commentPlaceholder =
    selectedShape === 'gem'
      ? 'What do you see from this?'
      : selectedShape === 'sphere'
        ? 'Leave a few words of blessing…'
        : 'Say something back (optional)…';

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

        <View style={styles.heroGemWrap}>
          <Pressable
            onPress={() => setSelectedShape('gem')}
            style={[
              styles.shapeChoice,
              selectedShape === 'gem' && styles.shapeChoiceSel,
              selectedShape && selectedShape !== 'gem' && styles.shapeChoiceDim,
            ]}
            hitSlop={8}
          >
            <View style={styles.shapePair}>
              <View style={styles.heroTextCol}>
                <Text style={[styles.heroHeading, styles.heroAlignRight]}>
                  Witnessing
                </Text>
                <Text style={[styles.heroQuestion, styles.heroAlignRight]}>
                  What value do you see in this entry?
                </Text>
                <Text style={[styles.heroHint, styles.heroAlignRight]}>
                  Choose a diamond to send to the writer.
                </Text>
              </View>
              <Gem cat={pickerCat} size={72} spinning />
            </View>
          </Pressable>
          <Pressable
            onPress={() => setSelectedShape('sphere')}
            style={[
              styles.shapeChoice,
              selectedShape === 'sphere' && styles.shapeChoiceSel,
              selectedShape && selectedShape !== 'sphere' && styles.shapeChoiceDim,
            ]}
            hitSlop={8}
          >
            <View style={styles.shapePair}>
              <Sphere cat={pickerCat} size={86} spinning />
              <View style={styles.heroTextCol}>
                <Text style={styles.heroHeading}>Blessing</Text>
                <Text style={styles.heroQuestion}>
                  What blessing would you like to send?
                </Text>
                <Text style={styles.heroHint}>
                  Choose a stone to offer this writer a source of strength.
                </Text>
              </View>
            </View>
          </Pressable>
        </View>

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
          style={styles.virtueGrid}
          onLayout={(e) => setGridW(e.nativeEvent.layout.width)}
        >
          {gridW > 0 &&
            virtueList.map((virtue) => {
              const isSel =
                selectedGift && selectedGift.cat === pickerCat && selectedGift.virtue === virtue;
              const cellW = Math.floor(gridW / 3);
              return (
                <Pressable
                  key={virtue}
                  onPress={() => setSelectedGift({ cat: pickerCat, virtue })}
                  style={({ pressed }) => [
                    styles.virtueCell,
                    { width: cellW },
                    isSel && styles.virtueCellSel,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={styles.virtueCellText}>{virtue}</Text>
                </Pressable>
              );
            })}
        </View>

        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder={commentPlaceholder}
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
            <Text style={styles.sendText}>{sendLabel}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  title: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 4 },
  heroGemWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    marginBottom: 10,
  },
  shapeChoice: {
    flex: 1,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  shapeChoiceSel: {
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  shapeChoiceDim: {
    opacity: 0.3,
  },
  shapePair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroTextCol: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  heroHeading: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  heroQuestion: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    lineHeight: 13,
  },
  heroHint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 9,
    lineHeight: 12,
    marginTop: 2,
  },
  heroAlignRight: {
    textAlign: 'right',
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
  virtueGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  virtueCell: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 6,
  },
  virtueCellSel: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  virtueCellText: { color: '#fff', fontSize: 11 },
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
