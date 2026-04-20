import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

function BookIcon({ size = 22, color = 'rgba(255,255,255,0.9)' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 5 H10 C11.2 5 12 5.8 12 7 L12 20 L4 20 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Path
        d="M20 5 H14 C12.8 5 12 5.8 12 7 L12 20 L20 20 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function PeerPortal({ onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.85 : 1 }]}
      hitSlop={6}
    >
      <BookIcon size={22} />
      <Text style={styles.label}>Peer</Text>
      <View style={styles.simTag}>
        <Text style={styles.simText}>SIM</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    right: 14,
    top: '50%',
    marginTop: -32,
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(18,12,40,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  label: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.4,
  },
  simTag: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  simText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
