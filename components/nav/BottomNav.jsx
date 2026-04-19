import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BG } from '../../theme';

const TABS = [
  { key: 'planet',   label: 'Planet',   icon: '◎' },
  { key: 'calendar', label: 'Calendar', icon: '▦' },
  { key: 'write',    label: 'Write',    icon: '✎', center: true },
  { key: 'profile',  label: 'Profile',  icon: '○', disabled: true },
  { key: 'bag',      label: 'Bag',      icon: '◇', disabled: true },
];

export default function BottomNav({ navKey, onChange, onWritePress }) {
  return (
    <View style={styles.bar}>
      {TABS.map((t) => {
        const active = navKey === t.key;
        const disabled = t.disabled;

        if (t.center) {
          return (
            <Pressable
              key={t.key}
              onPress={onWritePress}
              style={({ pressed }) => [styles.item, { opacity: pressed ? 0.8 : 1 }]}
            >
              <View style={styles.writeCircle}>
                <Text style={styles.writeIcon}>{t.icon}</Text>
              </View>
              <Text style={[styles.label, styles.labelActive]}>{t.label}</Text>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={t.key}
            disabled={disabled}
            onPress={() => onChange(t.key)}
            style={({ pressed }) => [styles.item, { opacity: pressed ? 0.7 : 1 }]}
          >
            <View
              style={[
                styles.iconBubble,
                {
                  backgroundColor: active
                    ? 'rgba(74,127,168,1)'
                    : 'rgba(255,255,255,0.25)',
                  opacity: disabled ? 0.35 : active ? 1 : 0.55,
                },
              ]}
            >
              <Text style={styles.iconText}>{t.icon}</Text>
            </View>
            <Text
              style={[
                styles.label,
                active ? styles.labelActive : styles.labelIdle,
                disabled && styles.labelDisabled,
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: 56,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: BG.NAV,
    zIndex: 100,
  },
  item: { alignItems: 'center', flex: 1, paddingTop: 4 },
  iconBubble: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  iconText: { color: '#fff', fontSize: 12 },
  writeCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#3a6fa0',
    alignItems: 'center', justifyContent: 'center',
    marginTop: -4,
  },
  writeIcon: { color: '#fff', fontSize: 14 },
  label: { fontSize: 7, marginTop: 2 },
  labelActive: { color: 'rgba(255,255,255,0.85)' },
  labelIdle:   { color: 'rgba(255,255,255,0.55)' },
  labelDisabled: { color: 'rgba(255,255,255,0.35)' },
});
