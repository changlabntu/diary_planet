import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';

import Modal from '../ui/Modal';
import EggIcon from '../ui/EggIcon';
import MoodDots from '../ui/MoodDots';
import EmotionTag from '../ui/EmotionTag';
import { ATTRIBUTES, DECIDE_BLUE, EGG_NAME, fmtDate, badge } from '../../theme';
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

export default function DiaryConversationSheet({
  open,
  onClose,
  diary,
  monster,
  onSave,
  onSendOut,
}) {
  if (!diary) return null;

  const attrStyle = badge('U');
  const attrLabel = ATTRIBUTES.U.label;
  const diaryCat = monster?.attribute || 'U';

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="sheet"
      backdropStyle={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
      sheetStyle={{ marginBottom: 56, paddingBottom: 6 }}
    >
      {open && (
        <View style={styles.walkerWrap}>
          <WalkingCreature size={144} flip />
          <Pressable
            style={({ hovered, pressed }) => [
              styles.bubble,
              hovered && styles.bubbleHover,
              pressed && { opacity: 0.9 },
            ]}
          >
            {({ hovered }) => (
              <>
                <View style={[styles.bubbleTail, hovered && styles.bubbleTailHover]} />
                <Text style={styles.bubbleText}>Want to talk about it?</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <EggIcon size={48} color={monster?.color || ATTRIBUTES.U.hi} />
          <View style={styles.headerText}>
            <Text style={styles.name}>{EGG_NAME}</Text>
            <Text style={styles.date}>{fmtDate(diary.created_at)}</Text>
            <View style={styles.pillRow}>
              <View style={[styles.pill, { backgroundColor: attrStyle.bg }]}>
                <Text style={[styles.pillText, { color: attrStyle.color }]}>
                  {attrLabel}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            {diary.emotions?.length > 0 && (
              <View style={styles.emotionRow}>
                {diary.emotions.map((e) => (
                  <EmotionTag key={e} label={e} cat={diaryCat} />
                ))}
              </View>
            )}
            <View style={styles.moodRow}>
              <Text style={styles.label}>Mood</Text>
              <MoodDots mood={diary.mood_score} cat={diaryCat} />
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyScrollContent}>
        <Text style={styles.body}>{diary.content}</Text>
      </ScrollView>

      <View style={styles.actionRow}>
        <Pressable
          onPress={onSave}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionBtnSecondary,
            styles.actionBtnLeft,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.actionText}>Keep as egg</Text>
        </Pressable>
        <Pressable
          onPress={onSendOut}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionBtnPrimary,
            styles.actionBtnRight,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.actionText}>Send out</Text>
        </Pressable>
      </View>
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
    borderWidth: 2,
    borderColor: 'transparent',
    flexShrink: 1,
    transitionProperty: 'background-color, border-color',
    transitionDuration: '150ms',
  },
  bubbleHover: {
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderColor: DECIDE_BLUE,
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
  bubbleTailHover: {
    borderRightColor: 'rgba(255,255,255,0.24)',
  },
  bubbleText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  header: { marginBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerText: { marginLeft: 12, flex: 1 },
  headerRight: {
    marginLeft: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 1,
  },
  name: { color: '#fff', fontSize: 17, fontWeight: '600' },
  date: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },
  pillRow: { flexDirection: 'row', marginTop: 6, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, marginRight: 6,
  },
  pillText: { fontSize: 11, fontWeight: '600' },
  emotionRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  moodRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  label: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginRight: 8, fontWeight: '600' },
  bodyScroll: { maxHeight: 180, marginBottom: 6 },
  bodyScrollContent: { paddingBottom: 4 },
  body: {
    color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 20,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  actionRow: { flexDirection: 'row', marginTop: 10 },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnLeft: {
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  actionBtnRight: {
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  actionBtnPrimary: { backgroundColor: '#6a60c4' },
  actionBtnSecondary: { backgroundColor: 'rgba(255,255,255,0.1)' },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
