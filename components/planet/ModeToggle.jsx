import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

const MODES = [
  { key: 'move', label: 'Move' },
  { key: 'slingshot', label: 'Sling' },
];

export default function ModeToggle({ mode, onChange }) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.pill}>
        {MODES.map((m) => {
          const active = m.key === mode;
          return (
            <Pressable
              key={m.key}
              onPress={() => onChange(m.key)}
              style={({ pressed }) => [
                styles.tab,
                active && styles.tabActive,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.label, active && styles.labelActive]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 12,
    right: 14,
    zIndex: 50,
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(18,12,40,0.72)',
    borderRadius: 999,
    padding: 3,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },
  labelActive: { color: '#fff' },
});
