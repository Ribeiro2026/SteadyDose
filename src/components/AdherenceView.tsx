import { useMemo, useState } from 'react';
import { Check, ClipboardCheck, Copy, Printer, RotateCcw } from 'lucide-react';
import { DoseLogEntry, Medication, ScheduledDose } from '../types/medication';
import {
  buildScheduledDosesForDate,
  computeAdherenceSummary,
  formatHumanDate,
  formatTime12h,
  formatTimestamp12h,
  generateDoctorReportText,
  parseDateKey,
  toDateKey,
} from '../utils/schedule';
import { PillVisual } from './PillVisual';
import { ProgressRing } from './ProgressRing';

interface AdherenceViewProps {
  now: Date;
  medications: Medication[];
  logs: Record<string, DoseLogEntry>;
  onMarkTaken: (dose: ScheduledDose) => void;
  onUndoDose: (dose: ScheduledDose) => void;
}

export function AdherenceView({
  now,
  medications,
  logs,
  onMarkTaken,
  onUndoDose,
}: AdherenceViewProps) {
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(14);
  const [inspectedDateKey, setInspectedDateKey] = useState<string>(
    toDateKey(now)
  );
  const [copiedReport, setCopiedReport] = useState(false);

  const todayKey = toDateKey(now);

  const summary = useMemo(
    () => computeAdherenceSummary(medications, logs, rangeDays, now),
    [medications, logs, rangeDays, now]
  );

  const inspectedDoses = useMemo(
    () => buildScheduledDosesForDate(inspectedDateKey, medications, logs, now),
    [inspectedDateKey, medications, logs, now]
  );

  const todayDoses = useMemo(
    () => buildScheduledDosesForDate(todayKey, medications, logs, now),
    [todayKey, medications, logs, now]
  );

  const handleCopyReport = async () => {
    const text = generateDoctorReportText(summary, rangeDays, todayDoses, now);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedReport(true);
      window.setTimeout(() => setCopiedReport(false), 3000);
    } catch {
      // Fallback textarea copy
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
      setCopiedReport(true);
      window.setTimeout(() => setCopiedReport(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Range Segmented Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#475569]">
            Adherence & History
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111C2D] tracking-tight mt-0.5">
            Your Consistency Over Time
          </h1>
        </div>

        <div
          className="inline-flex items-center p-1 rounded-2xl bg-[#E8EEF5] self-start sm:self-auto"
          role="group"
          aria-label="Select time range"
        >
          {([7, 14, 30] as const).map((days) => {
            const active = rangeDays === days;
            return (
              <button
                key={days}
                type="button"
                onClick={() => setRangeDays(days)}
                className={`min-h-[44px] px-4 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-white text-[#111C2D] shadow-sm'
                    : 'text-[#475569] hover:text-[#111C2D]'
                }`}
              >
                {days} Days
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="surface-card lg:col-span-5 rounded-3xl bg-white border border-[#DCE3EC] p-6 flex items-center gap-6">
          <ProgressRing
            percentage={summary.percentage}
            size={112}
            strokeWidth={10}
            primaryLabel={`${summary.percentage}%`}
            secondaryLabel={`${rangeDays}-day rate`}
            accentColor={summary.percentage >= 85 ? '#0E6B5E' : '#B45309'}
          />
          <div className="space-y-1.5 min-w-0">
            <h2 className="font-display text-xl font-bold text-[#111C2D]">
              {summary.percentage >= 90
                ? 'Strong Routine'
                : summary.percentage >= 75
                  ? 'Steady Progress'
                  : 'Needs Attention'}
            </h2>
            <p className="text-base text-[#475569] tabular-nums">
              {summary.takenCount} of {summary.totalScheduled} scheduled doses
              taken in the past {rangeDays} days.
            </p>
            <p className="text-sm font-semibold text-[#0E6B5E] tabular-nums">
              Current full-day streak: {summary.currentStreakDays} day
              {summary.currentStreakDays === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-3 gap-3 sm:gap-4">
          <div className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-sm font-medium text-[#475569]">
              Taken On Time
            </span>
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#0E6B5E] mt-2 tabular-nums">
              {summary.takenOnTimeCount}
            </p>
            <span className="text-xs text-[#64748B] mt-1">
              Within 45 min
            </span>
          </div>

          <div className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-sm font-medium text-[#475569]">
              Taken Late
            </span>
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#B45309] mt-2 tabular-nums">
              {summary.takenLateCount}
            </p>
            <span className="text-xs text-[#64748B] mt-1">
              Over 45 min late
            </span>
          </div>

          <div className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-sm font-medium text-[#475569]">
              Missed / Skipped
            </span>
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#B91C1C] mt-2 tabular-nums">
              {summary.missedCount + summary.skippedCount}
            </p>
            <span className="text-xs text-[#64748B] mt-1 tabular-nums">
              {summary.skippedCount} skipped · {summary.missedCount} missed
            </span>
          </div>
        </div>
      </div>

      {/* Daily Calendar Grid + Day Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="surface-card lg:col-span-7 rounded-3xl bg-white border border-[#DCE3EC] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-[#111C2D]">
                Daily Log Calendar
              </h2>
              <p className="text-sm text-[#475569]">
                Tap any day to see or update individual doses.
              </p>
            </div>
            <div className="text-xs text-[#475569] flex items-center gap-3">
              <span className="font-semibold text-[#0E6B5E]">All taken</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[#B45309]">Partial</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[#B91C1C]">Missed</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {summary.dailyBreakdown.map((day) => {
              const dateObj = parseDateKey(day.dateKey);
              const selected = day.dateKey === inspectedDateKey;
              const isAllTaken = day.total > 0 && day.taken === day.total;
              const isNoneTaken = day.total > 0 && day.taken === 0;
              const statusLabel =
                day.total === 0
                  ? 'No doses'
                  : isAllTaken
                    ? 'All'
                    : isNoneTaken
                      ? 'Missed'
                      : 'Partial';

              return (
                <button
                  key={day.dateKey}
                  type="button"
                  onClick={() => setInspectedDateKey(day.dateKey)}
                  className={`min-h-[68px] p-1.5 rounded-2xl border flex flex-col items-center justify-center transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[#111C2D] border-[#111C2D] text-white'
                      : isAllTaken
                        ? 'bg-[#F0FDF9] border-[#A7F3D0] text-[#111C2D] hover:bg-[#DCFCE7]'
                        : isNoneTaken
                          ? 'bg-[#FEF2F2] border-[#FECACA] text-[#111C2D] hover:bg-[#FEE2E2]'
                          : 'bg-[#FFFBEB] border-[#FDE68A] text-[#111C2D] hover:bg-[#FEF3C7]'
                  }`}
                  aria-label={`${dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })}: ${day.taken} of ${day.total} taken`}
                >
                  <span
                    className={`text-[11px] font-medium ${
                      selected ? 'text-white/75' : 'text-[#475569]'
                    }`}
                  >
                    {dateObj.toLocaleDateString([], { weekday: 'narrow' })}
                  </span>
                  <span className="font-display text-base font-bold leading-tight tabular-nums">
                    {dateObj.getDate()}
                  </span>
                  <span
                    className={`text-[11px] font-mono font-semibold mt-0.5 tabular-nums ${
                      selected
                        ? 'text-white/90'
                        : isAllTaken
                          ? 'text-[#0E6B5E]'
                          : isNoneTaken
                            ? 'text-[#B91C1C]'
                            : 'text-[#B45309]'
                    }`}
                  >
                    {day.total > 0 ? `${day.taken}/${day.total}` : statusLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Day Inspector Panel */}
        <section className="surface-card lg:col-span-5 rounded-3xl bg-white border border-[#DCE3EC] p-5 sm:p-6 space-y-4">
          <div>
            <p className="text-xs font-semibold text-[#0E6B5E]">
              Selected Day Details
            </p>
            <h2 className="font-display text-lg font-bold text-[#111C2D] mt-0.5">
              {formatHumanDate(inspectedDateKey, todayKey)}
            </h2>
          </div>

          <div className="divide-y divide-[#E5ECF3]">
            {inspectedDoses.map((dose) => {
              const taken = dose.status === 'taken';
              const skipped = dose.status === 'skipped';
              return (
                <div
                  key={dose.doseId}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <PillVisual
                      shape={dose.medication.shape}
                      color={dose.medication.color}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-base text-[#111C2D] truncate">
                        {dose.medication.name} {dose.medication.dosage}
                      </p>
                      <p className="text-sm text-[#475569]">
                        <span className="font-mono tabular-nums">
                          {formatTime12h(dose.scheduledTime)}
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span
                          className={
                            taken
                              ? 'text-[#0E6B5E] font-semibold'
                              : skipped
                                ? 'text-[#64748B]'
                                : 'text-[#B91C1C] font-semibold'
                          }
                        >
                          {taken
                            ? `Taken ${formatTimestamp12h(dose.log?.takenAt)}`
                            : skipped
                              ? `Skipped (${dose.log?.skipReason || 'Note'})`
                              : inspectedDateKey === todayKey && !dose.isOverdue
                                ? 'Upcoming'
                                : 'Missed'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {taken || skipped ? (
                    <button
                      type="button"
                      onClick={() => onUndoDose(dose)}
                      className="min-h-[44px] px-3 rounded-xl border border-[#CBD5E1] text-sm font-semibold text-[#334155] hover:bg-[#F8FAFC] flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Undo</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onMarkTaken(dose)}
                      className="min-h-[44px] px-3.5 rounded-xl bg-[#0E6B5E] hover:bg-[#0B574C] text-white text-sm font-semibold flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <Check className="w-4 h-4" />
                      <span>Take</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Per-Medication Adherence + Doctor Summary Export */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="surface-card lg:col-span-8 rounded-3xl bg-white border border-[#DCE3EC] p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[#111C2D]">
              By Medication ({rangeDays} Days)
            </h2>
            <p className="text-sm text-[#475569]">
              Sorted with medicines that may need an easier reminder time first.
            </p>
          </div>

          <div className="divide-y divide-[#E5ECF3]">
            {summary.perMedication.map((item) => (
              <div
                key={item.medication.id}
                className="py-4 first:pt-1 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <PillVisual
                    shape={item.medication.shape}
                    color={item.medication.color}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="font-display font-bold text-base text-[#111C2D] truncate">
                      {item.medication.name} {item.medication.dosage}
                    </p>
                    <p className="text-sm text-[#475569]">
                      {item.medication.times.map(formatTime12h).join(', ')} ·{' '}
                      {item.medication.purpose}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:w-56 shrink-0">
                  <div className="flex-1 h-2.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.rate >= 85 ? 'bg-[#0E6B5E]' : 'bg-[#B45309]'
                      }`}
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                  <div className="text-right w-20 shrink-0">
                    <span className="font-mono font-bold text-base text-[#111C2D] tabular-nums">
                      {item.rate}%
                    </span>
                    <span className="block font-mono text-xs text-[#64748B] tabular-nums">
                      {item.taken}/{item.total}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-card lg:col-span-4 rounded-3xl bg-white border border-[#DCE3EC] p-5 sm:p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-bold text-[#111C2D]">
              Share with Doctor or Family
            </h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              Copy a plain-text medication adherence summary to send in a
              message, or print a clean copy for your next appointment.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleCopyReport}
              className="w-full min-h-[50px] px-4 rounded-xl bg-[#0E6B5E] hover:bg-[#0B574C] text-white font-semibold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              {copiedReport ? (
                <>
                  <ClipboardCheck className="w-5 h-5 shrink-0" />
                  <span>Summary Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 shrink-0" />
                  <span>Copy Doctor Summary</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full min-h-[50px] px-4 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#111C2D] font-semibold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-5 h-5 shrink-0 text-[#334155]" />
              <span>Print Report</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
