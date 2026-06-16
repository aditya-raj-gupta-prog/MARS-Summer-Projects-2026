"use client";

// ── Holographic AI Orb ────────────────────────────────────────────────────────
//
// A hardware-accelerated 3D orb that visualizes the Gemini assistant's state.
// It lives entirely on the client (WebGL), so the whole module is "use client"
// and the <Canvas> only spins up its render loop after mount.
//
//   • idle     (isThinking=false) → gentle wobble, cyber-blue glow
//   • thinking (isThinking=true)  → fast, chaotic vibration, neon-cyan glow
//
// MeshWobbleMaterial drives the surface distortion itself (via its own time
// uniform); we only own the steady spin in useFrame and the colour/intensity
// crossfade between the two states.

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshWobbleMaterial } from "@react-three/drei";
import type { Mesh } from "three";

interface AIOrbProps {
  /** True while a Gemini request is in flight — drives the "thinking" visuals. */
  isThinking: boolean;
}

// Per-state visual tuning. Kept as plain constants so the values the brief calls
// out (speed 1.2/4.0, factor 0.35/0.7) live in one obvious place.
const ORB_STATE = {
  idle: {
    speed:            1.2,
    factor:           0.35,
    emissive:         "#1d4ed8", // cyber blue
    emissiveIntensity: 0.55,
    rotation:         0.25,
  },
  thinking: {
    speed:            4.0,
    factor:           0.7,
    emissive:         "#22d3ee", // neon cyan
    emissiveIntensity: 1.9,
    rotation:         0.9,
  },
} as const;

function Orb({ isThinking }: AIOrbProps) {
  const meshRef = useRef<Mesh>(null);
  const s = isThinking ? ORB_STATE.thinking : ORB_STATE.idle;

  // Steady spin; speeds up while thinking. Frame-rate independent via delta.
  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.rotation.x += delta * s.rotation;
    mesh.rotation.y += delta * s.rotation * 1.3;
  });

  return (
    <mesh ref={meshRef} scale={1.6}>
      {/* Icosahedron at higher detail reads as a smooth, faceted orb. */}
      <icosahedronGeometry args={[1, 6]} />
      <MeshWobbleMaterial
        speed={s.speed}
        factor={s.factor}
        color="#0b1220"
        emissive={s.emissive}
        emissiveIntensity={s.emissiveIntensity}
        roughness={0.25}
        metalness={0.85}
      />
    </mesh>
  );
}

export default function AIOrb({ isThinking }: AIOrbProps) {
  return (
    <div className="relative grid h-32 w-full place-items-center overflow-hidden">
      {/* Blurred glow behind the canvas — pulses when the assistant is thinking. */}
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute h-24 w-24 rounded-full blur-2xl transition-colors duration-500",
          isThinking
            ? "animate-pulse bg-cyan-400/60"
            : "bg-blue-600/35",
        ].join(" ")}
      />

      {/* The WebGL orb itself, layered above the glow. */}
      <Canvas
        className="relative z-10"
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={1.4} color="#7dd3fc" />
        <pointLight position={[-5, -3, 2]} intensity={0.9} color="#22d3ee" />
        <Orb isThinking={isThinking} />
      </Canvas>
    </div>
  );
}
