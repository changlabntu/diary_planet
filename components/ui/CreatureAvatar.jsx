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
  inSpace = false,
  rotation = 0,
}) {
  const BODY_VBW = 160;
  const PAD_X = 60;
  const vbMinX = -PAD_X;
  const vbW = BODY_VBW + PAD_X * 2;
  const vbH = 220;
  const w = size * (vbW / BODY_VBW);
  const h = w * (vbH / vbW);
  const transform = facingRight ? '' : `translate(${BODY_VBW}, 0) scale(-1, 1)`;

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
      <Svg width={w} height={h} viewBox={`${vbMinX} 0 ${vbW} ${vbH}`}>
        <Defs>
          <RadialGradient id="shadowGrad" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor="#000" stopOpacity="0.38" />
            <Stop offset="0.45" stopColor="#000" stopOpacity="0.18" />
            <Stop offset="1" stopColor="#000" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="auraGrad" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor="#6EA8FF" stopOpacity="0.12" />
            <Stop offset="0.55" stopColor="#6EA8FF" stopOpacity="0.14" />
            <Stop offset="1" stopColor="#6EA8FF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <G transform={transform}>
          {inSpace && (
            <Ellipse
              cx={80}
              cy={95}
              rx={100}
              ry={105}
              fill="url(#auraGrad)"
            />
          )}
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
          <G transform={`rotate(${rotation} 80 100)`}>
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
            <Path
              d="M 74 78 L 86 78 L 80 86 Z"
              fill="#E89FAE"
              stroke="#111"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
            <Path
              d="M 80 86 Q 76 92 71 90 M 80 86 Q 84 92 89 90"
              fill="none"
              stroke="#111"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <Path
              d="M 20 82 L 65 84 M 20 92 L 65 90 M 140 82 L 95 84 M 140 92 L 95 90"
              fill="none"
              stroke="#111"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </G>
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
