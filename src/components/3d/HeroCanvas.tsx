import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';

export default function HeroCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
      <Scene />
    </Canvas>
  );
}
