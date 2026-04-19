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
import { ATTRIBUTES } from '../../theme';

const EMOTION_POOL = [
  'proud', 'relieved', 'warm', 'grateful', 'peaceful', 'present',
  'curious', 'anxious', 'hopeful', 'joyful', 'nostalgic',
  'accomplished', 'reflective', 'content', 'inspired', 'tender',
];

export default function DiaryWriter({ open, onClose, onSubmit }) {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(3);
  const [emotions, setEmotions] = useState([]);
  const [attribute, setAttribute] = useState(null);

  useEffect(() => {
    if (open) {
      setContent('');
      setMood(3);
      setEmotions([]);
      setAttribute(null);
    }
  }, [open]);

  const toggleEmotion = (e) => {
    setEmotions((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
    );
  };

  const catForUi = attribute || 'A';
  const tier = ATTRIBUTES[catForUi];

  const canSubmit = attribute && content.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      content: content.trim(),
      mood_score: mood,
      emotions,
      attribute,
    });
  };

  return (
    <Modal open={open} onClose={onClose} variant="sheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={20}
      >
        <Text style={styles.title}>New diary</Text>

        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="What's on your mind?"
          placeholderTextColor="rgba(255,255,255,0.4)"
          multiline
          style={styles.textInput}
        />

        <Text style={styles.sectionLabel}>Mood</Text>
        <View style={styles.moodRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              onPress={() => setMood(n)}
              hitSlop={6}
              style={({ pressed }) => [
                styles.moodDot,
                {
                  backgroundColor: n <= mood ? tier.mid : 'rgba(255,255,255,0.15)',
                  borderColor: n === mood ? tier.hi : 'transparent',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            />
          ))}
          <Text style={styles.moodLabel}>{mood}/5</Text>
        </View>

        <Text style={styles.sectionLabel}>Emotions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emotionRow}>
          {EMOTION_POOL.map((e) => {
            const active = emotions.includes(e);
            return (
              <Pressable
                key={e}
                onPress={() => toggleEmotion(e)}
                style={({ pressed }) => [
                  styles.emotionChip,
                  {
                    backgroundColor: active ? tier.mid : 'rgba(255,255,255,0.05)',
                    borderColor: active ? tier.hi : 'rgba(255,255,255,0.15)',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.emotionText,
                    { color: active ? '#fff' : 'rgba(255,255,255,0.75)' },
                  ]}
                >
                  {e}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionLabel}>Category *</Text>
        <View style={styles.catRow}>
          {['A', 'B', 'C', 'D'].map((k) => (
            <CategoryPill
              key={k}
              cat={k}
              active={attribute === k}
              onPress={() => setAttribute(k)}
            />
          ))}
        </View>

        <Pressable
          disabled={!canSubmit}
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.submitBtn,
            {
              backgroundColor: canSubmit ? '#6a60c4' : 'rgba(255,255,255,0.1)',
              opacity: !canSubmit ? 0.55 : pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={styles.submitText}>
            {canSubmit ? 'Save entry' : 'Pick a category to save'}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  title: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  textInput: {
    minHeight: 120,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600',
    marginTop: 14, marginBottom: 6,
  },
  moodRow: { flexDirection: 'row', alignItems: 'center' },
  moodDot: {
    width: 22, height: 22, borderRadius: 11, marginRight: 10,
    borderWidth: 2,
  },
  moodLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginLeft: 6 },
  emotionRow: { flexDirection: 'row' },
  emotionChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, marginRight: 8,
  },
  emotionText: { fontSize: 12 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap' },
  submitBtn: {
    marginTop: 18, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
