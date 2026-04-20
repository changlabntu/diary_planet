import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
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
import ChordToggle from './ChordToggle';
import PeerPortal from './PeerPortal';
import CreatureAvatar from '../ui/CreatureAvatar';
import MoonCanvas from '../../assets/MoonCanvas';
import { CHIME_NOTES_MAJOR, CHIME_NOTES_MINOR, SECRET_SONG, playChime } from '../../assets/chimeSynth';
import { BG, darken } from '../../theme';

const BOTTOM_PAD = 0;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.5;
const DRAG_DEAD_ZONE = 6;
const CREATURE_BASE = 100;
const PLANET_EDGE_PAD = 24;
const WORLD_SCALE = 3;
const COLLISION_DIST = 100;
const MAX_PULL = 200;
const LAUNCH_K = 0.4;
const LAUNCH_DURATION = 3000;
const LAUNCH_MAX_V = 5.0;

// Physics tuning
const WANDER_SEEK_X = 0.0001;       // horizontal seek strength (per ms)
const WANDER_SEEK_Y = 0.0001;       // vertical seek strength (per ms)
const WANDER_FRICTION = 0.9;        // per-frame velocity damping during wander
const LAUNCH_FRICTION = 0.999;      // per-frame velocity damping during launch
const WANDER_MAX_V = 0.06;          // base max velocity during wander
const DROP_MAX_V = 0.25;            // max velocity during post-drag settle
const DROP_DURATION = 400;          // ms that _dropping physics apply
const WANDER_TIMER_MIN = 2500;      // ms
const WANDER_TIMER_RANDOM = 4000;   // ms (added on top of MIN)
const LAUNCH_TARGET_LOCK = LAUNCH_DURATION;
const DROP_TARGET_LOCK = 500;       // ms before wander resumes after a drop
const SPACE_RADIUS = 1.1;

// Boundary: flat walls on left/right/bottom, circular top from planet.
const WALL_PAD_X = 20;              // inset from viewport left/right
const WALL_PAD_BOTTOM = 6;          // inset from viewport bottom
const WALL_BOUNCE = 0.3;            // velocity retained after wall hit
const SPIN_DURATION_MIN = 1000;      // ms — fastest possible hit-spin
const SPIN_DURATION_MAX = 2000;      // ms — slowest possible hit-spin
const SONG_NOTE_INTERVAL = 280;      // ms between notes when auto-playing the secret song
const SECRET_MIN_INTERVAL = 200;     // ms — minimum gap between collision-driven secret notes

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function planetGeom(W, H) {
  const cx = W / 2;
  const cy = H + 40 + H / 3;
  const r = W * 1.5;
  return { cx, cy, r, topY: cy - r };
}

function isInSpace(x, y, W, H) {
  const { cx, cy, r } = planetGeom(W, H);
  return Math.hypot(x - cx, y - cy) > r;
}

// Upper arc of the planet (SPACE_RADIUS * radius, minus pad) — the ceiling.
function topCircleY(x, W, H, pad = PLANET_EDGE_PAD) {
  const { cx, cy, r } = planetGeom(W, H);
  const rMax = Math.max(10, r * SPACE_RADIUS - pad);
  const dx = x - cx;
  const inside = rMax * rMax - dx * dx;
  if (inside <= 0) {
    // x is outside the circle horizontally — ceiling is at the equator
    return cy;
  }
  return cy - Math.sqrt(inside); // upper arc
}

// Zoom-aware viewport edges. The world view is scaled by `sc` (shared value),
// so the visible edges in world coordinates expand as the user zooms out.
function viewportBounds(W, H, sc) {
  const halfW = W / (2 * sc);
  const halfH = H / (2 * sc);
  return {
    xMin: W / 2 - halfW + WALL_PAD_X,
    xMax: W / 2 + halfW - WALL_PAD_X,
    yMax: H / 2 + halfH - BOTTOM_PAD - WALL_PAD_BOTTOM,
  };
}

// Clamp a point into the fishbowl: flat left/right/bottom walls (zoom-aware),
// curved upper ceiling from the planet's top arc.
function clampToBounds(x, y, W, H, sc) {
  const { xMin, xMax, yMax } = viewportBounds(W, H, sc);
  const nx = clamp(x, xMin, xMax);
  const yCeil = topCircleY(nx, W, H);
  const yMin = yCeil;
  const ny = clamp(y, yMin, yMax);
  return {
    x: nx,
    y: ny,
    hitLeft: x < xMin,
    hitRight: x > xMax,
    hitTop: y < yMin,
    hitBottom: y > yMax,
  };
}

function makeState(creature, W, H, index) {
  const seed = (creature.id * 37 + index * 71) | 0;
  const { xMin, xMax, yMax } = viewportBounds(W, H, MIN_ZOOM);
  const rx = (Math.abs(seed) % 1000) / 1000;
  const ry = (Math.abs(seed * 53) % 1000) / 1000;
  const startX = xMin + rx * Math.max(1, xMax - xMin);
  const yCeil = topCircleY(startX, W, H);
  const startY = yCeil + 20 + ry * Math.max(1, yMax - yCeil - 40);
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
    _anchorX: 0,
    _anchorY: 0,
    spin: 0,              // 0..1 progress of current hit-spin
    spinDir: 1,           // +1 clockwise, -1 counterclockwise
    spinRemaining: 0,     // ms left in the current spin
    spinDuration: SPIN_DURATION_MIN, // ms total for the current spin
  };
}

function pickWanderTarget(W, H, sc) {
  const { xMin, xMax, yMax } = viewportBounds(W, H, sc);
  const tx = xMin + Math.random() * Math.max(1, xMax - xMin);
  const yCeil = topCircleY(tx, W, H);
  const ty = yCeil + 20 + Math.random() * Math.max(1, yMax - yCeil - 40);
  return { x: tx, y: ty };
}

export default function PlanetScreen({ monsters, onSelectCreature, onOpenManager, onMenuSelect, mode = 'slingshot', onModeChange }) {
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  const deployed = useMemo(() => monsters.filter((m) => m.state === 'hatched' && m.is_displayed), [monsters]);

  const [size, setSize] = useState({ W: 0, H: 0 });
  const { W, H } = size;

  const statesRef = useRef([]);
  const [, setTick] = useState(0);
  const collidingPairsRef = useRef(new Set());
  const [slingHits, setSlingHits] = useState(0);
  const [chord, setChord] = useState('major');
  const chordRef = useRef(chord);
  useEffect(() => { chordRef.current = chord; }, [chord]);
  const secretCursorRef = useRef(0);
  const secretLastPlayRef = useRef(0);
  useEffect(() => {
    if (chord === 'secret') {
      secretCursorRef.current = 0;
      secretLastPlayRef.current = 0;
    }
  }, [chord]);

  const songTimersRef = useRef([]);
  const playSecretSong = useCallback(() => {
    songTimersRef.current.forEach(clearTimeout);
    songTimersRef.current = SECRET_SONG.map((freq, i) =>
      setTimeout(() => playChime(freq), i * SONG_NOTE_INTERVAL),
    );
  }, []);
  useEffect(() => () => {
    songTimersRef.current.forEach(clearTimeout);
    songTimersRef.current = [];
  }, []);

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

    const step = (now) => {
      const dt = Math.min(now - last, 48);
      last = now;
      const states = statesRef.current;
      const sc = scale.value || 1;

      for (let i = 0; i < states.length; i++) {
        const s = states[i];
        if (s.dragging) {
          if (!isInSpace(s.x, s.y, W, H)) s.walkPhase += dt * 0.024;
          continue;
        }

        s.timer -= dt;
        if (s.timer <= 0) {
          const t = pickWanderTarget(W, H, sc);
          s.targetX = t.x;
          s.targetY = t.y;
          s.timer = WANDER_TIMER_MIN + Math.random() * WANDER_TIMER_RANDOM;
        }

        const dx = s.targetX - s.x;
        const dy = s.targetY - s.y;

        if (s._launching) {
          s.vx *= LAUNCH_FRICTION;
          s.vy *= LAUNCH_FRICTION;
        } else {
          s.vx += dx * WANDER_SEEK_X * dt;
          s.vy += dy * WANDER_SEEK_Y * dt;
          s.vx *= WANDER_FRICTION;
          s.vy *= WANDER_FRICTION;
        }

        const maxV = s._launching
          ? LAUNCH_MAX_V
          : s._dropping
            ? DROP_MAX_V
            : WANDER_MAX_V;
        s.vx = clamp(s.vx, -maxV, maxV);
        s.vy = clamp(s.vy, -maxV, maxV);

        s.x += s.vx * dt;
        s.y += s.vy * dt;

        // Fishbowl boundary: flat left/right/bottom + curved top.
        const b = clampToBounds(s.x, s.y, W, H, sc);
        if (b.hitLeft)   { s.x = b.x; s.vx = Math.abs(s.vx) * WALL_BOUNCE;  s.timer = 0; }
        if (b.hitRight)  { s.x = b.x; s.vx = -Math.abs(s.vx) * WALL_BOUNCE; s.timer = 0; }
        if (b.hitBottom) { s.y = b.y; s.vy = -Math.abs(s.vy) * WALL_BOUNCE; }
        if (b.hitTop)    {
          // Reflect off the curved ceiling along its outward normal.
          s.y = b.y;
          const pg = planetGeom(W, H);
          const nx = s.x - pg.cx;
          const ny = s.y - pg.cy;
          const nd = Math.hypot(nx, ny) || 1;
          const onx = nx / nd;   // outward-from-planet-center = away from ceiling-into-bowl
          const ony = ny / nd;
          const vDotN = s.vx * onx + s.vy * ony;
          if (vDotN < 0) {
            s.vx -= 2 * vDotN * onx;
            s.vy -= 2 * vDotN * ony;
            s.vx *= WALL_BOUNCE;
            s.vy *= WALL_BOUNCE;
          }
          s.timer = 0;
        }

        const speed = Math.hypot(s.vx, s.vy);
        if (speed > 0.015 && !isInSpace(s.x, s.y, W, H)) s.walkPhase += dt * 0.008;
        if (Math.abs(s.vx) > 0.02) s.facingRight = s.vx > 0;

        if (s._dropping) {
          s._dropTimer += dt;
          if (s._dropTimer > DROP_DURATION) {
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
        if (s.spinRemaining > 0) {
          s.spinRemaining = Math.max(0, s.spinRemaining - dt);
          s.spin = s.spinRemaining === 0 ? 0 : 1 - s.spinRemaining / s.spinDuration;
        }
      }

      // Creature-creature collision
      const pairs = collidingPairsRef.current;
      const seenKeys = new Set();
      let slingHitDelta = 0;
      for (let i = 0; i < states.length; i++) {
        for (let j = i + 1; j < states.length; j++) {
          const a = states[i];
          const b = states[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy);
          const key = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
          const colliding = d > 0 && d < COLLISION_DIST;
          if (colliding) {
            seenKeys.add(key);
            if (!pairs.has(key)) {
              pairs.add(key);
              if (a._launching || b._launching) {
                slingHitDelta += 1;
                const startSpin = (x) => {
                  const dur =
                    SPIN_DURATION_MIN +
                    Math.random() * (SPIN_DURATION_MAX - SPIN_DURATION_MIN);
                  x.spinDuration = dur;
                  x.spinRemaining = dur;
                  x.spin = 0;
                  x.spinDir = Math.random() < 0.5 ? -1 : 1;
                };
                const ring = (x) => {
                  const slot = states.indexOf(x);
                  if (slot < 0) return;
                  if (chordRef.current === 'secret') {
                    const nowMs =
                      typeof performance !== 'undefined' && performance.now
                        ? performance.now()
                        : Date.now();
                    if (nowMs - secretLastPlayRef.current < SECRET_MIN_INTERVAL) return;
                    secretLastPlayRef.current = nowMs;
                    const freq = SECRET_SONG[secretCursorRef.current % SECRET_SONG.length];
                    secretCursorRef.current =
                      (secretCursorRef.current + 1) % SECRET_SONG.length;
                    playChime(freq);
                    return;
                  }
                  const notes = chordRef.current === 'major' ? CHIME_NOTES_MAJOR : CHIME_NOTES_MINOR;
                  playChime(notes[slot % notes.length]);
                };
                if (a._launching && b._launching) {
                  startSpin(a); startSpin(b);
                  ring(a); ring(b);
                } else if (a._launching) {
                  startSpin(b);
                  ring(b);
                } else {
                  startSpin(a);
                  ring(a);
                }
              }
            }
          }
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

      for (const key of pairs) {
        if (!seenKeys.has(key)) pairs.delete(key);
      }
      if (slingHitDelta > 0) setSlingHits((n) => n + slingHitDelta);

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

  const { topY } = planetGeom(W || 1, H || 1);
  const yTop = Math.max(0, topY + 10);
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

    // Move mode: clamp into fishbowl.
    const nx = s._dragStartX + wx;
    const ny = s._dragStartY + wy;
    const c = clampToBounds(nx, ny, W, H, sc);
    s.x = c.x;
    s.y = c.y;
    s.targetX = s.x;
    s.targetY = s.y;
    if (wx > 2) s.facingRight = true;
    else if (wx < -2) s.facingRight = false;
  }, [W, H, scale]);

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
      s.timer = LAUNCH_TARGET_LOCK;
      return;
    }
    s.targetX = s.x;
    s.targetY = Math.min(yBot - 10, s.y + 22);
    s.vy = 0.22;
    s._dropping = true;
    s._dropTimer = 0;
    s.timer = DROP_TARGET_LOCK;
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
                    visualProps: {
                      color: '#7AA8E0',
                      craterColor: 'rgba(40,80,140,0.35)',
                      glowColor: '#7AA8E0',
                    },
                    size: 250,
                    radius: W * 1.95,
                    rpm: 0.05,
                    phase: Math.PI / 8 * -2,
                    selfSpinRpm: 0.1,
                  },
                  {
                    key: 'bluemoon',
                    Visual: Moon,
                    visualProps: {
                      color: '#7AA8E0',
                      craterColor: 'rgba(40,80,140,0.35)',
                      glowColor: '#7AA8E0',
                    },
                    size: 150,
                    radius: W * 1.55,
                    rpm: 0.05,
                    phase: Math.PI / 8 * -1,
                    selfSpinRpm: 0.1,
                  },
                  {
                    key: 'cratermoon',
                    Visual: MoonCanvas,
                    visualProps: { backgroundColor: 'transparent' },
                    size: 10,
                    radius: W * 1.85,
                    rpm: 10,
                    phase: Math.PI / 8 * -1,
                    selfSpinRpm: 0,
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
                        showShadow={!inSpace}
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
          if (onMenuSelect) onMenuSelect(key);
          else if (key === 'monsters' && onOpenManager) onOpenManager();
        }}
      />
      <View style={styles.hitCounterWrap} pointerEvents="none">
        <View style={styles.hitCounterPill}>
          <Text style={styles.hitCounterText}>Hits {slingHits}</Text>
        </View>
      </View>
      <ModeToggle mode={mode} onChange={onModeChange} />
      <ChordToggle
        chord={chord}
        onChange={setChord}
        onReselect={(m) => { if (m === 'secret') playSecretSong(); }}
      />
      <PeerPortal onPress={() => onMenuSelect && onMenuSelect('reader')} />
    </View>
  );
}

function CreaturePan({ id, monster, s, size, makeGesture, showShadow = true, inSpace = false }) {
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
          showShadow={showShadow}
          walkPhase={s.walkPhase}
          dragging={s.dragging}
          inSpace={inSpace}
          rotation={s.spinRemaining > 0 ? s.spin * 360 * s.spinDir : 0}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG.DEEP, overflow: 'hidden' },
  creature: { position: 'absolute' },
  hitCounterWrap: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 45,
  },
  hitCounterPill: {
    backgroundColor: 'rgba(18,12,40,0.72)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  hitCounterText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});