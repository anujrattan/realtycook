"use client";

import { RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/* -------------------------------------------------------------------------- */
/* Architectural Materials Palette                                            */
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

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

function easeOutBack(x: number): number {
  const c1 = 1.25;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

/* -------------------------------------------------------------------------- */
/* Reusable High-Detail Architectural Components                              */
/* -------------------------------------------------------------------------- */

function IsometricBaseBoard({
  width = 6.2,
  depth = 4.6,
  topColor = "#dfd8ca",
}: {
  width?: number;
  depth?: number;
  topColor?: string;
}) {
  return (
    <group>
      {/* Lower dark architectural plinth */}
      <RoundedBox args={[width + 0.16, 0.14, depth + 0.16]} radius={0.03} position={[0, -0.15, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={INK} roughness={0.5} />
      </RoundedBox>
      {/* Brass/gold reveal trim */}
      <mesh position={[0, -0.07, 0]}>
        <boxGeometry args={[width + 0.08, 0.025, depth + 0.08]} />
        <meshStandardMaterial color={BRASS} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Upper limestone site slab */}
      <RoundedBox args={[width, 0.12, depth]} radius={0.025} position={[0, -0.02, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={topColor} roughness={0.85} />
      </RoundedBox>
    </group>
  );
}

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
          <boxGeometry args={[0.18, 0.03, 0.18]} />
          <meshStandardMaterial color={TRAVERTINE} />
        </mesh>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.03, 0.18, 8]} />
          <meshStandardMaterial color="#5c4938" />
        </mesh>
        <mesh position={[0, 0.36, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.11, 0.48, 12]} />
          <meshStandardMaterial color={HEDGE} roughness={0.85} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={position} scale={scale}>
      {/* Square stone tree-pit planter */}
      <mesh position={[0, 0.02, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.26, 0.04, 0.26]} />
        <meshStandardMaterial color={TRAVERTINE} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.042, 0]}>
        <boxGeometry args={[0.2, 0.01, 0.2]} />
        <meshStandardMaterial color={HEDGE} />
      </mesh>
      {/* Trunk */}
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.034, 0.26, 10]} />
        <meshStandardMaterial color="#5c4938" roughness={0.85} />
      </mesh>
      {/* Multi-tiered architectural canopy */}
      <RoundedBox args={[0.36, 0.12, 0.36]} radius={0.04} position={[0, 0.3, 0]} castShadow>
        <meshStandardMaterial color={LAWN} roughness={0.82} />
      </RoundedBox>
      <RoundedBox args={[0.28, 0.11, 0.28]} radius={0.035} position={[0.02, 0.39, 0.02]} castShadow>
        <meshStandardMaterial color={FOLIAGE_LIGHT} roughness={0.82} />
      </RoundedBox>
      <RoundedBox args={[0.18, 0.09, 0.18]} radius={0.03} position={[-0.02, 0.46, -0.01]} castShadow>
        <meshStandardMaterial color={HEDGE} roughness={0.82} />
      </RoundedBox>
    </group>
  );
}

function DetailedCar({
  position,
  rotationY = 0,
  color = WHITE,
  moving = false,
  startX = -2.4,
  endX = 2.4,
  speed = 0.45,
}: {
  position: [number, number, number];
  rotationY?: number;
  color?: string;
  moving?: boolean;
  startX?: number;
  endX?: number;
  speed?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const progress = useRef(0.25);

  useFrame((_, dt) => {
    if (!moving || !ref.current) return;
    progress.current = (progress.current + Math.min(dt, 0.05) * speed * 0.18) % 1;
    ref.current.position.x = THREE.MathUtils.lerp(startX, endX, progress.current);
  });

  return (
    <group ref={ref} position={position} rotation={[0, rotationY, 0]}>
      {/* Lower chassis */}
      <RoundedBox args={[0.34, 0.065, 0.16]} radius={0.018} position={[0, 0.048, 0]} castShadow>
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.28} />
      </RoundedBox>
      {/* Cabin greenhouse */}
      <RoundedBox args={[0.18, 0.05, 0.135]} radius={0.015} position={[-0.015, 0.092, 0]} castShadow>
        <meshStandardMaterial color={GLASS_DARK} metalness={0.65} roughness={0.15} />
      </RoundedBox>
      {/* 4 Wheels */}
      {[
        [-0.1, -0.075],
        [0.1, -0.075],
        [-0.1, 0.075],
        [0.1, 0.075],
      ].map(([wx, wz], i) => (
        <mesh key={i} position={[wx, 0.028, wz]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.026, 0.026, 0.022, 12]} />
          <meshStandardMaterial color={INK} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* 1. HOMES ISOMETRIC MASTERPLAN                                              */
/* High-Rise Point Tower, Independent Courtyard Kothi & Low-Rise Floors       */
/* -------------------------------------------------------------------------- */

function IsometricHighRiseTower({ position }: { position: [number, number, number] }) {
  const w = 1.48;
  const d = 1.16;
  const floors = 12;
  const fh = 0.185;
  const towerH = floors * fh;

  return (
    <group position={position}>
      {/* Double-height colonnade lobby podium with drop-off canopy */}
      <RoundedBox args={[w + 0.28, 0.28, d + 0.28]} radius={0.02} position={[0, 0.14, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={TRAVERTINE} roughness={0.7} />
      </RoundedBox>
      {/* Lobby glass storefront */}
      <mesh position={[0, 0.14, (d + 0.28) / 2 + 0.005]}>
        <boxGeometry args={[w - 0.1, 0.2, 0.015]} />
        <meshStandardMaterial color={WARM_GLOW} emissive={WARM_GLOW} emissiveIntensity={0.45} />
      </mesh>
      {/* Porte-cochère entrance canopy */}
      <mesh position={[0, 0.24, (d + 0.28) / 2 + 0.16]} castShadow>
        <boxGeometry args={[0.68, 0.035, 0.28]} />
        <meshStandardMaterial color={BRONZE} metalness={0.4} roughness={0.35} />
      </mesh>

      {/* Glazed curtain-wall core */}
      <mesh position={[0, towerH / 2 + 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.08, towerH, d - 0.08]} />
        <meshStandardMaterial color={GLASS_DARK} metalness={0.65} roughness={0.14} />
      </mesh>

      {/* Window mullion grid + warm lit apartments */}
      {Array.from({ length: floors }, (_, i) => {
        const y = 0.28 + i * fh;
        return (
          <group key={i} position={[0, y, 0]}>
            {/* Cantilevered floor slab */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[w + 0.06, 0.03, d + 0.06]} />
              <meshStandardMaterial color={WHITE} roughness={0.5} />
            </mesh>
            {/* Corner wrap-around glass balcony rails */}
            <mesh position={[0, 0.045, d / 2 + 0.025]}>
              <boxGeometry args={[w + 0.02, 0.042, 0.012]} />
              <meshStandardMaterial color={GLASS_BALCONY} metalness={0.4} roughness={0.2} transparent opacity={0.65} />
            </mesh>
            <mesh position={[w / 2 + 0.025, 0.045, 0]}>
              <boxGeometry args={[0.012, 0.042, d + 0.02]} />
              <meshStandardMaterial color={GLASS_BALCONY} metalness={0.4} roughness={0.2} transparent opacity={0.65} />
            </mesh>
            {/* Warm lit residential bays */}
            {(i + 1) % 3 !== 0 && (
              <mesh position={[i % 2 === 0 ? -0.32 : 0.32, fh * 0.5, d / 2 - 0.03]}>
                <boxGeometry args={[0.42, fh * 0.68, 0.012]} />
                <meshStandardMaterial color={WARM_GLOW} emissive={WARM_GLOW} emissiveIntensity={0.4} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Vertical limestone façade piers (front, back & sides) */}
      {[-w / 2, -w / 6, w / 6, w / 2].map((px, i) => (
        <mesh key={i} position={[px, towerH / 2 + 0.28, 0]} castShadow>
          <boxGeometry args={[0.045, towerH + 0.04, d + 0.08]} />
          <meshStandardMaterial color={LIMESTONE} roughness={0.55} />
        </mesh>
      ))}
      {[-d / 2, 0, d / 2].map((pz, i) => (
        <mesh key={i} position={[0, towerH / 2 + 0.28, pz]} castShadow>
          <boxGeometry args={[w + 0.08, towerH + 0.04, 0.04]} />
          <meshStandardMaterial color={LIMESTONE} roughness={0.55} />
        </mesh>
      ))}

      {/* Rooftop Sky-Deck, Infinity Pool & Mechanical Crown */}
      <group position={[0, towerH + 0.28, 0]}>
        <mesh position={[0, 0.02, 0]} receiveShadow castShadow>
          <boxGeometry args={[w + 0.08, 0.04, d + 0.08]} />
          <meshStandardMaterial color={WHITE} roughness={0.5} />
        </mesh>
        {/* Rooftop sky pool */}
        <mesh position={[0.32, 0.045, 0.2]}>
          <boxGeometry args={[0.52, 0.015, 0.38]} />
          <meshStandardMaterial color={WATER} metalness={0.4} roughness={0.15} />
        </mesh>
        {/* Penthouse mechanical core & architectural red crown */}
        <RoundedBox args={[w * 0.58, 0.22, d * 0.58]} radius={0.02} position={[-0.18, 0.13, -0.1]} castShadow>
          <meshStandardMaterial color={LIMESTONE} roughness={0.55} />
        </RoundedBox>
        <mesh position={[-0.18, 0.26, -0.1]} castShadow>
          <boxGeometry args={[w * 0.66, 0.05, d * 0.66]} />
          <meshStandardMaterial color={RED} roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
}

function IsometricCourtyardKothi({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Walled freehold plot plinth */}
      <RoundedBox args={[2.1, 0.05, 1.72]} radius={0.02} position={[0, 0.025, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={PAVING} roughness={0.8} />
      </RoundedBox>
      {/* Manicured front lawn */}
      <mesh position={[-0.38, 0.054, 0.35]} receiveShadow>
        <boxGeometry args={[1.08, 0.014, 0.78]} />
        <meshStandardMaterial color={LAWN} roughness={0.88} />
      </mesh>
      {/* Sunken lap pool + travertine stepping stones */}
      <mesh position={[0.52, 0.054, 0.35]} receiveShadow>
        <boxGeometry args={[0.62, 0.016, 0.78]} />
        <meshStandardMaterial color={WATER} metalness={0.45} roughness={0.12} />
      </mesh>
      {[-0.15, 0.05, 0.25].map((sz, i) => (
        <mesh key={i} position={[0.18, 0.062, 0.35 + sz]}>
          <boxGeometry args={[0.14, 0.01, 0.1]} />
          <meshStandardMaterial color={WHITE} />
        </mesh>
      ))}
      {/* Perimeter compound wall & sliding architectural louver gate */}
      <mesh position={[-0.55, 0.12, 0.82]} castShadow>
        <boxGeometry args={[0.92, 0.15, 0.045]} />
        <meshStandardMaterial color={LIMESTONE} />
      </mesh>
      <mesh position={[0.62, 0.12, 0.82]} castShadow>
        <boxGeometry args={[0.76, 0.15, 0.045]} />
        <meshStandardMaterial color={LIMESTONE} />
      </mesh>
      <mesh position={[0.06, 0.1, 0.82]} castShadow>
        <boxGeometry args={[0.34, 0.12, 0.025]} />
        <meshStandardMaterial color={BRONZE} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* L-shaped ground floor villa wing */}
      <RoundedBox args={[1.72, 0.46, 0.78]} radius={0.02} position={[0, 0.26, -0.34]} castShadow receiveShadow>
        <meshStandardMaterial color={WHITE} roughness={0.48} />
      </RoundedBox>
      <RoundedBox args={[0.62, 0.46, 0.72]} radius={0.02} position={[-0.55, 0.26, 0.12]} castShadow receiveShadow>
        <meshStandardMaterial color={LIMESTONE} roughness={0.52} />
      </RoundedBox>
      {/* Ground floor floor-to-ceiling glass + warm interior */}
      <mesh position={[0.15, 0.24, 0.055]}>
        <boxGeometry args={[0.96, 0.34, 0.015]} />
        <meshStandardMaterial color={WARM_GLOW} emissive={WARM_GLOW} emissiveIntensity={0.48} />
      </mesh>
      {/* Upper floor cantilevered master suite */}
      <RoundedBox args={[1.18, 0.42, 0.84]} radius={0.02} position={[-0.18, 0.68, -0.3]} castShadow receiveShadow>
        <meshStandardMaterial color={LIMESTONE} roughness={0.5} />
      </RoundedBox>
      <mesh position={[-0.18, 0.68, 0.125]}>
        <boxGeometry args={[0.88, 0.28, 0.015]} />
        <meshStandardMaterial color={GLASS_DARK} metalness={0.6} roughness={0.16} />
      </mesh>
      {/* Signature cantilevered brand-red roof slab + timber pergola */}
      <mesh position={[-0.14, 0.91, -0.28]} castShadow>
        <boxGeometry args={[1.34, 0.05, 0.96]} />
        <meshStandardMaterial color={RED} roughness={0.35} />
      </mesh>
      {/* Pergola slats over right terrace */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[0.48 + i * 0.06, 0.5, -0.34]} castShadow>
          <boxGeometry args={[0.025, 0.025, 0.72]} />
          <meshStandardMaterial color={BRONZE} />
        </mesh>
      ))}
      <DetailedTree position={[-0.78, 0.05, 0.58]} scale={0.75} />
    </group>
  );
}

function IsometricLowRiseFloors({ position }: { position: [number, number, number] }) {
  const w = 1.65;
  const d = 1.08;
  const floors = 4;
  const fh = 0.26;
  const totalH = floors * fh + 0.2;

  return (
    <group position={position}>
      {/* Stilt parking level with columns */}
      <RoundedBox args={[w + 0.08, 0.2, d + 0.08]} radius={0.02} position={[0, 0.1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={SANDSTONE} roughness={0.75} />
      </RoundedBox>
      {/* Main 4-storey block */}
      <RoundedBox args={[w, totalH, d]} radius={0.025} position={[0, totalH / 2 + 0.12, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={WHITE} roughness={0.5} />
      </RoundedBox>
      {Array.from({ length: floors }, (_, i) => {
        const y = 0.24 + i * fh;
        return (
          <group key={i} position={[0, y, 0]}>
            {/* Wrap-around balcony slab */}
            <mesh position={[0, 0, d / 2 + 0.06]} castShadow receiveShadow>
              <boxGeometry args={[w + 0.06, 0.034, 0.15]} />
              <meshStandardMaterial color={LIMESTONE} roughness={0.5} />
            </mesh>
            {/* Glass & bronze railing */}
            <mesh position={[0, 0.048, d / 2 + 0.125]}>
              <boxGeometry args={[w + 0.04, 0.048, 0.014]} />
              <meshStandardMaterial color={BRONZE} metalness={0.5} roughness={0.35} />
            </mesh>
            {/* 3 Sliding glass bays */}
            {[-0.48, 0, 0.48].map((wx, wi) => (
              <mesh key={wi} position={[wx, 0.12, d / 2 + 0.008]}>
                <boxGeometry args={[0.36, 0.18, 0.012]} />
                <meshStandardMaterial
                  color={(i + wi) % 3 === 0 ? WARM_GLOW : GLASS_DARK}
                  emissive={(i + wi) % 3 === 0 ? WARM_GLOW : "#000000"}
                  emissiveIntensity={(i + wi) % 3 === 0 ? 0.4 : 0}
                  metalness={0.55}
                  roughness={0.18}
                />
              </mesh>
            ))}
            {/* Architectural brass louver privacy screen */}
            <mesh position={[i % 2 === 0 ? -0.7 : 0.7, 0.12, d / 2 + 0.08]} castShadow>
              <boxGeometry args={[0.16, 0.22, 0.02]} />
              <meshStandardMaterial color={BRASS} roughness={0.45} />
            </mesh>
          </group>
        );
      })}
      {/* Rooftop terrace overhang & solar/pergola crown */}
      <mesh position={[0, totalH + 0.14, 0]} castShadow>
        <boxGeometry args={[w + 0.12, 0.05, d + 0.12]} />
        <meshStandardMaterial color={BRONZE} roughness={0.4} />
      </mesh>
    </group>
  );
}

function HomesIsometricScene() {
  return (
    <group>
      <IsometricBaseBoard width={6.3} depth={4.7} topColor="#e4ddd0" />

      {/* Arterial Boulevard + Cross Street + Sidewalks */}
      <mesh position={[0, 0.048, 1.62]} receiveShadow>
        <boxGeometry args={[6.1, 0.02, 0.68]} />
        <meshStandardMaterial color={ASPHALT} roughness={0.8} />
      </mesh>
      {[-2.2, -1.1, 0, 1.1, 2.2].map((x, i) => (
        <mesh key={i} position={[x, 0.06, 1.62]}>
          <boxGeometry args={[0.52, 0.008, 0.035]} />
          <meshStandardMaterial color={BRASS} />
        </mesh>
      ))}
      <mesh position={[-0.58, 0.046, -0.3]} receiveShadow>
        <boxGeometry args={[0.48, 0.018, 3.2]} />
        <meshStandardMaterial color={ASPHALT} roughness={0.8} />
      </mesh>

      {/* 01. High-Rise Residential Tower (Back-Left) */}
      <group position={[-1.85, 0.04, -0.92]}>
        <IsometricHighRiseTower position={[0, 0, 0]} />
      </group>

      {/* 02. Independent Courtyard Kothi Villa (Front-Right/Center) */}
      <group position={[0.85, 0.04, 0.35]}>
        <IsometricCourtyardKothi position={[0, 0, 0]} />
      </group>

      {/* 03. Low-Rise Builder-Floor Block (Back-Right) */}
      <group position={[1.65, 0.04, -1.18]}>
        <IsometricLowRiseFloors position={[0, 0, 0]} />
      </group>

      {/* Landscaped Pocket Park (Front-Left) */}
      <group position={[-1.85, 0.04, 0.55]}>
        <RoundedBox args={[1.65, 0.04, 1.15]} radius={0.02} position={[0, 0.02, 0]} receiveShadow>
          <meshStandardMaterial color={LAWN} roughness={0.88} />
        </RoundedBox>
        <DetailedTree position={[-0.45, 0.03, -0.2]} scale={1.05} />
        <DetailedTree position={[0.42, 0.03, 0.2]} scale={0.95} />
        <DetailedTree position={[-0.1, 0.03, 0.32]} scale={0.88} type="cypress" />
      </group>

      {/* Streetscape Trees & Boulevard Vehicles */}
      <DetailedTree position={[-0.2, 0.04, -1.65]} scale={1.0} />
      <DetailedTree position={[2.68, 0.04, 0.45]} scale={1.0} />
      <DetailedCar position={[-1.5, 0.055, 1.46]} color={WHITE} moving startX={-2.6} endX={2.6} speed={0.5} />
      <DetailedCar position={[1.4, 0.055, 1.78]} rotationY={Math.PI} color={BRONZE} moving startX={2.6} endX={-2.6} speed={0.4} />
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. COMMERCIAL ISOMETRIC MASTERPLAN                                         */
/* Corner Flagship Multi-Floor Showroom & High-Street Retail Promenade        */
/* -------------------------------------------------------------------------- */

function CommercialIsometricScene() {
  return (
    <group>
      <IsometricBaseBoard width={6.3} depth={4.7} topColor="#e5dfd3" />

      {/* Travertine Pedestrian Plaza & Reflecting Pool */}
      <RoundedBox args={[5.9, 0.04, 2.2]} radius={0.02} position={[0, 0.055, 0.15]} receiveShadow>
        <meshStandardMaterial color={PAVING} roughness={0.82} />
      </RoundedBox>
      <mesh position={[0.35, 0.08, 0.55]} receiveShadow>
        <boxGeometry args={[1.85, 0.018, 0.58]} />
        <meshStandardMaterial color={WATER} metalness={0.45} roughness={0.12} />
      </mesh>
      {/* Front Main Road & Customer Parking Bays */}
      <mesh position={[0, 0.048, 1.68]} receiveShadow>
        <boxGeometry args={[6.1, 0.02, 0.72]} />
        <meshStandardMaterial color={ASPHALT} roughness={0.8} />
      </mesh>

      {/* 01. Corner Flagship Showroom (Back-Left) */}
      <group position={[-1.55, 0.07, -0.78]}>
        <RoundedBox args={[2.25, 2.15, 1.38]} radius={0.03} position={[0, 1.075, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={WHITE} roughness={0.45} />
        </RoundedBox>
        {/* Double-height structural glass atrium */}
        <mesh position={[0.12, 0.74, 0.695]}>
          <boxGeometry args={[1.76, 1.18, 0.02]} />
          <meshStandardMaterial color={GLASS_DARK} metalness={0.7} roughness={0.12} />
        </mesh>
        {/* Visible interior mezzanine slab & warm display podiums */}
        <mesh position={[0.12, 0.68, 0.52]}>
          <boxGeometry args={[1.64, 0.04, 0.32]} />
          <meshStandardMaterial color={WARM_GLOW} emissive={WARM_GLOW} emissiveIntensity={0.55} />
        </mesh>
        {/* Precision bronze curtain-wall mullions */}
        {[-0.56, -0.22, 0.12, 0.46, 0.8].map((mx, i) => (
          <mesh key={i} position={[mx, 0.74, 0.71]} castShadow>
            <boxGeometry args={[0.026, 1.18, 0.03]} />
            <meshStandardMaterial color={BRONZE} metalness={0.5} roughness={0.35} />
          </mesh>
        ))}
        {/* Upper showroom gallery window */}
        <mesh position={[0.12, 1.64, 0.695]}>
          <boxGeometry args={[1.76, 0.38, 0.02]} />
          <meshStandardMaterial color={GLASS_TINT} metalness={0.6} roughness={0.16} />
        </mesh>
        {/* Signature brand-red vertical architectural blade */}
        <mesh position={[-0.95, 1.14, 0.73]} castShadow>
          <boxGeometry args={[0.2, 2.28, 0.14]} />
          <meshStandardMaterial color={RED} roughness={0.35} />
        </mesh>
        {/* Cantilevered entrance canopy */}
        <mesh position={[0.12, 0.62, 0.86]} castShadow>
          <boxGeometry args={[1.84, 0.05, 0.34]} />
          <meshStandardMaterial color={BRONZE} metalness={0.45} roughness={0.35} />
        </mesh>
        {/* Illuminated fascia signage crown */}
        <mesh position={[0.12, 2.02, 0.71]} castShadow>
          <boxGeometry args={[1.8, 0.16, 0.045]} />
          <meshStandardMaterial color={INK} />
        </mesh>
        <mesh position={[0.12, 2.02, 0.74]}>
          <boxGeometry args={[1.05, 0.045, 0.015]} />
          <meshStandardMaterial color={BRASS} emissive={BRASS} emissiveIntensity={0.35} />
        </mesh>
      </group>

      {/* 02. High-Street Retail Arcade (3 Boutiques on Back-Right) */}
      {[0, 1, 2].map((i) => {
        const x = 0.42 + i * 1.08;
        const h = i === 1 ? 1.48 : 1.34;
        return (
          <group key={i} position={[x, 0.07, -0.72]}>
            <RoundedBox args={[0.98, h, 1.18]} radius={0.025} position={[0, h / 2, 0]} castShadow receiveShadow>
              <meshStandardMaterial color={i === 1 ? WHITE : LIMESTONE} roughness={0.5} />
            </RoundedBox>
            {/* Ground-floor retail vitrine */}
            <mesh position={[0, 0.38, 0.595]}>
              <boxGeometry args={[0.76, 0.56, 0.018]} />
              <meshStandardMaterial color={WARM_GLOW} emissive={WARM_GLOW} emissiveIntensity={0.48} />
            </mesh>
            {/* Upper floor boutique glazing */}
            <mesh position={[0, 0.96, 0.595]}>
              <boxGeometry args={[0.76, 0.32, 0.018]} />
              <meshStandardMaterial color={GLASS_DARK} metalness={0.6} roughness={0.16} />
            </mesh>
            {/* Retail box awning */}
            <mesh position={[0, 0.68, 0.7]} castShadow>
              <boxGeometry args={[0.86, 0.048, 0.24]} />
              <meshStandardMaterial color={i === 1 ? RED : BRONZE} roughness={0.4} />
            </mesh>
            {/* Rooftop fascia sign */}
            <mesh position={[0, h - 0.1, 0.6]} castShadow>
              <boxGeometry args={[0.78, 0.11, 0.03]} />
              <meshStandardMaterial color={INK} />
            </mesh>
          </group>
        );
      })}

      {/* Plaza Trees, Bollards & Parked/Moving Cars */}
      <DetailedTree position={[-2.62, 0.07, 0.65]} scale={1.08} />
      <DetailedTree position={[-0.85, 0.07, 0.65]} scale={0.95} />
      <DetailedTree position={[1.68, 0.07, 0.65]} scale={0.95} />
      <DetailedTree position={[2.68, 0.07, 0.55]} scale={1.05} />
      <DetailedCar position={[-1.8, 0.058, 1.52]} color={INK} moving startX={-2.6} endX={2.6} speed={0.52} />
      <DetailedCar position={[1.2, 0.058, 1.84]} rotationY={Math.PI} color={WHITE} moving startX={2.6} endX={-2.6} speed={0.42} />
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. UPCOMING PROJECTS ISOMETRIC MASTERPLAN                                  */
/* Stepped Construction Core, Curtain-Wall Installation & 3D Lattice Cranes   */
/* -------------------------------------------------------------------------- */

function LatticeCraneIsometric({
  position,
  height = 2.95,
  jibLength = 2.15,
  baseYaw = 0.3,
  speed = 0.55,
}: {
  position: [number, number, number];
  height?: number;
  jibLength?: number;
  baseYaw?: number;
  speed?: number;
}) {
  const jibRef = useRef<THREE.Group>(null);
  const trolleyRef = useRef<THREE.Group>(null);
  const clock = useRef(0);

  useFrame((_, dt) => {
    clock.current += Math.min(dt, 0.05);
    if (jibRef.current) {
      jibRef.current.rotation.y = baseYaw + Math.sin(clock.current * speed) * 0.35;
    }
    if (trolleyRef.current) {
      trolleyRef.current.position.x = -jibLength * 0.55 + Math.sin(clock.current * 0.9) * 0.25;
    }
  });

  const mastRungs = Math.floor(height / 0.22);

  return (
    <group position={position}>
      {/* Heavy concrete crane foundation pad */}
      <RoundedBox args={[0.48, 0.1, 0.48]} radius={0.015} position={[0, 0.05, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={CONCRETE} roughness={0.8} />
      </RoundedBox>
      {/* 4 Corner mast chords + horizontal bracing rungs for realistic lattice look */}
      {[
        [-0.06, -0.06],
        [0.06, -0.06],
        [-0.06, 0.06],
        [0.06, 0.06],
      ].map(([cx, cz], i) => (
        <mesh key={i} position={[cx, height / 2 + 0.05, cz]} castShadow>
          <boxGeometry args={[0.022, height, 0.022]} />
          <meshStandardMaterial color={BRASS} metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
      {Array.from({ length: mastRungs }, (_, i) => (
        <mesh key={i} position={[0, 0.18 + i * 0.22, 0]}>
          <boxGeometry args={[0.14, 0.016, 0.14]} />
          <meshStandardMaterial color={BRASS} />
        </mesh>
      ))}

      {/* Slewing upper crane assembly */}
      <group ref={jibRef} position={[0, height + 0.05, 0]} rotation={[0, baseYaw, 0]}>
        {/* Operator cab */}
        <RoundedBox args={[0.16, 0.15, 0.14]} radius={0.015} position={[0.08, -0.08, 0.08]} castShadow>
          <meshStandardMaterial color={WHITE} />
        </RoundedBox>
        {/* Main truss jib */}
        <mesh position={[-jibLength * 0.28, 0, 0]} castShadow>
          <boxGeometry args={[jibLength, 0.065, 0.09]} />
          <meshStandardMaterial color={BRASS} metalness={0.4} roughness={0.4} />
        </mesh>
        {/* Top tension tie-rod */}
        <mesh position={[-jibLength * 0.18, 0.1, 0]} rotation={[0, 0, 0.08]}>
          <boxGeometry args={[jibLength * 0.85, 0.016, 0.016]} />
          <meshStandardMaterial color={INK} />
        </mesh>
        {/* Brand-red counterweights */}
        <mesh position={[0.46, -0.04, 0]} castShadow>
          <boxGeometry args={[0.32, 0.16, 0.16]} />
          <meshStandardMaterial color={RED} roughness={0.35} />
        </mesh>
        {/* Trolley & suspended precast façade panel */}
        <group ref={trolleyRef} position={[-jibLength * 0.55, 0, 0]}>
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[0.12, 0.045, 0.1]} />
            <meshStandardMaterial color={INK} />
          </mesh>
          <mesh position={[0, -0.68, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 1.25, 6]} />
            <meshStandardMaterial color={CHARCOAL} />
          </mesh>
          <mesh position={[0, -1.32, 0]} castShadow>
            <boxGeometry args={[0.38, 0.18, 0.08]} />
            <meshStandardMaterial color={LIMESTONE} roughness={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function UpcomingIsometricScene() {
  const renderStructure = (pos: [number, number, number], floors: number, w: number, d: number, cladFloors: number) => {
    const step = 0.26;
    const totalH = floors * step;
    return (
      <group position={pos}>
        {/* Concrete raft foundation */}
        <RoundedBox args={[w + 0.36, 0.1, d + 0.36]} radius={0.02} position={[0, 0.05, 0]} receiveShadow castShadow>
          <meshStandardMaterial color={CONCRETE} roughness={0.85} />
        </RoundedBox>
        {/* Central slip-form concrete core with red hydraulic jump-form rig at top */}
        <mesh position={[0, (totalH + 0.36) / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[w * 0.36, totalH + 0.36, d * 0.36]} />
          <meshStandardMaterial color={TRAVERTINE} roughness={0.75} />
        </mesh>
        <mesh position={[0, totalH + 0.32, 0]} castShadow>
          <boxGeometry args={[w * 0.42, 0.14, d * 0.42]} />
          <meshStandardMaterial color={RED} roughness={0.4} />
        </mesh>
        {/* Perimeter structural columns */}
        {[-w / 2 + 0.06, 0, w / 2 - 0.06].map((cx, i) =>
          [-d / 2 + 0.06, d / 2 - 0.06].map((cz, j) => (
            <mesh key={`${i}-${j}`} position={[cx, totalH / 2 + 0.06, cz]} castShadow>
              <boxGeometry args={[0.06, totalH, 0.06]} />
              <meshStandardMaterial color={BRONZE} />
            </mesh>
          )),
        )}
        {/* Post-tensioned floor slabs */}
        {Array.from({ length: floors }, (_, i) => (
          <mesh key={i} position={[0, 0.14 + i * step, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, 0.045, d]} />
            <meshStandardMaterial color={i < cladFloors ? WHITE : LIMESTONE} roughness={0.65} />
          </mesh>
        ))}
        {/* Lower floors with unitized glass curtain-wall already installed */}
        {Array.from({ length: cladFloors }, (_, i) => (
          <mesh key={i} position={[0, 0.14 + (i + 0.5) * step, 0]}>
            <boxGeometry args={[w - 0.06, step - 0.04, d - 0.06]} />
            <meshStandardMaterial color={GLASS_DARK} metalness={0.65} roughness={0.15} />
          </mesh>
        ))}
        {/* Perimeter cocoon safety screens on upper construction decks */}
        {[floors - 2, floors - 1].map((fi) => (
          <mesh key={fi} position={[0, 0.18 + fi * step, d / 2 + 0.015]} castShadow>
            <boxGeometry args={[w + 0.04, 0.09, 0.02]} />
            <meshStandardMaterial color={RED} />
          </mesh>
        ))}
      </group>
    );
  };

  return (
    <group>
      <IsometricBaseBoard width={6.3} depth={4.7} topColor="#dfd6c5" />

      {/* Site Logistics Haul Road & Perimeter Hoarding */}
      <mesh position={[0, 0.048, 1.48]} receiveShadow>
        <boxGeometry args={[5.9, 0.02, 0.58]} />
        <meshStandardMaterial color={SANDSTONE} roughness={0.9} />
      </mesh>
      {[-1.65, 1.65].map((hx, i) => (
        <group key={i} position={[hx, 0.12, 1.88]}>
          <mesh castShadow>
            <boxGeometry args={[2.1, 0.16, 0.04]} />
            <meshStandardMaterial color={WHITE} />
          </mesh>
          <mesh position={[0, 0.05, 0.022]}>
            <boxGeometry args={[2.1, 0.035, 0.01]} />
            <meshStandardMaterial color={RED} />
          </mesh>
        </group>
      ))}

      {/* Primary 9-Storey Tower & Secondary 6-Storey Wing */}
      {renderStructure([-0.75, 0.04, -0.45], 9, 1.72, 1.22, 4)}
      {renderStructure([1.42, 0.04, -0.48], 6, 1.36, 1.05, 2)}

      {/* Dual 3D Lattice Tower Cranes */}
      <LatticeCraneIsometric position={[0.38, 0.04, 0.42]} height={2.95} jibLength={2.15} baseYaw={0.28} speed={0.55} />
      <LatticeCraneIsometric position={[-2.15, 0.04, -0.78]} height={2.45} jibLength={1.75} baseYaw={2.4} speed={0.72} />

      {/* Site Engineering Portacabins & Precast Laydown Yard */}
      <RoundedBox args={[0.88, 0.24, 0.44]} radius={0.015} position={[-2.15, 0.16, 0.65]} castShadow>
        <meshStandardMaterial color={WHITE} />
      </RoundedBox>
      <RoundedBox args={[0.88, 0.24, 0.44]} radius={0.015} position={[-2.15, 0.4, 0.65]} castShadow>
        <meshStandardMaterial color={LIMESTONE} />
      </RoundedBox>
      <DetailedCar position={[-1.2, 0.058, 1.48]} color={BRASS} moving startX={-2.4} endX={2.4} speed={0.4} />
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. LAND PARCELS ISOMETRIC MASTERPLAN                                       */
/* Contoured Empty Greenfield Lot -> Pop-Up Roads, Railings & Plot Plinths    */
/* -------------------------------------------------------------------------- */

function LandPopStage({
  clockRef,
  delay,
  duration = 0.5,
  sinkY = -0.25,
  children,
}: {
  clockRef: React.RefObject<number>;
  delay: number;
  duration?: number;
  sinkY?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const raw = THREE.MathUtils.clamp((clockRef.current - delay) / duration, 0, 1);
    ref.current.visible = raw > 0.006;
    const curve = raw <= 0 ? 0.001 : easeOutBack(raw);
    const sxz = THREE.MathUtils.lerp(0.82, 1, easeOutCubic(raw));
    ref.current.scale.set(sxz, Math.max(0.001, curve), sxz);
    ref.current.position.y = (1 - raw) * sinkY;
  });
  return <group ref={ref}>{children}</group>;
}

function LandIsometricScene() {
  const clockRef = useRef(0);
  useFrame((_, dt) => {
    clockRef.current = (clockRef.current + Math.min(dt, 0.05)) % 5.6;
  });

  const cols = 4;
  const rows = 2;
  const pw = 1.16;
  const pd = 0.92;
  const gapX = 0.16;
  const gapZ = 0.48;

  return (
    <group>
      <IsometricBaseBoard width={6.3} depth={4.7} topColor="#dccdb6" />

      {/* Contoured raw greenfield terrace (always visible at start of cycle) */}
      <RoundedBox args={[5.7, 0.04, 3.6]} radius={0.02} position={[0, 0.05, 0]} receiveShadow>
        <meshStandardMaterial color="#e4d6c0" roughness={0.92} />
      </RoundedBox>

      {/* Step 1: 30m Internal Sector Boulevard pops up */}
      <LandPopStage clockRef={clockRef} delay={0.3} duration={0.45} sinkY={-0.08}>
        <mesh position={[0, 0.075, 0]} receiveShadow>
          <boxGeometry args={[5.45, 0.02, 0.38]} />
          <meshStandardMaterial color={ASPHALT} roughness={0.8} />
        </mesh>
        {[-2.0, -1.0, 0, 1.0, 2.0].map((x, i) => (
          <mesh key={i} position={[x, 0.088, 0]}>
            <boxGeometry args={[0.45, 0.008, 0.028]} />
            <meshStandardMaterial color={BRASS} />
          </mesh>
        ))}
      </LandPopStage>

      {/* Step 2: 8 Demarcated Villa Plots pop up with kerbs, lawns & corner stones */}
      {Array.from({ length: rows * cols }, (_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const x = (c - (cols - 1) / 2) * (pw + gapX);
        const z = (r === 0 ? -1 : 1) * (pd / 2 + gapZ / 2);
        const prime = i === 5 || i === 6;
        return (
          <group key={i} position={[x, 0, z]}>
            <LandPopStage clockRef={clockRef} delay={0.45 + i * 0.09} duration={0.48} sinkY={-0.18}>
              <RoundedBox args={[pw, 0.09, pd]} radius={0.015} position={[0, 0.095, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={prime ? "#f8e8c0" : WHITE} roughness={0.75} />
              </RoundedBox>
              <mesh position={[0, 0.142, 0]} receiveShadow>
                <boxGeometry args={[pw - 0.12, 0.01, pd - 0.12]} />
                <meshStandardMaterial color={prime ? "#edd396" : LAWN} roughness={0.88} />
              </mesh>
              {/* Crisp boundary kerbs */}
              <mesh position={[0, 0.148, pd / 2 - 0.02]}>
                <boxGeometry args={[pw, 0.016, 0.028]} />
                <meshStandardMaterial color={prime ? RED : BRONZE} />
              </mesh>
              <mesh position={[0, 0.148, -pd / 2 + 0.02]}>
                <boxGeometry args={[pw, 0.016, 0.028]} />
                <meshStandardMaterial color={prime ? RED : BRONZE} />
              </mesh>
              {/* Corner survey monument stone */}
              <mesh position={[-pw / 2 + 0.07, 0.165, pd / 2 - 0.07]} castShadow>
                <boxGeometry args={[0.07, 0.05, 0.07]} />
                <meshStandardMaterial color={prime ? RED : INK} />
              </mesh>
            </LandPopStage>

            {i === 5 && (
              <LandPopStage clockRef={clockRef} delay={1.45} duration={0.5} sinkY={-0.4}>
                <RoundedBox args={[0.18, 0.56, 0.065]} radius={0.012} position={[0.22, 0.38, -0.1]} castShadow>
                  <meshStandardMaterial color={RED} roughness={0.35} />
                </RoundedBox>
              </LandPopStage>
            )}
          </group>
        );
      })}

      {/* Step 3: Perimeter Railings, Gatehouse Arch & Avenue Trees pop up */}
      <LandPopStage clockRef={clockRef} delay={1.2} duration={0.5} sinkY={-0.28}>
        {/* Back & Side Perimeter Walls */}
        <mesh position={[0, 0.16, -1.48]} castShadow>
          <boxGeometry args={[5.45, 0.2, 0.05]} />
          <meshStandardMaterial color={LIMESTONE} />
        </mesh>
        {[-2.72, 2.72].map((sx, idx) => (
          <mesh key={idx} position={[sx, 0.16, 0]} castShadow>
            <boxGeometry args={[0.05, 0.2, 3.0]} />
            <meshStandardMaterial color={LIMESTONE} />
          </mesh>
        ))}
        {/* Front Architectural Railings & Piers */}
        {Array.from({ length: 11 }, (_, i) => (
          <mesh key={i} position={[-2.6 + i * 0.52, 0.18, 1.48]} castShadow>
            <boxGeometry args={[0.055, 0.24, 0.055]} />
            <meshStandardMaterial color={BRONZE} />
          </mesh>
        ))}
        <mesh position={[-1.55, 0.22, 1.48]} castShadow>
          <boxGeometry args={[2.1, 0.028, 0.028]} />
          <meshStandardMaterial color={WHITE} />
        </mesh>
        <mesh position={[1.55, 0.22, 1.48]} castShadow>
          <boxGeometry args={[2.1, 0.028, 0.028]} />
          <meshStandardMaterial color={WHITE} />
        </mesh>
        {/* Estate Entrance Portal Arch */}
        <group position={[0, 0.06, 1.48]}>
          <mesh position={[-0.42, 0.24, 0]} castShadow>
            <boxGeometry args={[0.12, 0.48, 0.12]} />
            <meshStandardMaterial color={BRONZE} />
          </mesh>
          <mesh position={[0.42, 0.24, 0]} castShadow>
            <boxGeometry args={[0.12, 0.48, 0.12]} />
            <meshStandardMaterial color={BRONZE} />
          </mesh>
          <mesh position={[0, 0.48, 0]} castShadow>
            <boxGeometry args={[1.1, 0.09, 0.2]} />
            <meshStandardMaterial color={WHITE} />
          </mesh>
          <mesh position={[0, 0.48, 0.105]}>
            <boxGeometry args={[0.76, 0.04, 0.01]} />
            <meshStandardMaterial color={RED} />
          </mesh>
        </group>
        <DetailedTree position={[-2.45, 0.07, 1.82]} scale={0.95} />
        <DetailedTree position={[2.45, 0.07, 1.82]} scale={0.95} />
      </LandPopStage>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. LEASING ISOMETRIC MASTERPLAN                                            */
/* Grade-A Corporate Office Tower, Leased Retail Flagship & Executive Plaza   */
/* -------------------------------------------------------------------------- */

function LeasingIsometricScene() {
  return (
    <group>
      <IsometricBaseBoard width={6.3} depth={4.7} topColor="#e4ded2" />

      {/* Corporate Drop-Off Plaza & Reflecting Water Court */}
      <RoundedBox args={[5.9, 0.04, 2.25]} radius={0.02} position={[0, 0.055, 0.12]} receiveShadow>
        <meshStandardMaterial color={PAVING} roughness={0.8} />
      </RoundedBox>
      <mesh position={[0.05, 0.08, 0.58]} receiveShadow>
        <boxGeometry args={[1.55, 0.018, 0.54]} />
        <meshStandardMaterial color={WATER} metalness={0.45} roughness={0.12} />
      </mesh>
      {/* Front Boulevard */}
      <mesh position={[0, 0.048, 1.68]} receiveShadow>
        <boxGeometry args={[6.1, 0.02, 0.72]} />
        <meshStandardMaterial color={ASPHALT} roughness={0.8} />
      </mesh>

      {/* 01. Grade-A Corporate Office Tower (Back-Left) */}
      <group position={[-1.62, 0.07, -0.78]}>
        <RoundedBox args={[1.95, 2.45, 1.28]} radius={0.03} position={[0, 1.225, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={GLASS_DARK} metalness={0.68} roughness={0.14} />
        </RoundedBox>
        {/* Horizontal brushed-limestone spandrel bands & illuminated leased office floors */}
        {Array.from({ length: 8 }, (_, i) => {
          const y = 0.28 + i * 0.28;
          return (
            <group key={i} position={[0, y, 0]}>
              <mesh castShadow>
                <boxGeometry args={[2.02, 0.035, 1.34]} />
                <meshStandardMaterial color={WHITE} roughness={0.45} />
              </mesh>
              {i % 2 === 0 && (
                <mesh position={[0, 0.12, 0.645]}>
                  <boxGeometry args={[1.68, 0.16, 0.012]} />
                  <meshStandardMaterial color={WARM_GLOW} emissive={WARM_GLOW} emissiveIntensity={0.45} />
                </mesh>
              )}
            </group>
          );
        })}
        {/* Rooftop Corporate Tenant Crown & Brass Sign */}
        <mesh position={[0, 2.5, 0]} castShadow>
          <boxGeometry args={[1.65, 0.12, 1.05]} />
          <meshStandardMaterial color={BRONZE} roughness={0.4} />
        </mesh>
        <mesh position={[0, 2.5, 0.54]}>
          <boxGeometry args={[0.92, 0.045, 0.015]} />
          <meshStandardMaterial color={BRASS} emissive={BRASS} emissiveIntensity={0.4} />
        </mesh>
        {/* Double-height glass reception canopy */}
        <mesh position={[0, 0.34, 0.82]} castShadow>
          <boxGeometry args={[1.25, 0.045, 0.36]} />
          <meshStandardMaterial color={RED} roughness={0.35} />
        </mesh>
      </group>

      {/* 02. Anchor Retail Flagship & Leased Boutique Wing (Back-Right) */}
      <group position={[1.25, 0.07, -0.68]}>
        <RoundedBox args={[2.35, 1.48, 1.22]} radius={0.03} position={[0, 0.74, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={LIMESTONE} roughness={0.5} />
        </RoundedBox>
        {/* Ground-floor anchor tenant storefront */}
        <mesh position={[-0.45, 0.42, 0.615]}>
          <boxGeometry args={[1.18, 0.58, 0.018]} />
          <meshStandardMaterial color={WARM_GLOW} emissive={WARM_GLOW} emissiveIntensity={0.52} />
        </mesh>
        <mesh position={[0.68, 0.42, 0.615]}>
          <boxGeometry args={[0.82, 0.58, 0.018]} />
          <meshStandardMaterial color={WARM_GLOW} emissive={WARM_GLOW} emissiveIntensity={0.42} />
        </mesh>
        {/* Upper leased studio/office floor */}
        <mesh position={[0, 1.06, 0.615]}>
          <boxGeometry args={[2.05, 0.34, 0.018]} />
          <meshStandardMaterial color={GLASS_TINT} metalness={0.6} roughness={0.16} />
        </mesh>
        {/* Cantilevered brass & red awnings */}
        <mesh position={[-0.45, 0.74, 0.74]} castShadow>
          <boxGeometry args={[1.24, 0.048, 0.26]} />
          <meshStandardMaterial color={RED} roughness={0.38} />
        </mesh>
        <mesh position={[0.68, 0.74, 0.74]} castShadow>
          <boxGeometry args={[0.88, 0.048, 0.26]} />
          <meshStandardMaterial color={BRASS} roughness={0.38} />
        </mesh>
      </group>

      {/* Trees & Executive Fleet */}
      <DetailedTree position={[-2.62, 0.07, 0.65]} scale={1.05} />
      <DetailedTree position={[-0.78, 0.07, 0.65]} scale={0.92} />
      <DetailedTree position={[1.05, 0.07, 0.65]} scale={0.92} />
      <DetailedTree position={[2.62, 0.07, 0.58]} scale={1.05} />
      <DetailedCar position={[-1.6, 0.058, 1.52]} color={WHITE} moving startX={-2.6} endX={2.6} speed={0.48} />
      <DetailedCar position={[1.4, 0.058, 1.84]} rotationY={Math.PI} color={INK} moving startX={2.6} endX={-2.6} speed={0.42} />
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* True Isometric Stage Wrapper with Responsive Fit & Gentle Hover Tilt       */
/* -------------------------------------------------------------------------- */

function IsometricStage({ activeId }: { activeId: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport, camera } = useThree();
  const availW = viewport.getCurrentViewport(camera, [0, 0, 0]).width;
  const fitScale = Math.min(0.86, (availW * 0.88) / 7.8);

  useFrame((state, dt) => {
    const step = Math.min(dt, 0.05);
    if (!groupRef.current) return;
    // True 45° isometric yaw (-Math.PI / 4) + subtle interactive cursor tilt
    const targetYaw = -Math.PI / 4 + state.pointer.x * 0.08;
    const targetPitch = -state.pointer.y * 0.05;
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetYaw, 3, step);
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetPitch, 3, step);
  });

  return (
    <group ref={groupRef} position={[0, -0.35, 0]} rotation={[0, -Math.PI / 4, 0]} scale={fitScale}>
      {activeId === "homes" && <HomesIsometricScene />}
      {activeId === "commercial" && <CommercialIsometricScene />}
      {activeId === "upcoming" && <UpcomingIsometricScene />}
      {activeId === "land" && <LandIsometricScene />}
      {activeId === "leasing" && <LeasingIsometricScene />}
    </group>
  );
}

export default function HeroBannerScene({ activeId }: { activeId: string }) {
  return (
    <Canvas
      shadows="soft"
      dpr={[1.5, 2]}
      /* Narrow-FOV telephoto camera at isometric elevation produces razor-sharp parallel architectural lines */
      camera={{ position: [0, 9.2, 13.2], fov: 17 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ camera }) => {
        camera.lookAt(0, 0.35, 0);
      }}
    >
      <ambientLight intensity={0.72} />
      <hemisphereLight args={["#fff9f0", "#c9bfb0", 0.65]} />
      <directionalLight
        position={[8, 14, 9]}
        intensity={2.05}
        color="#fff6e8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0003}
      />
      <directionalLight position={[-7, 6, -5]} intensity={0.48} color="#ffd8c4" />
      <IsometricStage activeId={activeId} />
    </Canvas>
  );
}
