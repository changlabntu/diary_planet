import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';

import Sky from './Sky';
import Planet from './Planet';
import Moon from './Moon';
import OrbitingBody from './OrbitingBody';
import PlanetMenu from './PlanetMenu';
import ModeToggle from './ModeToggle';
import CreatureAvatar from '../ui/CreatureAvatar';
import { BG, darken } from '../../theme';

const BOTTOM_PAD = 0;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.5;
const DRAG_DEAD_ZONE = 6;
const CREATURE_BASE = 114;
const PLANET_EDGE_PAD = 24;
const WORLD_SCALE = 3;
const COLLISION_DIST = 100;
const MAX_PULL = 200;
const LAUNCH_K = 0.05;
const LAUNCH_DURATION = 2000;
const LAUNCH_MAX_V = 2.0;
const SPACE_REACH = 1.10;
const SPACE_SPEED_MUL = 0.5;
const RETURN_SPEED = 0.1;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function planetGeom(W, H) {
  const cx = W / 2;
  const cy = H + 40 + H / 3;
  const r = W * 1.5;
  return { cx, cy, r, topY: cy - r };
}

function clampToPlanet(x, y, W, H, pad = PLANET_EDGE_PAD, maxMul = 1.0) {
  const { cx, cy, r } = planetGeom(W, H);
  const rMax = Math.max(10, r * maxMul - pad);
  const dx = x - cx;
  const dy = y - cy;
  const d = Math.hypot(dx, dy);
  if (d <= rMax) return { x, y, hitEdge: false };
  return { x: cx + (dx / d) * rMax, y: cy + (dy / d) * rMax, hitEdge: true };
}

function isInSpace(x, y, W, H) {
  const { cx, cy, r } = planetGeom(W, H);
  return Math.hypot(x - cx, y - cy) > r;
}

function makeState(creature, W, H, index) {
  const seed = (creature.id * 37 + index * 71) | 0;
  const sc = MIN_ZOOM;
  const halfW = W / (2 * sc);
  const halfH = H / (2 * sc);
  const xMin = W / 2 - halfW + 20;
  const xMax = W / 2 + halfW - 20;
  const { topY } = planetGeom(W, H);
  const baseYTop = Math.max(0, topY + 10);
  const yMin = Math.max(baseYTop, H / 2 - halfH);
  const yMax = H / 2 + halfH - BOTTOM_PAD;
  const rx = (Math.abs(seed) % 1000) / 1000;
  const ry = (Math.abs(seed * 53) % 1000) / 1000;
  let startX = xMin + rx * Math.max(1, xMax - xMin);
  let startY = yMin + ry * Math.max(1, yMax - yMin);
  const c = clampToPlanet(startX, startY, W, H);
  startX = clamp(c.x, xMin, xMax);
  startY = clamp(c.y, yMin, yMax);
  return {
    id: creature.id,
    x: startX,
    y: startY,
    vx: 0,
    vy: 0,
    targetX: startX,
    targetY: startY,
    timer: 0,
    facingRight: true,
    walkPhase: 0,
    depth: 0.3 + ((Math.abs(seed * 13) % 100) / 143),
    dragging: false,
    _pointerDown: false,
    _dropping: false,
    _dropTimer: 0,
    _dragStartX: 0,
    _dragStartY: 0,
    _launching: false,
    _launchTimer: 0,
    _returning: false,
    _anchorX: 0,
    _anchorY: 0,
  };
}

export default function PlanetScreen({ monsters, onSelectCreature, onOpenManager, mode = 'move', onModeChange }) {
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  const deployed = useMemo(() => monsters.filter((m) => m.is_displayed), [monsters]);

  const [size, setSize] = useState({ W: 0, H: 0 });
  const { W, H } = size;

  const statesRef = useRef([]);
  const [, setTick] = useState(0);

  const deployedRef = useRef(deployed);
  useEffect(() => { deployedRef.current = deployed; }, [deployed]);

  useEffect(() => {
    if (!W || !H) return;
    const existing = new Map(statesRef.current.map((s) => [s.id, s]));
    statesRef.current = deployed.map((c, i) => existing.get(c.id) || makeState(c, W, H, i));
  }, [deployed, W, H]);

  useEffect(() => {
    if (!W || !H) return;
    let raf;
    let last =
      typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    const { topY, r: planetR } = planetGeom(W, H);
    const baseYTop = Math.max(0, topY - planetR * (SPACE_REACH - 1) + 10);

    const step = (now) => {
      const dt = Math.min(now - last, 48);
      last = now;
      const states = statesRef.current;
      const sc = scale.value || 1;
      const halfW = W / (2 * sc);
      const halfH = H / (2 * sc);
      const xMin = W / 2 - halfW + 20;
      const xMax = W / 2 + halfW - 20;
      const yTop = Math.max(baseYTop, H / 2 - halfH);
      const yBot = H / 2 + halfH - BOTTOM_PAD;

      for (let i = 0; i < states.length; i++) {
        const s = states[i];
        if (s.dragging) {
          s.walkPhase += dt * 0.024;
          continue;
        }

        if (!s._returning && !s._launching && isInSpace(s.x, s.y, W, H)) {
          s._returning = true;
        }

        if (s._returning) {
          const pg = planetGeom(W, H);
          const dxc = pg.cx - s.x;
          const dyc = pg.cy - s.y;
          const dc = Math.hypot(dxc, dyc) || 1;
          if (dc <= pg.r) {
            s._returning = false;
            s.timer = 0;
          } else {
            s.vx = (dxc / dc) * RETURN_SPEED;
            s.vy = (dyc / dc) * RETURN_SPEED;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            s.walkPhase += dt * 0.008;
            if (Math.abs(s.vx) > 0.02) s.facingRight = s.vx > 0;
            continue;
          }
        }

        s.timer -= dt;
        if (s.timer <= 0) {
          const tx = xMin + Math.random() * Math.max(1, xMax - xMin);
          const ty = yTop + 10 + Math.random() * Math.max(1, yBot - yTop - 20);
          const cTarget = clampToPlanet(tx, ty, W, H, PLANET_EDGE_PAD);
          s.targetX = clamp(cTarget.x, xMin, xMax);
          s.targetY = clamp(cTarget.y, yTop + 10, yBot);
          s.timer = 2500 + Math.random() * 4000;
        }

        const dx = s.targetX - s.x;
        const dy = s.targetY - s.y;
        const depth = clamp((s.y - yTop) / Math.max(1, yBot - yTop), 0, 1);
        const factor = 0.3 + depth * 0.7;

        s.vx += dx * 0.0003 * dt;
        s.vy += dy * 0.0002 * dt;
        s.vx *= 0.9;
        s.vy *= 0.9;

        const baseMaxV = s._launching
          ? LAUNCH_MAX_V
          : s._dropping
            ? 0.25
            : 1 * factor;
        const inSpace = isInSpace(s.x, s.y, W, H);
        const maxV = inSpace ? baseMaxV * SPACE_SPEED_MUL : baseMaxV;
        s.vx = clamp(s.vx, -maxV, maxV);
        s.vy = clamp(s.vy, -maxV, maxV);

        s.x += s.vx * dt;
        s.y += s.vy * dt;

        const clamped = clampToPlanet(s.x, s.y, W, H, 0, SPACE_REACH);
        if (clamped.hitEdge) {
          s.x = clamped.x;
          s.y = clamped.y;
          s._returning = true;
          s._launching = false;
          s._launchTimer = 0;
          s.timer = 0;
        }
        if (s.x < xMin) { s.x = xMin; s.vx = Math.abs(s.vx) * 0.3; s.timer = 0; }
        if (s.x > xMax) { s.x = xMax; s.vx = -Math.abs(s.vx) * 0.3; s.timer = 0; }
        if (s.y < yTop + 10) { s.y = yTop + 10; s.vy = Math.abs(s.vy) * 0.3; }
        if (s.y > yBot) { s.y = yBot; s.vy = 0; }

        const speed = Math.hypot(s.vx, s.vy);
        if (speed > 0.015) s.walkPhase += dt * 0.008;
        if (Math.abs(s.vx) > 0.02) s.facingRight = s.vx > 0;

        if (s._dropping) {
          s._dropTimer += dt;
          if (s._dropTimer > 400) {
            s._dropping = false;
            s._dropTimer = 0;
          }
        }
        if (s._launching) {
          s._launchTimer += dt;
          if (s._launchTimer > LAUNCH_DURATION) {
            s._launching = false;
            s._launchTimer = 0;
          }
        }
      }

      for (let i = 0; i < states.length; i++) {
        for (let j = i + 1; j < states.length; j++) {
          const a = states[i];
          const b = states[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy);
          if (d === 0 || d >= COLLISION_DIST) continue;
          const overlap = COLLISION_DIST - d;
          const nx = dx / d;
          const ny = dy / d;
          if (a.dragging && b.dragging) continue;
          if (a.dragging) {
            b.x += nx * overlap;
            b.y += ny * overlap;
            b.vx += nx * 0.04;
            b.vy += ny * 0.04;
            b.timer = 0;
          } else if (b.dragging) {
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            a.vx -= nx * 0.04;
            a.vy -= ny * 0.04;
            a.timer = 0;
          } else {
            const half = overlap / 2;
            a.x -= nx * half;
            a.y -= ny * half;
            b.x += nx * half;
            b.y += ny * half;
            a.vx -= nx * 0.02;
            a.vy -= ny * 0.02;
            b.vx += nx * 0.02;
            b.vy += ny * 0.02;
          }
        }
      }

      setTick((t) => (t + 1) & 0xffff);
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [W, H]);

  const scale = useSharedValue(MIN_ZOOM);
  const savedScale = useSharedValue(MIN_ZOOM);

  const pinch = Gesture.Pinch()
    .onStart(() => {
      'worklet';
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      'worklet';
      const next = savedScale.value * e.scale;
      scale.value = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
    });

  const worldStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onWheel =
    Platform.OS === 'web'
      ? (e) => {
          const next = scale.value * (1 - e.deltaY * 0.0015);
          scale.value = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
        }
      : undefined;

  const { topY, r: planetR } = planetGeom(W || 1, H || 1);
  const yTop = Math.max(0, topY - planetR * (SPACE_REACH - 1) + 10);
  const yBot = H - BOTTOM_PAD;

  const onDragBegin = useCallback((id) => {
    const s = statesRef.current.find((x) => x.id === id);
    if (!s) return;
    s.vx = 0; s.vy = 0;
    s._pointerDown = true;
    s.dragging = false;
    s._dragStartX = s.x;
    s._dragStartY = s.y;
    s._anchorX = s.x;
    s._anchorY = s.y;
    s._launching = false;
    s._launchTimer = 0;
  }, []);

  const onDragUpdate = useCallback((id, tx, ty) => {
    const s = statesRef.current.find((x) => x.id === id);
    if (!s || !s._pointerDown) return;
    const sc = scale.value || 1;
    let wx = tx / sc;
    let wy = ty / sc;
    if (!s.dragging && Math.hypot(wx, wy) > DRAG_DEAD_ZONE) {
      s.dragging = true;
    }
    if (!s.dragging) return;

    if (modeRef.current === 'slingshot') {
      const mag = Math.hypot(wx, wy);
      if (mag > MAX_PULL) {
        wx = (wx / mag) * MAX_PULL;
        wy = (wy / mag) * MAX_PULL;
      }
      s.x = s._anchorX + wx;
      s.y = s._anchorY + wy;
      s.targetX = s.x;
      s.targetY = s.y;
      if (wx < -2) s.facingRight = true;
      else if (wx > 2) s.facingRight = false;
      return;
    }

    const halfW = W / (2 * sc);
    const halfH = H / (2 * sc);
    const xMinD = W / 2 - halfW + 20;
    const xMaxD = W / 2 + halfW - 20;
    const yMinD = Math.max(yTop + 10, H / 2 - halfH);
    const yMaxD = H / 2 + halfH - 6;
    let nx = clamp(s._dragStartX + wx, xMinD, xMaxD);
    let ny = clamp(s._dragStartY + wy, yMinD, yMaxD);
    const c = clampToPlanet(nx, ny, W, H, 0, SPACE_REACH);
    s.x = clamp(c.x, xMinD, xMaxD);
    s.y = clamp(c.y, yMinD, yMaxD);
    s.targetX = s.x; s.targetY = s.y;
    if (wx > 2) s.facingRight = true;
    else if (wx < -2) s.facingRight = false;
  }, [W, H, yBot, yTop, scale]);

  const onDragEnd = useCallback((id) => {
    const s = statesRef.current.find((x) => x.id === id);
    if (!s) return;
    const wasDragging = s.dragging;
    s.dragging = false;
    s._pointerDown = false;
    if (!wasDragging) {
      const c = deployedRef.current.find((m) => m.id === id);
      if (c && onSelectCreature) onSelectCreature(c);
      return;
    }
    if (modeRef.current === 'slingshot') {
      const dx = s._anchorX - s.x;
      const dy = s._anchorY - s.y;
      s.vx = dx * LAUNCH_K;
      s.vy = dy * LAUNCH_K;
      s.targetX = s.x + dx * 6;
      s.targetY = s.y + dy * 6;
      s._launching = true;
      s._launchTimer = 0;
      s.timer = 10000;
      return;
    }
    s.targetX = s.x;
    s.targetY = Math.min(yBot - 10, s.y + 22);
    s.vy = 0.22;
    s._dropping = true;
    s._dropTimer = 0;
    s.timer = 500;
  }, [onSelectCreature, yBot]);

  const makePanGesture = (id) =>
    Gesture.Pan()
      .maxPointers(1)
      .minDistance(0)
      .onBegin(() => {
        'worklet';
        runOnJS(onDragBegin)(id);
      })
      .onUpdate((e) => {
        'worklet';
        runOnJS(onDragUpdate)(id, e.translationX, e.translationY);
      })
      .onFinalize(() => {
        'worklet';
        runOnJS(onDragEnd)(id);
      });

  const states = statesRef.current;

  return (
    <View
      style={styles.container}
      onLayout={(e) =>
        setSize({ W: e.nativeEvent.layout.width, H: e.nativeEvent.layout.height })
      }
      onWheel={onWheel}
    >
      <GestureDetector gesture={pinch}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: -W,
              top: -H,
              width: W * WORLD_SCALE,
              height: H * WORLD_SCALE,
            },
            worldStyle,
          ]}
        >
          {W > 0 && H > 0 && (
            <>
              <Sky width={W * WORLD_SCALE} height={H * WORLD_SCALE} />
              {(() => {
                const planetCxWorld = (W * WORLD_SCALE) / 2;
                const planetCyWorld = (H * WORLD_SCALE - H) / 2 + H + 40 + H / 3;
                const ORBITS = [
                  {
                    key: 'moon',
                    Visual: Moon,
                    size: 150,
                    radius: W * 2.5,
                    rpm: 2.5,
                    phase: 0,
                    selfSpinRpm: 5,
                  },
                  {
                    key: 'bluemoon',
                    Visual: Moon,
                    visualProps: {
                      color: '#7AA8E0',
                      craterColor: 'rgba(40,80,140,0.35)',
                      glowColor: '#7AA8E0',
                    },
                    size: 75,
                    radius: W * 2,
                    rpm: 3,
                    phase: Math.PI,
                    selfSpinRpm: 15,
                  },
                ];
                return ORBITS.map(({ key, Visual, visualProps, size: vSize, radius, rpm, phase, selfSpinRpm }) => (
                  <OrbitingBody
                    key={key}
                    centerX={planetCxWorld}
                    centerY={planetCyWorld}
                    orbitRadius={radius}
                    rpm={rpm}
                    phase={phase}
                    selfSpinRpm={selfSpinRpm}
                    size={vSize}
                  >
                    <Visual size={vSize} {...visualProps} />
                  </OrbitingBody>
                ));
              })()}
              <Planet
                worldW={W * WORLD_SCALE}
                worldH={H * WORLD_SCALE}
                viewportW={W}
                viewportH={H}
              />
              <View
                style={{
                  position: 'absolute',
                  left: W,
                  top: H,
                  width: W,
                  height: H,
                }}
              >
                {(() => {
                  const pg = planetGeom(W, H);
                  const lightX = pg.cx - pg.r * 0.4;
                  const lightY = pg.cy - pg.r * 0.4;
                  return deployed.map((c) => {
                    const s = states.find((x) => x.id === c.id);
                    if (!s) return null;
                    const depth = clamp(
                      (s.y - yTop) / Math.max(1, yBot - yTop),
                      0,
                      1,
                    );
                    const sz = CREATURE_BASE * (0.45 + depth * 0.75);
                    const shadeDist = Math.hypot(s.x - lightX, s.y - lightY);
                    const shadeT = clamp(shadeDist / pg.r, 0, 1);
                    const darkAmt = shadeT * 0.45;
                    const shadedC = { ...c, color: darken(c.color, darkAmt), torsoColor: darken(c.torsoColor, darkAmt) };
                    const inSpace = Math.hypot(s.x - pg.cx, s.y - pg.cy) > pg.r;
                    return (
                      <CreaturePan
                        key={c.id}
                        id={c.id}
                        monster={shadedC}
                        s={s}
                        size={sz}
                        makeGesture={makePanGesture}
                        inSpace={inSpace}
                      />
                    );
                  });
                })()}
              </View>
            </>
          )}
        </Animated.View>
      </GestureDetector>
      <PlanetMenu
        onSelect={(key) => {
          if (key === 'monsters' && onOpenManager) onOpenManager();
        }}
      />
      <ModeToggle mode={mode} onChange={onModeChange} />
    </View>
  );
}

function CreaturePan({ id, monster, s, size, makeGesture, inSpace }) {
  const gesture = useMemo(() => makeGesture(id), [id]);
  return (
    <GestureDetector gesture={gesture}>
      <View
        style={[
          styles.creature,
          {
            left: s.x - size / 2,
            top: s.y - size,
            width: size,
            zIndex: Math.floor(s.y),
          },
        ]}
      >
        <CreatureAvatar
          color={monster.color}
          torsoColor={monster.torsoColor}
          size={size}
          facingRight={s.facingRight}
          showShadow={!inSpace}
          walkPhase={inSpace ? 0 : s.walkPhase}
          dragging={s.dragging}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG.DEEP, overflow: 'hidden' },
  creature: { position: 'absolute' },
});
