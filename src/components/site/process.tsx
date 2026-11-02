"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { CheckCircle2, ClipboardCheck, Compass, Handshake, KeyRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mark } from "@/components/brand/logo";
import { STEPS } from "@/lib/content";
import { cn } from "@/lib/utils";

const TOTAL_FRAMES = 240; // 60 frames per step × 4 steps
const FRAMES_PER_STEP = 60;
const FPS = 10.5; // ~5.7 seconds per step (~23s full loop)

const STEP_META = [
  {
    n: "01",
    icon: Compass,
    deliverable: "Written requirement & budget plan",
  },
  {
    n: "02",
    icon: ClipboardCheck,
    deliverable: "On-site & RERA verification report",
  },
  {
    n: "03",
    icon: Handshake,
    deliverable: "Negotiated terms, loan & sale deed",
  },
  {
    n: "04",
    icon: KeyRound,
    deliverable: "Registration, handover & annual review",
  },
] as const;

function clamp(v: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - clamp(t), 3);
}

function easeInOutCubic(t: number) {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeOutBack(t: number) {
  const x = clamp(t);
  const c1 = 1.45;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function isoProject(x: number, y: number, z: number, cx: number, cy: number, scale: number): [number, number] {
  const cos30 = 0.8660254;
  const sin30 = 0.5;
  const sx = cx + (x - z) * cos30 * scale;
  const sy = cy + (x + z) * sin30 * scale - y * scale;
  return [sx, sy];
}

function drawIsoPrism(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  colors: { top: string; left: string; right: string; stroke?: string; alpha?: number },
) {
  if (h <= 0.001) return;
  const hw = w / 2;
  const hd = d / 2;

  const p001 = isoProject(x - hw, y + h, z - hd, cx, cy, scale);
  const p101 = isoProject(x + hw, y + h, z - hd, cx, cy, scale);
  const p111 = isoProject(x + hw, y + h, z + hd, cx, cy, scale);
  const p011 = isoProject(x - hw, y + h, z + hd, cx, cy, scale);

  const p100 = isoProject(x + hw, y, z - hd, cx, cy, scale);
  const p110 = isoProject(x + hw, y, z + hd, cx, cy, scale);
  const p010 = isoProject(x - hw, y, z + hd, cx, cy, scale);

  ctx.save();
  if (colors.alpha !== undefined) ctx.globalAlpha = colors.alpha;

  ctx.beginPath();
  ctx.moveTo(p011[0], p011[1]);
  ctx.lineTo(p111[0], p111[1]);
  ctx.lineTo(p110[0], p110[1]);
  ctx.lineTo(p010[0], p010[1]);
  ctx.closePath();
  ctx.fillStyle = colors.left;
  ctx.fill();
  if (colors.stroke) {
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(p111[0], p111[1]);
  ctx.lineTo(p101[0], p101[1]);
  ctx.lineTo(p100[0], p100[1]);
  ctx.lineTo(p110[0], p110[1]);
  ctx.closePath();
  ctx.fillStyle = colors.right;
  ctx.fill();
  if (colors.stroke) {
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(p001[0], p001[1]);
  ctx.lineTo(p101[0], p101[1]);
  ctx.lineTo(p111[0], p111[1]);
  ctx.lineTo(p011[0], p011[1]);
  ctx.closePath();
  ctx.fillStyle = colors.top;
  ctx.fill();
  if (colors.stroke) {
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}

function drawCalloutPill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  sub: string,
  accent: string,
  alpha: number,
) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = "600 11px Inter, system-ui, sans-serif";
  const w1 = ctx.measureText(label).width;
  ctx.font = "500 10px Inter, system-ui, sans-serif";
  const w2 = ctx.measureText(sub).width;
  const boxW = Math.max(w1, w2) + 32;
  const boxH = 38;
  const bx = x - boxW / 2;
  const by = y - boxH / 2;

  ctx.fillStyle = "rgba(18, 19, 23, 0.9)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(bx, by, boxW, boxH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.roundRect(bx + 8, by + 9, 4, boxH - 18, 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "600 11px Inter, system-ui, sans-serif";
  ctx.fillText(label, bx + 18, by + 16);

  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.font = "500 10px Inter, system-ui, sans-serif";
  ctx.fillText(sub, bx + 18, by + 29);
  ctx.restore();
}

function renderHyperframe(ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) {
  ctx.clearRect(0, 0, width, height);

  const safeFrame = Number.isFinite(frame) ? ((frame % TOTAL_FRAMES) + TOTAL_FRAMES) % TOTAL_FRAMES : 0;

  const bgGrad = ctx.createRadialGradient(width * 0.5, height * 0.45, 20, width * 0.5, height * 0.5, width * 0.7);
  bgGrad.addColorStop(0, "#1d2028");
  bgGrad.addColorStop(0.6, "#14161b");
  bgGrad.addColorStop(1, "#0f1014");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,255,255,0.05)";
  const gridStep = 26;
  for (let gx = gridStep; gx < width; gx += gridStep) {
    for (let gy = gridStep; gy < height; gy += gridStep) {
      ctx.fillRect(gx, gy, 1.2, 1.2);
    }
  }

  const cx = width * 0.5;
  const cy = height * 0.6;
  const scale = Math.min(width, height) * 0.088;

  const stepIdx = clamp(Math.floor(safeFrame / FRAMES_PER_STEP), 0, STEPS.length - 1);
  const localFrame = safeFrame - stepIdx * FRAMES_PER_STEP;
  const t = clamp(localFrame / (FRAMES_PER_STEP - 1));

  // Isometric base platform
  drawIsoPrism(ctx, cx, cy, scale, 0, -0.35, 0, 6.2, 0.25, 6.2, {
    top: "#23262f",
    left: "#181a20",
    right: "#121418",
    stroke: "rgba(255,255,255,0.12)",
  });
  drawIsoPrism(ctx, cx, cy, scale, 0, -0.1, 0, 5.7, 0.1, 5.7, {
    top: "#2b2f3a",
    left: "#20232b",
    right: "#191c22",
    stroke: "rgba(201,149,43,0.32)",
  });

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    const a = isoProject(i * 1.1, 0, -2.5, cx, cy, scale);
    const b = isoProject(i * 1.1, 0, 2.5, cx, cy, scale);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();

    const c = isoProject(-2.5, 0, i * 1.1, cx, cy, scale);
    const d = isoProject(2.5, 0, i * 1.1, cx, cy, scale);
    ctx.beginPath();
    ctx.moveTo(c[0], c[1]);
    ctx.lineTo(d[0], d[1]);
    ctx.stroke();
  }
  ctx.restore();

  // Step 01: Know your appetite
  if (stepIdx === 0) {
    const pPlot = easeOutCubic(t / 0.35);
    const pBars = easeOutBack((t - 0.18) / 0.55);
    const pLock = easeInOutCubic((t - 0.55) / 0.4);

    drawIsoPrism(ctx, cx, cy, scale, 0, 0, 0, 3.6 * pPlot, 0.08, 3.6 * pPlot, {
      top: "rgba(200, 16, 46, 0.18)",
      left: "rgba(200, 16, 46, 0.35)",
      right: "rgba(142, 11, 31, 0.35)",
      stroke: "#c8102e",
    });

    const pillars = [
      { x: -1.15, z: 0.4, h: 1.65 * pBars, top: "#fcfbf9", left: "#e7e0d4", right: "#cfc6b6", stroke: "rgba(255,255,255,0.4)" },
      { x: 0, z: 0, h: 2.35 * pBars, top: "#e0263f", left: "#c8102e", right: "#8e0b1f", stroke: "#ff6b7f" },
      { x: 1.15, z: -0.4, h: 1.95 * pBars, top: "#e5b85c", left: "#c9952b", right: "#9a6f1a", stroke: "#f6ead0" },
    ];
    for (const pil of pillars) {
      drawIsoPrism(ctx, cx, cy, scale, pil.x, 0.08, pil.z, 0.88, pil.h, 0.88, pil);
    }

    if (pLock > 0.02) {
      const centerTop = isoProject(0, 0.12, 0, cx, cy, scale);
      ctx.save();
      ctx.strokeStyle = `rgba(201, 149, 43, ${0.7 * pLock})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.ellipse(centerTop[0], centerTop[1], scale * 2.5 * pLock, scale * 1.35 * pLock, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    drawCalloutPill(ctx, width * 0.25, height * 0.22, "Budget & Horizon", "Matched to your plan", "#fcfbf9", easeOutCubic((t - 0.15) / 0.3));
    drawCalloutPill(ctx, width * 0.75, height * 0.22, "End-Use vs. Yield", "Risk comfort agreed", "#c9952b", easeOutCubic((t - 0.35) / 0.3));
    drawCalloutPill(ctx, width * 0.5, height * 0.84, "Mandate Agreed", "Single advisor assigned", "#c8102e", pLock);
  }

  // Step 02: Pick the ingredients
  if (stepIdx === 1) {
    const rise = easeOutCubic(t / 0.3);
    const scanPos = easeInOutCubic((t - 0.2) / 0.55);
    const filterOut = easeInOutCubic((t - 0.62) / 0.32);

    const leftAlpha = 1 - filterOut * 0.68;
    drawIsoPrism(ctx, cx, cy, scale, -1.55, 0, 0.65, 1.1, 1.55 * rise * (1 - filterOut * 0.35), 1.1, {
      top: "#3a3f4d",
      left: "#2c303b",
      right: "#22252e",
      stroke: "rgba(255,255,255,0.2)",
      alpha: leftAlpha,
    });

    drawIsoPrism(ctx, cx, cy, scale, 1.55, 0, -0.65, 1.1, 1.35 * rise * (1 - filterOut * 0.35), 1.1, {
      top: "#3a3f4d",
      left: "#2c303b",
      right: "#22252e",
      stroke: "rgba(255,255,255,0.2)",
      alpha: leftAlpha,
    });

    const winFloors = 7;
    const fh = 0.32 * rise;
    for (let f = 0; f < winFloors; f++) {
      const y = f * fh;
      const isScanned = scanPos * winFloors >= f;
      drawIsoPrism(ctx, cx, cy, scale, 0, y, 0, 1.55, fh * 0.82, 1.55, {
        top: isScanned ? "#fcfbf9" : "#3a3f4d",
        left: isScanned ? "#f1ece3" : "#2c303b",
        right: isScanned ? "#d8cebe" : "#22252e",
        stroke: isScanned ? "rgba(200,16,46,0.45)" : "rgba(255,255,255,0.15)",
      });
    }
    drawIsoPrism(ctx, cx, cy, scale, 0, winFloors * fh, 0, 1.15, 0.14 * rise, 1.15, {
      top: "#e0263f",
      left: "#c8102e",
      right: "#8e0b1f",
    });

    if (t > 0.18 && t < 0.82) {
      const laserY = scanPos * (winFloors * fh + 0.2);
      drawIsoPrism(ctx, cx, cy, scale, 0, laserY, 0, 2.35, 0.03, 2.35, {
        top: "rgba(200, 16, 46, 0.45)",
        left: "#c8102e",
        right: "#c8102e",
        stroke: "#ff6b7f",
      });
    }

    drawCalloutPill(ctx, width * 0.24, height * 0.22, "RERA & Approvals", "Sanction plans checked", "#c8102e", easeOutCubic((t - 0.15) / 0.25));
    drawCalloutPill(ctx, width * 0.76, height * 0.24, "Builder Track Record", "Past deliveries verified", "#c9952b", easeOutCubic((t - 0.35) / 0.25));
    drawCalloutPill(ctx, width * 0.5, height * 0.84, "Verified Shortlist", "Unverified options filtered out", "#fcfbf9", filterOut);
  }

  // Step 03: Cook the deal
  if (stepIdx === 2) {
    const explode = Math.sin(clamp(t / 0.85) * Math.PI);
    const gap = explode * 0.58;
    const lockIn = easeOutBack((t - 0.65) / 0.35);

    drawIsoPrism(ctx, cx, cy, scale, 0, 0, 0, 2.35, 0.38, 2.35, {
      top: "#e6dfd3",
      left: "#d4cab8",
      right: "#b8ae9c",
      stroke: "#c9952b",
    });

    drawIsoPrism(ctx, cx, cy, scale, 0, 0.44 + gap, 0, 1.85, 1.15, 1.85, {
      top: "#fcfbf9",
      left: "#f1ece3",
      right: "#dcd3c2",
      stroke: "rgba(17,17,17,0.35)",
    });
    drawIsoPrism(ctx, cx, cy, scale, 0, 0.68 + gap, 0, 1.9, 0.35, 1.9, {
      top: "#2c4257",
      left: "#1e2d3d",
      right: "#15202b",
      stroke: "#c9952b",
    });

    drawIsoPrism(ctx, cx, cy, scale, 0, 1.65 + gap * 2, 0, 1.95, 0.28, 1.95, {
      top: "#e0263f",
      left: "#c8102e",
      right: "#8e0b1f",
      stroke: "#ff6b7f",
    });

    if (explode > 0.05) {
      ctx.save();
      ctx.strokeStyle = `rgba(201, 149, 43, ${0.65 * explode})`;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      for (const [dx, dz] of [
        [-0.9, -0.9],
        [0.9, -0.9],
        [-0.9, 0.9],
        [0.9, 0.9],
      ]) {
        const pBot = isoProject(dx, 0.38, dz, cx, cy, scale);
        const pTop = isoProject(dx, 1.65 + gap * 2, dz, cx, cy, scale);
        ctx.beginPath();
        ctx.moveTo(pBot[0], pBot[1]);
        ctx.lineTo(pTop[0], pTop[1]);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawCalloutPill(ctx, width * 0.24, height * 0.22, "Price Negotiated", "Benchmarked against recent deals", "#c9952b", easeOutCubic((t - 0.1) / 0.25));
    drawCalloutPill(ctx, width * 0.76, height * 0.24, "Loan & Tax Setup", "Joint ownership & paperwork", "#fcfbf9", easeOutCubic((t - 0.3) / 0.25));
    drawCalloutPill(ctx, width * 0.5, height * 0.84, "Terms Finalised", "Ready for registration", "#c8102e", lockIn);
  }

  // Step 04: Serve & grow
  if (stepIdx === 3) {
    const build = easeOutCubic(t / 0.35);
    const glow = easeInOutCubic((t - 0.25) / 0.45);
    const curveProgress = easeInOutCubic((t - 0.35) / 0.55);

    drawIsoPrism(ctx, cx, cy, scale, 0, 0, 0, 3.8, 0.14, 3.8, {
      top: "#738c66",
      left: "#536b48",
      right: "#435739",
      stroke: "rgba(255,255,255,0.25)",
    });

    const hTower = 2.25 * build;
    drawIsoPrism(ctx, cx, cy, scale, -0.45, 0.14, -0.35, 1.55, hTower, 1.35, {
      top: "#fcfbf9",
      left: "#f2ede4",
      right: "#dfd6c5",
      stroke: "rgba(17,17,17,0.3)",
    });
    for (let w = 0; w < 5; w++) {
      const wy = 0.36 + w * 0.38 * build;
      drawIsoPrism(ctx, cx, cy, scale, -0.45, wy, -0.35, 1.58, 0.14 * build, 1.38, {
        top: "#ffcf78",
        left: glow > 0.2 ? "#ffcf78" : "#2c4257",
        right: glow > 0.2 ? "#e5a93c" : "#1e2d3d",
      });
    }
    drawIsoPrism(ctx, cx, cy, scale, -0.45, 0.14 + hTower, -0.35, 1.2, 0.14 * build, 1.05, {
      top: "#e0263f",
      left: "#c8102e",
      right: "#8e0b1f",
    });

    drawIsoPrism(ctx, cx, cy, scale, 0.95, 0.14, 0.45, 1.35, 1.05 * build, 1.15, {
      top: "#fcfbf9",
      left: "#eae3d5",
      right: "#d4cab8",
      stroke: "rgba(17,17,17,0.25)",
    });
    drawIsoPrism(ctx, cx, cy, scale, 0.95, 0.14 + 1.05 * build, 0.45, 1.4, 0.08 * build, 1.2, {
      top: "#c9952b",
      left: "#b07f1e",
      right: "#8c6314",
    });

    if (curveProgress > 0.02) {
      ctx.save();
      ctx.strokeStyle = "#c9952b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      const steps = 24;
      const maxStep = Math.max(2, Math.floor(steps * curveProgress));
      for (let i = 0; i <= maxStep; i++) {
        const u = i / steps;
        const gx = -2.2 + u * 4.4;
        const gy = 0.3 + Math.pow(u, 1.7) * 2.4;
        const gz = 1.6 - u * 0.8;
        const [sx, sy] = isoProject(gx, gy, gz, cx, cy, scale);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.restore();
    }

    drawCalloutPill(ctx, width * 0.24, height * 0.22, "Possession & Keys", "Registered & handed over", "#fcfbf9", easeOutCubic((t - 0.1) / 0.25));
    drawCalloutPill(ctx, width * 0.76, height * 0.22, "Leasing & Upkeep", "Tenant placed & managed", "#c9952b", easeOutCubic((t - 0.3) / 0.25));
    drawCalloutPill(ctx, width * 0.5, height * 0.84, "Annual Portfolio Check", "Hold & exit reviewed yearly", "#c8102e", curveProgress);
  }
}

export function Process({ interactive = false }: { interactive?: boolean } = {}) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inView = useInView(sectionRef, { amount: 0.2 });

  const [frame, setFrame] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [paused, setPaused] = useState(false);
  const frameRef = useRef(0);

  const safeFrame = Number.isFinite(frame) ? ((frame % TOTAL_FRAMES) + TOTAL_FRAMES) % TOTAL_FRAMES : 0;
  const activeStepIdx = clamp(Math.floor(safeFrame / FRAMES_PER_STEP), 0, STEPS.length - 1);
  const activeStep = STEPS[activeStepIdx] ?? STEPS[0];
  const activeMeta = STEP_META[activeStepIdx] ?? STEP_META[0];
  const visibleSteps = STEPS.map((s, idx) => ({ s, idx })).slice(activeStepIdx);

  const drawFrame = useCallback((f: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(300, Math.floor(rect.width));
    const h = Math.max(260, Math.floor(rect.height));
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    ctx.save();
    ctx.scale(dpr, dpr);
    renderHyperframe(ctx, w, h, f);
    ctx.restore();
  }, []);

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      const dt = Number.isFinite(rawDt) && rawDt > 0 ? Math.min(rawDt, 0.1) : 0;
      lastTime = now;

      if (inView && !(interactive && paused)) {
        const nextFrame = frameRef.current + dt * FPS;
        if (nextFrame >= TOTAL_FRAMES) {
          frameRef.current = ((nextFrame % TOTAL_FRAMES) + TOTAL_FRAMES) % TOTAL_FRAMES;
          setCycle((c) => c + 1);
        } else {
          frameRef.current = Math.max(0, nextFrame);
        }
        const rounded = Math.floor(frameRef.current);
        setFrame(rounded);
        drawFrame(frameRef.current);
      } else {
        drawFrame(frameRef.current);
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [inView, interactive, paused, drawFrame]);

  useEffect(() => {
    const onResize = () => drawFrame(frameRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [drawFrame]);

  return (
    <section
      ref={sectionRef}
      id="process"
      className="relative scroll-mt-24 overflow-hidden bg-white py-24 sm:py-32"
    >
      <div className="section">
        {/* Top Section Header */}
        <div className="flex flex-col justify-between gap-6 border-b border-border pb-12 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <span className="eyebrow">The RealtyCook recipe</span>
            <h2 className="mt-4 text-4xl font-semibold text-ink sm:text-5xl lg:text-[3.35rem]">
              Four steps from{" "}
              <em className="font-script text-[1.25em] font-normal text-brand-red not-italic">craving</em> to keys.
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-ink/65">
            The same tested method for a first home, a flagship showroom or a plotted land parcel. Nothing is skipped,
            and you always know which step you&apos;re on.
          </p>
        </div>

        {/* Balanced Equal-Height Split: Left Animation (500px) & Right Auto-Swiping Cards (500px) */}
        <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          {/* Left Column: Clean Hyperframe Animation Card */}
          <div className="flex h-[460px] flex-col overflow-hidden rounded-[2rem] border border-ink/15 bg-ink text-white shadow-lift sm:h-[500px]">
            {/* Clean Top Bar */}
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-xl bg-brand-red font-heading text-sm font-semibold text-white">
                  {activeStep.n}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{activeStep.title}</p>
                  <p className="text-xs text-white/55">{activeMeta.deliverable}</p>
                </div>
              </div>

              {/* Minimal 4-step progress pills */}
              <div className="flex items-center gap-1.5" aria-label={interactive ? "Jump to step" : undefined}>
                {STEPS.map((s, idx) =>
                  interactive ? (
                    <button
                      key={s.n}
                      type="button"
                      aria-label={`Jump to step ${s.n}`}
                      onClick={() => {
                        if (idx < activeStepIdx) setCycle((c) => c + 1);
                        const next = idx * FRAMES_PER_STEP + 4;
                        frameRef.current = next;
                        setFrame(next);
                        drawFrame(next);
                      }}
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        idx === activeStepIdx
                          ? "w-8 bg-brand-red"
                          : idx < activeStepIdx
                            ? "w-3 bg-white/55 hover:bg-white"
                            : "w-3 bg-white/20 hover:bg-white/50",
                      )}
                    />
                  ) : (
                    <span
                      key={s.n}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        idx === activeStepIdx ? "w-7 bg-brand-red" : idx < activeStepIdx ? "w-2.5 bg-white/45" : "w-2.5 bg-white/15",
                      )}
                    />
                  ),
                )}
              </div>
            </div>

            {/* Canvas Viewport */}
            <div className="relative flex-1">
              <canvas
                ref={canvasRef}
                className="block h-full w-full"
                aria-label={`Animated recipe step ${activeStep.n}: ${activeStep.title}`}
              />
            </div>

            {/* Subtle Bottom Promise Bar */}
            <div className="flex items-center gap-3.5 border-t border-white/10 bg-[#14161b] px-6 py-3.5">
              <Mark inverted className="h-7 shrink-0" />
              <p className="text-xs text-white/70">
                Every deal gets a written checklist and a single named advisor—you never chase three people for one
                answer.
              </p>
            </div>
          </div>

          {/* Right Column: Same Height (460px / 500px), Auto-Swiping Cards with Top & Bottom Border Fade */}
          <div
            onMouseEnter={() => interactive && setPaused(true)}
            onMouseLeave={() => interactive && setPaused(false)}
            className="relative h-[460px] overflow-hidden rounded-[2rem] border border-border/80 bg-cream/35 p-4 sm:h-[500px] sm:p-6"
          >
            {/* Soft fade-out gradients near the top and bottom borders */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 z-20 h-8 bg-gradient-to-b from-cream/90 to-transparent"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-28 bg-gradient-to-t from-white via-white/85 to-transparent"
            />

            {/* Vertical connecting timeline line */}
            <span
              className="pointer-events-none absolute top-8 bottom-12 left-[43px] w-px bg-gradient-to-b from-brand-red via-border to-transparent sm:left-[51px]"
              aria-hidden="true"
            />

            <ol className="relative space-y-4 pt-1">
              <AnimatePresence mode="popLayout" initial={false}>
                {visibleSteps.map(({ s, idx }, listPos) => {
                  const meta = STEP_META[idx];
                  const Icon = meta.icon;
                  const isActive = listPos === 0;
                  const stepProgress = isActive
                    ? clamp((safeFrame - idx * FRAMES_PER_STEP) / (FRAMES_PER_STEP - 1))
                    : 0;

                  return (
                    <motion.li
                      key={`${cycle}-${s.n}`}
                      layout
                      initial={{ opacity: 0, y: 64, scale: 0.96 }}
                      animate={{
                        opacity: isActive ? 1 : listPos === 1 ? 0.58 : 0.25,
                        y: 0,
                        scale: isActive ? 1 : 0.985,
                        transition: {
                          type: "spring",
                          stiffness: 240,
                          damping: 28,
                        },
                      }}
                      exit={{
                        opacity: 0,
                        y: -130,
                        scale: 0.95,
                        filter: "blur(4px)",
                        transition: { duration: 0.55, ease: [0.32, 0, 0.2, 1] },
                      }}
                      className="pointer-events-none relative select-none"
                    >
                      <article
                        className={cn(
                          "relative flex w-full gap-5 rounded-[1.6rem] border p-5 transition-colors duration-300 sm:p-6",
                          isActive
                            ? "border-brand-red/50 bg-white shadow-lift"
                            : "border-border/70 bg-white/60",
                        )}
                      >
                        {/* Step Number Badge */}
                        <span
                          className={cn(
                            "relative z-10 flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl border font-heading text-base font-semibold transition-all duration-300",
                            isActive
                              ? "scale-105 border-brand-red bg-brand-red text-white shadow-red"
                              : "border-border bg-cream text-ink/65",
                          )}
                        >
                          <span>{s.n}</span>
                          <Icon className={cn("mt-0.5 size-3.5", isActive ? "text-white/90" : "text-brand-red/70")} />
                        </span>

                        {/* Step Content */}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xl font-semibold text-ink sm:text-2xl">{s.title}</h3>
                          <p className="mt-2 text-sm leading-relaxed text-ink/70 sm:text-base">{s.body}</p>

                          <div className="mt-4 flex items-center gap-2 border-t border-border/70 pt-3.5 text-xs font-medium text-ink/75">
                            <CheckCircle2 className={cn("size-3.5 shrink-0", isActive ? "text-brand-red" : "text-ink/35")} />
                            <span>{meta.deliverable}</span>
                          </div>

                          {/* Active Step Progress Bar */}
                          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink/8">
                            <div
                              className="h-full bg-brand-red transition-[width] duration-150 ease-out"
                              style={{ width: `${Math.round(stepProgress * 100)}%` }}
                            />
                          </div>
                        </div>
                      </article>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
