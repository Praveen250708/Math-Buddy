/**
 * StreakRing — SVG circular progress ring for the dashboard hero.
 *
 * Props:
 *   value  — current streak count (0 = empty ring, 7+ = full ring)
 *   size   — diameter in px (default 88)
 *
 * Arc fill formula: min(value, 7) / 7
 * Progress drawn from 12 o'clock (top), sweeping clockwise.
 * Amber fill (#FFB020), dark track, rounded end-caps, no fill inside.
 */

interface StreakRingProps {
  value: number;
  size?: number;
}

export function StreakRing({ value, size = 88 }: StreakRingProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // min(value, 7) / 7 — clamp to [0, 1]
  const pct = Math.min(Math.max(value, 0), 7) / 7;
  const dashOffset = circumference * (1 - pct);

  const cx = size / 2;
  const cy = size / 2;

  return (
    // position: relative so the absolutely-positioned center text sits over the SVG
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`${value} day streak`}
      role="img"
    >
      {/* SVG ring — rotated -90° so arc starts at 12 o'clock */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)", display: "block" }}
      >
        {/* Track ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#FFB020"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>

      {/* Center text — absolutely positioned over the SVG */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
      >
        <span
          className="font-display font-bold text-white leading-none"
          style={{ fontSize: Math.round(size * 0.28) }}
        >
          {value}
        </span>
        <span
          className="uppercase tracking-wider text-white/50 font-semibold"
          style={{ fontSize: Math.round(size * 0.1), marginTop: 3 }}
        >
          day streak
        </span>
      </div>
    </div>
  );
}
