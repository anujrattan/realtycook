"use client";

import { ContactShadows, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { Projection } from "@/lib/format";

const MAX_BAR = 3.6;
const MAX_YEARS = 15;

function Bar({
  index,
  count,
  valueH,
  rentH,
}: {
  index: number;
  count: number;
  valueH: number;
  rentH: number;
}) {
  const value = useRef<THREE.Mesh>(null);
  const rent = useRef<THREE.Mesh>(null);
  const spacing = Math.min(0.62, 8 / count);
  const x = (index - (count - 1) / 2) * spacing;
  const w = spacing * 0.7;

  useFrame((_, dt) => {
    if (!value.current || !rent.current) return;
    const vy = THREE.MathUtils.damp(value.current.scale.y, Math.max(valueH, 0.001), 5, dt);
    const ry = THREE.MathUtils.damp(rent.current.scale.y, Math.max(rentH, 0.001), 5, dt);
    value.current.scale.y = vy;
    value.current.position.y = vy / 2;
    rent.current.scale.y = ry;
    rent.current.position.y = vy + ry / 2 + 0.01;
  });

  return (
    <group position={[x, 0, 0]}>
      <RoundedBox ref={value} args={[w, 1, w]} radius={0.03} smoothness={2} castShadow>
        <meshStandardMaterial color={index === count - 1 ? "#c8102e" : "#2a2a2d"} roughness={0.5} />
      </RoundedBox>
      <RoundedBox ref={rent} args={[w, 1, w]} radius={0.03} smoothness={2} castShadow>
        <meshStandardMaterial color="#c9952b" metalness={0.55} roughness={0.32} />
      </RoundedBox>
    </group>
  );
}

function Bars({ rows, maxTotal }: { rows: Projection[]; maxTotal: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    if (!group.current) return;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, -0.35 + state.pointer.x * 0.25, 3, dt);
  });
  const scale = MAX_BAR / maxTotal;
  return (
    <group ref={group}>
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[Math.min(0.62, 8 / rows.length) * rows.length + 0.6, 0.12, 1.2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
      {rows.map((r, i) => (
        <Bar key={r.year} index={i} count={rows.length} valueH={r.value * scale} rentH={r.cumulativeRent * scale} />
      ))}
    </group>
  );
}

export default function GrowthScene({ rows }: { rows: Projection[] }) {
  const last = rows[rows.length - 1];
  const maxTotal = Math.max(1, last ? last.value + last.cumulativeRent : 1);
  return (
    <Canvas shadows="percentage" dpr={[1, 1.75]} camera={{ position: [0, 4.2, 10.5], fov: 34 }} gl={{ alpha: true, antialias: true }} onCreated={({ camera }) => camera.lookAt(0, 1.6, 0)}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 8, 6]} intensity={1.8} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-5, 3, -2]} intensity={0.3} />
      <Bars rows={rows.slice(0, MAX_YEARS)} maxTotal={maxTotal} />
      <ContactShadows position={[0, -0.13, 0]} opacity={0.3} scale={12} blur={2.4} far={2} />
    </Canvas>
  );
}
