import { AppSettings, DoseLogEntry, Medication } from '../types/medication';
import { makeDoseId, minutesFromTime, shiftDateKey, toDateKey } from '../utils/schedule';

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  chimeStyle: 'bell',
  snoozeMinutes: 10,
  browserNotificationsEnabled: false,
  textScale: 'standard',
  highContrast: false,
  caregiver: {
    name: 'Sarah Jenkins',
    relation: 'Daughter',
    phone: '(555) 234-8910',
    pharmacyName: 'Neighborhood Care Pharmacy',
    pharmacyPhone: '(555) 890-4421',
  },
};

export function createInitialMedications(now: Date): Medication[] {
  const createdAt = shiftDateKey(now, -30);
  // Make one dose sit gracefully close to the current time if opened mid-day,
  // while keeping realistic daily senior medication times.
  return [
    {
      id: 'med-lisinopril',
      name: 'Lisinopril',
      dosage: '10 mg',
      quantityLabel: '1 tablet',
      purpose: 'Blood pressure',
      instructions: 'Take in the morning with a full glass of water',
      times: ['08:00'],
      shape: 'round',
      color: 'coral',
      remainingPills: 22,
      refillThreshold: 7,
      active: true,
      createdAt,
    },
    {
      id: 'med-metformin',
      name: 'Metformin',
      dosage: '500 mg',
      quantityLabel: '1 tablet',
      purpose: 'Blood sugar',
      instructions: 'Take with breakfast and dinner to settle stomach',
      times: ['08:30', '18:30'],
      shape: 'oval',
      color: 'white',
      remainingPills: 18,
      refillThreshold: 10,
      active: true,
      createdAt,
    },
    {
      id: 'med-vitamin-d',
      name: 'Vitamin D3',
      dosage: '1000 IU',
      quantityLabel: '1 softgel',
      purpose: 'Bone strength',
      instructions: 'Take with lunch for best absorption',
      times: ['12:30'],
      shape: 'capsule',
      color: 'amber',
      remainingPills: 5,
      refillThreshold: 7,
      active: true,
      createdAt,
    },
    {
      id: 'med-atorvastatin',
      name: 'Atorvastatin',
      dosage: '20 mg',
      quantityLabel: '1 tablet',
      purpose: 'Cholesterol',
      instructions: 'Take before bed, with or without food',
      times: ['21:00'],
      shape: 'oval',
      color: 'sky',
      remainingPills: 26,
      refillThreshold: 7,
      active: true,
      createdAt,
    },
  ];
}

export function createInitialDoseLogs(
  medications: Medication[],
  now: Date
): Record<string, DoseLogEntry> {
  const logs: Record<string, DoseLogEntry> = {};
  const todayKey = toDateKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Seed past 14 days with realistic senior adherence (~88%, occasional missed evening dose)
  for (let offset = 14; offset >= 1; offset--) {
    const dateKey = shiftDateKey(now, -offset);
    const [y, m, d] = dateKey.split('-').map(Number);

    for (const med of medications) {
      for (const time of med.times) {
        const doseId = makeDoseId(dateKey, med.id, time);
        const [h, min] = time.split(':').map(Number);

        // Deterministic realistic pattern so calendar looks authentic
        const seed = (offset * 17 + h * 7 + med.name.length) % 19;
        if (med.id === 'med-metformin' && time === '18:30' && (offset === 4 || offset === 9)) {
          // Missed evening Metformin twice in last two weeks
          continue;
        }
        if (med.id === 'med-atorvastatin' && offset === 6) {
          logs[doseId] = {
            id: doseId,
            dateKey,
            medicationId: med.id,
            scheduledTime: time,
            status: 'skipped',
            skipReason: 'Forgot',
          };
          continue;
        }
        if (med.id === 'med-vitamin-d' && offset === 11) {
          continue;
        }

        const minuteOffset = seed < 14 ? (seed % 14) : 52; // mostly on time, occasional late
        const takenDate = new Date(y, m - 1, d, h, min + minuteOffset);

        logs[doseId] = {
          id: doseId,
          dateKey,
          medicationId: med.id,
          scheduledTime: time,
          status: 'taken',
          takenAt: takenDate.toISOString(),
        };
      }
    }
  }

  // For today: mark any dose that was more than 2 hours ago as taken, leaving the most recent/upcoming dose actionable!
  const todayDosesFlat: Array<{ med: Medication; time: string; mins: number }> = [];
  for (const med of medications) {
    for (const time of med.times) {
      todayDosesFlat.push({ med, time, mins: minutesFromTime(time) });
    }
  }
  todayDosesFlat.sort((a, b) => a.mins - b.mins);

  // Leave at least one past/current dose pending if we're past morning so the user sees an immediately actionable spotlight
  const pastDoses = todayDosesFlat.filter((d) => d.mins <= nowMinutes);
  const autoTakeCount = Math.max(0, pastDoses.length - 1);

  for (let i = 0; i < autoTakeCount; i++) {
    const item = pastDoses[i];
    const doseId = makeDoseId(todayKey, item.med.id, item.time);
    const [h, min] = item.time.split(':').map(Number);
    const takenDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, min + 6);
    logs[doseId] = {
      id: doseId,
      dateKey: todayKey,
      medicationId: item.med.id,
      scheduledTime: item.time,
      status: 'taken',
      takenAt: takenDate.toISOString(),
    };
  }

  return logs;
}
