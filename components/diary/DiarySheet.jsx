import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import Modal from '../ui/Modal';
import CreatureAvatar from '../ui/CreatureAvatar';
import EggIcon from '../ui/EggIcon';
import Gem from '../ui/Gem';
import MoodDots from '../ui/MoodDots';
import EmotionTag from '../ui/EmotionTag';
import {
  ATTRIBUTES,
  EGG_NAME,
  fmtDate,
  badge,
} from '../../theme';

function SpaceshipIcon({ size = 22, color = '#fff' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2 C14 2 15 6 15 10 L15 17 L9 17 L9 10 C9 6 10 2 12 2 Z"
        fill={color}
      />
      <Path
        d="M9 14 L5 20 L9 18 Z M15 14 L19 20 L15 18 Z M10 17 L12 21 L14 17 Z"
        fill={color}
      />
      <Circle cx="12" cy="9" r="1.6" fill="#3a6fa0" />
    </Svg>
  );
}

export default function DiarySheet({
  open,
  onClose,
  diary,
  monster,
  onSendOut,
  onHatch,
  onRecall,
  source = 'planet',
}) {
  const [rightH, setRightH] = React.useState(0);

  if (!diary) return null;

  const state = monster?.state || 'egg';
  const hatched = state === 'hatched';
  // Until hatch, the author must not see the incoming attribute — eggs look neutral.
  const attrCat = hatched ? monster.attribute : 'U';
  const attrStyle = badge(attrCat);
  const attrLabel = ATTRIBUTES[attrCat]?.label || '';
  const diaryCat = hatched ? monster.attribute : 'U';

  return (
    <>
      {open && source === 'planet' && (
        <View style={styles.topTextOverlay} pointerEvents="none">
          <Text style={styles.topDate}>{fmtDate(diary.created_at)}</Text>
          <Text style={styles.topText}>{diary.content}</Text>
        </View>
      )}
      <Modal
        open={open}
        onClose={onClose}
        variant="sheet"
        backdropStyle={{ backgroundColor: 'transparent' }}
        sheetStyle={{ marginBottom: 56, paddingBottom: 6 }}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {hatched ? (
              <CreatureAvatar
                color={monster.color}
                torsoColor={monster.torsoColor}
                size={64}
                showShadow
              />
            ) : (
              <EggIcon
                size={48}
                color={ATTRIBUTES.U.hi}
                pending={state === 'sent'}
                ready={state === 'replied'}
              />
            )}
            <View style={styles.headerText}>
              <Text style={styles.name}>{hatched ? monster.name : EGG_NAME}</Text>
              <Text style={styles.date}>{fmtDate(diary.created_at)}</Text>
              <View style={styles.pillRow}>
                <View style={[styles.pill, { backgroundColor: attrStyle.bg }]}>
                  <Text style={[styles.pillText, { color: attrStyle.color }]}>
                    {attrLabel}
                  </Text>
                </View>
                {hatched && (
                  <View style={styles.gemPill}>
                    <Gem cat={attrCat} size={14} angle={0.6} />
                    <Text style={styles.gemText}>{monster.gem}</Text>
                  </View>
                )}
              </View>
            </View>
            {hatched && rightH > 0 && (
              <Pressable
                onPress={
                  monster.is_displayed
                    ? () => {
                        onRecall && onRecall(monster.id);
                        onClose && onClose();
                      }
                    : undefined
                }
                disabled={!monster.is_displayed}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.recallIconBtn,
                  { width: rightH, height: rightH },
                  !monster.is_displayed && styles.recallIconBtnIdle,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <SpaceshipIcon size={Math.max(16, rightH - 10)} color="#fff" />
              </Pressable>
            )}
            <View
              style={styles.headerRight}
              onLayout={(e) => setRightH(e.nativeEvent.layout.height)}
            >
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

        {source === 'calendar' && diary.content ? (
          <Text style={styles.body}>{diary.content}</Text>
        ) : null}

        {hatched && monster.reply_comment ? (
          <View style={styles.commentBox}>
            <Text style={styles.commentLabel}>From the reader</Text>
            <Text style={styles.commentText}>{monster.reply_comment}</Text>
          </View>
        ) : null}

        {state === 'egg' && (
          <Pressable
            onPress={() => onSendOut && onSendOut(diary.id)}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.sendBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.actionText}>Send out</Text>
          </Pressable>
        )}

        {state === 'sent' && (
          <View style={styles.waitingBox}>
            <Text style={styles.waitingText}>
              Waiting for a response from the universe…
            </Text>
          </View>
        )}

        {state === 'replied' && (
          <Pressable
            onPress={() => onHatch && onHatch(diary.id)}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.hatchBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.actionText}>Someone replied: hatch to see it.</Text>
          </Pressable>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  topTextOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '33%',
    paddingHorizontal: 24,
    paddingTop: 72,
    zIndex: 60,
  },
  topDate: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  topText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
  recallIconBtn: {
    borderRadius: 8,
    backgroundColor: '#3a6fa0',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  recallIconBtnIdle: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  name: { color: '#fff', fontSize: 17, fontWeight: '600' },
  date: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },
  pillRow: { flexDirection: 'row', marginTop: 6, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, marginRight: 6,
  },
  pillText: { fontSize: 11, fontWeight: '600' },
  gemPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  gemText: { color: '#fff', fontSize: 11, marginLeft: 4 },
  emotionRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  moodRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 2,
  },
  label: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginRight: 8, fontWeight: '600' },
  body: {
    color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 20,
    marginBottom: 16,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  commentBox: {
    backgroundColor: 'rgba(106,96,196,0.12)',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    marginBottom: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#6a60c4',
  },
  commentLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  commentText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  waitingBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  waitingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontStyle: 'italic',
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  sendBtn: { backgroundColor: '#3a6fa0' },
  hatchBtn: { backgroundColor: '#6a60c4' },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
