import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { ATTRIBUTES, pillActive, pillIdle } from '../../theme';

const DEFAULT_LABELS = {
  A: 'Self', B: 'Relation', C: 'Achieve', D: 'Meaning', all: 'All',
};

export default function CategoryPill({ cat, active, onPress, label }) {
  const key = cat === 'all' || cat == null ? 'A' : cat;
  const a = pillActive(key);
  const i = pillIdle(key);
  const styleActive = active;
  const bg = styleActive ? a.bg : i.bg;
  const color = styleActive ? a.color : i.color;
  const border = styleActive ? 'transparent' : i.border;
  const text = label || DEFAULT_LABELS[cat] || ATTRIBUTES[cat]?.label || '';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: bg, borderColor: border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[styles.text, { color }]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  text: { fontSize: 12, fontWeight: '600' },
});
