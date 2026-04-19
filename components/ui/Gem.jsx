import React, { useEffect } from 'react';
import Svg, { Polygon, Ellipse, G } from 'react-native-svg';
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
const TWO_PI_OVER_6 = (2 * Math.PI) / 6;
const TOP_APEX_Y = -1.5;
const BOT_APEX_Y = 1.4;
const FACES_COUNT = WAIST_COUNT * 2;

function projectFace(angle, faceIndex, scale) {
  'worklet';
  const isTop = faceIndex < 6;
  const i = isTop ? faceIndex : faceIndex - 6;
  const j = (i + 1) % 6;
  const apexY = isTop ? -1.5 : 1.4;

  const ai = i * ((2 * Math.PI) / 6) + angle;
  const aj = j * ((2 * Math.PI) / 6) + angle;
  const wiX = Math.cos(ai);
  const wiZ = Math.sin(ai);
  const wjX = Math.cos(aj);
  const wjZ = Math.sin(aj);

  const p1x = 0;
  const p1y = apexY * scale;
  const p2x = wiX * scale;
  const p2y = 0;
  const p3x = wjX * scale;
  const p3y = 0;

  const cross = (p2x - p1x) * (p3y - p1y) - (p2y - p1y) * (p3x - p1x);
  const avgZ = (wiZ + wjZ) / 2;

  return { p1x, p1y, p2x, p2y, p3x, p3y, cross, avgZ };
}

function SpinningFace({ angle, faceIndex, scale, hi, mid, lo }) {
  const isTop = faceIndex < WAIST_COUNT;
  const props = useAnimatedProps(() => {
    'worklet';
    const f = projectFace(angle.value, faceIndex, scale);
    const front = isTop ? f.cross > 0 : f.cross < 0;
    const points = `${f.p1x},${f.p1y} ${f.p2x},${f.p2y} ${f.p3x},${f.p3y}`;
    return {
      points,
      opacity: front ? 1 : 0,
    };
  });

  const baseFill = isTop ? hi : mid;

  return (
    <AnimatedPolygon
      animatedProps={props}
      fill={baseFill}
      stroke="rgba(255,255,255,0.2)"
      strokeWidth={0.15}
    />
  );
}

function StaticFaces({ angle, scale, hi, mid }) {
  const visible = [];
  for (let k = 0; k < FACES_COUNT; k++) {
    const f = projectFace(angle, k, scale);
    const isTop = k < WAIST_COUNT;
    const front = isTop ? f.cross > 0 : f.cross < 0;
    if (!front) continue;
    visible.push({ ...f, faceIndex: k, isTop });
  }
  visible.sort((a, b) => a.avgZ - b.avgZ);

  return (
    <>
      {visible.map((f) => (
        <Polygon
          key={f.faceIndex}
          points={`${f.p1x},${f.p1y} ${f.p2x},${f.p2y} ${f.p3x},${f.p3y}`}
          fill={f.isTop ? hi : mid}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={0.15}
        />
      ))}
    </>
  );
}

export default function Gem({ cat = 'A', size = 30, angle = 0.5, spinning = false }) {
  const tiers = ATTRIBUTES[cat] || ATTRIBUTES._;
  const hi = lighten(tiers.hi, 0.1);
  const mid = tiers.mid;
  const lo = darken(tiers.lo, 0.1);

  const innerAngle = useSharedValue(angle);

  useEffect(() => {
    if (spinning) {
      innerAngle.value = 0;
      innerAngle.value = withRepeat(
        withTiming(Math.PI * 2, { duration: 4000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      innerAngle.value = angle;
    }
  }, [spinning, angle]);

  const vb = 8;
  const radius = 2.2;

  return (
    <Svg width={size} height={size * 1.1} viewBox={`-${vb / 2} -${vb / 2} ${vb} ${vb * 1.1}`}>
      <Ellipse cx={0} cy={BOT_APEX_Y * radius + 0.5} rx={radius * 0.9} ry={0.25} fill="rgba(0,0,0,0.3)" />
      <G>
        {spinning
          ? Array.from({ length: FACES_COUNT }).map((_, k) => (
              <SpinningFace
                key={k}
                angle={innerAngle}
                faceIndex={k}
                scale={radius}
                hi={hi}
                mid={mid}
                lo={lo}
              />
            ))
          : <StaticFaces angle={angle} scale={radius} hi={hi} mid={mid} />}
      </G>
    </Svg>
  );
}
