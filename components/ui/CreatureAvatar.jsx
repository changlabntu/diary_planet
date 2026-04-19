import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Ellipse, Circle, Path, G, Defs, RadialGradient, Stop } from 'react-native-svg';

const DOME_PATH =
  'M 12 70 A 68 68 0 0 1 148 70 L 148 83.6 A 54.4 54.4 0 0 1 93.6 138 L 66.4 138 A 54.4 54.4 0 0 1 12 83.6 Z';

export default function CreatureAvatar({
  color = '#CECBF6',
  torsoColor = '#7F77DD',
  size = 56,
  name,
  facingRight = true,
  showShadow = false,
  walkPhase = 0,
  dragging = false,
}) {
  const vbW = 160;
  const vbH = 220;
  const w = size;
  const h = size * (vbH / vbW);
  const transform = facingRight ? '' : `translate(${vbW}, 0) scale(-1, 1)`;

  const legAmp = 6;
  const legBaseY = 142;
  const leftCy = legBaseY + Math.sin(walkPhase) * legAmp;
  const rightCy = legBaseY - Math.sin(walkPhase) * legAmp;

  const shadowCy = dragging ? 190 : 165;
  const shadowRx = dragging ? 60 : 80;
  const shadowRy = dragging ? 16 : 24;
  const shadowOpacity = dragging ? 0.75 : 1;

  return (
    <View style={styles.wrap}>
      <Svg width={w} height={h} viewBox={`0 0 ${vbW} ${vbH}`}>
        <Defs>
          <RadialGradient id="shadowGrad" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor="#000" stopOpacity="0.38" />
            <Stop offset="0.45" stopColor="#000" stopOpacity="0.18" />
            <Stop offset="1" stopColor="#000" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <G transform={transform}>
          {showShadow && (
            <Ellipse
              cx={80}
              cy={shadowCy}
              rx={shadowRx}
              ry={shadowRy}
              fill="url(#shadowGrad)"
              opacity={shadowOpacity}
            />
          )}
          <Circle
            cx={56} cy={leftCy} r={10}
            fill={torsoColor}
            stroke="#111" strokeWidth={2}
          />
          <Circle
            cx={104} cy={rightCy} r={10}
            fill={torsoColor}
            stroke="#111" strokeWidth={2}
          />
          <Path
            d={DOME_PATH}
            fill={color}
            stroke="#111" strokeWidth={2.5}
            strokeLinejoin="round"
          />
          <Circle cx={60} cy={58} r={10} fill="#fff" />
          <Circle cx={60} cy={58} r={5} fill="#111" />
          <Circle cx={100} cy={58} r={10} fill="#fff" />
          <Circle cx={100} cy={58} r={5} fill="#111" />
        </G>
      </Svg>
      {name && <Text style={styles.name}>{name}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  name: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2 },
});
