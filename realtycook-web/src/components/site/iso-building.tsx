const PALETTE = {
  red: { top: "#e2364f", left: "#c8102e", right: "#8e0b1f", bg: "#fbe7ea" },
  ink: { top: "#4a4a50", left: "#2a2a2d", right: "#141416", bg: "#ebe7e1" },
  gold: { top: "#e3b65a", left: "#c9952b", right: "#94681a", bg: "#f6ead0" },
} as const;

/** Small isometric block used as the visual for each listing card. */
export function IsoBuilding({ floors, hue }: { floors: number; hue: keyof typeof PALETTE }) {
  const p = PALETTE[hue];
  const fh = floors <= 1 ? 0 : Math.min(15, 110 / floors);
  const h = floors <= 1 ? 0 : fh * floors;
  const baseY = 150;
  const cx = 120;
  const w = 56;
  const iso = w / 2;

  const left = `${cx - w},${baseY - iso} ${cx},${baseY} ${cx},${baseY - h} ${cx - w},${baseY - iso - h}`;
  const right = `${cx},${baseY} ${cx + w},${baseY - iso} ${cx + w},${baseY - iso - h} ${cx},${baseY - h}`;
  const top = `${cx - w},${baseY - iso - h} ${cx},${baseY - h} ${cx + w},${baseY - iso - h} ${cx},${baseY - 2 * iso - h}`;

  return (
    <svg viewBox="0 0 240 180" className="h-full w-full" aria-hidden="true">
      <rect width="240" height="180" fill={p.bg} />
      <polygon points={`${cx - 96},${baseY - 4} ${cx},${baseY + 44} ${cx + 96},${baseY - 4} ${cx},${baseY - 52}`} fill="#ffffff" opacity="0.75" />
      {floors <= 1 ? (
        <g>
          <polygon points={top} fill="none" stroke={p.left} strokeWidth="2.5" strokeDasharray="6 5" />
          <circle cx={cx} cy={baseY - iso - 26} r="11" fill={p.left} />
          <circle cx={cx} cy={baseY - iso - 26} r="4" fill="#fff" />
          <path d={`M${cx - 7} ${baseY - iso - 19} L${cx} ${baseY - iso - 4} L${cx + 7} ${baseY - iso - 19}`} fill={p.left} />
        </g>
      ) : (
        <g>
          <polygon points={left} fill={p.left} />
          <polygon points={right} fill={p.right} />
          <polygon points={top} fill={p.top} />
          {Array.from({ length: floors }, (_, i) => {
            const y = baseY - fh * (i + 0.5);
            return (
              <g key={i} opacity="0.55">
                <line x1={cx - w + 8} y1={y - iso + 4} x2={cx - 8} y2={y - 4} stroke="#fff" strokeWidth="2" strokeDasharray="7 5" />
                <line x1={cx + 8} y1={y - 4} x2={cx + w - 8} y2={y - iso + 4} stroke="#fff" strokeWidth="2" strokeDasharray="7 5" opacity="0.6" />
              </g>
            );
          })}
        </g>
      )}
      <circle cx="40" cy="128" r="12" fill="#a7b39a" />
      <circle cx="206" cy="120" r="9" fill="#a7b39a" />
    </svg>
  );
}
