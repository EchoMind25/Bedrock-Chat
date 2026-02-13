"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Stars, MeshDistortMaterial } from "@react-three/drei";
import type { Mesh, Group, PointLight as TPointLight } from "three";
import * as THREE from "three";

// OKLCH primary/secondary/accent converted to hex for Three.js
const COLORS = {
  primary: "#6B5CE7",    // oklch(0.65 0.25 265) - purple-blue
  secondary: "#7B9CF0",  // oklch(0.7 0.15 285) - blue
  accent: "#5BC98C",     // oklch(0.75 0.2 145) - green
  portalCore: "#8B6CF7", // lighter purple for portal glow
  crystal1: "#9B7BF7",
  crystal2: "#6BA0F0",
  crystal3: "#5BD4A0",
};

/**
 * Mouse-tracking camera offset.
 * Subtly moves the camera based on mouse position for parallax depth.
 */
function CameraRig() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  // Track mouse on the window (not canvas) for smoother UX
  useMemo(() => {
    if (typeof window === "undefined") return;
    const handler = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  useFrame(() => {
    // Smooth lerp toward mouse position
    target.current.x += (mouse.current.x * 0.8 - target.current.x) * 0.02;
    target.current.y += (mouse.current.y * 0.5 - target.current.y) * 0.02;
    camera.position.x = target.current.x;
    camera.position.y = target.current.y;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/**
 * Central portal - a distorted torus with emissive glow
 */
function Portal() {
  const meshRef = useRef<Mesh>(null);
  const lightRef = useRef<TPointLight>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.3) * 0.1;
      meshRef.current.rotation.z = clock.elapsedTime * 0.15;
    }
    // Pulse the light intensity
    if (lightRef.current) {
      lightRef.current.intensity =
        2 + Math.sin(clock.elapsedTime * 1.5) * 0.8;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <torusGeometry args={[2.2, 0.35, 64, 128]} />
        <MeshDistortMaterial
          color={COLORS.primary}
          emissive={COLORS.portalCore}
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.8}
          distort={0.3}
          speed={2}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Inner glow ring */}
      <mesh>
        <torusGeometry args={[2.2, 0.08, 32, 128]} />
        <meshBasicMaterial
          color={COLORS.portalCore}
          transparent
          opacity={0.4}
        />
      </mesh>
      {/* Portal center fill - subtle disc */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.9, 64]} />
        <meshBasicMaterial
          color={COLORS.primary}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        color={COLORS.portalCore}
        intensity={2}
        distance={12}
        decay={2}
      />
    </group>
  );
}

/**
 * Orbiting crystal - icosahedron with glass-like material
 */
function Crystal({
  color,
  position,
  size,
  speed,
  floatIntensity,
}: {
  color: string;
  position: [number, number, number];
  size: number;
  speed: number;
  floatIntensity: number;
}) {
  const meshRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = clock.elapsedTime * speed * 0.5;
    meshRef.current.rotation.y = clock.elapsedTime * speed * 0.3;
  });

  return (
    <Float
      speed={speed}
      rotationIntensity={0.5}
      floatIntensity={floatIntensity}
    >
      <mesh ref={meshRef} position={position}>
        <icosahedronGeometry args={[size, 1]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.85}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>
    </Float>
  );
}

/**
 * Orbital ring of crystals around the portal
 * Mobile-optimized: fewer crystals on small screens
 */
function OrbitalCrystals() {
  const groupRef = useRef<Group>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.elapsedTime * 0.08;
      groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.2) * 0.05;
    }
  });

  const crystals = useMemo(
    () => {
      const allCrystals = [
        { color: COLORS.crystal1, pos: [3.5, 0.5, 0.5] as [number, number, number], size: 0.25, speed: 1.2, float: 1.5 },
        { color: COLORS.crystal2, pos: [-3.2, -0.3, 1] as [number, number, number], size: 0.3, speed: 0.9, float: 1.2 },
        { color: COLORS.crystal3, pos: [1.5, 2.8, -0.5] as [number, number, number], size: 0.2, speed: 1.5, float: 1.8 },
        { color: COLORS.crystal1, pos: [-1.8, -2.5, 0.8] as [number, number, number], size: 0.22, speed: 1.1, float: 1.4 },
        { color: COLORS.secondary, pos: [2.5, -1.8, -1] as [number, number, number], size: 0.18, speed: 1.3, float: 1.6 },
        { color: COLORS.accent, pos: [-2.8, 1.5, -0.3] as [number, number, number], size: 0.28, speed: 0.8, float: 1.3 },
      ];
      // On mobile, only show first 4 crystals for performance
      return isMobile ? allCrystals.slice(0, 4) : allCrystals;
    },
    [isMobile]
  );

  return (
    <group ref={groupRef}>
      {crystals.map((c, i) => (
        <Crystal
          key={i}
          color={c.color}
          position={c.pos}
          size={c.size}
          speed={c.speed}
          floatIntensity={c.float}
        />
      ))}
    </group>
  );
}

/**
 * Ambient floating particles for depth
 * Mobile-optimized: fewer particles on small screens
 */
function ParticleField() {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <Stars
      radius={15}
      depth={50}
      count={isMobile ? 800 : 1500} // Reduce particle count on mobile
      factor={3}
      saturation={0.5}
      fade
      speed={0.5}
    />
  );
}

/**
 * Scene lighting setup
 */
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.15} color="#8B9FE8" />
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.3}
        color="#A0B0FF"
      />
      <pointLight
        position={[-4, 3, -3]}
        intensity={0.5}
        color={COLORS.secondary}
        distance={15}
        decay={2}
      />
      <pointLight
        position={[4, -3, 2]}
        intensity={0.4}
        color={COLORS.accent}
        distance={12}
        decay={2}
      />
    </>
  );
}

/**
 * Complete 3D scene composition
 */
function Scene() {
  return (
    <>
      <CameraRig />
      <Lighting />
      <fog attach="fog" args={["#0D0F1A", 8, 25]} />
      <Portal />
      <OrbitalCrystals />
      <ParticleField />
    </>
  );
}

/**
 * Hero 3D Scene - React Three Fiber canvas
 * Renders the portal marketplace environment.
 * Must be loaded with next/dynamic ssr: false.
 * Mobile-optimized: reduced particle count and simpler effects on smaller screens.
 */
export default function Hero3DScene() {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div
      className="absolute inset-0 z-0"
      aria-hidden="true"
    >
      <Canvas
        camera={{
          position: [0, 0, isMobile ? 9 : 7],
          fov: isMobile ? 65 : 55
        }}
        gl={{
          antialias: !isMobile, // Disable AA on mobile for performance
          alpha: true,
          powerPreference: isMobile ? "default" : "high-performance",
        }}
        dpr={[1, isMobile ? 1 : 1.5]}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
