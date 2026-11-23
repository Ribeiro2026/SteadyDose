import { useMemo, useState } from 'react';
import {
  Check,
  ClipboardCheck,
  Copy,
  Download,
  Printer,
  RotateCcw,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { DoseLogEntry, Medication, ScheduledDose } from '../types/medication';
import {
  buildScheduledDosesForDate,
  computeAdherenceSummary,
  generateAdherenceCsv,
  generateDoctorReportText,
  parseDateKey,
  toDateKey,
} from '../utils/schedule';
import { PillVisual } from './PillVisual';
import { ProgressRing } from './ProgressRing';
import { WeeklyAdherenceChart } from './WeeklyAdherenceChart';

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
  const {
    language,
    locale,
    t,
    formatTime,
    formatTimestamp,
    formatDate,
    getDisplayMed,
  } = useLanguage();
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(14);
  const [inspectedDateKey, setInspectedDateKey] = useState<string>(
    toDateKey(now)
  );
  const [copiedReport, setCopiedReport] = useState(false);
  const [downloadedCsv, setDownloadedCsv] = useState(false);

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
    const text = generateDoctorReportText(
      summary,
      rangeDays,
      todayDoses,
      now,
      language,
      getDisplayMed
    );
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

  const handleDownloadCsv = () => {
    const csvContent = generateAdherenceCsv(
      medications,
      logs,
      rangeDays,
      now,
      language,
      getDisplayMed
    );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `steadydose-adherence-${rangeDays}days-${todayKey}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadedCsv(true);
    window.setTimeout(() => setDownloadedCsv(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header + Range Segmented Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#475569]">
            {t.adherence.eyebrow}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111C2D] tracking-tight mt-0.5">
            {t.adherence.title}
          </h1>
        </div>

        <div
          className="inline-flex items-center p-1 rounded-2xl bg-[#E8EEF5] self-start sm:self-auto"
          role="group"
          aria-label={t.adherence.selectRangeAria}
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
                {t.adherence.daysLabel(days)}
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
            secondaryLabel={t.adherence.dayRateLabel(rangeDays)}
            accentColor={summary.percentage >= 85 ? '#0E6B5E' : '#B45309'}
          />
          <div className="space-y-1.5 min-w-0">
            <h2 className="font-display text-xl font-bold text-[#111C2D]">
              {summary.percentage >= 90
                ? t.adherence.strongRoutine
                : summary.percentage >= 75
                  ? t.adherence.steadyProgress
                  : t.adherence.needsAttention}
            </h2>
            <p className="text-base text-[#475569] tabular-nums">
              {t.adherence.takenSummary(
                summary.takenCount,
                summary.totalScheduled,
                rangeDays
              )}
            </p>
            <p className="text-sm font-semibold text-[#0E6B5E] tabular-nums">
              {t.adherence.streakLabel(summary.currentStreakDays)}
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-3 gap-3 sm:gap-4">
          <div className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-sm font-medium text-[#475569]">
              {t.adherence.takenOnTime}
            </span>
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#0E6B5E] mt-2 tabular-nums">
              {summary.takenOnTimeCount}
            </p>
            <span className="text-xs text-[#64748B] mt-1">
              {t.adherence.within45Min}
            </span>
          </div>

          <div className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-sm font-medium text-[#475569]">
              {t.adherence.takenLate}
            </span>
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#B45309] mt-2 tabular-nums">
              {summary.takenLateCount}
            </p>
            <span className="text-xs text-[#64748B] mt-1">
              {t.adherence.over45MinLate}
            </span>
          </div>

          <div className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-sm font-medium text-[#475569]">
              {t.adherence.missedSkipped}
            </span>
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#B91C1C] mt-2 tabular-nums">
              {summary.missedCount + summary.skippedCount}
            </p>
            <span className="text-xs text-[#64748B] mt-1 tabular-nums">
              {t.adherence.skippedMissedBreakdown(
                summary.skippedCount,
                summary.missedCount
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Weekly / Bi-weekly / Monthly Taken vs. Missed Bar Chart */}
      <WeeklyAdherenceChart
        now={now}
        medications={medications}
        logs={logs}
        rangeDays={rangeDays}
        onRangeChange={setRangeDays}
        selectedDateKey={inspectedDateKey}
        onSelectDateKey={setInspectedDateKey}
      />

      {/* Daily Calendar Grid + Day Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="surface-card lg:col-span-7 rounded-3xl bg-white border border-[#DCE3EC] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-[#111C2D]">
                {t.adherence.dailyCalendarTitle}
              </h2>
              <p className="text-sm text-[#475569]">
                {t.adherence.dailyCalendarSubtitle}
              </p>
            </div>
            <div className="text-xs text-[#475569] flex items-center gap-3">
              <span className="font-semibold text-[#0E6B5E]">
                {t.adherence.legendAllTaken}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[#B45309]">
                {t.adherence.legendPartial}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[#B91C1C]">
                {t.adherence.legendMissed}
              </span>
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
                  ? t.adherence.noDoses
                  : isAllTaken
                    ? t.adherence.all
                    : isNoneTaken
                      ? t.adherence.missed
                      : t.adherence.partial;
              const shortDateLabel = dateObj.toLocaleDateString(locale, {
                month: 'short',
                day: 'numeric',
              });

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
                  aria-label={t.adherence.dayAria(
                    shortDateLabel,
                    day.taken,
                    day.total
                  )}
                >
                  <span
                    className={`text-[11px] font-medium ${
                      selected ? 'text-white/75' : 'text-[#475569]'
                    }`}
                  >
                    {dateObj.toLocaleDateString(locale, { weekday: 'narrow' })}
                  </span>
                  <span className="font-display text-base font-bold leading-tight tabular-nums">
                    {dateObj.getDate()}
                  </span>
                  <span
                    dir={day.total > 0 ? 'ltr' : undefined}
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
              {t.adherence.selectedDayDetails}
            </p>
            <h2 className="font-display text-lg font-bold text-[#111C2D] mt-0.5">
              {formatDate(inspectedDateKey, todayKey)}
            </h2>
          </div>

          <div className="divide-y divide-[#E5ECF3]">
            {inspectedDoses.map((dose) => {
              const dispMed = getDisplayMed(dose.medication);
              const taken = dose.status === 'taken';
              const skipped = dose.status === 'skipped';
              const skipReasonLabel = dose.log?.skipReason
                ? t.skipReasons[dose.log.skipReason] || dose.log.skipReason
                : t.adherence.noteFallback;

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
                        {dispMed.name} {dispMed.dosage}
                      </p>
                      <p className="text-sm text-[#475569]">
                        <span dir="ltr" className="font-mono tabular-nums inline-block">
                          {formatTime(dose.scheduledTime)}
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
                            ? t.adherence.takenTime(
                                formatTimestamp(dose.log?.takenAt)
                              )
                            : skipped
                              ? t.adherence.skippedReason(skipReasonLabel)
                              : inspectedDateKey === todayKey && !dose.isOverdue
                                ? t.adherence.upcoming
                                : t.adherence.missedStatus}
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
                      <span>{t.today.undo}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onMarkTaken(dose)}
                      className="min-h-[44px] px-3.5 rounded-xl bg-[#0E6B5E] hover:bg-[#0B574C] text-white text-sm font-semibold flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <Check className="w-4 h-4" />
                      <span>{t.today.take}</span>
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
              {t.adherence.byMedication(rangeDays)}
            </h2>
            <p className="text-sm text-[#475569]">
              {t.adherence.byMedicationSubtitle}
            </p>
          </div>

          <div className="divide-y divide-[#E5ECF3]">
            {summary.perMedication.map((item) => {
              const dispMed = getDisplayMed(item.medication);
              return (
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
                        {dispMed.name} {dispMed.dosage}
                      </p>
                      <p className="text-sm text-[#475569]">
                        <span dir="ltr" className="inline-block">
                          {item.medication.times.map(formatTime).join(', ')}
                        </span>{' '}
                        · {dispMed.purpose}
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
                    <div className="text-end w-20 shrink-0">
                      <span
                        dir="ltr"
                        className="font-mono font-bold text-base text-[#111C2D] tabular-nums inline-block"
                      >
                        {item.rate}%
                      </span>
                      <span
                        dir="ltr"
                        className="block font-mono text-xs text-[#64748B] tabular-nums"
                      >
                        {item.taken}/{item.total}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="surface-card lg:col-span-4 rounded-3xl bg-white border border-[#DCE3EC] p-5 sm:p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-bold text-[#111C2D]">
              {t.adherence.shareTitle}
            </h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              {t.adherence.shareBody(rangeDays)}
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="w-full min-h-[50px] px-4 rounded-xl bg-[#0E6B5E] hover:bg-[#0B574C] text-white font-semibold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              {downloadedCsv ? (
                <>
                  <Check className="w-5 h-5 shrink-0" />
                  <span>{t.adherence.csvDownloaded}</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 shrink-0" />
                  <span>{t.adherence.downloadCsv(rangeDays)}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyReport}
              className="w-full min-h-[50px] px-4 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#111C2D] font-semibold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              {copiedReport ? (
                <>
                  <ClipboardCheck className="w-5 h-5 shrink-0 text-[#0E6B5E]" />
                  <span>{t.adherence.summaryCopied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 shrink-0 text-[#334155]" />
                  <span>{t.adherence.copyDoctorSummary}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full min-h-[50px] px-4 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#111C2D] font-semibold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-5 h-5 shrink-0 text-[#334155]" />
              <span>{t.adherence.printReport}</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
