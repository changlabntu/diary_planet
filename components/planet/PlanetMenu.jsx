import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

const MENU_ITEMS = [
  { key: 'monsters', label: 'Monsters' },
  { key: 'planet', label: 'Planet', disabled: true },
  { key: 'pokedex', label: 'Pokédex', disabled: true },
  { key: 'items', label: 'Items', disabled: true },
  { key: 'shop', label: 'Shop', disabled: true },
];

export default function PlanetMenu({ onSelect }) {
  const [open, setOpen] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, { duration: 180 });
  }, [open]);

  const topBar = useAnimatedStyle(() => ({
    transform: [
      { translateY: progress.value * 6 },
      { rotate: `${progress.value * 45}deg` },
    ],
  }));
  const midBar = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));
  const botBar = useAnimatedStyle(() => ({
    transform: [
      { translateY: -progress.value * 6 },
      { rotate: `${-progress.value * 45}deg` },
    ],
  }));

  const dropdownStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -6 }],
  }));

  const handlePick = (key) => {
    setOpen(false);
    onSelect && onSelect(key);
  };

  return (
    <>
      {open && (
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
      )}
      <View style={styles.wrap} pointerEvents="box-none">
        <Pressable
          onPress={() => setOpen((v) => !v)}
          style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.8 : 1 }]}
          hitSlop={6}
        >
          <Animated.View style={[styles.bar, topBar]} />
          <Animated.View style={[styles.bar, midBar]} />
          <Animated.View style={[styles.bar, botBar]} />
        </Pressable>
        {open && (
          <Animated.View style={[styles.dropdown, dropdownStyle]}>
            {MENU_ITEMS.map((m) => (
              <Pressable
                key={m.key}
                disabled={m.disabled}
                onPress={() => handlePick(m.key)}
                style={({ pressed }) => [
                  styles.item,
                  pressed && !m.disabled && styles.itemPressed,
                ]}
              >
                <Text
                  style={[
                    styles.itemText,
                    m.disabled && styles.itemDisabled,
                  ]}
                >
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </Animated.View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', top: 12, left: 14, zIndex: 50,
  },
  btn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(18,12,40,0.72)',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9,
  },
  bar: {
    width: 18, height: 2, borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    marginVertical: 2,
    position: 'absolute',
  },
  dropdown: {
    marginTop: 6,
    minWidth: 160,
    backgroundColor: 'rgba(12,6,32,0.93)',
    borderRadius: 12,
    paddingVertical: 4,
  },
  item: {
    paddingHorizontal: 14, paddingVertical: 10,
  },
  itemPressed: { backgroundColor: 'rgba(255,255,255,0.08)' },
  itemText: { color: 'rgba(255,255,255,0.92)', fontSize: 13 },
  itemDisabled: { color: 'rgba(255,255,255,0.35)' },
});
