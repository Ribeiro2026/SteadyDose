export type PillShape = 'round' | 'oval' | 'capsule' | 'square';

export type PillColor =
  | 'white'
  | 'sky'
  | 'butter'
  | 'coral'
  | 'sage'
  | 'amber';

export type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'bedtime';

export type DoseStatus = 'pending' | 'taken' | 'skipped' | 'snoozed';

export type SkipReason =
  | 'Forgot'
  | 'Not feeling well'
  | 'Ran out of pills'
  | 'Doctor advised';

export type ChimeStyle = 'bell' | 'warm' | 'clear';

export type TextScale = 'standard' | 'large' | 'xlarge';

export type NavTab = 'today' | 'adherence' | 'medications' | 'nearby' | 'alerts';

export interface Medication {
  id: string;
  name: string;
  dosage: string; // e.g., "10 mg"
  quantityLabel: string; // e.g., "1 tablet"
  purpose: string; // plain English, e.g., "Blood pressure"
  instructions: string; // e.g., "Take with breakfast and water"
  times: string[]; // "HH:mm" in 24-hour format, e.g., ["08:00", "20:00"]
  shape: PillShape;
  color: PillColor;
  remainingPills: number;
  refillThreshold: number;
  active: boolean;
  createdAt: string; // ISO date
}

export interface DoseLogEntry {
  id: string; // `${dateKey}_${medId}_${scheduledTime}`
  dateKey: string; // "YYYY-MM-DD"
  medicationId: string;
  scheduledTime: string; // "HH:mm"
  status: DoseStatus;
  takenAt?: string; // ISO timestamp
  snoozedUntil?: string; // ISO timestamp
  skipReason?: SkipReason;
}

export interface ScheduledDose {
  doseId: string;
  dateKey: string;
  medication: Medication;
  scheduledTime: string; // "HH:mm"
  period: TimePeriod;
  log?: DoseLogEntry;
  status: DoseStatus;
  isOverdue: boolean;
  isDueNow: boolean;
  minutesDelta: number; // positive = past scheduled time, negative = upcoming
}

export interface CaregiverContact {
  name: string;
  relation: string;
  phone: string;
  pharmacyName: string;
  pharmacyPhone: string;
}

export interface AppSettings {
  soundEnabled: boolean;
  chimeStyle: ChimeStyle;
  snoozeMinutes: 10 | 15 | 30;
  browserNotificationsEnabled: boolean;
  textScale: TextScale;
  highContrast: boolean;
  caregiver: CaregiverContact;
}
