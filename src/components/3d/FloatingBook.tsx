import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Box, Extrude } from '@react-three/drei';
import * as THREE from 'three';

export function FloatingBook() {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = Math.sin(t * 0.5) * 0.1;
    group.current.rotation.x = Math.cos(t * 0.3) * 0.05 + 0.1;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.5}>
      <group ref={group} position={[0, -2.5, 0]}>
        {/* Book Cover Base */}
        <Box args={[4, 0.2, 3]} position={[0, -0.1, 0]}>
          <meshStandardMaterial color="#6D4AFF" roughness={0.7} metalness={0.2} />
        </Box>
        
        {/* Left Page */}
        <Box args={[1.9, 0.15, 2.8]} position={[-1.0, 0.1, 0]} rotation={[0, 0, 0.05]}>
          <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
        </Box>
        
        {/* Right Page */}
        <Box args={[1.9, 0.15, 2.8]} position={[1.0, 0.1, 0]} rotation={[0, 0, -0.05]}>
          <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
        </Box>

        {/* Glowing floating text lines on pages */}
        <Box args={[1.2, 0.02, 0.1]} position={[-1.0, 0.2, -0.5]} rotation={[0, 0, 0.05]}>
          <meshBasicMaterial color="#16B9C4" />
        </Box>
        <Box args={[0.8, 0.02, 0.1]} position={[-1.0, 0.2, 0]} rotation={[0, 0, 0.05]}>
          <meshBasicMaterial color="#16B9C4" />
        </Box>
        
        <Box args={[1.2, 0.02, 0.1]} position={[1.0, 0.2, -0.5]} rotation={[0, 0, -0.05]}>
          <meshBasicMaterial color="#FF9B5C" />
        </Box>
        <Box args={[1.0, 0.02, 0.1]} position={[1.0, 0.2, 0]} rotation={[0, 0, -0.05]}>
          <meshBasicMaterial color="#FF9B5C" />
        </Box>
      </group>
    </Float>
  );
}
