import { View } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useMoonRotation, type ProjectedCrater } from './engine';

interface MoonCanvasProps {
  size?: number;
  width?: number;
  height?: number;
  moonRadius?: number;
  moonCenterX?: number;
  moonCenterY?: number;
  backgroundColor?: string;
}

export default function MoonCanvas({
  size,
  width: widthProp,
  height: heightProp,
  moonRadius: moonRadiusProp,
  moonCenterX: moonCenterXProp,
  moonCenterY: moonCenterYProp,
  backgroundColor = '#0A0A0F',
}: MoonCanvasProps) {
  const width = widthProp ?? size ?? 80;
  const height = heightProp ?? size ?? 80;
  const moonCenterX = moonCenterXProp ?? width / 2;
  const moonCenterY = moonCenterYProp ?? height / 2;
  const moonRadius =
    moonRadiusProp ?? Math.min(width, height) / 2 / 1.4;
  const { craters, onDragStart, onDragMove, onDragEnd } = useMoonRotation({
    centerX: moonCenterX,
    centerY: moonCenterY,
    moonRadius,
  });

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onStart(() => onDragStart())
    .onChange((e) => onDragMove(e.changeX, e.changeY))
    .onEnd(() => onDragEnd());

  const lightX = moonCenterX + moonRadius;
  const lightY = moonCenterY;
  const glowR = moonRadius * 1.4;
  const glowInnerStop = (moonRadius * 0.8) / glowR;

  return (
    <GestureDetector gesture={pan}>
      <View style={{ width, height }} collapsable={false}>
        <Svg width={width} height={height}>
          <Defs>
            <RadialGradient
              id="moonGlow"
              cx={moonCenterX}
              cy={moonCenterY}
              rx={glowR}
              ry={glowR}
              fx={moonCenterX}
              fy={moonCenterY}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset={glowInnerStop} stopColor="rgb(200,210,230)" stopOpacity="0.08" />
              <Stop offset="1" stopColor="rgb(200,210,230)" stopOpacity="0" />
            </RadialGradient>

            <RadialGradient
              id="moonSurface"
              cx={moonCenterX}
              cy={moonCenterY}
              rx={moonRadius}
              ry={moonRadius}
              fx={moonCenterX + moonRadius * 0.35}
              fy={moonCenterY - moonRadius * 0.1}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor="#E8E4D8" />
              <Stop offset="0.5" stopColor="#D4CFC0" />
              <Stop offset="1" stopColor="#A8A090" />
            </RadialGradient>

            <RadialGradient
              id="moonShadow"
              cx={moonCenterX}
              cy={moonCenterY}
              rx={moonRadius}
              ry={moonRadius}
              fx={moonCenterX + moonRadius * 0.85}
              fy={moonCenterY - moonRadius * 0.2}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor="rgb(10,10,15)" stopOpacity="0" />
              <Stop offset="0.5" stopColor="rgb(10,10,15)" stopOpacity="0.3" />
              <Stop offset="0.7" stopColor="rgb(10,10,15)" stopOpacity="0.5" />
              <Stop offset="1" stopColor="rgb(5,5,10)" stopOpacity="0.9" />
            </RadialGradient>

            <ClipPath id="moonClip">
              <Circle cx={moonCenterX} cy={moonCenterY} r={moonRadius} />
            </ClipPath>
          </Defs>

          {backgroundColor !== 'transparent' && (
            <Rect x={0} y={0} width={width} height={height} fill={backgroundColor} />
          )}

          <Circle cx={moonCenterX} cy={moonCenterY} r={glowR} fill="url(#moonGlow)" />

          <G clipPath="url(#moonClip)">
            <Circle
              cx={moonCenterX}
              cy={moonCenterY}
              r={moonRadius}
              fill="url(#moonSurface)"
            />
            {craters.map((c, i) => (
              <Crater key={i} crater={c} lightX={lightX} lightY={lightY} />
            ))}
            <Circle
              cx={moonCenterX}
              cy={moonCenterY}
              r={moonRadius}
              fill="url(#moonShadow)"
            />
          </G>

          <Circle
            cx={moonCenterX}
            cy={moonCenterY}
            r={moonRadius}
            fill="none"
            stroke="rgba(180,175,160,0.4)"
            strokeWidth={1}
          />
        </Svg>
      </View>
    </GestureDetector>
  );
}

function Crater({
  crater,
  lightX,
  lightY,
}: {
  crater: ProjectedCrater;
  lightX: number;
  lightY: number;
}) {
  const { screenX, screenY, radiusSquashed, radiusFull, radialAngle, facing } = crater;
  if (radiusSquashed < 0.5) return null;

  const toLightX = lightX - screenX;
  const toLightY = lightY - screenY;
  const len = Math.sqrt(toLightX * toLightX + toLightY * toLightY) || 1;
  const cosR = Math.cos(-radialAngle);
  const sinR = Math.sin(-radialAngle);
  const lx = (toLightX / len) * cosR - (toLightY / len) * sinR;
  const ly = (toLightX / len) * sinR + (toLightY / len) * cosR;

  const rx = radiusSquashed;
  const ry = radiusFull;
  const innerScale = 0.92;
  const offsetFrac = 0.095;
  const a = facing;
  const rotDeg = (radialAngle * 180) / Math.PI;
  const stroke = `rgba(128,128,128,${a})`;

  return (
    <G transform={`translate(${screenX}, ${screenY}) rotate(${rotDeg})`}>
      <Ellipse
        cx={0}
        cy={0}
        rx={rx}
        ry={ry}
        fill={`rgba(196,188,158,${0.5 * a})`}
        stroke={stroke}
        strokeWidth={1}
      />
      <Ellipse
        cx={lx * rx * offsetFrac}
        cy={ly * ry * offsetFrac}
        rx={rx * innerScale}
        ry={ry * innerScale}
        fill={`rgba(0,0,0,${0.5 * a})`}
        stroke={stroke}
        strokeWidth={1}
      />
      <Ellipse
        cx={-lx * rx * offsetFrac}
        cy={-ly * ry * offsetFrac}
        rx={rx * innerScale}
        ry={ry * innerScale}
        fill={`rgba(240,237,228,${0.5 * a})`}
        stroke={stroke}
        strokeWidth={1}
      />
    </G>
  );
}
