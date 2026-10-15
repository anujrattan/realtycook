"use client";

import { Component, type ReactNode, useEffect, useRef, useState, useSyncExternalStore } from "react";

class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

let webglSupport: boolean | undefined;
function hasWebGL() {
  if (webglSupport === undefined) {
    try {
      const c = document.createElement("canvas");
      webglSupport = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}

export function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/**
 * Mounts a WebGL scene only once it scrolls near the viewport, and swaps in
 * `fallback` when WebGL is unavailable or the scene throws.
 */
export function CanvasShell({
  children,
  fallback,
  loading,
  className,
}: {
  children: ReactNode;
  fallback: ReactNode;
  loading: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"waiting" | "scene" | "fallback">("waiting");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMode(hasWebGL() ? "scene" : "fallback");
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {mode === "fallback" ? (
        fallback
      ) : mode === "scene" ? (
        <SceneBoundary fallback={fallback}>{children}</SceneBoundary>
      ) : (
        loading
      )}
    </div>
  );
}
