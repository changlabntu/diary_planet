import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Ellipse, Circle, ClipPath, G } from 'react-native-svg';
import WoodTexture from '../../assets/texture/wood-line-texture-dawing-4-1.svg';

export default function Planet({ worldW, worldH, viewportW, viewportH }) {
  if (!worldW || !worldH || !viewportW || !viewportH) return null;

  const offsetX = (worldW - viewportW) / 2;
  const offsetY = (worldH - viewportH) / 2;

  const cx = worldW / 2;
  const cy = offsetY + viewportH + 40 + viewportH / 3;
  const r = viewportW * 1.5;

  const texScale = 1;
  const baseTexSize = r * 2.2;
  const texSize = baseTexSize * texScale;
  const centeringShift = (baseTexSize * (texScale - 1)) / 2;
  const texOffsetX = -viewportW * 0.15 - centeringShift;
  const texOffsetY = -viewportW * 0.15 - centeringShift;

  const craters = [
    { cx: cx - viewportW * 0.22, cy: offsetY + viewportH - 72, r: 14, fill: 'rgba(60,52,137,0.6)' },
    { cx: cx + viewportW * 0.18, cy: offsetY + viewportH - 40, r: 9,  fill: 'rgba(60,52,137,0.5)' },
    { cx: cx + viewportW * 0.05, cy: offsetY + viewportH - 120, r: 6, fill: 'rgba(60,52,137,0.5)' },
  ];

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      <Svg width={worldW} height={worldH}>
        <Defs>
          <RadialGradient id="planetGrad" cx="30%" cy="30%" rx="70%" ry="70%">
            <Stop offset="0" stopColor="#7F77DD" />
            <Stop offset="0.55" stopColor="#3C3489" />
            <Stop offset="1" stopColor="#1A0F38" />
          </RadialGradient>
          <ClipPath id="planetClip">
            <Ellipse cx={cx} cy={cy} rx={r} ry={r} />
          </ClipPath>
        </Defs>

        <Ellipse
          cx={cx} cy={cy} rx={r} ry={r}
          fill="url(#planetGrad)"
        />

        <G clipPath="url(#planetClip)" opacity={0.35}>
          <WoodTexture
            x={cx - r + texOffsetX}
            y={cy - r + texOffsetY}
            width={texSize}
            height={texSize}
            preserveAspectRatio="xMidYMid slice"
          />
        </G>

        <Ellipse
          cx={cx} cy={cy} rx={r} ry={r}
          fill="url(#planetGrad)"
          fillOpacity={0.55}
          stroke="#111" strokeWidth={2}
        />

        {craters.map((c, i) => (
          <Circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill={c.fill} />
        ))}
      </Svg>
    </View>
  );
}
