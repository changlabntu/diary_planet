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
import { ATTRIBUTES } from '../../theme';
import Creature1 from '../../assets/creature1.svg';

const WALK_FRAMES = 4;
const WALK_FRAME_MS = 160;

function WalkingCreature({ size = 72, flip = false }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % WALK_FRAMES);
    }, WALK_FRAME_MS);
    return () => clearInterval(id);
  }, []);
  return (
    <View
      style={{
        width: size,
        height: size,
        overflow: 'hidden',
        transform: flip ? [{ scaleX: -1 }] : undefined,
      }}
    >
      <View
        style={{
          width: size * WALK_FRAMES,
          height: size,
          transform: [{ translateX: -frame * size }],
        }}
      >
        <Creature1 width={size * WALK_FRAMES} height={size} />
      </View>
    </View>
  );
}

const EMOTION_POOL = [
  'proud', 'relieved', 'warm', 'grateful', 'peaceful', 'present',
  'curious', 'anxious', 'hopeful', 'joyful', 'nostalgic',
  'accomplished', 'reflective', 'content', 'inspired', 'tender',
];

export default function DiaryWriter({ open, onClose, onSubmit }) {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(3);
  const [emotions, setEmotions] = useState([]);

  useEffect(() => {
    if (open) {
      setContent('');
      setMood(3);
      setEmotions([]);
    }
  }, [open]);

  const toggleEmotion = (e) => {
    setEmotions((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
    );
  };

  const tier = ATTRIBUTES.U;

  const canSubmit = content.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      content: content.trim(),
      mood_score: mood,
      emotions,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="sheet"
      sheetStyle={{ backgroundColor: 'rgba(14,7,38,0.95)' }}
      backdropStyle={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={20}
      >
        {open && (
          <View style={styles.walkerWrap}>
            <WalkingCreature size={144} flip />
            <View style={styles.bubble}>
              <View style={styles.bubbleTail} />
              <Text style={styles.bubbleText}>What's on your mind?</Text>
            </View>
          </View>
        )}

        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Today, I..."
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
            {canSubmit ? 'Create my diary' : 'Write something to save'}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  walkerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -16,
    marginBottom: 8,
  },
  bubble: {
    marginLeft: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.14)',
    flexShrink: 1,
  },
  bubbleTail: {
    position: 'absolute',
    left: -10,
    top: '50%',
    marginTop: -5,
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderRightWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'rgba(255,255,255,0.14)',
  },
  bubbleText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  textInput: {
    minHeight: 240,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: 14,
    textAlignVertical: 'top',
    borderWidth: 0,
    outlineStyle: 'none',
    outlineWidth: 0,
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
  submitBtn: {
    marginTop: 18, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
