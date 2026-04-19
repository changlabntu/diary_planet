import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

export default function Moon({
  size = 36,
  color = '#FAC775',
  craterColor = 'rgba(186,117,23,0.35)',
  glowColor,
}) {
  const glow = glowColor || color;
  const platformShadow = Platform.select({
    ios: {
      shadowColor: glow,
      shadowOpacity: 0.55,
      shadowRadius: 15,
      shadowOffset: { width: 0, height: 0 },
    },
    android: { elevation: 8 },
    web: {
      shadowColor: glow,
      shadowOpacity: 0.55,
      shadowRadius: 15,
      shadowOffset: { width: 0, height: 0 },
    },
  });

  return (
    <View
      style={[
        styles.moon,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        platformShadow,
      ]}
    >
      <View
        style={[
          styles.crater,
          {
            width: size * 0.22,
            height: size * 0.22,
            borderRadius: size * 0.11,
            top: size * 0.25,
            left: size * 0.28,
            backgroundColor: craterColor,
          },
        ]}
      />
      <View
        style={[
          styles.crater,
          {
            width: size * 0.14,
            height: size * 0.14,
            borderRadius: size * 0.07,
            top: size * 0.55,
            left: size * 0.55,
            backgroundColor: craterColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  moon: {
    borderWidth: 1.5,
    borderColor: '#111',
  },
  crater: {
    position: 'absolute',
  },
});
