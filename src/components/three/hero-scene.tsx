"use client";

import { RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { createContext, useContext, useMemo, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";

/* -------------------------------------------------------------------------- */
/* Architectural Maquette Palette                                             */
/* -------------------------------------------------------------------------- */
const RED = "#c8102e";
const INK = "#151619";
const CHARCOAL = "#22252a";
const BRONZE = "#332f2c";
const BRASS = "#c9952b";
const WHITE = "#fcfbf9";
const LIMESTONE = "#f2ede4";
const TRAVERTINE = "#e5dec9";
const SANDSTONE = "#d4cab8";
const CONCRETE = "#c8c2b8";
const GLASS_DARK = "#16202b";
const GLASS_TINT = "#2c4257";
const GLASS_BALCONY = "#7d9ab2";
const WARM_GLOW = "#ffcf78";
const ASPHALT = "#232529";
const PAVING = "#e8e1d5";
const LAWN = "#738c66";
const HEDGE = "#536b48";
const FOLIAGE_LIGHT = "#88a178";
const WATER = "#4d7c94";

const SCENES = [
  { id: "homes", ground: "#eae4d9" },
  { id: "commercial", ground: "#e7e1d6" },
  { id: "upcoming", ground: "#e5dccb" },
  { id: "land", ground: "#e4dac9" },
] as const;

type SceneId = (typeof SCENES)[number]["id"];

const INTRO_TURN = 1.65;
const HOLD = 5.2;
const TRANSITION = 2.3;

type Live = {
  scene: SceneId;
  motion: boolean;
  /** 0 = tucked into platter, 1 = fully risen */
  presence: number;
  /** Seconds since current scene became active */
  sceneClock: number;
};

const LiveContext = createContext<RefObject<Live> | null>(null);

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

function easeInCubic(x: number): number {
  return x * x * x;
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeOutBack(x: number): number {
  const c1 = 1.28;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

/**
 * Staggered architectural pop-up / pop-down wrapper for maquette layers.
 */
function PopLayer({
  tier = 0,
  sinkY = -0.35,
  overshoot = false,
  children,
}: {
  tier?: number;
  sinkY?: number;
  overshoot?: boolean;
  children: ReactNode;
}) {
  const live = useContext(LiveContext);
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current || !live?.current) return;
    const p = live.current.presence;
    const span = 1 - tier * 0.34;
    const local = THREE.MathUtils.clamp((p - tier * 0.34) / span, 0, 1);
    ref.current.visible = local > 0.005;
    const curve = local <= 0 ? 0.001 : overshoot ? easeOutBack(local) : easeOutCubic(local);
    const sy = Math.max(0.001, curve);
    const sxz = Math.max(0.001, THREE.MathUtils.lerp(0.84, 1, easeOutCubic(local)));
    ref.current.scale.set(sxz, sy, sxz);
    ref.current.position.y = (1 - local) * sinkY;
  });

  return <group ref={ref}>{children}</group>;
}

/* -------------------------------------------------------------------------- */
/* High-Detail Architectural Landscape & Streetscape Elements                 */
/* -------------------------------------------------------------------------- */

function DetailedTree({
  position,
  scale = 1,
  type = "broad",
}: {
  position: [number, number, number];
  scale?: number;
  type?: "broad" | "cypress";
}) {
  if (type === "cypress") {
    return (
      <group position={position} scale={scale}>
        <mesh position={[0, 0.02, 0]} receiveShadow>
          <boxGeometry args={[0.16, 0.03, 0.16]} />
          <meshStandardMaterial color={TRAVERTINE} />
        </mesh>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.028, 0.18, 8]} />
          <meshStandardMaterial color="#5c4938" />
        </mesh>
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.024, 0.1, 0.46, 12]} />
          <meshStandardMaterial color={HEDGE} roughness={0.85} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.02, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.24, 0.038, 0.24]} />
        <meshStandardMaterial color={TRAVERTINE} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.18, 0.01, 0.18]} />
        <meshStandardMaterial color={HEDGE} />
      </mesh>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.032, 0.24, 10]} />
        <meshStandardMaterial color="#5c4938" roughness={0.85} />
      </mesh>
      <RoundedBox args={[0.34, 0.11, 0.34]} radius={0.035} position={[0, 0.28, 0]} castShadow>
        <meshStandardMaterial color={LAWN} roughness={0.82} />
      </RoundedBox>
      <RoundedBox args={[0.26, 0.1, 0.26]} radius={0.03} position={[0.02, 0.36, 0.02]} castShadow>
        <meshStandardMaterial color={FOLIAGE_LIGHT} roughness={0.82} />
      </RoundedBox>
      <RoundedBox args={[0.16, 0.08, 0.16]} radius={0.025} position={[-0.02, 0.43, -0.01]} castShadow>
        <meshStandardMaterial color={HEDGE} roughness={0.82} />
      </RoundedBox>
    </group>
  );
}

function DetailedCar({
  position,
  rotationY = 0,
  color = WHITE,
  driveAxis,
  driveDistance = 0,
  speed = 0.5,
  scene,
}: {
  position: [number, number, number];
  rotationY?: number;
  color?: string;
  driveAxis?: "x" | "z";
  driveDistance?: number;
  speed?: number;
  scene: SceneId;
}) {
  const live = useContext(LiveContext);
  const ref = useRef<THREE.Group>(null);
  const clock = useRef(0);

  useFrame((_, dt) => {
    if (!ref.current || !driveAxis || !driveDistance) return;
    const active = Boolean(live?.current.motion && live.current.scene === scene && live.current.presence > 0.7);
    if (active) clock.current += Math.min(dt, 0.05) * speed;
    const t = (Math.sin(clock.current) + 1) / 2;
    const idx = driveAxis === "x" ? 0 : 2;
    ref.current.position[driveAxis] = position[idx] + t * driveDistance;
  });

  return (
    <group ref={ref} position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[0.3, 0.06, 0.14]} radius={0.016} position={[0, 0.044, 0]} castShadow>
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.28} />
      </RoundedBox>
      <RoundedBox args={[0.16, 0.045, 0.12]} radius={0.014} position={[-0.01, 0.084, 0]} castShadow>
        <meshStandardMaterial color={GLASS_DARK} metalness={0.65} roughness={0.15} />
      </RoundedBox>
      {[
        [-0.09, -0.065],
        [0.09, -0.065],
        [-0.09, 0.065],
        [0.09, 0.065],
      ].map(([wx, wz], i) => (
        <mesh key={i} position={[wx, 0.025, wz]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.024, 0.024, 0.02, 10]} />
          <meshStandardMaterial color={INK} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* 1. HOMES MASTERPLAN: Point Tower, Courtyard Kothi & Low-Rise Builder Block */
/* -------------------------------------------------------------------------- */

function IsometricHighRise({
  position,
  w = 1.24,
  d = 0.96,
  floors = 12,
  crownColor = RED,
}: {
  position: [number, number, number];
  w?: number;
  d?: number;
  floors?: number;
  crownColor?: string;
}) {
  const fh = 0.185;
  const towerH = floors * fh;
  return (
    <group position={position}>
      {/* Double-height colonnade lobby podium + porte-cochère canopy */}
      <RoundedBox args={[w + 0.24, 0.26, d + 0.24]} radius={0.02} position={[0, 0.13, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={TRAVERTINE} roughness={0.7} />
      </RoundedBox>
      <mesh position={[0, 0.13, (d + 0.24) / 2 + 0.005]}>
        <boxGeometry args={[w - 0.12, 0.18, 0.015]} />
        <meshStandardMaterial color={WARM_GLOW} emissive={WARM_GLOW} emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[0, 0.22, (d + 0.24) / 2 + 0.14]} castShadow>
        <boxGeometry args={[0.58, 0.032, 0.24]} />
        <meshStandardMaterial color={BRONZE} metalness={0.4} roughness={0.35} />
      </mesh>

      {/* Recessed curtain-wall glass core */}
      <mesh position={[0, towerH / 2 + 0.26, 0]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.08, towerH, d - 0.08]} />
        <meshStandardMaterial color={GLASS_DARK} metalness={0.65} roughness={0.14} />
      </mesh>

      {/* Cantilevered floor plates, corner glass balustrades & lit apartments */}
      {Array.from({ length: floors }, (_, i) => {
        const y = 0.26 + i * fh;
        return (
          <group key={i} position={[0, y, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[w + 0.05, 0.028, d + 0.05]} />
              <meshStandardMaterial color={WHITE} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.042, d / 2 + 0.022]}>
              <boxGeometry args={[w + 0.02, 0.04, 0.01]} />
              <meshStandardMaterial color={GLASS_BALCONY} metalness={0.4} roughness={0.2} transparent opacity={0.65} />
            </mesh>
            <mesh position={[w / 2 + 0.022, 0.042, 0]}>
              <boxGeometry args={[0.01, 0.04, d + 0.02]} />
              <meshStandardMaterial color={GLASS_BALCONY} metalness={0.4} roughness={0.2} transparent opacity={0.65} />
            </mesh>
            {(i + 1) % 3 !== 0 && (
              <mesh position={[i % 2 === 0 ? -0.26 : 0.26, fh * 0.5, d / 2 - 0.03]}>
                <boxGeometry args={[0.34, fh * 0.65, 0.012]} />
                <meshStandardMaterial color={WARM_GLOW} emissive={WARM_GLOW} emissiveIntensity={0.38} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Vertical limestone piers */}
      {[-w / 2, -w / 6, w / 6, w / 2].map((px, i) => (
        <mesh key={i} position={[px, towerH / 2 + 0.26, 0]} castShadow>
          <boxGeometry args={[0.04, towerH + 0.04, d + 0.06]} />
          <meshStandardMaterial color={LIMESTONE} roughness={0.55} />
        </mesh>
      ))}
      {[-d / 2, 0, d / 2].map((pz, i) => (
        <mesh key={i} position={[0, towerH / 2 + 0.26, pz]} castShadow>
          <boxGeometry args={[w + 0.06, towerH + 0.04, 0.036]} />
          <meshStandardMaterial color={LIMESTONE} roughness={0.55} />
        </mesh>
      ))}

      {/* Rooftop Sky-Deck, Infinity Pool & Crown */}
      <group position={[0, towerH + 0.26, 0]}>
        <mesh position={[0, 0.02, 0]} receiveShadow castShadow>
          <boxGeometry args={[w + 0.06, 0.036, d + 0.06]} />
          <meshStandardMaterial color={WHITE} roughness={0.5} />
        </mesh>
        <mesh position={[0.26, 0.042, 0.16]}>
          <boxGeometry args={[0.42, 0.015, 0.32]} />
          <meshStandardMaterial color={WATER} metalness={0.4} roughness={0.15} />
        </mesh>
        <RoundedBox args={[w * 0.56, 0.2, d * 0.56]} radius={0.02} position={[-0.14, 0.12, -0.08]} castShadow>
          <meshStandardMaterial color={LIMESTONE} roughness={0.55} />
        </RoundedBox>
        <mesh position={[-0.14, 0.24, -0.08]} castShadow>
          <boxGeometry args={[w * 0.64, 0.045, d * 0.64]} />
          <meshStandardMaterial color={crownColor} roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
}

function IsometricKothiVilla({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Walled estate plot plinth */}
      <RoundedBox args={[1.92, 0.045, 1.54]} radius={0.02} position={[0, 0.022, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={PAVING} roughness={0.8} />
      </RoundedBox>
      {/* Courtyard lawn & lap pool with stepping stones */}
      <mesh position={[-0.35, 0.048, 0.32]} receiveShadow>
        <boxGeometry args={[0.98, 0.012, 0.68]} />
        <meshStandardMaterial color={LAWN} roughness={0.88} />
      </mesh>
      <mesh position={[0.48, 0.048, 0.32]} receiveShadow>
        <boxGeometry args={[0.56, 0.015, 0.68]} />
        <meshStandardMaterial color={WATER} metalness={0.45} roughness={0.12} />
      </mesh>
      {[-0.14, 0.04, 0.22].map((sz, i) => (
        <mesh key={i} position={[0.16, 0.056, 0.32 + sz]}>
          <boxGeometry args={[0.12, 0.01, 0.09]} />
          <meshStandardMaterial color={WHITE} />
        </mesh>
      ))}
      {/* Compound wall & architectural louver gate */}
      <mesh position={[-0.5, 0.11, 0.74]} castShadow>
        <boxGeometry args={[0.84, 0.14, 0.04]} />
        <meshStandardMaterial color={LIMESTONE} />
      </mesh>
      <mesh position={[0.56, 0.11, 0.74]} castShadow>
        <boxGeometry args={[0.7, 0.14, 0.04]} />
        <meshStandardMaterial color={LIMESTONE} />
      </mesh>
      <mesh position={[0.05, 0.09, 0.74]} castShadow>
        <boxGeometry args={[0.3, 0.11, 0.024]} />
        <meshStandardMaterial color={BRONZE} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* L-shaped ground floor villa wing */}
      <RoundedBox args={[1.56, 0.42, 0.72]} radius={0.02} position={[0, 0.24, -0.3]} castShadow receiveShadow>
        <meshStandardMaterial color={WHITE} roughness={0.48} />
      </RoundedBox>
      <RoundedBox args={[0.56, 0.42, 0.64]} radius={0.02} position={[-0.5, 0.24, 0.1]} castShadow receiveShadow>
        <meshStandardMaterial color={LIMESTONE} roughness={0.52} />
      </RoundedBox>
      <mesh position={[0.14, 0.22, 0.065]}>
        <boxGeometry args={[0.86, 0.3, 0.015]} />
        <meshStandardMaterial color={WARM_GLOW} emissive={WARM_GLOW} emissiveIntensity={0.48} />
      </mesh>
      {/* Upper cantilevered master suite */}
      <RoundedBox args={[1.08, 0.38, 0.76]} radius={0.02} position={[-0.16, 0.62, -0.26]} castShadow receiveShadow>
        <meshStandardMaterial color={LIMESTONE} roughness={0.5} />
      </RoundedBox>
      <mesh position={[-0.16, 0.62, 0.125]}>
        <boxGeometry args={[0.8, 0.25, 0.015]} />
        <meshStandardMaterial color={GLASS_DARK} metalness={0.6} roughness={0.16} />
      </mesh>
      {/* Cantilevered red roof slab + terrace pergola slats */}
      <mesh position={[-0.12, 0.83, -0.24]} castShadow>
        <boxGeometry args={[1.22, 0.048, 0.88]} />
        <meshStandardMaterial color={RED} roughness={0.35} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[0.44 + i * 0.055, 0.46, -0.3]} castShadow>
          <boxGeometry args={[0.022, 0.022, 0.66]} />
          <meshStandardMaterial color={BRONZE} />
        </mesh>
      ))}
    </group>
  );
}

function IsometricLowRise({ position }: { position: [number, number, number] }) {
  const w = 1.44;
  const d = 0.94;
  const floors = 4;
  const fh = 0.24;
  const totalH = floors * fh + 0.18;

  return (
    <group position={position}>
      <RoundedBox args={[w + 0.08, 0.18, d + 0.08]} radius={0.02} position={[0, 0.09, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={SANDSTONE} roughness={0.75} />
      </RoundedBox>
      <RoundedBox args={[w, totalH, d]} radius={0.025} position={[0, totalH / 2 + 0.1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={WHITE} roughness={0.5} />
      </RoundedBox>
      {Array.from({ length: floors }, (_, i) => {
        const y = 0.22 + i * fh;
        return (
          <group key={i} position={[0, y, 0]}>
            <mesh position={[0, 0, d / 2 + 0.055]} castShadow receiveShadow>
              <boxGeometry args={[w + 0.05, 0.032, 0.14]} />
              <meshStandardMaterial color={LIMESTONE} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.045, d / 2 + 0.115]}>
              <boxGeometry args={[w + 0.03, 0.045, 0.014]} />
              <meshStandardMaterial color={BRONZE} metalness={0.5} roughness={0.35} />
            </mesh>
            {[-0.42, 0, 0.42].map((wx, wi) => (
              <mesh key={wi} position={[wx, 0.11, d / 2 + 0.008]}>
                <boxGeometry args={[0.32, 0.16, 0.012]} />
                <meshStandardMaterial
                  color={(i + wi) % 3 === 0 ? WARM_GLOW : GLASS_DARK}
                  emissive={(i + wi) % 3 === 0 ? WARM_GLOW : "#000000"}
                  emissiveIntensity={(i + wi) % 3 === 0 ? 0.38 : 0}
                  metalness={0.55}
                  roughness={0.18}
                />
              </mesh>
            ))}
            <mesh position={[i % 2 === 0 ? -0.6 : 0.6, 0.11, d / 2 + 0.075]} castShadow>
              <boxGeometry args={[0.14, 0.2, 0.02]} />
              <meshStandardMaterial color={BRASS} roughness={0.45} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, totalH + 0.12, 0]} castShadow>
        <boxGeometry args={[w + 0.1, 0.045, d + 0.1]} />
        <meshStandardMaterial color={BRONZE} roughness={0.4} />
      </mesh>
    </group>
  );
}

function HomesScene() {
  return (
    <group>
      <PopLayer tier={0.0} sinkY={-0.08}>
        <mesh position={[0, 0.012, 1.32]} receiveShadow>
          <boxGeometry args={[4.6, 0.024, 0.56]} />
          <meshStandardMaterial color={ASPHALT} roughness={0.85} />
        </mesh>
        {[-1.5, -0.5, 0.5, 1.5].map((x, i) => (
          <mesh key={i} position={[x, 0.026, 1.32]}>
            <boxGeometry args={[0.55, 0.01, 0.03]} />
            <meshStandardMaterial color={BRASS} />
          </mesh>
        ))}
        <mesh position={[-0.25, 0.012, -0.1]} receiveShadow>
          <boxGeometry args={[0.42, 0.022, 2.4]} />
          <meshStandardMaterial color={ASPHALT} roughness={0.85} />
        </mesh>
      </PopLayer>

      <PopLayer tier={0.14} sinkY={-0.65} overshoot>
        <IsometricHighRise position={[-1.35, 0, -0.82]} w={1.24} d={0.96} floors={12} crownColor={RED} />
      </PopLayer>

      <PopLayer tier={0.28} sinkY={-0.48} overshoot>
        <IsometricLowRise position={[1.18, 0, -0.92]} />
      </PopLayer>

      <PopLayer tier={0.42} sinkY={-0.36} overshoot>
        <IsometricKothiVilla position={[0.82, 0, 0.34]} />
      </PopLayer>

      <PopLayer tier={0.55} sinkY={-0.2}>
        {/* Pocket Park on Front-Left */}
        <RoundedBox args={[1.45, 0.035, 0.96]} radius={0.02} position={[-1.38, 0.018, 0.42]} receiveShadow>
          <meshStandardMaterial color={LAWN} roughness={0.88} />
        </RoundedBox>
        <DetailedTree position={[-1.72, 0.03, 0.28]} scale={1.0} />
        <DetailedTree position={[-1.02, 0.03, 0.52]} scale={0.92} />
        <DetailedTree position={[-1.4, 0.03, 0.62]} scale={0.85} type="cypress" />
        <DetailedTree position={[-0.1, 0, -1.55]} scale={0.95} />
        <DetailedTree position={[2.22, 0, 0.35]} scale={0.95} />
        <DetailedCar position={[-1.4, 0.02, 1.18]} color={WHITE} driveAxis="x" driveDistance={2.4} speed={0.48} scene="homes" />
        <DetailedCar position={[1.2, 0.02, 1.44]} rotationY={Math.PI} color={BRONZE} driveAxis="x" driveDistance={-2.2} speed={0.4} scene="homes" />
      </PopLayer>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. COMMERCIAL MASTERPLAN: Flagship Showroom & High-Street Retail Arcade    */
/* -------------------------------------------------------------------------- */

function CommercialScene() {
  return (
    <group>
      <PopLayer tier={0.0} sinkY={-0.08}>
        <RoundedBox args={[4.7, 0.036, 1.65]} radius={0.015} position={[0, 0.018, 0.42]} receiveShadow>
          <meshStandardMaterial color={PAVING} roughness={0.85} />
        </RoundedBox>
        <mesh position={[0.25, 0.04, 0.48]} receiveShadow>
          <boxGeometry args={[1.45, 0.02, 0.46]} />
          <meshStandardMaterial color={WATER} metalness={0.4} roughness={0.15} />
        </mesh>
        <mesh position={[0, 0.012, 1.48]} receiveShadow>
          <boxGeometry args={[4.5, 0.024, 0.52]} />
          <meshStandardMaterial color={ASPHALT} roughness={0.85} />
        </mesh>
      </PopLayer>

      {/* Corner Flagship Showroom */}
      <PopLayer tier={0.16} sinkY={-0.6} overshoot>
        <group position={[-1.25, 0, -0.65]}>
          <RoundedBox args={[2.0, 1.96, 1.2]} radius={0.03} position={[0, 0.98, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={WHITE} roughness={0.45} />
          </RoundedBox>
          <mesh position={[0.12, 0.68, 0.605]}>
            <boxGeometry args={[1.52, 1.08, 0.02]} />
            <meshStandardMaterial color={GLASS_DARK} metalness={0.7} roughness={0.12} />
          </mesh>
          <mesh position={[0.12, 0.62, 0.46]}>
            <boxGeometry args={[1.4, 0.035, 0.28]} />
            <meshStandardMaterial color={WARM_GLOW} emissive={WARM_GLOW} emissiveIntensity={0.55} />
          </mesh>
          {[-0.46, -0.17, 0.12, 0.41, 0.7].map((mx, i) => (
            <mesh key={i} position={[mx, 0.68, 0.62]} castShadow>
              <boxGeometry args={[0.024, 1.08, 0.025]} />
              <meshStandardMaterial color={BRONZE} metalness={0.5} roughness={0.35} />
            </mesh>
          ))}
          <mesh position={[0.12, 1.52, 0.605]}>
            <boxGeometry args={[1.52, 0.36, 0.02]} />
            <meshStandardMaterial color={GLASS_TINT} metalness={0.6} roughness={0.16} />
          </mesh>
          <mesh position={[-0.84, 1.04, 0.64]} castShadow>
            <boxGeometry args={[0.18, 2.08, 0.12]} />
            <meshStandardMaterial color={RED} roughness={0.35} />
          </mesh>
          <mesh position={[0.12, 0.56, 0.76]} castShadow>
            <boxGeometry args={[1.58, 0.048, 0.3]} />
            <meshStandardMaterial color={BRONZE} metalness={0.45} roughness={0.35} />
          </mesh>
          <mesh position={[0.12, 1.84, 0.62]} castShadow>
            <boxGeometry args={[1.54, 0.15, 0.04]} />
            <meshStandardMaterial color={INK} />
          </mesh>
          <mesh position={[0.12, 1.84, 0.65]}>
            <boxGeometry args={[0.92, 0.042, 0.015]} />
            <meshStandardMaterial color={BRASS} emissive={BRASS} emissiveIntensity={0.35} />
          </mesh>
        </group>
      </PopLayer>

      {/* 3 High-Street Retail Boutiques */}
      <PopLayer tier={0.3} sinkY={-0.48} overshoot>
        <group position={[1.05, 0, -0.62]}>
          {[
            { x: -0.92, awning: BRONZE, h: 1.2 },
            { x: 0, awning: RED, h: 1.32 },
            { x: 0.92, awning: BRONZE, h: 1.15 },
          ].map((s, i) => (
            <group key={i} position={[s.x, 0, 0]}>
              <RoundedBox args={[0.88, s.h, 0.92]} radius={0.025} position={[0, s.h / 2, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={i === 1 ? WHITE : LIMESTONE} roughness={0.5} />
              </RoundedBox>
              <mesh position={[0, 0.34, 0.465]}>
                <boxGeometry args={[0.68, 0.5, 0.018]} />
                <meshStandardMaterial color={WARM_GLOW} emissive={WARM_GLOW} emissiveIntensity={0.45} />
              </mesh>
              <mesh position={[0, 0.86, 0.465]}>
                <boxGeometry args={[0.68, 0.28, 0.018]} />
                <meshStandardMaterial color={GLASS_DARK} metalness={0.6} roughness={0.16} />
              </mesh>
              <mesh position={[0, 0.6, 0.56]} castShadow>
                <boxGeometry args={[0.78, 0.045, 0.22]} />
                <meshStandardMaterial color={s.awning} roughness={0.4} />
              </mesh>
              <mesh position={[0, s.h - 0.1, 0.47]} castShadow>
                <boxGeometry args={[0.72, 0.1, 0.03]} />
                <meshStandardMaterial color={INK} />
              </mesh>
            </group>
          ))}
        </group>
      </PopLayer>

      <PopLayer tier={0.5} sinkY={-0.22}>
        <DetailedTree position={[-2.25, 0.03, 0.48]} scale={1.0} />
        <DetailedTree position={[-0.75, 0.03, 0.52]} scale={0.9} />
        <DetailedTree position={[1.38, 0.03, 0.52]} scale={0.9} />
        <DetailedTree position={[2.25, 0.03, 0.38]} scale={1.0} />
        <DetailedCar position={[-1.5, 0.02, 1.48]} color={INK} driveAxis="x" driveDistance={2.8} speed={0.52} scene="commercial" />
      </PopLayer>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. UPCOMING PROJECTS: Hydraulic Jump-Form Core & 3D Lattice Tower Cranes   */
/* -------------------------------------------------------------------------- */

function LatticeTowerCrane({
  position,
  height = 2.8,
  jibLength = 2.0,
  initialYaw = 0.25,
  swaySpeed = 0.55,
}: {
  position: [number, number, number];
  height?: number;
  jibLength?: number;
  initialYaw?: number;
  swaySpeed?: number;
}) {
  const live = useContext(LiveContext);
  const jibRef = useRef<THREE.Group>(null);
  const trolleyRef = useRef<THREE.Group>(null);
  const clock = useRef(0);

  useFrame((_, dt) => {
    const step = Math.min(dt, 0.05);
    const active = Boolean(live?.current.motion && live.current.scene === "upcoming" && live.current.presence > 0.65);
    if (active) clock.current += step;
    if (jibRef.current) {
      const targetYaw = initialYaw + (active ? Math.sin(clock.current * swaySpeed) * 0.36 : 0);
      jibRef.current.rotation.y = THREE.MathUtils.damp(jibRef.current.rotation.y, targetYaw, 3, step);
    }
    if (trolleyRef.current) {
      const slide = active ? Math.sin(clock.current * 0.9) * 0.24 : 0;
      trolleyRef.current.position.x = THREE.MathUtils.damp(trolleyRef.current.position.x, -jibLength * 0.55 + slide, 4, step);
    }
  });

  const mastRungs = Math.floor(height / 0.22);

  return (
    <group position={position}>
      <RoundedBox args={[0.42, 0.09, 0.42]} radius={0.015} position={[0, 0.045, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={CONCRETE} roughness={0.8} />
      </RoundedBox>
      {/* 4 Lattice Mast Chords + Bracing Rungs */}
      {[
        [-0.055, -0.055],
        [0.055, -0.055],
        [-0.055, 0.055],
        [0.055, 0.055],
      ].map(([cx, cz], i) => (
        <mesh key={i} position={[cx, height / 2 + 0.04, cz]} castShadow>
          <boxGeometry args={[0.02, height, 0.02]} />
          <meshStandardMaterial color={BRASS} metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
      {Array.from({ length: mastRungs }, (_, i) => (
        <mesh key={i} position={[0, 0.16 + i * 0.22, 0]}>
          <boxGeometry args={[0.13, 0.015, 0.13]} />
          <meshStandardMaterial color={BRASS} />
        </mesh>
      ))}

      <group ref={jibRef} position={[0, height + 0.04, 0]} rotation={[0, initialYaw, 0]}>
        <RoundedBox args={[0.15, 0.14, 0.13]} radius={0.015} position={[0.07, -0.07, 0.07]} castShadow>
          <meshStandardMaterial color={WHITE} />
        </RoundedBox>
        <mesh position={[-jibLength * 0.28, 0, 0]} castShadow>
          <boxGeometry args={[jibLength, 0.06, 0.085]} />
          <meshStandardMaterial color={BRASS} metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh position={[-jibLength * 0.18, 0.09, 0]} rotation={[0, 0, 0.08]}>
          <boxGeometry args={[jibLength * 0.85, 0.015, 0.015]} />
          <meshStandardMaterial color={INK} />
        </mesh>
        <mesh position={[0.42, -0.04, 0]} castShadow>
          <boxGeometry args={[0.3, 0.15, 0.15]} />
          <meshStandardMaterial color={RED} roughness={0.35} />
        </mesh>
        <group ref={trolleyRef} position={[-jibLength * 0.55, 0, 0]}>
          <mesh position={[0, -0.045, 0]}>
            <boxGeometry args={[0.11, 0.04, 0.09]} />
            <meshStandardMaterial color={INK} />
          </mesh>
          <mesh position={[0, -0.65, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 1.22, 6]} />
            <meshStandardMaterial color={CHARCOAL} />
          </mesh>
          <mesh position={[0, -1.28, 0]} castShadow>
            <boxGeometry args={[0.36, 0.16, 0.08]} />
            <meshStandardMaterial color={LIMESTONE} roughness={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function UnderConstructionTower({
  position,
  floors = 8,
  step = 0.26,
  w = 1.48,
  d = 1.08,
  cladFloors = 3,
}: {
  position: [number, number, number];
  floors?: number;
  step?: number;
  w?: number;
  d?: number;
  cladFloors?: number;
}) {
  const totalH = floors * step;
  return (
    <group position={position}>
      <RoundedBox args={[w + 0.32, 0.1, d + 0.32]} radius={0.02} position={[0, 0.05, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={CONCRETE} roughness={0.85} />
      </RoundedBox>
      {/* Concrete shear core + red hydraulic jump-form rig */}
      <mesh position={[0, (totalH + 0.36) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w * 0.36, totalH + 0.36, d * 0.36]} />
        <meshStandardMaterial color={TRAVERTINE} roughness={0.78} />
      </mesh>
      <mesh position={[0, totalH + 0.32, 0]} castShadow>
        <boxGeometry args={[w * 0.42, 0.13, d * 0.42]} />
        <meshStandardMaterial color={RED} roughness={0.4} />
      </mesh>
      {[-w / 2 + 0.06, 0, w / 2 - 0.06].map((cx, i) =>
        [-d / 2 + 0.06, d / 2 - 0.06].map((cz, j) => (
          <mesh key={`${i}-${j}`} position={[cx, totalH / 2 + 0.06, cz]} castShadow>
            <boxGeometry args={[0.055, totalH, 0.055]} />
            <meshStandardMaterial color={BRONZE} roughness={0.6} />
          </mesh>
        )),
      )}
      {Array.from({ length: floors }, (_, i) => (
        <mesh key={i} position={[0, 0.14 + i * step, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, 0.045, d]} />
          <meshStandardMaterial color={i < cladFloors ? WHITE : LIMESTONE} roughness={0.7} />
        </mesh>
      ))}
      {Array.from({ length: cladFloors }, (_, i) => (
        <mesh key={i} position={[0, 0.14 + (i + 0.5) * step, 0]}>
          <boxGeometry args={[w - 0.06, step - 0.04, d - 0.06]} />
          <meshStandardMaterial color={GLASS_DARK} metalness={0.6} roughness={0.16} />
        </mesh>
      ))}
      {[floors - 2, floors - 1].map((fi) => (
        <mesh key={fi} position={[0, 0.18 + fi * step, d / 2 + 0.012]} castShadow>
          <boxGeometry args={[w + 0.02, 0.09, 0.018]} />
          <meshStandardMaterial color={RED} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function UpcomingScene() {
  return (
    <group>
      <PopLayer tier={0.0} sinkY={-0.08}>
        <RoundedBox args={[4.6, 0.035, 2.75]} radius={0.015} position={[0, 0.018, 0.05]} receiveShadow>
          <meshStandardMaterial color="#dfd5c3" roughness={0.95} />
        </RoundedBox>
        <mesh position={[0, 0.028, 1.05]} receiveShadow>
          <boxGeometry args={[4.4, 0.02, 0.48]} />
          <meshStandardMaterial color={SANDSTONE} roughness={0.9} />
        </mesh>
        {[-1.35, 1.35].map((hx, i) => (
          <group key={i} position={[hx, 0.1, 1.38]}>
            <mesh castShadow>
              <boxGeometry args={[1.65, 0.16, 0.035]} />
              <meshStandardMaterial color={WHITE} />
            </mesh>
            <mesh position={[0, 0.05, 0.02]}>
              <boxGeometry args={[1.65, 0.035, 0.01]} />
              <meshStandardMaterial color={RED} />
            </mesh>
          </group>
        ))}
      </PopLayer>

      <PopLayer tier={0.14} sinkY={-0.65} overshoot>
        <UnderConstructionTower position={[-0.45, 0, -0.38]} floors={8} step={0.26} w={1.48} d={1.08} cladFloors={3} />
      </PopLayer>
      <PopLayer tier={0.26} sinkY={-0.5} overshoot>
        <UnderConstructionTower position={[1.18, 0, -0.42]} floors={5} step={0.25} w={1.16} d={0.92} cladFloors={2} />
      </PopLayer>

      <PopLayer tier={0.36} sinkY={-0.7} overshoot>
        <LatticeTowerCrane position={[0.42, 0, 0.35]} height={2.82} jibLength={2.05} initialYaw={0.25} swaySpeed={0.55} />
        <LatticeTowerCrane position={[-1.68, 0, -0.78]} height={2.32} jibLength={1.65} initialYaw={2.4} swaySpeed={0.72} />
      </PopLayer>

      <PopLayer tier={0.52} sinkY={-0.22}>
        <RoundedBox args={[0.72, 0.24, 0.36]} radius={0.015} position={[-1.65, 0.14, 0.55]} castShadow>
          <meshStandardMaterial color={WHITE} roughness={0.6} />
        </RoundedBox>
        <RoundedBox args={[0.72, 0.24, 0.36]} radius={0.015} position={[-1.65, 0.38, 0.55]} castShadow>
          <meshStandardMaterial color={LIMESTONE} roughness={0.6} />
        </RoundedBox>
        <mesh position={[1.65, 0.1, 0.55]} castShadow>
          <boxGeometry args={[0.52, 0.16, 0.34]} />
          <meshStandardMaterial color={TRAVERTINE} roughness={0.85} />
        </mesh>
        <DetailedCar position={[-1.1, 0.03, 1.05]} color={BRASS} driveAxis="x" driveDistance={2.2} speed={0.42} scene="upcoming" />
      </PopLayer>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. LAND PARCELS: Contoured Empty Lot -> Roads, Railings & Plot Demarcation */
/* -------------------------------------------------------------------------- */

function LandPopUp({
  delay,
  duration = 0.52,
  sinkY = -0.22,
  children,
}: {
  delay: number;
  duration?: number;
  sinkY?: number;
  children: ReactNode;
}) {
  const live = useContext(LiveContext);
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current || !live?.current) return;
    const clock = live.current.motion ? live.current.sceneClock : 10;
    const timeFactor = THREE.MathUtils.clamp((clock - delay) / duration, 0, 1);
    const combined = timeFactor * live.current.presence;
    ref.current.visible = combined > 0.006;
    const curve = combined <= 0 ? 0.001 : easeOutBack(combined);
    const sy = Math.max(0.001, curve);
    const sxz = Math.max(0.001, THREE.MathUtils.lerp(0.75, 1, easeOutCubic(combined)));
    ref.current.scale.set(sxz, sy, sxz);
    ref.current.position.y = (1 - combined) * sinkY;
  });

  return <group ref={ref}>{children}</group>;
}

function ArchitecturalFence({
  position,
  length,
  rotationY = 0,
}: {
  position: [number, number, number];
  length: number;
  rotationY?: number;
}) {
  const pillars = Math.max(2, Math.round(length / 0.58) + 1);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.045, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, 0.06, 0.05]} />
        <meshStandardMaterial color={LIMESTONE} roughness={0.7} />
      </mesh>
      {Array.from({ length: pillars }, (_, i) => {
        const x = -length / 2 + (i * length) / (pillars - 1);
        return (
          <mesh key={i} position={[x, 0.12, 0]} castShadow>
            <boxGeometry args={[0.045, 0.2, 0.055]} />
            <meshStandardMaterial color={BRONZE} roughness={0.5} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[length, 0.022, 0.022]} />
        <meshStandardMaterial color={BRONZE} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[length, 0.018, 0.018]} />
        <meshStandardMaterial color={BRONZE} metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

function LandScene() {
  const cols = 4;
  const rows = 2;
  const pw = 0.88;
  const pd = 0.72;
  const gapX = 0.14;
  const gapZ = 0.36;

  return (
    <group>
      <PopLayer tier={0.0} sinkY={-0.06}>
        <RoundedBox args={[4.45, 0.045, 2.55]} radius={0.02} position={[0, 0.022, 0.04]} receiveShadow>
          <meshStandardMaterial color="#d9cab4" roughness={0.96} />
        </RoundedBox>
        <RoundedBox args={[3.95, 0.02, 2.05]} radius={0.015} position={[0, 0.048, 0.04]} receiveShadow>
          <meshStandardMaterial color="#e0d3be" roughness={0.96} />
        </RoundedBox>
      </PopLayer>

      <LandPopUp delay={0.28} duration={0.45} sinkY={-0.08}>
        <mesh position={[0, 0.062, 0.04]} receiveShadow>
          <boxGeometry args={[4.05, 0.018, 0.26]} />
          <meshStandardMaterial color={ASPHALT} roughness={0.85} />
        </mesh>
      </LandPopUp>

      {Array.from({ length: rows * cols }, (_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const x = (c - (cols - 1) / 2) * (pw + gapX);
        const z = (r === 0 ? -1 : 1) * (pd / 2 + gapZ / 2) + 0.04;
        const prime = i === 5 || i === 6;
        return (
          <group key={i} position={[x, 0, z]}>
            <LandPopUp delay={0.42 + i * 0.09} duration={0.48} sinkY={-0.14}>
              <RoundedBox args={[pw, 0.075, pd]} radius={0.015} position={[0, 0.075, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={prime ? "#f6e7c1" : WHITE} roughness={0.8} />
              </RoundedBox>
              <mesh position={[0, 0.115, 0]} receiveShadow>
                <boxGeometry args={[pw - 0.1, 0.008, pd - 0.1]} />
                <meshStandardMaterial color={prime ? "#ebd49e" : LAWN} roughness={0.9} />
              </mesh>
              <mesh position={[0, 0.118, pd / 2 - 0.018]}>
                <boxGeometry args={[pw, 0.014, 0.024]} />
                <meshStandardMaterial color={prime ? RED : BRONZE} />
              </mesh>
              <mesh position={[0, 0.118, -pd / 2 + 0.018]}>
                <boxGeometry args={[pw, 0.014, 0.024]} />
                <meshStandardMaterial color={prime ? RED : BRONZE} />
              </mesh>
              <mesh position={[-pw / 2 + 0.06, 0.135, pd / 2 - 0.06]} castShadow>
                <boxGeometry args={[0.06, 0.04, 0.06]} />
                <meshStandardMaterial color={prime ? RED : INK} />
              </mesh>
            </LandPopUp>

            {i === 5 && (
              <LandPopUp delay={1.45} duration={0.52} sinkY={-0.42}>
                <group position={[0.18, 0.11, -0.08]}>
                  <RoundedBox args={[0.16, 0.58, 0.06]} radius={0.012} position={[0, 0.29, 0]} castShadow>
                    <meshStandardMaterial color={RED} roughness={0.35} />
                  </RoundedBox>
                  <mesh position={[0, 0.44, 0.035]}>
                    <boxGeometry args={[0.1, 0.08, 0.01]} />
                    <meshStandardMaterial color={WHITE} />
                  </mesh>
                </group>
              </LandPopUp>
            )}
          </group>
        );
      })}

      <LandPopUp delay={1.15} duration={0.5} sinkY={-0.26}>
        <ArchitecturalFence position={[0, 0.04, -1.08]} length={4.15} />
      </LandPopUp>
      <LandPopUp delay={1.26} duration={0.5} sinkY={-0.26}>
        <ArchitecturalFence position={[-2.08, 0.04, 0.04]} length={2.24} rotationY={Math.PI / 2} />
      </LandPopUp>
      <LandPopUp delay={1.36} duration={0.5} sinkY={-0.26}>
        <ArchitecturalFence position={[2.08, 0.04, 0.04]} length={2.24} rotationY={Math.PI / 2} />
      </LandPopUp>
      <LandPopUp delay={1.46} duration={0.5} sinkY={-0.26}>
        <ArchitecturalFence position={[-1.25, 0.04, 1.16]} length={1.65} />
        <ArchitecturalFence position={[1.25, 0.04, 1.16]} length={1.65} />
      </LandPopUp>

      <LandPopUp delay={1.58} duration={0.54} sinkY={-0.38}>
        <group position={[0, 0.04, 1.16]}>
          <mesh position={[-0.36, 0.22, 0]} castShadow>
            <boxGeometry args={[0.1, 0.44, 0.1]} />
            <meshStandardMaterial color={BRONZE} />
          </mesh>
          <mesh position={[0.36, 0.22, 0]} castShadow>
            <boxGeometry args={[0.1, 0.44, 0.1]} />
            <meshStandardMaterial color={BRONZE} />
          </mesh>
          <mesh position={[0, 0.44, 0]} castShadow>
            <boxGeometry args={[0.96, 0.08, 0.18]} />
            <meshStandardMaterial color={WHITE} />
          </mesh>
          <mesh position={[0, 0.44, 0.095]}>
            <boxGeometry args={[0.64, 0.035, 0.01]} />
            <meshStandardMaterial color={RED} />
          </mesh>
        </group>
        <DetailedTree position={[-2.25, 0, -0.55]} scale={1.0} />
        <DetailedTree position={[-2.25, 0, 0.55]} scale={0.9} type="cypress" />
        <DetailedTree position={[2.25, 0, -0.55]} scale={1.0} />
        <DetailedTree position={[2.25, 0, 0.55]} scale={0.9} type="cypress" />
      </LandPopUp>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Full-Platter Isometric Revolving Turntable                                 */
/* -------------------------------------------------------------------------- */

const PLATTER_R = 3.55;
const STAGE_R = 3.32;
/** 38° isometric resting angle so every building sits in a clean axonometric layout */
const ISO_YAW = -Math.PI / 4.8;

type Phase = "intro" | "hold" | "turn";

function Platter({ reducedMotion, onFacing }: { reducedMotion: boolean; onFacing?: (id: string) => void }) {
  const spin = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const stageYaw = useRef<THREE.Group>(null);
  const padMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const sceneRefs = useRef<(THREE.Group | null)[]>([null, null, null, null]);
  const activeIdxRef = useRef(0);
  const onFacingRef = useRef(onFacing);
  onFacingRef.current = onFacing;

  const groundColors = useMemo(() => SCENES.map((s) => new THREE.Color(s.ground)), []);

  const live = useRef<Live>({
    scene: SCENES[0].id,
    motion: !reducedMotion,
    presence: reducedMotion ? 1 : 0,
    sceneClock: 0,
  });
  live.current.motion = !reducedMotion;

  const phaseRef = useRef<Phase>(reducedMotion ? "hold" : "intro");
  const spinY = useRef(reducedMotion ? ISO_YAW : ISO_YAW + Math.PI * 0.85);
  const timer = useRef(0);
  const swapped = useRef(false);
  const fromY = useRef(reducedMotion ? ISO_YAW : ISO_YAW + Math.PI * 0.85);
  const toY = useRef(ISO_YAW);

  const { viewport, camera } = useThree();
  const availWidth = viewport.getCurrentViewport(camera, [0, 0, 0]).width;
  const fitScale = Math.min(0.86, (availWidth * 0.86) / (PLATTER_R * 2));

  useFrame((state, dt) => {
    const step = Math.min(dt, 0.05);
    const tick = Math.min(dt, 0.12);

    if (reducedMotion) {
      live.current.presence = 1;
      live.current.sceneClock = 10;
      spinY.current = ISO_YAW;
    } else if (phaseRef.current === "intro") {
      timer.current += tick;
      const t = Math.min(1, timer.current / INTRO_TURN);
      const easedSpin = easeOutCubic(t);
      spinY.current = fromY.current + (toY.current - fromY.current) * easedSpin;
      live.current.presence = easeOutCubic(THREE.MathUtils.clamp((t - 0.08) / 0.92, 0, 1));
      live.current.sceneClock += step;

      if (stageYaw.current) stageYaw.current.rotation.y = 0;

      if (t >= 1) {
        phaseRef.current = "hold";
        timer.current = 0;
        spinY.current = ISO_YAW;
        live.current.presence = 1;
      }
    } else if (phaseRef.current === "hold") {
      timer.current += tick;
      live.current.presence = THREE.MathUtils.damp(live.current.presence, 1, 10, step);
      live.current.sceneClock += step;

      if (timer.current >= HOLD) {
        phaseRef.current = "turn";
        swapped.current = false;
        timer.current = 0;
        fromY.current = spinY.current;
        toY.current = spinY.current - Math.PI;
      }
    } else {
      timer.current += tick;
      const t = Math.min(1, timer.current / TRANSITION);
      const easedSpin = easeInOutCubic(t);
      spinY.current = fromY.current + (toY.current - fromY.current) * easedSpin;

      if (t < 0.48) {
        const downProgress = t / 0.48;
        live.current.presence = 1 - easeInCubic(downProgress);
        if (stageYaw.current) stageYaw.current.rotation.y = ISO_YAW - fromY.current;
      } else {
        if (!swapped.current) {
          swapped.current = true;
          const nextIdx = (activeIdxRef.current + 1) % SCENES.length;
          activeIdxRef.current = nextIdx;
          const nextScene = SCENES[nextIdx];
          live.current.scene = nextScene.id;
          live.current.sceneClock = 0;
          onFacingRef.current?.(nextScene.id);
        }
        if (stageYaw.current) stageYaw.current.rotation.y = ISO_YAW - toY.current;
        const upProgress = (t - 0.48) / 0.52;
        live.current.presence = easeOutCubic(Math.min(1, upProgress));
        live.current.sceneClock += step;
      }

      if (t >= 1) {
        phaseRef.current = "hold";
        timer.current = 0;
        spinY.current = toY.current;
        live.current.presence = 1;
      }
    }

    for (let i = 0; i < SCENES.length; i++) {
      const g = sceneRefs.current[i];
      if (g) g.visible = i === activeIdxRef.current;
    }

    if (padMatRef.current) {
      padMatRef.current.color.lerp(groundColors[activeIdxRef.current], Math.min(1, step * 8));
    }

    if (spin.current) spin.current.rotation.y = spinY.current;
    if (tilt.current) {
      tilt.current.rotation.x = THREE.MathUtils.damp(tilt.current.rotation.x, -state.pointer.y * 0.045, 3, step);
      tilt.current.rotation.z = THREE.MathUtils.damp(tilt.current.rotation.z, state.pointer.x * 0.032, 3, step);
    }
  });

  return (
    <LiveContext.Provider value={live}>
      <group ref={tilt} position={[0, -0.45, 0]} scale={fitScale}>
        <group ref={spin}>
          {/* Lower dark-bronze recessed shadow pedestal */}
          <mesh position={[0, -0.34, 0]} receiveShadow castShadow>
            <cylinderGeometry args={[PLATTER_R - 0.28, PLATTER_R - 0.38, 0.14, 128]} />
            <meshStandardMaterial color={BRONZE} metalness={0.35} roughness={0.5} />
          </mesh>
          {/* Main warm limestone/ivory architectural turntable body */}
          <mesh position={[0, -0.15, 0]} receiveShadow castShadow>
            <cylinderGeometry args={[PLATTER_R, PLATTER_R - 0.18, 0.28, 128]} />
            <meshStandardMaterial color={WHITE} roughness={0.38} />
          </mesh>
          {/* Precision-milled brand-red bezel band around the exterior wall */}
          <mesh position={[0, -0.06, 0]}>
            <cylinderGeometry args={[PLATTER_R + 0.008, PLATTER_R - 0.015, 0.055, 128, 1, true]} />
            <meshStandardMaterial color={RED} roughness={0.35} />
          </mesh>
          {/* Smooth torus rim lip */}
          <mesh position={[0, 0.002, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[PLATTER_R - 0.045, 0.045, 24, 128]} />
            <meshStandardMaterial color={WHITE} roughness={0.35} />
          </mesh>
          {/* Inset travertine degree ring */}
          <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[STAGE_R + 0.02, PLATTER_R - 0.08, 128]} />
            <meshStandardMaterial color={TRAVERTINE} roughness={0.7} />
          </mesh>
          {/* 36 architectural degree ticks around the rim */}
          {Array.from({ length: 36 }, (_, i) => {
            const a = (i * Math.PI * 2) / 36;
            const major = i % 9 === 0;
            const r = PLATTER_R - 0.14;
            return (
              <mesh key={i} position={[Math.cos(a) * r, 0.014, Math.sin(a) * r]} rotation={[0, -a, 0]}>
                <boxGeometry args={[major ? 0.14 : 0.07, 0.012, major ? 0.036 : 0.018]} />
                <meshStandardMaterial color={major ? RED : BRONZE} roughness={0.5} />
              </mesh>
            );
          })}

          {/* Full-Platter Isometric Maquette Stage */}
          <group ref={stageYaw} position={[0, 0.035, 0]}>
            <mesh position={[0, -0.018, 0]} receiveShadow>
              <cylinderGeometry args={[STAGE_R, STAGE_R + 0.03, 0.04, 128]} />
              <meshStandardMaterial ref={padMatRef} color={SCENES[0].ground} roughness={0.92} />
            </mesh>
            <group
              ref={(el) => {
                sceneRefs.current[0] = el;
              }}
            >
              <HomesScene />
            </group>
            <group
              ref={(el) => {
                sceneRefs.current[1] = el;
              }}
              visible={false}
            >
              <CommercialScene />
            </group>
            <group
              ref={(el) => {
                sceneRefs.current[2] = el;
              }}
              visible={false}
            >
              <UpcomingScene />
            </group>
            <group
              ref={(el) => {
                sceneRefs.current[3] = el;
              }}
              visible={false}
            >
              <LandScene />
            </group>
          </group>
        </group>
      </group>
    </LiveContext.Provider>
  );
}

export default function HeroScene({
  reducedMotion = false,
  onFacing,
}: {
  reducedMotion?: boolean;
  onFacing?: (id: string) => void;
}) {
  return (
    <Canvas
      shadows="soft"
      dpr={[1.5, 2]}
      /* Narrow-FOV telephoto camera at isometric elevation produces clean, parallel vertical lines */
      camera={{ position: [0, 9.6, 15.2], fov: 17 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ camera }) => {
        camera.lookAt(0, 0.35, 0);
      }}
    >
      <ambientLight intensity={0.7} />
      <hemisphereLight args={["#fff8ef", "#d6cbb9", 0.62]} />
      <directionalLight
        position={[7, 13, 9]}
        intensity={2.0}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-4.6}
        shadow-camera-right={4.6}
        shadow-camera-top={4.6}
        shadow-camera-bottom={-4.6}
        shadow-bias={-0.0003}
      />
      <directionalLight position={[-6, 6, -4]} intensity={0.45} color="#ffe0d4" />
      <Platter reducedMotion={reducedMotion} onFacing={onFacing} />
    </Canvas>
  );
}
