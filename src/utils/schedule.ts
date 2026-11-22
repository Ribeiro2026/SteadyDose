import { DoseLogEntry, Medication, ScheduledDose, TimePeriod } from '../types/medication';

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function shiftDateKey(baseDate: Date, deltaDays: number): string {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + deltaDays);
  return toDateKey(d);
}

export function minutesFromTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function formatTime12h(timeStr: string): string {
  const [hRaw, mRaw] = timeStr.split(':').map(Number);
  const h = hRaw ?? 0;
  const m = mRaw ?? 0;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatTimestamp12h(isoString?: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatHumanDate(dateKey: string, todayKey: string): string {
  if (dateKey === todayKey) {
    return parseDateKey(dateKey).toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }
  return parseDateKey(dateKey).toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function getPeriodFromTime(timeStr: string): TimePeriod {
  const mins = minutesFromTime(timeStr);
  if (mins < 12 * 60) return 'morning';
  if (mins < 17 * 60) return 'afternoon';
  if (mins < 20 * 60 + 30) return 'evening';
  return 'bedtime';
}

export const PERIOD_LABELS: Record<TimePeriod, { title: string; range: string }> = {
  morning: { title: 'Morning', range: 'Before noon' },
  afternoon: { title: 'Afternoon', range: '12:00 PM – 5:00 PM' },
  evening: { title: 'Evening', range: '5:00 PM – 8:30 PM' },
  bedtime: { title: 'Bedtime', range: '8:30 PM – Midnight' },
};

export const PERIOD_ORDER: TimePeriod[] = ['morning', 'afternoon', 'evening', 'bedtime'];

export function makeDoseId(dateKey: string, medId: string, scheduledTime: string): string {
  return `${dateKey}_${medId}_${scheduledTime}`;
}

export function buildScheduledDosesForDate(
  dateKey: string,
  medications: Medication[],
  logs: Record<string, DoseLogEntry>,
  now: Date
): ScheduledDose[] {
  const todayKey = toDateKey(now);
  const isToday = dateKey === todayKey;
  const isPastDay = dateKey < todayKey;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const doses: ScheduledDose[] = [];

  for (const med of medications) {
    if (!med.active) continue;
    for (const scheduledTime of med.times) {
      const doseId = makeDoseId(dateKey, med.id, scheduledTime);
      const log = logs[doseId];
      const scheduledMinutes = minutesFromTime(scheduledTime);

      let status = log?.status ?? 'pending';
      // If snoozed time has already elapsed today, revert to pending so it notifies again
      if (
        status === 'snoozed' &&
        log?.snoozedUntil &&
        now.getTime() >= new Date(log.snoozedUntil).getTime()
      ) {
        status = 'pending';
      }

      const minutesDelta = isToday
        ? nowMinutes - scheduledMinutes
        : isPastDay
          ? 999
          : -999;

      const isDueNow =
        isToday &&
        status === 'pending' &&
        minutesDelta >= -5 &&
        minutesDelta <= 30;

      const isOverdue =
        (isToday && status === 'pending' && minutesDelta > 30) ||
        (isPastDay && status === 'pending');

      doses.push({
        doseId,
        dateKey,
        medication: med,
        scheduledTime,
        period: getPeriodFromTime(scheduledTime),
        log,
        status,
        isOverdue,
        isDueNow,
        minutesDelta,
      });
    }
  }

  return doses.sort((a, b) => {
    const diff = minutesFromTime(a.scheduledTime) - minutesFromTime(b.scheduledTime);
    if (diff !== 0) return diff;
    return a.medication.name.localeCompare(b.medication.name);
  });
}

export interface AdherenceSummary {
  totalScheduled: number;
  takenCount: number;
  takenOnTimeCount: number;
  takenLateCount: number;
  skippedCount: number;
  missedCount: number;
  percentage: number;
  currentStreakDays: number;
  dailyBreakdown: Array<{
    dateKey: string;
    total: number;
    taken: number;
    skipped: number;
    missed: number;
    rate: number;
  }>;
  perMedication: Array<{
    medication: Medication;
    total: number;
    taken: number;
    missedOrSkipped: number;
    rate: number;
  }>;
}

export function computeAdherenceSummary(
  medications: Medication[],
  logs: Record<string, DoseLogEntry>,
  days: number,
  now: Date
): AdherenceSummary {
  const activeMeds = medications.filter((m) => m.active);
  const todayKey = toDateKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  let totalScheduled = 0;
  let takenCount = 0;
  let takenOnTimeCount = 0;
  let takenLateCount = 0;
  let skippedCount = 0;
  let missedCount = 0;

  const medAccumulator: Record<string, { total: number; taken: number }> = {};
  for (const med of activeMeds) {
    medAccumulator[med.id] = { total: 0, taken: 0 };
  }

  const dailyBreakdown: AdherenceSummary['dailyBreakdown'] = [];

  for (let offset = days - 1; offset >= 0; offset--) {
    const dateKey = shiftDateKey(now, -offset);
    const isToday = dateKey === todayKey;
    let dayTotal = 0;
    let dayTaken = 0;
    let daySkipped = 0;
    let dayMissed = 0;

    for (const med of activeMeds) {
      for (const time of med.times) {
        const schedMins = minutesFromTime(time);
        const doseId = makeDoseId(dateKey, med.id, time);
        const log = logs[doseId];

        // On today, only count doses that are already taken/skipped OR whose time has already passed
        if (isToday && !log && schedMins > nowMinutes) {
          continue;
        }

        dayTotal += 1;
        totalScheduled += 1;
        medAccumulator[med.id].total += 1;

        if (log?.status === 'taken') {
          dayTaken += 1;
          takenCount += 1;
          medAccumulator[med.id].taken += 1;

          if (log.takenAt) {
            const takenDate = new Date(log.takenAt);
            const takenMins = takenDate.getHours() * 60 + takenDate.getMinutes();
            if (Math.abs(takenMins - schedMins) <= 45) {
              takenOnTimeCount += 1;
            } else {
              takenLateCount += 1;
            }
          } else {
            takenOnTimeCount += 1;
          }
        } else if (log?.status === 'skipped') {
          daySkipped += 1;
          skippedCount += 1;
        } else {
          dayMissed += 1;
          missedCount += 1;
        }
      }
    }

    const rate = dayTotal > 0 ? Math.round((dayTaken / dayTotal) * 100) : 100;
    dailyBreakdown.push({
      dateKey,
      total: dayTotal,
      taken: dayTaken,
      skipped: daySkipped,
      missed: dayMissed,
      rate,
    });
  }

  // Compute current streak of consecutive days with >= 100% adherence (checking backwards from yesterday, plus today if all due so far taken)
  let currentStreakDays = 0;
  for (let i = dailyBreakdown.length - 1; i >= 0; i--) {
    const d = dailyBreakdown[i];
    if (d.total === 0) continue;
    if (d.taken === d.total) {
      currentStreakDays += 1;
    } else if (d.dateKey === todayKey && d.missed === 0 && d.skipped === 0) {
      continue;
    } else {
      break;
    }
  }

  const percentage =
    totalScheduled > 0 ? Math.round((takenCount / totalScheduled) * 100) : 100;

  const perMedication = activeMeds
    .map((med) => {
      const acc = medAccumulator[med.id] || { total: 0, taken: 0 };
      const rate = acc.total > 0 ? Math.round((acc.taken / acc.total) * 100) : 100;
      return {
        medication: med,
        total: acc.total,
        taken: acc.taken,
        missedOrSkipped: acc.total - acc.taken,
        rate,
      };
    })
    .sort((a, b) => a.rate - b.rate);

  return {
    totalScheduled,
    takenCount,
    takenOnTimeCount,
    takenLateCount,
    skippedCount,
    missedCount,
    percentage,
    currentStreakDays,
    dailyBreakdown,
    perMedication,
  };
}

export function generateDoctorReportText(
  summary: AdherenceSummary,
  days: number,
  todayDoses: ScheduledDose[],
  now: Date
): string {
  const dateLabel = now.toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const lines: string[] = [
    `SteadyDose Medication Adherence Summary`,
    `Generated: ${dateLabel}`,
    `Period: Last ${days} days`,
    ``,
    `Overall Adherence: ${summary.percentage}% (${summary.takenCount} of ${summary.totalScheduled} doses taken)`,
    `On-time doses: ${summary.takenOnTimeCount} · Late doses: ${summary.takenLateCount} · Skipped: ${summary.skippedCount} · Missed: ${summary.missedCount}`,
    `Current full-day streak: ${summary.currentStreakDays} day(s)`,
    ``,
    `Medication Breakdown:`,
  ];

  for (const item of summary.perMedication) {
    const timesText = item.medication.times.map(formatTime12h).join(', ');
    lines.push(
      `- ${item.medication.name} ${item.medication.dosage} (${timesText}): ${item.rate}% (${item.taken}/${item.total} taken) · ${item.medication.remainingPills} pills remaining`
    );
  }

  lines.push(``, `Today's Status:`);
  for (const dose of todayDoses) {
    const statusText =
      dose.status === 'taken'
        ? `Taken at ${formatTimestamp12h(dose.log?.takenAt)}`
        : dose.status === 'skipped'
          ? `Skipped (${dose.log?.skipReason || 'No reason'})`
          : dose.isOverdue
            ? 'Overdue'
            : 'Upcoming';
    lines.push(
      `- ${formatTime12h(dose.scheduledTime)} · ${dose.medication.name} ${dose.medication.dosage}: ${statusText}`
    );
  }

  return lines.join('\n');
}

function escapeCsvCell(value: string | number | undefined | null): string {
  const raw = value == null ? '' : String(value);
  // Neutralize spreadsheet formula injection if cell begins with =, +, -, @, tab, or CR
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function generateAdherenceCsv(
  medications: Medication[],
  logs: Record<string, DoseLogEntry>,
  days: number,
  now: Date
): string {
  const todayKey = toDateKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const headers = [
    'Date',
    'Scheduled Time',
    'Medication',
    'Dosage',
    'Amount',
    'Purpose',
    'Status',
    'Taken At',
    'Notes',
  ];

  const rows: string[][] = [headers];

  // Iterate most recent date first so healthcare providers see latest adherence at the top
  for (let offset = 0; offset < days; offset++) {
    const dateKey = shiftDateKey(now, -offset);
    const isToday = dateKey === todayKey;
    const doses = buildScheduledDosesForDate(dateKey, medications, logs, now);

    for (const dose of doses) {
      const schedMins = minutesFromTime(dose.scheduledTime);
      let statusLabel: string;
      let takenAtLabel = '';
      let notes = '';

      if (dose.status === 'taken') {
        takenAtLabel = formatTimestamp12h(dose.log?.takenAt);
        if (dose.log?.takenAt) {
          const takenDate = new Date(dose.log.takenAt);
          const takenMins = takenDate.getHours() * 60 + takenDate.getMinutes();
          statusLabel =
            Math.abs(takenMins - schedMins) <= 45
              ? 'Taken (On Time)'
              : 'Taken (Late)';
        } else {
          statusLabel = 'Taken';
        }
      } else if (dose.status === 'skipped') {
        statusLabel = 'Skipped';
        notes = dose.log?.skipReason || 'Skipped';
      } else if (dose.status === 'snoozed') {
        statusLabel = 'Snoozed';
        notes = dose.log?.snoozedUntil
          ? `Snoozed until ${formatTimestamp12h(dose.log.snoozedUntil)}`
          : '';
      } else if (isToday && schedMins > nowMinutes) {
        statusLabel = 'Upcoming';
      } else {
        statusLabel = 'Missed';
      }

      rows.push([
        dateKey,
        formatTime12h(dose.scheduledTime),
        dose.medication.name,
        dose.medication.dosage,
        dose.medication.quantityLabel,
        dose.medication.purpose,
        statusLabel,
        takenAtLabel,
        notes,
      ]);
    }
  }

  // Include UTF-8 BOM so Excel opens special characters cleanly
  return `\uFEFF${rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')}`;
}

