import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { seededRand } from '../../theme';

const STAR_DENSITY = 18 / (375 * 800);
const STAR_COLOR = '#fffef8';

export default function Sky({ width, height }) {
  const stars = useMemo(() => {
    if (!width || !height) return [];
    const r = seededRand('sky-v1');
    const count = Math.round(STAR_DENSITY * width * height);
    return Array.from({ length: count }).map(() => ({
      x: r() * width,
      y: r() * height,
      s: 0.8 + r() * 3.5,
      o: 0.25 + r() * 0.75,
    }));
  }, [width, height]);

  if (!width || !height) return null;

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <LinearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0A0F2A" />
            <Stop offset="0.45" stopColor="#1A1040" />
            <Stop offset="0.75" stopColor="#3A2B5F" />
            <Stop offset="1" stopColor="#5B3A70" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#skyGrad)" />
      </Svg>
      {stars.map((p, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: p.x, top: p.y,
            width: p.s, height: p.s,
            borderRadius: p.s / 2,
            backgroundColor: STAR_COLOR,
            opacity: p.o,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0 },
});
