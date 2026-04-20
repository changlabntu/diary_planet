import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import Modal from '../ui/Modal';
import CreatureAvatar from '../ui/CreatureAvatar';
import EggIcon from '../ui/EggIcon';
import Gem from '../ui/Gem';
import MoodDots from '../ui/MoodDots';
import EmotionTag from '../ui/EmotionTag';
import CategoryPill from '../ui/CategoryPill';

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
import {
  ATTRIBUTES,
  GEMS,
  fmtDate,
  badge,
  pillActive,
} from '../../theme';

export default function DiarySheet({
  open,
  onClose,
  diary,
  monster,
  onHatch,
  onRecall,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedGem, setSelectedGem] = useState(null);
  const [pickerCat, setPickerCat] = useState(diary?.attribute || 'A');
  const [gridW, setGridW] = useState(0);
  const [rightH, setRightH] = useState(0);

  useEffect(() => {
    if (open) {
      setPickerOpen(false);
      setSelectedGem(null);
      setPickerCat(diary?.attribute || 'A');
    }
  }, [open, diary?.id]);

  if (!diary) return null;

  const attrCat = diary.attribute;
  const attrStyle = badge(attrCat);
  const attrLabel = ATTRIBUTES[attrCat]?.label || '';
  const hatched = !!monster;

  const gemList = GEMS[pickerCat] || [];

  return (
    <>
      {open && (
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
            <EggIcon size={48} color={ATTRIBUTES[attrCat]?.hi || '#9DB9E8'} />
          )}
          <View style={styles.headerText}>
            <Text style={styles.name}>{hatched ? monster.name : 'Unhatched egg'}</Text>
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
                  <EmotionTag key={e} label={e} cat={attrCat} />
                ))}
              </View>
            )}
            <View style={styles.moodRow}>
              <Text style={styles.label}>Mood</Text>
              <MoodDots mood={diary.mood_score} cat={attrCat} />
            </View>
          </View>
        </View>
      </View>

      {hatched ? null : pickerOpen ? (
        <View>
          <Text style={styles.label}>Pick a gem</Text>
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
                    <Gem cat={pickerCat} size={34} angle={0.5 + idx * 0.07} />
                    <Text style={styles.gemCellText}>{g}</Text>
                  </Pressable>
                );
              })}
          </View>
          <Pressable
            disabled={!selectedGem}
            onPress={() => {
              if (!selectedGem) return;
              onHatch && onHatch(diary.id, selectedGem);
              onClose && onClose();
            }}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.hatchBtn,
              { opacity: !selectedGem ? 0.5 : pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.actionText}>
              {selectedGem ? `Hatch with ${selectedGem.value}` : 'Pick a gem'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.hatchBtn,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.actionText}>Choose a gem</Text>
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
  bodyInput: {
    color: '#fff', fontSize: 14, lineHeight: 20,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row', justifyContent: 'flex-end',
    marginTop: 8, marginBottom: 8,
  },
  editBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 8, marginLeft: 8,
  },
  editCancel: { backgroundColor: 'rgba(255,255,255,0.08)' },
  editSave: { backgroundColor: '#6a60c4' },
  editCancelText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  editSaveText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, marginBottom: 10 },
  gemGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
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
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  hatchBtn: { backgroundColor: '#6a60c4' },
  recallBtn: { backgroundColor: '#3a6fa0' },
  idlePill: { backgroundColor: 'rgba(255,255,255,0.08)' },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  idleText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
});
