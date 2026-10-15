"use client";

import { ContactShadows, Float, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const RED = "#c8102e";
const INK = "#1d1d20";
const WHITE = "#f7f4ee";
const BONE = "#e9e3d8";
const GOLD = "#c9952b";
const SAGE = "#a7b39a";

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Tower = { x: number; z: number; w: number; d: number; h: number; color: string; cap?: string };

function useCity(): { towers: Tower[]; trees: [number, number, number][] } {
  return useMemo(() => {
    const rand = mulberry32(7);
    const towers: Tower[] = [];
    const trees: [number, number, number][] = [];
    const step = 1.25;
    for (let gx = -3; gx <= 3; gx++) {
      for (let gz = -3; gz <= 3; gz++) {
        const x = gx * step + (rand() - 0.5) * 0.25;
        const z = gz * step + (rand() - 0.5) * 0.25;
        const r = Math.hypot(x, z);
        if (r < 1.9 || r > 4.3) continue;
        if (gx === 0 || gz === 0) continue;
        if (rand() < 0.22) {
          trees.push([x, z, 0.5 + rand() * 0.4]);
          continue;
        }
        // Keep the camera-facing side low so the hero house stays visible.
        const back = (1 - (x + z) / (Math.SQRT2 * r)) / 2;
        const h = 0.35 + rand() * 0.7 + back * back * 2.6;
        const roll = rand();
        towers.push({
          x,
          z,
          w: 0.55 + rand() * 0.35,
          d: 0.55 + rand() * 0.35,
          h,
          color: roll < 0.14 ? INK : roll < 0.55 ? WHITE : BONE,
          cap: rand() < 0.18 ? RED : undefined,
        });
      }
    }
    return { towers, trees };
  }, []);
}

function TowerMesh({ t }: { t: Tower }) {
  const bands = Math.max(0, Math.floor(t.h / 0.42) - 1);
  const bandColor = t.color === INK ? "#3a3a3f" : "#d4ccbf";
  return (
    <group position={[t.x, 0, t.z]}>
      <RoundedBox args={[t.w, t.h, t.d]} radius={0.04} smoothness={3} position={[0, t.h / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={t.color} roughness={0.75} />
      </RoundedBox>
      {Array.from({ length: bands }, (_, i) => (
        <mesh key={i} position={[0, 0.42 * (i + 1), 0]}>
          <boxGeometry args={[t.w + 0.012, 0.035, t.d + 0.012]} />
          <meshStandardMaterial color={bandColor} roughness={0.9} />
        </mesh>
      ))}
      {t.cap && (
        <mesh position={[0, t.h + 0.04, 0]} castShadow>
          <boxGeometry args={[t.w * 0.7, 0.08, t.d * 0.7]} />
          <meshStandardMaterial color={t.cap} roughness={0.5} />
        </mesh>
      )}
    </group>
  );
}

function Tree({ x, z, s }: { x: number; z: number; s: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.3, 8]} />
        <meshStandardMaterial color="#8a7a66" />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.26, 16, 16]} />
        <meshStandardMaterial color={SAGE} roughness={0.9} />
      </mesh>
    </group>
  );
}

function HeroHouse() {
  const roof = useMemo(() => {
    const w = 2.1;
    const h = 1.05;
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo(0, h);
    shape.lineTo(w / 2, 0);
    shape.lineTo(-w / 2, 0);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.7, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
    geo.translate(0, 0, -0.85);
    return geo;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      <RoundedBox args={[1.7, 1.25, 1.45]} radius={0.05} position={[0, 0.625, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </RoundedBox>
      <mesh geometry={roof} position={[0, 1.25, 0]} castShadow>
        <meshStandardMaterial color={RED} roughness={0.45} metalness={0.05} />
      </mesh>
      <mesh position={[0.5, 2.05, -0.25]} castShadow>
        <boxGeometry args={[0.22, 0.55, 0.22]} />
        <meshStandardMaterial color={INK} />
      </mesh>
      {/* Front door */}
      <mesh position={[-0.35, 0.4, 0.731]}>
        <boxGeometry args={[0.36, 0.8, 0.02]} />
        <meshStandardMaterial color={INK} roughness={0.4} />
      </mesh>
      <mesh position={[-0.24, 0.42, 0.75]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.25} />
      </mesh>
      {/* Four-pane window from the logo mark */}
      {[
        [0.29, 0.84],
        [0.47, 0.84],
        [0.29, 0.66],
        [0.47, 0.66],
      ].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.731]}>
          <boxGeometry args={[0.15, 0.15, 0.02]} />
          <meshStandardMaterial color={INK} emissive="#ffb347" emissiveIntensity={0.12} />
        </mesh>
      ))}
      <mesh position={[-0.35, 0.02, 0.95]} receiveShadow>
        <boxGeometry args={[0.5, 0.04, 0.45]} />
        <meshStandardMaterial color={BONE} />
      </mesh>
    </group>
  );
}

function Pin({ position, color = RED }: { position: [number, number, number]; color?: string }) {
  return (
    <Float speed={2.2} rotationIntensity={0} floatIntensity={0.6} floatingRange={[0, 0.25]}>
      <group position={position}>
        <mesh position={[0, 0.42, 0]} castShadow>
          <sphereGeometry args={[0.2, 24, 24]} />
          <meshStandardMaterial color={color} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.42, 0.13]}>
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.18, 0]} rotation={[Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[0.13, 0.36, 24]} />
          <meshStandardMaterial color={color} roughness={0.35} />
        </mesh>
      </group>
    </Float>
  );
}

function CoinStack({ position }: { position: [number, number, number] }) {
  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.8}>
      <group position={position} rotation={[0.25, 0, -0.15]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[Math.sin(i * 1.7) * 0.03, i * 0.11, Math.cos(i * 1.3) * 0.03]} castShadow>
            <cylinderGeometry args={[0.32, 0.32, 0.09, 40]} />
            <meshStandardMaterial color={GOLD} metalness={0.75} roughness={0.28} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function FloatingKey({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.6;
  });
  return (
    <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.9}>
      <group ref={ref} position={position} rotation={[0, 0, Math.PI / 2.4]}>
        <mesh castShadow>
          <torusGeometry args={[0.26, 0.075, 16, 40]} />
          <meshStandardMaterial color={RED} roughness={0.35} />
        </mesh>
        <mesh position={[0.62, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.75, 16]} />
          <meshStandardMaterial color={RED} roughness={0.35} />
        </mesh>
        <mesh position={[0.86, -0.1, 0]} castShadow>
          <boxGeometry args={[0.07, 0.2, 0.08]} />
          <meshStandardMaterial color={RED} roughness={0.35} />
        </mesh>
        <mesh position={[0.72, -0.08, 0]} castShadow>
          <boxGeometry args={[0.07, 0.16, 0.08]} />
          <meshStandardMaterial color={RED} roughness={0.35} />
        </mesh>
      </group>
    </Float>
  );
}

function Platter({ reducedMotion }: { reducedMotion: boolean }) {
  const spin = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const { towers, trees } = useCity();

  const pinTargets = useMemo(() => {
    const tall = [...towers].sort((a, b) => b.h - a.h);
    return [tall[2], tall[7], tall[12]].filter(Boolean).map((t) => [t.x, t.h, t.z] as [number, number, number]);
  }, [towers]);

  useFrame((state, dt) => {
    if (spin.current && !reducedMotion) spin.current.rotation.y += dt * 0.07;
    if (tilt.current) {
      tilt.current.rotation.x = THREE.MathUtils.damp(tilt.current.rotation.x, -state.pointer.y * 0.08, 3, dt);
      tilt.current.rotation.z = THREE.MathUtils.damp(tilt.current.rotation.z, state.pointer.x * 0.05, 3, dt);
    }
  });

  return (
    <group ref={tilt}>
      <group ref={spin}>
        {/* Serving platter */}
        <mesh position={[0, -0.18, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[5, 4.7, 0.36, 96]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.62, 4.78, 96]} />
          <meshStandardMaterial color={RED} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[4.55, 96]} />
          <meshStandardMaterial color="#efe9df" roughness={0.95} />
        </mesh>
        {/* Avenues */}
        {[0, Math.PI / 2].map((r) => (
          <mesh key={r} position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, r]} receiveShadow>
            <planeGeometry args={[0.55, 9]} />
            <meshStandardMaterial color="#dcd4c7" roughness={1} />
          </mesh>
        ))}

        <group scale={1.35}>
          <HeroHouse />
        </group>
        {towers.map((t, i) => (
          <TowerMesh key={i} t={t} />
        ))}
        {trees.map(([x, z, s], i) => (
          <Tree key={i} x={x} z={z} s={s} />
        ))}
        {pinTargets.map((p, i) => (
          <Pin key={i} position={[p[0], p[1] + 0.1, p[2]]} color={i === 1 ? INK : RED} />
        ))}
      </group>
      <CoinStack position={[3.1, 3.3, -2.4]} />
      <FloatingKey position={[-4.2, 2.4, 2.2]} />
    </group>
  );
}

export default function HeroScene({ reducedMotion = false }: { reducedMotion?: boolean }) {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      camera={{ position: [11.5, 9.6, 13.5], fov: 33 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ camera }) => camera.lookAt(0, 0.9, 0)}
    >
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#fff6ea", "#d9cfc0", 0.6]} />
      <directionalLight
        position={[6, 10, 5]}
        intensity={1.9}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-6, 4, -4]} intensity={0.35} color="#ffd9d0" />
      <Platter reducedMotion={reducedMotion} />
      <ContactShadows position={[0, -0.37, 0]} opacity={0.35} scale={14} blur={2.6} far={3} />
    </Canvas>
  );
}
