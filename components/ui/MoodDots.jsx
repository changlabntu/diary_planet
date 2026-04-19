import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ATTRIBUTES } from '../../theme';

export default function MoodDots({ mood = 0, cat, dotSize = 6 }) {
  const fill = (ATTRIBUTES[cat] || ATTRIBUTES._).mid;
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => (
        <View
          key={n}
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: n <= mood ? fill : 'rgba(255,255,255,0.15)',
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { marginRight: 3 },
});
