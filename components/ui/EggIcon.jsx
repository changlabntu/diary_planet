import React from 'react';
import Svg, { Ellipse, G, Path } from 'react-native-svg';

export default function EggIcon({ size = 28, color = '#9DB9E8' }) {
  const w = size;
  const h = size * 1.22;
  return (
    <Svg width={w} height={h} viewBox="0 0 100 122">
      <Ellipse cx={52} cy={115} rx={26} ry={4} fill="rgba(0,0,0,0.2)" />
      <G>
        <Path
          d="M50 6 C22 6 12 58 12 80 C12 104 30 116 50 116 C70 116 88 104 88 80 C88 58 78 6 50 6 Z"
          fill={color}
        />
        <Ellipse cx={36} cy={46} rx={7} ry={4} fill="rgba(255,255,255,0.55)" />
        <Ellipse cx={64} cy={72} rx={5} ry={3} fill="rgba(255,255,255,0.28)" />
        <Ellipse cx={40} cy={90} rx={6} ry={3.5} fill="rgba(0,0,0,0.12)" />
        <Ellipse cx={68} cy={40} rx={5} ry={3} fill="rgba(0,0,0,0.1)" />
      </G>
    </Svg>
  );
}
