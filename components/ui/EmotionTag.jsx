import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ATTRIBUTES } from '../../theme';

export default function EmotionTag({ label, cat }) {
  const tiers = ATTRIBUTES[cat] || ATTRIBUTES._;
  return (
    <View style={[styles.tag, { borderColor: tiers.mid }]}>
      <Text style={[styles.text, { color: tiers.hi }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginRight: 6,
    marginBottom: 4,
  },
  text: { fontSize: 11 },
});
