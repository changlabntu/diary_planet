import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { BG } from '../../theme';

export default function Modal({
  open,
  onClose,
  title,
  maxWidth = 420,
  variant = 'modal',
  sheetStyle: sheetStyleProp,
  backdropStyle: backdropStyleProp,
  children,
}) {
  const progress = useSharedValue(0);
  const [mounted, setMounted] = React.useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      progress.value = withTiming(1, { duration: 220 });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [open]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  const { height: screenH } = Dimensions.get('window');
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * screenH * 0.6 }],
    opacity: progress.value,
  }));

  if (!mounted) return null;

  if (variant === 'sheet') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyleProp, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <View style={styles.sheetAnchor} pointerEvents="box-none">
          <Animated.View style={[styles.sheet, sheetStyleProp, sheetStyle]}>
            <View style={styles.handleBar} />
            {title && <Text style={styles.sheetTitle}>{title}</Text>}
            <ScrollView
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <View style={styles.modalCenter} pointerEvents="box-none">
        <Animated.View style={[styles.modalCard, { maxWidth }, sheetStyle]}>
          {title && (
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
                <Text style={styles.closeX}>✕</Text>
              </Pressable>
            </View>
          )}
          <ScrollView contentContainerStyle={styles.modalContent}>{children}</ScrollView>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.55)' },
  sheetAnchor: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: BG.SHEET,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 20,
    maxHeight: '86%',
  },
  handleBar: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center', marginBottom: 10,
  },
  sheetTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  sheetContent: { paddingBottom: 20 },
  modalCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: {
    width: '100%',
    backgroundColor: BG.SURFACE,
    borderRadius: 16,
    maxHeight: '82%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#17171a' },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeX: { fontSize: 14, color: '#444' },
  modalContent: { paddingHorizontal: 18, paddingBottom: 20 },
});
