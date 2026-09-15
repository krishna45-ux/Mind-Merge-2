import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere, Float } from '@react-three/drei';
import * as THREE from 'three';

export function MindCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.y = t * 0.15;
    meshRef.current.rotation.z = t * 0.1;
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={1}>
      <Sphere ref={meshRef} args={[1.5, 64, 64]} scale={1}>
        <MeshDistortMaterial
          color="#6D4AFF"
          emissive="#4F8CFF"
          emissiveIntensity={1.2}
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
          transparent
          opacity={0.9}
        />
      </Sphere>
      {/* Inner glowing core */}
      <Sphere args={[1, 32, 32]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </Sphere>
    </Float>
  );
}
