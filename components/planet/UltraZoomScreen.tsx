import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Planet from './Planet';
import Sky from './Sky';

const SKY_SCALE = 3;

type Props = {
  width: number;
  height: number;
  worldScale: number;
  initialScale: number;
  targetScale: number;
  onExit: () => void;
};

const ZOOM_DURATION = 2000;

export default function UltraZoomScreen({
  width,
  height,
  worldScale,
  initialScale,
  targetScale,
  onExit,
}: Props) {
  const scale = useSharedValue(initialScale);

  useEffect(() => {
    scale.value = withTiming(targetScale, {
      duration: ZOOM_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [scale, targetScale]);

  const worldStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const skyOpacityStyle = useAnimatedStyle(() => {
    'worklet';
    const range = initialScale - targetScale;
    const t = range > 0 ? (scale.value - targetScale) / range : 1;
    return { opacity: Math.max(0, Math.min(1, t)) };
  });

  const handleExit = () => {
    scale.value = withTiming(
      initialScale,
      { duration: ZOOM_DURATION, easing: Easing.in(Easing.cubic) },
      (finished) => {
        'worklet';
        if (finished) runOnJS(onExit)();
      },
    );
  };

  const worldW = width * worldScale;
  const worldH = height * worldScale;
  const worldLeft = (width * (1 - worldScale)) / 2;
  const worldTop = (height * (1 - worldScale)) / 2;

  const skyW = width * SKY_SCALE;
  const skyH = height * SKY_SCALE;
  const skyLeft = (worldW - skyW) / 2;
  const skyTop = (worldH - skyH) / 2;

  return (
    <View style={[styles.root, { width, height }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: worldLeft,
            top: worldTop,
            width: worldW,
            height: worldH,
          },
          worldStyle,
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: skyLeft,
              top: skyTop,
              width: skyW,
              height: skyH,
            },
            skyOpacityStyle,
          ]}
        >
          <Sky width={skyW} height={skyH} />
        </Animated.View>
        <Planet
          worldW={worldW}
          worldH={worldH}
          viewportW={width}
          viewportH={height}
        />
      </Animated.View>

      <View style={styles.backWrap} pointerEvents="box-none">
        <Pressable
          onPress={handleExit}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.85 : 1 }]}
          hitSlop={8}
        >
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: '#000',
    overflow: 'hidden',
    zIndex: 100,
  },
  backWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 28,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: 'rgba(18,12,40,0.72)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
