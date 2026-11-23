interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  primaryLabel: string;
  secondaryLabel?: string;
  accentColor?: string;
}

export function ProgressRing({
  percentage,
  size = 104,
  strokeWidth = 9,
  primaryLabel,
  secondaryLabel,
  accentColor = '#0E6B5E',
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${primaryLabel} ${secondaryLabel ?? ''}`.trim()}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={accentColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-[stroke-dashoffset] duration-300 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
        <span
          dir="ltr"
          className="font-display font-bold text-[#111C2D] text-xl leading-none tabular-nums"
        >
          {primaryLabel}
        </span>
        {secondaryLabel && (
          <span className="text-xs font-medium text-[#475569] mt-1 leading-tight">
            {secondaryLabel}
          </span>
        )}
      </div>
    </div>
  );
}
