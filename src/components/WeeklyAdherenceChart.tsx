import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DoseLogEntry, Medication } from '../types/medication';
import {
  computeAdherenceSummary,
  parseDateKey,
  toDateKey,
} from '../utils/schedule';

export type ChartRangeDays = 7 | 14 | 30;

const RANGE_OPTIONS: Array<{
  days: ChartRangeDays;
  label: string;
  heading: string;
}> = [
  { days: 7, label: 'Weekly', heading: 'Past 7 Days · Taken vs. Missed' },
  { days: 14, label: 'Bi-weekly', heading: 'Past 14 Days · Taken vs. Missed' },
  { days: 30, label: 'Monthly', heading: 'Past 30 Days · Taken vs. Missed' },
];

interface ChartDatum {
  dateKey: string;
  dayLabel: string;
  shortLabel: string;
  fullDateLabel: string;
  takenPct: number;
  missedPct: number;
  takenCount: number;
  missedCount: number;
  totalCount: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDatum }>;
}

function AdherenceChartTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="rounded-2xl bg-white border border-[#CBD5E1] shadow-lg px-4 py-3 text-sm space-y-1.5 min-w-[196px]">
      <p className="font-display font-bold text-[#111C2D]">
        {item.fullDateLabel}
      </p>
      {item.totalCount === 0 ? (
        <p className="text-[#475569]">No scheduled doses due yet.</p>
      ) : (
        <div className="space-y-1 tabular-nums">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-[#0E6B5E]">Taken</span>
            <span className="font-mono font-semibold text-[#111C2D]">
              {item.takenPct}% ({item.takenCount}/{item.totalCount})
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-[#B91C1C]">Missed</span>
            <span className="font-mono font-semibold text-[#111C2D]">
              {item.missedPct}% ({item.missedCount}/{item.totalCount})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

interface WeeklyAdherenceChartProps {
  now: Date;
  medications: Medication[];
  logs: Record<string, DoseLogEntry>;
  rangeDays?: ChartRangeDays;
  onRangeChange?: (days: ChartRangeDays) => void;
  selectedDateKey?: string;
  onSelectDateKey?: (dateKey: string) => void;
}

export function WeeklyAdherenceChart({
  now,
  medications,
  logs,
  rangeDays: controlledRangeDays,
  onRangeChange,
  selectedDateKey,
  onSelectDateKey,
}: WeeklyAdherenceChartProps) {
  const [internalRangeDays, setInternalRangeDays] =
    useState<ChartRangeDays>(7);

  const activeRangeDays = controlledRangeDays ?? internalRangeDays;
  const handleSelectRange = (days: ChartRangeDays) => {
    if (onRangeChange) {
      onRangeChange(days);
    } else {
      setInternalRangeDays(days);
    }
  };

  const todayKey = toDateKey(now);
  const rangeMeta =
    RANGE_OPTIONS.find((opt) => opt.days === activeRangeDays) ??
    RANGE_OPTIONS[0];

  const periodSummary = useMemo(
    () => computeAdherenceSummary(medications, logs, activeRangeDays, now),
    [medications, logs, activeRangeDays, now]
  );

  const chartData: ChartDatum[] = useMemo(() => {
    return periodSummary.dailyBreakdown.map((day) => {
      const dateObj = parseDateKey(day.dateKey);
      const isToday = day.dateKey === todayKey;

      const dayLabel = isToday
        ? 'Today'
        : activeRangeDays === 7
          ? dateObj.toLocaleDateString([], { weekday: 'short', day: 'numeric' })
          : dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

      const shortLabel = isToday
        ? 'Today'
        : dateObj.toLocaleDateString([], { weekday: 'short' });

      const fullDateLabel = dateObj.toLocaleDateString([], {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });

      const missedTotal = day.missed + day.skipped;
      const takenPct =
        day.total > 0 ? Math.round((day.taken / day.total) * 100) : 0;
      const missedPct = day.total > 0 ? 100 - takenPct : 0;

      return {
        dateKey: day.dateKey,
        dayLabel,
        shortLabel,
        fullDateLabel,
        takenPct,
        missedPct,
        takenCount: day.taken,
        missedCount: missedTotal,
        totalCount: day.total,
      };
    });
  }, [periodSummary, todayKey, activeRangeDays]);

  // Group into readable period chunks when viewing Bi-weekly (2 weeks) or Monthly (4 chunks)
  const chunkedSummaries = useMemo(() => {
    if (activeRangeDays === 7) return [];
    const chunkCount = activeRangeDays === 14 ? 2 : 4;
    const chunkSize = Math.ceil(chartData.length / chunkCount);
    const chunks: Array<{
      label: string;
      dateRange: string;
      takenPct: number;
      taken: number;
      total: number;
      lastDateKey: string;
    }> = [];

    for (let i = 0; i < chartData.length; i += chunkSize) {
      const slice = chartData.slice(i, i + chunkSize);
      if (slice.length === 0) continue;
      const taken = slice.reduce((acc, item) => acc + item.takenCount, 0);
      const total = slice.reduce((acc, item) => acc + item.totalCount, 0);
      const takenPct = total > 0 ? Math.round((taken / total) * 100) : 0;
      const startObj = parseDateKey(slice[0].dateKey);
      const endObj = parseDateKey(slice[slice.length - 1].dateKey);
      const isLastChunk = i + chunkSize >= chartData.length;
      const weekIndex = chunks.length + 1;

      chunks.push({
        label: isLastChunk
          ? 'This Week'
          : activeRangeDays === 14
            ? 'Previous Week'
            : `Week ${weekIndex}`,
        dateRange: `${startObj.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${endObj.toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
        takenPct,
        taken,
        total,
        lastDateKey: slice[slice.length - 1].dateKey,
      });
    }
    return chunks;
  }, [activeRangeDays, chartData]);

  const averageMissedPct =
    periodSummary.totalScheduled > 0 ? 100 - periodSummary.percentage : 0;

  const maxBarSize =
    activeRangeDays === 7 ? 44 : activeRangeDays === 14 ? 24 : 14;
  const barCategoryGap =
    activeRangeDays === 7 ? '24%' : activeRangeDays === 14 ? '18%' : '14%';

  return (
    <section
      aria-label={`${rangeMeta.label} taken versus missed medication bar chart`}
      className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-5 sm:p-6 space-y-5"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-[#111C2D]">
            {rangeMeta.heading}
          </h2>
          <p className="text-sm text-[#475569] mt-0.5 tabular-nums">
            {activeRangeDays}-day average: {periodSummary.percentage}% taken ·{' '}
            {averageMissedPct}% missed or skipped
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4">
          {/* Segmented Weekly / Bi-weekly / Monthly View Toggle */}
          <div
            className="inline-flex items-center p-1 rounded-2xl bg-[#E8EEF5]"
            role="group"
            aria-label="Chart time period"
          >
            {RANGE_OPTIONS.map((option) => {
              const active = option.days === activeRangeDays;
              return (
                <button
                  key={option.days}
                  type="button"
                  onClick={() => handleSelectRange(option.days)}
                  aria-pressed={active}
                  className={`min-h-[44px] px-3.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white text-[#111C2D] shadow-sm'
                      : 'text-[#475569] hover:text-[#111C2D]'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* High-contrast accessible legend (paired shape + text) */}
          <div className="flex items-center gap-4 text-sm font-semibold">
            <div className="flex items-center gap-2 text-[#111C2D]">
              <span
                className="w-3.5 h-3.5 rounded-sm bg-[#0E6B5E] shrink-0"
                aria-hidden="true"
              />
              <span className="whitespace-nowrap">Taken (%)</span>
            </div>
            <div className="flex items-center gap-2 text-[#111C2D]">
              <span
                className="w-3.5 h-3.5 rounded-sm bg-[#DC2626] shrink-0"
                aria-hidden="true"
              />
              <span className="whitespace-nowrap">Missed (%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Responsive Bar Chart */}
      <div className="w-full h-64 sm:h-72 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: -12, bottom: 4 }}
            barCategoryGap={barCategoryGap}
            onClick={(state) => {
              const payload = (
                state as {
                  activePayload?: Array<{ payload?: ChartDatum }>;
                } | null
              )?.activePayload?.[0]?.payload;
              if (payload?.dateKey && onSelectDateKey) {
                onSelectDateKey(payload.dateKey);
              }
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E2E8F0"
            />
            <XAxis
              dataKey="dayLabel"
              axisLine={{ stroke: '#CBD5E1' }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={activeRangeDays === 7 ? 4 : activeRangeDays === 14 ? 14 : 26}
              tick={{
                fill: '#334155',
                fontSize: activeRangeDays === 7 ? 13 : 12,
                fontWeight: 600,
              }}
              dy={6}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => `${value}%`}
              tick={{
                fill: '#475569',
                fontSize: 12,
                fontFamily: 'IBM Plex Mono, monospace',
              }}
            />
            <Tooltip
              content={<AdherenceChartTooltip />}
              cursor={{ fill: '#F1F5F9', opacity: 0.7 }}
            />
            <Bar
              dataKey="takenPct"
              name="Taken (%)"
              stackId="adherence"
              fill="#0E6B5E"
              radius={[0, 0, 4, 4]}
              maxBarSize={maxBarSize}
              isAnimationActive={false}
              className={onSelectDateKey ? 'cursor-pointer' : undefined}
            />
            <Bar
              dataKey="missedPct"
              name="Missed (%)"
              stackId="adherence"
              fill="#DC2626"
              radius={[4, 4, 0, 0]}
              maxBarSize={maxBarSize}
              isAnimationActive={false}
              className={onSelectDateKey ? 'cursor-pointer' : undefined}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Accessible Breakdown Strip: 7 individual days for Weekly, Week-by-Week cards for Bi-weekly & Monthly */}
      {activeRangeDays === 7 ? (
        <div
          className="grid grid-cols-7 gap-1.5 pt-2 border-t border-[#E5ECF3]"
          aria-label="Daily percentage breakdown for past week"
        >
          {chartData.map((day) => {
            const isSelected = selectedDateKey === day.dateKey;
            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => onSelectDateKey?.(day.dateKey)}
                className={`min-h-[44px] py-1.5 px-1 rounded-xl text-center transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#111C2D] text-white'
                    : 'bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#111C2D]'
                }`}
                aria-label={`${day.fullDateLabel}: ${day.takenPct}% taken, ${day.missedPct}% missed`}
              >
                <span
                  className={`block font-mono text-xs font-bold tabular-nums ${
                    isSelected
                      ? 'text-white'
                      : day.totalCount === 0
                        ? 'text-[#64748B]'
                        : day.takenPct === 100
                          ? 'text-[#0E6B5E]'
                          : 'text-[#111C2D]'
                  }`}
                >
                  {day.totalCount > 0 ? `${day.takenPct}%` : '—'}
                </span>
                <span
                  className={`block text-[11px] leading-tight mt-0.5 truncate ${
                    isSelected ? 'text-white/80' : 'text-[#475569]'
                  }`}
                >
                  {day.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div
          className={`grid gap-2.5 pt-3 border-t border-[#E5ECF3] ${
            activeRangeDays === 14
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-2 sm:grid-cols-4'
          }`}
          aria-label="Weekly summary breakdown"
        >
          {chunkedSummaries.map((chunk) => (
            <button
              key={chunk.label}
              type="button"
              onClick={() => onSelectDateKey?.(chunk.lastDateKey)}
              className="min-h-[56px] p-3 rounded-2xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E5ECF3] text-left flex items-center justify-between gap-2 transition-colors cursor-pointer"
            >
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-[#111C2D] truncate">
                  {chunk.label}
                </span>
                <span className="block text-xs text-[#64748B] truncate">
                  {chunk.dateRange}
                </span>
              </div>
              <div className="text-right shrink-0 tabular-nums">
                <span
                  className={`block font-mono text-sm font-bold ${
                    chunk.takenPct >= 85 ? 'text-[#0E6B5E]' : 'text-[#B45309]'
                  }`}
                >
                  {chunk.takenPct}%
                </span>
                <span className="block font-mono text-[11px] text-[#64748B]">
                  {chunk.taken}/{chunk.total}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
