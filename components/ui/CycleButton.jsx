import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function CycleButton({ value, options, onChange, style }) {
  const idx = Math.max(0, options.findIndex((o) => o.key === value));
  const current = options[idx] || options[0];

  const handlePress = () => {
    const next = options[(idx + 1) % options.length];
    onChange && onChange(next.key);
  };

  return (
    <View style={[styles.wrap, style]} pointerEvents="box-none">
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.pill, { opacity: pressed ? 0.85 : 1 }]}
        hitSlop={6}
      >
        <Text style={styles.label}>{current.label}</Text>
        <Text style={styles.glyph}>↻</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18,12,40,0.72)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  label: { color: '#fff', fontSize: 11, fontWeight: '600' },
  glyph: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
});
