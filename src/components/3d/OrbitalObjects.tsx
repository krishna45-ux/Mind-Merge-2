import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Box, Sphere } from '@react-three/drei';
import * as THREE from 'three';

export function OrbitalObjects() {
  const group = useRef<THREE.Group>(null);
  const orb1 = useRef<THREE.Group>(null);
  const orb2 = useRef<THREE.Group>(null);
  const orb3 = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = t * 0.1;
    }
    if (orb1.current) orb1.current.rotation.x = t * 0.5;
    if (orb2.current) orb2.current.rotation.y = t * 0.4;
    if (orb3.current) orb3.current.rotation.z = t * 0.3;
  });

  return (
    <group ref={group}>
      {/* Orb 1: Document */}
      <Float speed={2} floatIntensity={1} rotationIntensity={1}>
        <group ref={orb1} position={[3, 1, 2]}>
          <Box args={[0.8, 1.2, 0.05]}>
            <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
          </Box>
          <Box args={[0.6, 0.05, 0.06]} position={[0, 0.3, 0]}>
            <meshBasicMaterial color="#6D4AFF" />
          </Box>
        </group>
      </Float>

      {/* Orb 2: Lightbulb/Idea */}
      <Float speed={1.5} floatIntensity={1.5} rotationIntensity={0.5}>
        <group ref={orb2} position={[-3.5, -0.5, 1]}>
          <Sphere args={[0.4, 16, 16]}>
            <meshStandardMaterial color="#FF9B5C" emissive="#FF9B5C" emissiveIntensity={0.8} />
          </Sphere>
        </group>
      </Float>

      {/* Orb 3: Flashcard */}
      <Float speed={2.5} floatIntensity={0.8} rotationIntensity={1.2}>
        <group ref={orb3} position={[1, 2.5, -3]}>
          <Box args={[1.2, 0.8, 0.05]}>
            <meshStandardMaterial color="#DFF7F2" roughness={0.3} />
          </Box>
          <Box args={[0.8, 0.05, 0.06]} position={[0, 0, 0]}>
            <meshBasicMaterial color="#16B9C4" />
          </Box>
        </group>
      </Float>
    </group>
  );
}
