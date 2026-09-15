import React, { useRef, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { MindCore } from './MindCore';
import { FloatingBook } from './FloatingBook';
import { ParticleField } from './ParticleField';
import { OrbitalObjects } from './OrbitalObjects';

gsap.registerPlugin(ScrollTrigger);

export function Scene() {
  const mouse = useThree((state) => state.pointer);
  const group = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useLayoutEffect(() => {
    if (!group.current) return;
    
    // GSAP Scroll animation:
    // Move the group down and rotate it as the user scrolls
    gsap.to(group.current.position, {
      y: -5,
      scrollTrigger: {
        trigger: '#main-content',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      }
    });

    gsap.to(group.current.rotation, {
      y: Math.PI * 2,
      scrollTrigger: {
        trigger: '#main-content',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      }
    });
  }, []);

  useFrame(() => {
    if (!group.current) return;
    
    // Smooth, damped mouse interaction (2-8 degrees max)
    const targetX = (mouse.x * Math.PI) / 8;
    const targetY = (mouse.y * Math.PI) / 8;
    
    group.current.rotation.y += 0.05 * (targetX - group.current.rotation.y);
    group.current.rotation.x += 0.05 * (-targetY - group.current.rotation.x);

    // Make the point light slightly follow the cursor
    if (lightRef.current) {
      lightRef.current.position.x += 0.05 * (mouse.x * 5 - lightRef.current.position.x);
      lightRef.current.position.y += 0.05 * (mouse.y * 5 - lightRef.current.position.y);
    }
  });

  return (
    <group ref={group}>
      <ambientLight intensity={1.5} />
      <pointLight ref={lightRef} position={[2, 3, 4]} intensity={2.5} color="#6D4AFF" />
      <pointLight position={[-3, -1, -2]} intensity={1.5} color="#16B9C4" />
      <directionalLight position={[5, 10, 5]} intensity={1} color="#ffffff" castShadow />
      
      <MindCore />
      <FloatingBook />
      <OrbitalObjects />
      <ParticleField count={80} />

      {/* Ground shadow */}
      <ContactShadows
        position={[0, -4, 0]}
        opacity={0.4}
        scale={15}
        blur={2}
        far={10}
        resolution={256}
        color="#0F172A"
      />
    </group>
  );
}
