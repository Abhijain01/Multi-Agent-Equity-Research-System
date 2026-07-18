"use client";

interface Props {
  values: number[];
  width?: number;
  height?: number;
  colorClass?: string; // tailwind text-* class, stroke uses currentColor
}

export default function Sparkline({ values, width = 600, height = 220, colorClass = "text-accent-blue" }: Props) {
  if (!values || values.length < 2) {
    return (
      <div className="w-full h-full flex items-center justify-center text-text-muted text-label-sm">
        No historical data available
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });

  const areaPoints = `0,${height} ${points.join(" ")} ${width},${height}`;
  const trendUp = values[values.length - 1] >= values[0];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`w-full h-full ${trendUp ? "text-growth-emerald" : "text-risk-crimson"}`} preserveAspectRatio="none">
      <polygon points={areaPoints} fill="currentColor" opacity="0.08" />
      <polyline points={points.join(" ")} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}