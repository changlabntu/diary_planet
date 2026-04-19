import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export default function OrbitingBody({
  centerX,
  centerY,
  orbitRadius,
  rpm = 1,
  phase = 0,
  selfSpinRpm = 0,
  size = 32,
  children,
}) {
  const startAngle = phase - Math.PI / 2;
  const angle = useSharedValue(startAngle);
  const spin = useSharedValue(0);

  useEffect(() => {
    const period = Math.max(1000, (60 / Math.max(0.0001, rpm)) * 1000);
    angle.value = startAngle;
    angle.value = withRepeat(
      withTiming(startAngle + Math.PI * 2, {
        duration: period,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [rpm, phase]);

  useEffect(() => {
    if (!selfSpinRpm) {
      spin.value = 0;
      return;
    }
    const period = Math.max(1000, (60 / Math.abs(selfSpinRpm)) * 1000);
    const sign = selfSpinRpm >= 0 ? 1 : -1;
    spin.value = 0;
    spin.value = withRepeat(
      withTiming(360 * sign, { duration: period, easing: Easing.linear }),
      -1,
      false,
    );
  }, [selfSpinRpm]);

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: orbitRadius * Math.cos(angle.value) },
      { translateY: orbitRadius * Math.sin(angle.value) },
      { rotate: `${spin.value}deg` },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: centerX - size / 2,
          top: centerY - size / 2,
          width: size,
          height: size,
        },
        orbitStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
}
