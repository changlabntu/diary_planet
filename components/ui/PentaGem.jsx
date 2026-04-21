import React, { useEffect } from 'react';
import Svg, { Polygon, G, Ellipse } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { ATTRIBUTES, lighten, darken } from '../../theme';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

const WAIST_COUNT = 6;
const TAU = Math.PI * 2;
const STEP = TAU / WAIST_COUNT;
const TABLE_Y = -1.2;
const GIRDLE_Y = 0;
const CULET_Y = 2.4;
const TABLE_R = 0.9;
const GIRDLE_R = 2.2;
const PITCH = 0.25;
const PITCH_COS = Math.cos(PITCH);
const PITCH_SIN = Math.sin(PITCH);

function CrownFace({ angle, faceIndex, fill }) {
  const props = useAnimatedProps(() => {
    'worklet';
    const ai = faceIndex * STEP + angle.value;
    const aj = (faceIndex + 1) * STEP + angle.value;

    const p1zr = Math.sin(ai) * TABLE_R;
    const p1x = Math.cos(ai) * TABLE_R;
    const p1y = TABLE_Y * PITCH_COS + p1zr * PITCH_SIN;
    const p1z = -TABLE_Y * PITCH_SIN + p1zr * PITCH_COS;

    const p2zr = Math.sin(aj) * TABLE_R;
    const p2x = Math.cos(aj) * TABLE_R;
    const p2y = TABLE_Y * PITCH_COS + p2zr * PITCH_SIN;
    const p2z = -TABLE_Y * PITCH_SIN + p2zr * PITCH_COS;

    const p3zr = Math.sin(aj) * GIRDLE_R;
    const p3x = Math.cos(aj) * GIRDLE_R;
    const p3y = p3zr * PITCH_SIN;
    const p3z = p3zr * PITCH_COS;

    const p4zr = Math.sin(ai) * GIRDLE_R;
    const p4x = Math.cos(ai) * GIRDLE_R;
    const p4y = p4zr * PITCH_SIN;
    const p4z = p4zr * PITCH_COS;

    const avgZ = (p1z + p2z + p3z + p4z) / 4;
    const points = `${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y}`;
    return { points, opacity: avgZ > 0 ? 1 : 0 };
  });

  return (
    <AnimatedPolygon
      animatedProps={props}
      fill={fill}
      stroke="rgba(255,255,255,0.2)"
      strokeWidth={0.15}
    />
  );
}

function PavilionFace({ angle, faceIndex, fill }) {
  const props = useAnimatedProps(() => {
    'worklet';
    const ai = faceIndex * STEP + angle.value;
    const aj = (faceIndex + 1) * STEP + angle.value;

    const p1zr = Math.sin(ai) * GIRDLE_R;
    const p1x = Math.cos(ai) * GIRDLE_R;
    const p1y = p1zr * PITCH_SIN;
    const p1z = p1zr * PITCH_COS;

    const p2zr = Math.sin(aj) * GIRDLE_R;
    const p2x = Math.cos(aj) * GIRDLE_R;
    const p2y = p2zr * PITCH_SIN;
    const p2z = p2zr * PITCH_COS;

    const p3x = 0;
    const p3y = CULET_Y * PITCH_COS;
    const p3z = -CULET_Y * PITCH_SIN;

    const avgZ = (p1z + p2z + p3z) / 3;
    const points = `${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y}`;
    return { points, opacity: avgZ > 0 ? 1 : 0 };
  });

  return (
    <AnimatedPolygon
      animatedProps={props}
      fill={fill}
      stroke="rgba(255,255,255,0.2)"
      strokeWidth={0.15}
    />
  );
}

function TableFace({ angle, fill }) {
  const props = useAnimatedProps(() => {
    'worklet';
    let s = '';
    for (let i = 0; i < WAIST_COUNT; i++) {
      const a = i * STEP + angle.value;
      const x = Math.cos(a) * TABLE_R;
      const zr = Math.sin(a) * TABLE_R;
      const y = TABLE_Y * PITCH_COS + zr * PITCH_SIN;
      s += `${x},${y} `;
    }
    return { points: s.trim() };
  });

  return (
    <AnimatedPolygon
      animatedProps={props}
      fill={fill}
      stroke="rgba(255,255,255,0.25)"
      strokeWidth={0.15}
    />
  );
}

export default function PentaGem({ cat = 'A', size = 72, spinning = false }) {
  const tiers = ATTRIBUTES[cat] || ATTRIBUTES._;
  const hi = lighten(tiers.hi, 0.1);
  const mid = tiers.mid;
  const lo = darken(tiers.lo, 0.05);
  const tableFill = lighten(tiers.hi, 0.22);

  const angle = useSharedValue(0);

  useEffect(() => {
    if (spinning) {
      angle.value = 0;
      angle.value = withRepeat(
        withTiming(TAU, { duration: 4000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      angle.value = 0;
    }
  }, [spinning]);

  const vb = 8;
  const height = size * 1.1;
  const shadowY = CULET_Y * PITCH_COS + 0.25;

  return (
    <Svg width={size} height={height} viewBox={`-${vb / 2} -${vb / 2} ${vb} ${vb * 1.1}`}>
      <Ellipse cx={0} cy={shadowY} rx={GIRDLE_R * 0.75} ry={0.22} fill="rgba(0,0,0,0.3)" />
      <G>
        {Array.from({ length: WAIST_COUNT }).map((_, i) => (
          <CrownFace key={`c${i}`} angle={angle} faceIndex={i} fill={i % 2 === 0 ? hi : mid} />
        ))}
        {Array.from({ length: WAIST_COUNT }).map((_, i) => (
          <PavilionFace key={`p${i}`} angle={angle} faceIndex={i} fill={i % 2 === 0 ? mid : lo} />
        ))}
        <TableFace angle={angle} fill={tableFill} />
      </G>
    </Svg>
  );
}
