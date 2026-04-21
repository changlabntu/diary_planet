import React from 'react';
import Gem from './Gem';
import Sphere from './Sphere';

export default function GiftSymbol({
  shape,
  cat = 'A',
  size = 30,
  angle = 0.55,
  spinning = false,
}) {
  const Comp = shape === 'sphere' ? Sphere : Gem;
  return <Comp cat={cat} size={size} angle={angle} spinning={spinning} />;
}
