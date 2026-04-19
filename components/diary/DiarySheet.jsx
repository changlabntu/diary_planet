import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';

import Modal from '../ui/Modal';
import CreatureAvatar from '../ui/CreatureAvatar';
import EggIcon from '../ui/EggIcon';
import Gem from '../ui/Gem';
import MoodDots from '../ui/MoodDots';
import EmotionTag from '../ui/EmotionTag';
import CategoryPill from '../ui/CategoryPill';
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
  onUpdateDiary,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedGem, setSelectedGem] = useState(null);
  const [pickerCat, setPickerCat] = useState(diary?.attribute || 'A');
  const [gridW, setGridW] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (open) {
      setPickerOpen(false);
      setSelectedGem(null);
      setPickerCat(diary?.attribute || 'A');
      setEditing(false);
      setDraft(diary?.content || '');
    }
  }, [open, diary?.id]);

  if (!diary) return null;

  const attrCat = diary.attribute;
  const attrStyle = badge(attrCat);
  const attrLabel = ATTRIBUTES[attrCat]?.label || '';
  const hatched = !!monster;

  const gemList = GEMS[pickerCat] || [];

  return (
    <Modal open={open} onClose={onClose} variant="sheet">
      <View style={styles.header}>
        {hatched ? (
          <View style={styles.headerRow}>
            <CreatureAvatar
              color={monster.color}
              torsoColor={monster.torsoColor}
              size={64}
              showShadow
            />
            <View style={styles.headerText}>
              <Text style={styles.name}>{monster.name}</Text>
              <Text style={styles.date}>{fmtDate(diary.created_at)}</Text>
              <View style={styles.pillRow}>
                <View style={[styles.pill, { backgroundColor: attrStyle.bg }]}>
                  <Text style={[styles.pillText, { color: attrStyle.color }]}>
                    {attrLabel}
                  </Text>
                </View>
                <View style={styles.gemPill}>
                  <Gem cat={attrCat} size={14} angle={0.6} />
                  <Text style={styles.gemText}>{monster.gem}</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.headerRow}>
            <EggIcon size={48} color={ATTRIBUTES[attrCat]?.hi || '#9DB9E8'} />
            <View style={styles.headerText}>
              <Text style={styles.name}>Unhatched egg</Text>
              <Text style={styles.date}>{fmtDate(diary.created_at)}</Text>
              <View style={styles.pillRow}>
                <View style={[styles.pill, { backgroundColor: attrStyle.bg }]}>
                  <Text style={[styles.pillText, { color: attrStyle.color }]}>
                    {attrLabel}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

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

      {editing ? (
        <View>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            multiline
            autoFocus
            placeholder="Write your thoughts..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={styles.bodyInput}
          />
          <View style={styles.editActions}>
            <Pressable
              onPress={() => {
                setDraft(diary.content || '');
                setEditing(false);
              }}
              style={({ pressed }) => [
                styles.editBtn,
                styles.editCancel,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.editCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (onUpdateDiary) onUpdateDiary(diary.id, { content: draft });
                setEditing(false);
              }}
              style={({ pressed }) => [
                styles.editBtn,
                styles.editSave,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.editSaveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => {
            setDraft(diary.content || '');
            setEditing(true);
          }}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <Text style={styles.body}>{diary.content}</Text>
        </Pressable>
      )}

      {hatched ? (
        monster.is_displayed ? (
          <Pressable
            onPress={() => {
              onRecall && onRecall(monster.id);
              onClose && onClose();
            }}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.recallBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.actionText}>Recall from planet</Text>
          </Pressable>
        ) : (
          <View style={[styles.actionBtn, styles.idlePill]}>
            <Text style={styles.idleText}>Currently idle</Text>
          </View>
        )
      ) : pickerOpen ? (
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
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerText: { marginLeft: 12, flex: 1 },
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
  emotionRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, marginBottom: 8 },
  moodRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 4, marginBottom: 10,
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
