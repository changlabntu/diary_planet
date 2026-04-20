import React from 'react';
import Svg, { Ellipse, G, Path, Circle } from 'react-native-svg';

export default function EggIcon({
  size = 28,
  color = '#9DB9E8',
  pending = false,
  ready = false,
}) {
  const w = size;
  const h = size * 1.22;
  const bodyOpacity = pending ? 0.35 : 1;
  const shadowOpacity = pending ? 0.08 : 0.2;
  return (
    <Svg width={w} height={h} viewBox="0 0 100 122">
      <Ellipse cx={52} cy={115} rx={26} ry={4} fill={`rgba(0,0,0,${shadowOpacity})`} />
      <G opacity={bodyOpacity}>
        <Path
          d="M50 6 C22 6 12 58 12 80 C12 104 30 116 50 116 C70 116 88 104 88 80 C88 58 78 6 50 6 Z"
          fill={color}
        />
        <Ellipse cx={36} cy={46} rx={7} ry={4} fill="rgba(255,255,255,0.55)" />
        <Ellipse cx={64} cy={72} rx={5} ry={3} fill="rgba(255,255,255,0.28)" />
        <Ellipse cx={40} cy={90} rx={6} ry={3.5} fill="rgba(0,0,0,0.12)" />
        <Ellipse cx={68} cy={40} rx={5} ry={3} fill="rgba(0,0,0,0.1)" />
      </G>
      {ready && (
        <G>
          <Circle cx={80} cy={20} r={14} fill="#FFFFFF" />
          <Circle cx={80} cy={20} r={6} fill="#6a60c4" />
        </G>
      )}
    </Svg>
  );
}
