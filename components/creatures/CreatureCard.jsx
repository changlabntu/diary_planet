import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

import CreatureAvatar from '../ui/CreatureAvatar';
import Gem from '../ui/Gem';
import { ATTRIBUTES, cardBg, fmtDate } from '../../theme';

export default function CreatureCard({ monster, width, selected, onPress, onStar }) {
  const cat = monster.attribute;
  const cg = cardBg(cat);
  const attrMid = (ATTRIBUTES[cat] || ATTRIBUTES._).mid;
  const cardW = width;
  const faceH = cardW;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          width: cardW,
          opacity: pressed ? 0.9 : 1,
          borderColor: selected ? attrMid : 'transparent',
          backgroundColor: monster.is_displayed ? '#1a1530' : '#fff',
        },
      ]}
    >
      <View style={{ width: cardW, height: faceH, overflow: 'hidden' }}>
        <Svg
          width={cardW}
          height={faceH}
          style={StyleSheet.absoluteFillObject}
        >
          <Defs>
            <RadialGradient id={`cg-${monster.id}`} cx="50%" cy="45%" rx="70%" ry="70%">
              <Stop offset="0" stopColor={cg.inner} />
              <Stop offset="1" stopColor={cg.outer} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={cardW} height={faceH} fill={`url(#cg-${monster.id})`} />
        </Svg>
        <View style={styles.faceOverlay}>
          <CreatureAvatar
            color={monster.color}
            torsoColor={monster.torsoColor}
            size={Math.min(64, cardW * 0.7)}
          />
        </View>
        <Pressable onPress={onStar} hitSlop={6} style={styles.starBtn}>
          <Text style={[styles.starText, monster.starred && { color: '#FFD45A' }]}>
            {monster.starred ? '★' : '☆'}
          </Text>
        </Pressable>
        {monster.is_displayed && <View style={styles.deployedDot} />}
      </View>
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={[styles.name, { color: monster.is_displayed ? '#fff' : '#17171a' }]} numberOfLines={1}>
            {monster.name}
          </Text>
          <Gem cat={cat} size={18} angle={0.55} />
        </View>
        <Text
          style={[
            styles.date,
            { color: monster.is_displayed ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)' },
          ]}
        >
          {monster.dateLabel}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 2,
    overflow: 'hidden',
  },
  faceOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  starBtn: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 999,
    width: 24, height: 24, alignItems: 'center', justifyContent: 'center',
  },
  starText: { color: '#fff', fontSize: 14 },
  deployedDot: {
    position: 'absolute', bottom: 6, left: 6,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#58e1a0',
  },
  body: { paddingHorizontal: 8, paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 13, fontWeight: '600', flex: 1, marginRight: 6 },
  date: { fontSize: 10, marginTop: 2 },
});
