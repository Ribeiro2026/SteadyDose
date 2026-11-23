import { useMemo } from 'react';
import {
  Bell,
  Check,
  Clock,
  PackagePlus,
  RotateCcw,
  SkipForward,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { TranslationDict } from '../i18n/translations';
import {
  DoseLogEntry,
  Medication,
  ScheduledDose,
  TimePeriod,
} from '../types/medication';
import {
  PERIOD_ORDER,
  buildScheduledDosesForDate,
  parseDateKey,
  shiftDateKey,
  toDateKey,
} from '../utils/schedule';
import { LanguageSwitcher } from './LanguageSwitcher';
import { PillVisual } from './PillVisual';
import { PWAInstallButton } from './PWAInstallButton';
import { ProgressRing } from './ProgressRing';

interface TodayViewProps {
  now: Date;
  selectedDateKey: string;
  onSelectDateKey: (dateKey: string) => void;
  medications: Medication[];
  logs: Record<string, DoseLogEntry>;
  snoozeMinutes: number;
  onMarkTaken: (dose: ScheduledDose) => void;
  onUndoDose: (dose: ScheduledDose) => void;
  onSnoozeDose: (dose: ScheduledDose) => void;
  onOpenReminderForDose: (dose: ScheduledDose) => void;
  onRefillMedication: (medId: string, amount: number) => void;
  onOpenAddMedication: () => void;
  onTriggerTestReminder: () => void;
}

function getDoseStatusText(
  dose: ScheduledDose,
  isToday: boolean,
  t: TranslationDict,
  formatTimestamp: (iso?: string) => string
): {
  label: string;
  toneClass: string;
} {
  if (dose.status === 'taken') {
    const timeStr = formatTimestamp(dose.log?.takenAt);
    return {
      label: timeStr ? t.today.statusTakenAt(timeStr) : t.today.statusTaken,
      toneClass: 'text-[#0E6B5E] font-semibold',
    };
  }
  if (dose.status === 'skipped') {
    const localizedReason = dose.log?.skipReason
      ? t.skipReasons[dose.log.skipReason] || dose.log.skipReason
      : '';
    return {
      label: localizedReason
        ? t.today.statusSkippedWithReason(localizedReason)
        : t.today.statusSkipped,
      toneClass: 'text-[#64748B] font-medium',
    };
  }
  if (dose.status === 'snoozed' && dose.log?.snoozedUntil) {
    return {
      label: t.today.statusSnoozedUntil(formatTimestamp(dose.log.snoozedUntil)),
      toneClass: 'text-[#B45309] font-semibold',
    };
  }
  if (dose.isDueNow) {
    return {
      label: t.today.statusDueNow,
      toneClass: 'text-[#B45309] font-semibold',
    };
  }
  if (dose.isOverdue) {
    if (isToday && dose.minutesDelta < 720) {
      const hrs = Math.floor(dose.minutesDelta / 60);
      const mins = dose.minutesDelta % 60;
      return {
        label:
          hrs > 0
            ? t.today.statusLateHours(hrs, mins)
            : t.today.statusLateMins(mins),
        toneClass: 'text-[#B45309] font-semibold',
      };
    }
    return {
      label: t.today.statusMissed,
      toneClass: 'text-[#B91C1C] font-semibold',
    };
  }
  return {
    label: t.today.statusUpcoming,
    toneClass: 'text-[#475569] font-medium',
  };
}

export function TodayView({
  now,
  selectedDateKey,
  onSelectDateKey,
  medications,
  logs,
  snoozeMinutes,
  onMarkTaken,
  onUndoDose,
  onSnoozeDose,
  onOpenReminderForDose,
  onRefillMedication,
  onOpenAddMedication,
  onTriggerTestReminder,
}: TodayViewProps) {
  const { t, locale, formatTime, formatTimestamp, formatDate, getDisplayMed } =
    useLanguage();
  const todayKey = toDateKey(now);
  const isToday = selectedDateKey === todayKey;

  const doses = useMemo(
    () => buildScheduledDosesForDate(selectedDateKey, medications, logs, now),
    [selectedDateKey, medications, logs, now]
  );

  // Build 7-day strip: last 5 days + today + tomorrow
  const dateStrip = useMemo(() => {
    const items: Array<{
      dateKey: string;
      weekday: string;
      dayNum: number;
      taken: number;
      total: number;
    }> = [];
    for (let offset = -5; offset <= 1; offset++) {
      const key = shiftDateKey(now, offset);
      const d = parseDateKey(key);
      const dayDoses = buildScheduledDosesForDate(key, medications, logs, now);
      const taken = dayDoses.filter((item) => item.status === 'taken').length;
      items.push({
        dateKey: key,
        weekday: d.toLocaleDateString(locale, { weekday: 'short' }),
        dayNum: d.getDate(),
        taken,
        total: dayDoses.length,
      });
    }
    return items;
  }, [now, medications, logs, locale]);

  const takenCount = doses.filter((d) => d.status === 'taken').length;
  const totalCount = doses.length;
  const completionPct =
    totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

  // Pick single dominant spotlight dose for Today: first overdue/due-now pending dose, else first upcoming pending dose
  const spotlightDose = useMemo(() => {
    if (!isToday) return null;
    const actionable = doses.filter(
      (d) => d.status === 'pending' || d.status === 'snoozed'
    );
    if (actionable.length === 0) return null;
    const dueOrOverdue = actionable.find((d) => d.isDueNow || d.isOverdue);
    return dueOrOverdue ?? actionable[0];
  }, [doses, isToday]);

  const spotlightMed = spotlightDose
    ? getDisplayMed(spotlightDose.medication)
    : null;

  const groupedByPeriod = useMemo(() => {
    const map: Record<TimePeriod, ScheduledDose[]> = {
      morning: [],
      afternoon: [],
      evening: [],
      bedtime: [],
    };
    for (const dose of doses) {
      map[dose.period].push(dose);
    }
    return map;
  }, [doses]);

  const lowSupplyMeds = useMemo(
    () =>
      medications.filter(
        (m) => m.active && m.remainingPills <= m.refillThreshold
      ),
    [medications]
  );

  return (
    <div className="space-y-6">
      {/* Greeting & Date Heading + Language Switcher + 7-Day Interactive Strip */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#475569]">
              {isToday ? t.today.todaySchedule : t.today.dailySchedule}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111C2D] tracking-tight mt-0.5">
              {formatDate(selectedDateKey, todayKey)}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!isToday && (
              <button
                type="button"
                onClick={() => onSelectDateKey(todayKey)}
                className="min-h-[44px] px-4 rounded-xl bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-sm font-semibold text-[#0E6B5E] transition-colors cursor-pointer whitespace-nowrap"
              >
                {t.today.returnToToday}
              </button>
            )}
            <LanguageSwitcher variant="segmented" />
          </div>
        </div>

        {/* 7-day horizontal date scroller */}
        <div
          className="grid grid-cols-7 gap-1.5 sm:gap-2"
          role="tablist"
          aria-label={t.today.chooseDayAria}
        >
          {dateStrip.map((day) => {
            const active = day.dateKey === selectedDateKey;
            const isDayToday = day.dateKey === todayKey;
            const allDone = day.total > 0 && day.taken === day.total;
            return (
              <button
                key={day.dateKey}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectDateKey(day.dateKey)}
                className={`min-h-[68px] py-2 px-1 rounded-2xl border flex flex-col items-center justify-center transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#111C2D] border-[#111C2D] text-white'
                    : 'bg-white border-[#DCE3EC] text-[#111C2D] hover:bg-[#F8FAFC]'
                }`}
              >
                <span
                  className={`text-xs font-medium ${
                    active ? 'text-white/80' : 'text-[#475569]'
                  }`}
                >
                  {isDayToday ? t.today.todayShort : day.weekday}
                </span>
                <span className="font-display text-lg font-bold leading-tight mt-0.5 tabular-nums">
                  {day.dayNum}
                </span>
                <span
                  dir="ltr"
                  className={`text-[11px] font-mono mt-0.5 tabular-nums ${
                    active
                      ? 'text-white/85'
                      : allDone
                        ? 'text-[#0E6B5E] font-semibold'
                        : 'text-[#64748B]'
                  }`}
                >
                  {day.total > 0 ? `${day.taken}/${day.total}` : '—'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main 2-column responsive layout (stacks on mobile, 8+4 on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Primary Column: Focal Anchor Spotlight + Time-of-Day List */}
        <div className="lg:col-span-8 space-y-6">
          {/* Dominant Focal Anchor Card (only on Today) */}
          {isToday && totalCount > 0 && (
            <section
              aria-label={t.today.nextMedDueAria}
              className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-5 sm:p-6"
            >
              {spotlightDose && spotlightMed ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span
                      className={`font-semibold ${
                        spotlightDose.isOverdue || spotlightDose.isDueNow
                          ? 'text-[#B45309]'
                          : 'text-[#0E6B5E]'
                      }`}
                    >
                      {spotlightDose.isOverdue
                        ? t.today.actionNeededOverdue
                        : spotlightDose.isDueNow
                          ? t.today.readyToTakeNow
                          : t.today.nextScheduledMed}
                    </span>
                    <span
                      dir="ltr"
                      className="font-mono font-semibold text-[#111C2D] tabular-nums"
                    >
                      {formatTime(spotlightDose.scheduledTime)}
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    <PillVisual
                      shape={spotlightMed.shape}
                      color={spotlightMed.color}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#111C2D] leading-tight">
                        {spotlightMed.name}{' '}
                        <span className="font-semibold text-[#334155]">
                          {spotlightMed.dosage}
                        </span>
                      </h2>
                      <p className="text-base text-[#475569] mt-1">
                        {spotlightMed.quantityLabel} ·{' '}
                        {t.pills.colors[spotlightMed.color].label}{' '}
                        {t.pills.shapes[spotlightMed.shape]}
                      </p>
                      <p className="text-base text-[#111C2D] mt-2 leading-relaxed">
                        {spotlightMed.instructions}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => onMarkTaken(spotlightDose)}
                      className="flex-1 min-h-[56px] px-6 py-3.5 rounded-2xl bg-[#0E6B5E] hover:bg-[#0B574C] active:scale-[0.99] text-white font-display font-semibold text-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Check className="w-6 h-6 shrink-0" strokeWidth={2.5} />
                      <span>{t.today.markAsTaken}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSnoozeDose(spotlightDose)}
                      className="min-h-[56px] px-5 py-3.5 rounded-2xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#111C2D] font-semibold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Clock className="w-5 h-5 shrink-0 text-[#334155]" />
                      <span>{t.today.remindIn(snoozeMinutes)}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[#0E6B5E]">
                      {t.today.allDoneTitle}
                    </p>
                    <h2 className="font-display text-2xl font-bold text-[#111C2D]">
                      {t.today.allDoneHeadline}
                    </h2>
                    <p className="text-base text-[#475569]">
                      {t.today.allDoneBody(takenCount, totalCount)}
                    </p>
                  </div>
                  <div className="shrink-0 w-14 h-14 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#0E6B5E]">
                    <Check className="w-8 h-8" strokeWidth={2.5} />
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Empty state if no active medications */}
          {totalCount === 0 && (
            <section className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-8 text-center space-y-4">
              <h2 className="font-display text-xl font-bold text-[#111C2D]">
                {t.today.emptyTitle}
              </h2>
              <p className="text-base text-[#475569] max-w-md mx-auto">
                {t.today.emptyBody}
              </p>
              <button
                type="button"
                onClick={onOpenAddMedication}
                className="min-h-[52px] px-6 rounded-2xl bg-[#0E6B5E] hover:bg-[#0B574C] text-white font-display font-semibold text-base transition-colors cursor-pointer"
              >
                {t.today.addFirstMed}
              </button>
            </section>
          )}

          {/* Time-of-day grouped list */}
          {PERIOD_ORDER.map((period) => {
            const periodDoses = groupedByPeriod[period];
            if (periodDoses.length === 0) return null;
            const periodMeta = t.periods[period];
            const periodTaken = periodDoses.filter(
              (d) => d.status === 'taken'
            ).length;

            return (
              <section key={period} className="space-y-2.5">
                <div className="flex items-baseline justify-between px-1">
                  <div className="flex items-baseline gap-2.5">
                    <h3 className="font-display text-lg font-bold text-[#111C2D]">
                      {periodMeta.title}
                    </h3>
                    <span className="text-sm text-[#64748B]">
                      {periodMeta.range}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-medium text-[#475569] tabular-nums">
                    {t.today.takenOfTotal(periodTaken, periodDoses.length)}
                  </span>
                </div>

                <div className="surface-card rounded-3xl bg-white border border-[#DCE3EC] divide-y divide-[#E5ECF3] overflow-hidden">
                  {periodDoses.map((dose) => {
                    const dispMed = getDisplayMed(dose.medication);
                    const statusInfo = getDoseStatusText(
                      dose,
                      isToday,
                      t,
                      formatTimestamp
                    );
                    const isTaken = dose.status === 'taken';
                    const isSkipped = dose.status === 'skipped';

                    return (
                      <div
                        key={dose.doseId}
                        className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                          isTaken ? 'bg-[#FAFCFB]' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <PillVisual
                            shape={dispMed.shape}
                            color={dispMed.color}
                            size="md"
                            className={isTaken ? 'opacity-70' : ''}
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                              <span
                                className={`font-display text-lg font-bold leading-snug ${
                                  isTaken
                                    ? 'text-[#475569] line-through decoration-[#94A3B8]'
                                    : 'text-[#111C2D]'
                                }`}
                              >
                                {dispMed.name} {dispMed.dosage}
                              </span>
                            </div>

                            <p className="text-sm text-[#475569] mt-0.5 leading-relaxed">
                              <span
                                dir="ltr"
                                className="font-mono font-semibold text-[#111C2D] tabular-nums inline-block"
                              >
                                {formatTime(dose.scheduledTime)}
                              </span>
                              <span aria-hidden="true"> · </span>
                              <span>{dispMed.quantityLabel}</span>
                              <span aria-hidden="true"> · </span>
                              <span>{dispMed.instructions}</span>
                            </p>

                            <p className={`text-sm mt-1.5 ${statusInfo.toneClass}`}>
                              {statusInfo.label}
                            </p>
                          </div>
                        </div>

                        {/* Interactive controls with generous >=48px touch targets */}
                        <div className="flex items-center gap-2 sm:shrink-0">
                          {isTaken || isSkipped ? (
                            <button
                              type="button"
                              onClick={() => onUndoDose(dose)}
                              className="w-full sm:w-auto min-h-[48px] px-4 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#334155] font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <RotateCcw className="w-4 h-4 shrink-0" />
                              <span>{t.today.undo}</span>
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => onMarkTaken(dose)}
                                className="flex-1 sm:flex-initial min-h-[48px] px-5 rounded-xl bg-[#0E6B5E] hover:bg-[#0B574C] text-white font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                                <span>{t.today.take}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenReminderForDose(dose)}
                                className="min-h-[48px] min-w-[48px] px-3 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#334155] font-medium text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                                aria-label={t.today.moreOptionsAria(dispMed.name)}
                                title={t.today.snoozeOrSkipTitle}
                              >
                                <SkipForward className="w-4 h-4 shrink-0" />
                                <span className="sm:hidden">{t.today.options}</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Right Companion Column on Desktop / Summary Cards below on Mobile */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Daily Progress Card */}
          <div className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-5 flex items-center gap-5">
            <ProgressRing
              percentage={completionPct}
              size={96}
              strokeWidth={9}
              primaryLabel={`${takenCount}/${totalCount}`}
              secondaryLabel={t.today.takenWord}
            />
            <div className="min-w-0 space-y-1">
              <h3 className="font-display text-lg font-bold text-[#111C2D]">
                {isToday ? t.today.todaysProgress : t.today.daySummary}
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                {totalCount === 0
                  ? t.today.noDosesScheduled
                  : takenCount === totalCount
                    ? t.today.everyDoseTaken
                    : t.today.remainingDoses(totalCount - takenCount)}
              </p>
            </div>
          </div>

          {/* Install on Smartphone Card */}
          <PWAInstallButton variant="card" />

          {/* Timely Reminder Preview Card */}
          <div className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-5 space-y-3.5">
            <div className="space-y-1">
              <h3 className="font-display text-lg font-bold text-[#111C2D]">
                {t.today.timelyAlertsTitle}
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                {t.today.timelyAlertsBody}
              </p>
            </div>
            <button
              type="button"
              onClick={onTriggerTestReminder}
              className="w-full min-h-[48px] px-4 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#111C2D] font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Bell className="w-4 h-4 shrink-0 text-[#0E6B5E]" />
              <span>{t.today.previewReminderAlert}</span>
            </button>
          </div>

          {/* Low Supply Watchlist */}
          {lowSupplyMeds.length > 0 && (
            <div className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-5 space-y-3.5">
              <div className="space-y-1">
                <h3 className="font-display text-lg font-bold text-[#111C2D]">
                  {t.today.refillSoonTitle}
                </h3>
                <p className="text-sm text-[#475569]">
                  {t.today.refillSoonBody}
                </p>
              </div>
              <div className="divide-y divide-[#E5ECF3]">
                {lowSupplyMeds.map((med) => {
                  const dispMed = getDisplayMed(med);
                  return (
                    <div
                      key={med.id}
                      className="py-3 first:pt-1 last:pb-0 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-base text-[#111C2D] truncate">
                          {dispMed.name} {dispMed.dosage}
                        </p>
                        <p className="text-sm font-medium text-[#B45309] tabular-nums">
                          {t.today.pillsLeft(med.remainingPills)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRefillMedication(med.id, 30)}
                        className="min-h-[44px] px-3.5 rounded-xl bg-[#0E6B5E]/10 hover:bg-[#0E6B5E]/15 text-[#0E6B5E] font-semibold text-sm flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <PackagePlus className="w-4 h-4 shrink-0" />
                        <span>{t.today.refillBtn}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
