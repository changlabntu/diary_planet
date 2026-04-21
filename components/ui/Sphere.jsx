import React, { useEffect, useMemo } from 'react';
import Svg, { Polygon, G, Ellipse } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { ATTRIBUTES, lighten } from '../../theme';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

const LAT = 5;
const LON = 10;
const TAU = Math.PI * 2;
const RADIUS = 2.2;

function vertex(colat, lon) {
  return {
    x: Math.sin(colat) * Math.cos(lon) * RADIUS,
    y: -Math.cos(colat) * RADIUS,
    z: Math.sin(colat) * Math.sin(lon) * RADIUS,
  };
}

function buildFaces() {
  const faces = [];
  for (let i = 0; i < LAT; i++) {
    const ct = (i / LAT) * Math.PI;
    const cb = ((i + 1) / LAT) * Math.PI;
    const isTopHalf = i < LAT / 2;
    for (let j = 0; j < LON; j++) {
      const la = (j / LON) * TAU;
      const lb = ((j + 1) / LON) * TAU;

      const vTL = vertex(ct, la);
      const vTR = vertex(ct, lb);
      const vBR = vertex(cb, lb);
      const vBL = vertex(cb, la);

      let verts;
      if (i === 0) {
        verts = [vTL, vBR, vBL];
      } else if (i === LAT - 1) {
        verts = [vTL, vTR, vBR];
      } else {
        verts = [vTL, vTR, vBR, vBL];
      }
      faces.push({
        verts: verts.map((v) => [v.x, v.y, v.z]),
        isTopHalf,
      });
    }
  }
  return faces;
}

function SphereFace({ angle, verts, fill }) {
  const props = useAnimatedProps(() => {
    'worklet';
    const cos = Math.cos(angle.value);
    const sin = Math.sin(angle.value);
    let sumZ = 0;
    let str = '';
    for (let k = 0; k < verts.length; k++) {
      const vx = verts[k][0];
      const vy = verts[k][1];
      const vz = verts[k][2];
      const rx = vx * cos + vz * sin;
      const rz = -vx * sin + vz * cos;
      str += `${rx},${vy} `;
      sumZ += rz;
    }
    const avgZ = sumZ / verts.length;
    return {
      points: str.trim(),
      opacity: avgZ > 0 ? 1 : 0,
    };
  });
  return (
    <AnimatedPolygon
      animatedProps={props}
      fill={fill}
      stroke="rgba(255,255,255,0.2)"
      strokeWidth={0.08}
    />
  );
}

export default function Sphere({ cat = 'A', size = 86, angle: angleProp = 0, spinning = false }) {
  const tiers = ATTRIBUTES[cat] || ATTRIBUTES._;
  const hi = lighten(tiers.hi, 0.1);
  const mid = tiers.mid;

  const faces = useMemo(() => buildFaces(), []);
  const angle = useSharedValue(angleProp);

  useEffect(() => {
    if (spinning) {
      angle.value = 0;
      angle.value = withRepeat(
        withTiming(TAU, { duration: 5000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      angle.value = angleProp;
    }
  }, [spinning, angleProp]);

  const vb = 8;
  const height = size * 1.1;
  const shadowY = RADIUS + 0.4;

  return (
    <Svg width={size} height={height} viewBox={`-${vb / 2} -${vb / 2} ${vb} ${vb * 1.1}`}>
      <Ellipse cx={0} cy={shadowY} rx={RADIUS * 0.9} ry={0.22} fill="rgba(0,0,0,0.3)" />
      <G>
        {faces.map((f, k) => (
          <SphereFace
            key={k}
            angle={angle}
            verts={f.verts}
            fill={f.isTopHalf ? hi : mid}
          />
        ))}
      </G>
    </Svg>
  );
}
