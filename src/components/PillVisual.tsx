import { useLanguage } from '../i18n/LanguageContext';
import { PillColor, PillShape } from '../types/medication';

export const PILL_COLOR_STYLES: Record<
  PillColor,
  {
    label: string;
    fill: string;
    fillSecondary: string;
    stroke: string;
    containerBg: string;
  }
> = {
  white: {
    label: 'White',
    fill: '#FFFFFF',
    fillSecondary: '#E2E8F0',
    stroke: '#94A3B8',
    containerBg: '#F1F5F9',
  },
  sky: {
    label: 'Soft Blue',
    fill: '#60A5FA',
    fillSecondary: '#DBEAFE',
    stroke: '#2563EB',
    containerBg: '#EFF6FF',
  },
  butter: {
    label: 'Pale Yellow',
    fill: '#FDE047',
    fillSecondary: '#FEF9C3',
    stroke: '#CA8A04',
    containerBg: '#FEFCE8',
  },
  coral: {
    label: 'Warm Peach',
    fill: '#FB923C',
    fillSecondary: '#FFEDD5',
    stroke: '#C2410C',
    containerBg: '#FFF7ED',
  },
  sage: {
    label: 'Mint Green',
    fill: '#34D399',
    fillSecondary: '#D1FAE5',
    stroke: '#047857',
    containerBg: '#ECFDF5',
  },
  amber: {
    label: 'Golden Amber',
    fill: '#F59E0B',
    fillSecondary: '#FEF3C7',
    stroke: '#B45309',
    containerBg: '#FFFBEB',
  },
};

export const PILL_SHAPES: Array<{ value: PillShape; label: string }> = [
  { value: 'round', label: 'Round' },
  { value: 'oval', label: 'Oval' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'square', label: 'Square' },
];

interface PillVisualProps {
  shape: PillShape;
  color: PillColor;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PillVisual({
  shape,
  color,
  size = 'md',
  className = '',
}: PillVisualProps) {
  const { t } = useLanguage();
  const palette = PILL_COLOR_STYLES[color];
  const colorLabel = t.pills.colors[color].label;
  const shapeLabel = t.pills.shapes[shape];
  const dimensions =
    size === 'sm'
      ? 'w-11 h-11 rounded-xl'
      : size === 'lg'
        ? 'w-20 h-20 rounded-2xl'
        : 'w-14 h-14 rounded-2xl';
  const svgSize = size === 'sm' ? 28 : size === 'lg' ? 54 : 36;

  return (
    <div
      className={`shrink-0 flex items-center justify-center border border-[#DCE3EC] ${dimensions} ${className}`}
      style={{ backgroundColor: palette.containerBg }}
      aria-label={t.pills.pillAria(colorLabel, shapeLabel)}
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {shape === 'round' && (
          <g>
            <circle
              cx="24"
              cy="24"
              r="15"
              fill={palette.fill}
              stroke={palette.stroke}
              strokeWidth="2.5"
            />
            <line
              x1="13"
              y1="24"
              x2="35"
              y2="24"
              stroke={palette.stroke}
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.55"
            />
            <path
              d="M15 17C17 13.5 20.5 12 24 12"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.65"
            />
          </g>
        )}

        {shape === 'oval' && (
          <g transform="rotate(-24 24 24)">
            <rect
              x="7"
              y="14"
              width="34"
              height="20"
              rx="10"
              fill={palette.fill}
              stroke={palette.stroke}
              strokeWidth="2.5"
            />
            <line
              x1="24"
              y1="15.5"
              x2="24"
              y2="32.5"
              stroke={palette.stroke}
              strokeWidth="2"
              opacity="0.55"
            />
            <line
              x1="13"
              y1="19"
              x2="20"
              y2="19"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.65"
            />
          </g>
        )}

        {shape === 'capsule' && (
          <g transform="rotate(-32 24 24)">
            <clipPath id={`cap-${color}-${size}`}>
              <rect x="6" y="15" width="36" height="18" rx="9" />
            </clipPath>
            <g clipPath={`url(#cap-${color}-${size})`}>
              <rect x="6" y="15" width="18" height="18" fill={palette.fill} />
              <rect
                x="24"
                y="15"
                width="18"
                height="18"
                fill={palette.fillSecondary}
              />
            </g>
            <rect
              x="6"
              y="15"
              width="36"
              height="18"
              rx="9"
              stroke={palette.stroke}
              strokeWidth="2.5"
            />
            <line
              x1="24"
              y1="15"
              x2="24"
              y2="33"
              stroke={palette.stroke}
              strokeWidth="2"
            />
            <line
              x1="12"
              y1="20"
              x2="19"
              y2="20"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.7"
            />
          </g>
        )}

        {shape === 'square' && (
          <g>
            <rect
              x="10"
              y="10"
              width="28"
              height="28"
              rx="7"
              fill={palette.fill}
              stroke={palette.stroke}
              strokeWidth="2.5"
            />
            <line
              x1="24"
              y1="14"
              x2="24"
              y2="34"
              stroke={palette.stroke}
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.45"
            />
            <line
              x1="14"
              y1="24"
              x2="34"
              y2="24"
              stroke={palette.stroke}
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.45"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
