/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  CalendarCheck,
  ClipboardList,
  MapPin,
  Pill,
  Plus,
} from 'lucide-react';
import { AdherenceView } from './components/AdherenceView';
import { MedicationFormModal } from './components/MedicationFormModal';
import { MedicationsView } from './components/MedicationsView';
import { NearbyCareView } from './components/NearbyCareView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ReminderOverlay } from './components/ReminderOverlay';
import { SettingsView } from './components/SettingsView';
import { TodayView } from './components/TodayView';
import {
  DEFAULT_SETTINGS,
  createInitialDoseLogs,
  createInitialMedications,
} from './data/seedData';
import {
  AppSettings,
  ChimeStyle,
  DoseLogEntry,
  Medication,
  NavTab,
  ScheduledDose,
  SkipReason,
} from './types/medication';
import {
  buildScheduledDosesForDate,
  formatTime12h,
  toDateKey,
} from './utils/schedule';
import { playReminderChime, playTakenConfirmation } from './utils/sound';

const STORAGE_KEYS = {
  medications: 'steadydose_v1_medications',
  logs: 'steadydose_v1_logs',
  settings: 'steadydose_v1_settings',
};

function loadInitialState(): {
  medications: Medication[];
  logs: Record<string, DoseLogEntry>;
  settings: AppSettings;
} {
  const now = new Date();
  try {
    const rawMeds = window.localStorage.getItem(STORAGE_KEYS.medications);
    const rawLogs = window.localStorage.getItem(STORAGE_KEYS.logs);
    const rawSettings = window.localStorage.getItem(STORAGE_KEYS.settings);

    const medications: Medication[] = rawMeds
      ? JSON.parse(rawMeds)
      : createInitialMedications(now);

    const logs: Record<string, DoseLogEntry> = rawLogs
      ? JSON.parse(rawLogs)
      : createInitialDoseLogs(medications, now);

    const settings: AppSettings = rawSettings
      ? {
          ...DEFAULT_SETTINGS,
          ...JSON.parse(rawSettings),
          caregiver: {
            ...DEFAULT_SETTINGS.caregiver,
            ...(JSON.parse(rawSettings).caregiver || {}),
          },
        }
      : DEFAULT_SETTINGS;

    return { medications, logs, settings };
  } catch {
    const medications = createInitialMedications(now);
    return {
      medications,
      logs: createInitialDoseLogs(medications, now),
      settings: DEFAULT_SETTINGS,
    };
  }
}

export default function App() {
  const [initial] = useState(loadInitialState);
  const [medications, setMedications] = useState<Medication[]>(
    initial.medications
  );
  const [logs, setLogs] = useState<Record<string, DoseLogEntry>>(initial.logs);
  const [settings, setSettings] = useState<AppSettings>(initial.settings);

  const [now, setNow] = useState<Date>(() => new Date());
  const [activeTab, setActiveTab] = useState<NavTab>('today');
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() =>
    toDateKey(new Date())
  );

  // Modals & Overlays
  const [activeReminder, setActiveReminder] = useState<{
    dose: ScheduledDose;
    isPreview: boolean;
  } | null>(null);
  const [formModalState, setFormModalState] = useState<{
    open: boolean;
    editing: Medication | null;
  }>({ open: false, editing: null });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState<boolean>(false);

  // Listen for Google Maps Platform quota exhaustion across the entire app
  useEffect(() => {
    const handleQuotaExceeded = () => {
      setMapsQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  // Track which dose IDs have already triggered an automatic alert during this session
  const firedAlertKeysRef = useRef<Set<string>>(new Set());
  const mountTimeRef = useRef<number>(Date.now());

  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return window.Notification.permission;
  });

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.medications,
        JSON.stringify(medications)
      );
    } catch {
      // ignore storage quota issues
    }
  }, [medications]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
    } catch {
      // ignore
    }
  }, [logs]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.settings,
        JSON.stringify(settings)
      );
    } catch {
      // ignore
    }
  }, [settings]);

  // Apply reading comfort preferences to <html>
  useEffect(() => {
    document.documentElement.dataset.textScale = settings.textScale;
    document.documentElement.dataset.contrast = settings.highContrast
      ? 'high'
      : 'normal';
  }, [settings.textScale, settings.highContrast]);

  // Live clock tick every 10 seconds to catch scheduled reminders promptly
  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => window.clearInterval(id);
  }, []);

  const todayKey = toDateKey(now);

  const todayDoses = useMemo(
    () => buildScheduledDosesForDate(todayKey, medications, logs, now),
    [todayKey, medications, logs, now]
  );

  // Timely Reminder Engine: fires automatically when a dose reaches its exact minute or snooze expires
  useEffect(() => {
    // Never fire an unsolicited popup during initial page arrival
    if (Date.now() - mountTimeRef.current < 10000) return;
    if (activeReminder) return;

    const currentHH = String(now.getHours()).padStart(2, '0');
    const currentMM = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHH}:${currentMM}`;

    for (const dose of todayDoses) {
      if (dose.status !== 'pending') continue;

      const isExactScheduledMinute = dose.scheduledTime === currentTimeStr;
      const isSnoozeExpired =
        dose.log?.status === 'snoozed' &&
        dose.log.snoozedUntil &&
        now.getTime() >= new Date(dose.log.snoozedUntil).getTime();

      if (!isExactScheduledMinute && !isSnoozeExpired) continue;

      const alertKey = `${dose.doseId}_${currentTimeStr}`;
      if (firedAlertKeysRef.current.has(alertKey)) continue;

      firedAlertKeysRef.current.add(alertKey);
      setActiveReminder({ dose, isPreview: false });

      if (settings.soundEnabled) {
        playReminderChime(settings.chimeStyle);
      }

      if (
        notificationPermission === 'granted' &&
        typeof window !== 'undefined' &&
        'Notification' in window
      ) {
        try {
          new window.Notification(
            `Time for ${dose.medication.name} ${dose.medication.dosage}`,
            {
              body: `${dose.medication.quantityLabel} — ${dose.medication.instructions}`,
              tag: dose.doseId,
            }
          );
        } catch {
          // ignore if blocked in iframe context
        }
      }
      break;
    }
  }, [
    now,
    todayDoses,
    activeReminder,
    settings.soundEnabled,
    settings.chimeStyle,
    notificationPermission,
  ]);

  // Handlers
  const handleMarkTaken = useCallback(
    (dose: ScheduledDose) => {
      const wasTaken = logs[dose.doseId]?.status === 'taken';
      setLogs((prev) => ({
        ...prev,
        [dose.doseId]: {
          id: dose.doseId,
          dateKey: dose.dateKey,
          medicationId: dose.medication.id,
          scheduledTime: dose.scheduledTime,
          status: 'taken',
          takenAt: new Date().toISOString(),
        },
      }));

      if (!wasTaken) {
        setMedications((prev) =>
          prev.map((m) =>
            m.id === dose.medication.id
              ? { ...m, remainingPills: Math.max(0, m.remainingPills - 1) }
              : m
          )
        );
      }

      if (settings.soundEnabled) {
        playTakenConfirmation();
      }
      setActiveReminder(null);
      showToast(`Recorded ${dose.medication.name} as taken.`);
    },
    [logs, settings.soundEnabled, showToast]
  );

  const handleUndoDose = useCallback(
    (dose: ScheduledDose) => {
      const wasTaken = logs[dose.doseId]?.status === 'taken';
      setLogs((prev) => {
        const next = { ...prev };
        delete next[dose.doseId];
        return next;
      });

      if (wasTaken) {
        setMedications((prev) =>
          prev.map((m) =>
            m.id === dose.medication.id
              ? { ...m, remainingPills: m.remainingPills + 1 }
              : m
          )
        );
      }

      showToast(`Reset ${dose.medication.name} for ${formatTime12h(dose.scheduledTime)}.`);
    },
    [logs, showToast]
  );

  const handleSnoozeDose = useCallback(
    (dose: ScheduledDose) => {
      const snoozeUntil = new Date(
        Date.now() + settings.snoozeMinutes * 60 * 1000
      );
      setLogs((prev) => ({
        ...prev,
        [dose.doseId]: {
          id: dose.doseId,
          dateKey: dose.dateKey,
          medicationId: dose.medication.id,
          scheduledTime: dose.scheduledTime,
          status: 'snoozed',
          snoozedUntil: snoozeUntil.toISOString(),
        },
      }));
      setActiveReminder(null);
      showToast(
        `Snoozed ${dose.medication.name} for ${settings.snoozeMinutes} minutes.`
      );
    },
    [settings.snoozeMinutes, showToast]
  );

  const handleSkipDose = useCallback(
    (dose: ScheduledDose, reason: SkipReason) => {
      setLogs((prev) => ({
        ...prev,
        [dose.doseId]: {
          id: dose.doseId,
          dateKey: dose.dateKey,
          medicationId: dose.medication.id,
          scheduledTime: dose.scheduledTime,
          status: 'skipped',
          skipReason: reason,
        },
      }));
      setActiveReminder(null);
      showToast(`Marked ${dose.medication.name} as skipped.`);
    },
    [showToast]
  );

  const handleSaveMedication = useCallback(
    (data: Omit<Medication, 'id' | 'createdAt'>, existingId?: string) => {
      if (existingId) {
        setMedications((prev) =>
          prev.map((m) => (m.id === existingId ? { ...m, ...data } : m))
        );
        showToast(`Updated ${data.name}.`);
      } else {
        const newMed: Medication = {
          ...data,
          id: `med-${Date.now()}`,
          createdAt: toDateKey(new Date()),
        };
        setMedications((prev) => [...prev, newMed]);
        showToast(`Added ${data.name} to your schedule.`);
      }
      setFormModalState({ open: false, editing: null });
    },
    [showToast]
  );

  const handleToggleActiveMed = useCallback(
    (medId: string) => {
      setMedications((prev) =>
        prev.map((m) => {
          if (m.id !== medId) return m;
          const nextActive = !m.active;
          showToast(
            nextActive ? `Resumed ${m.name}.` : `Paused reminders for ${m.name}.`
          );
          return { ...m, active: nextActive };
        })
      );
    },
    [showToast]
  );

  const handleDeleteMed = useCallback(
    (medId: string) => {
      const target = medications.find((m) => m.id === medId);
      setMedications((prev) => prev.filter((m) => m.id !== medId));
      if (target) {
        showToast(`Removed ${target.name}.`);
      }
    },
    [medications, showToast]
  );

  const handleRefillMed = useCallback(
    (medId: string, amount: number) => {
      setMedications((prev) =>
        prev.map((m) => {
          if (m.id !== medId) return m;
          showToast(`Added ${amount} pills to ${m.name}.`);
          return { ...m, remainingPills: m.remainingPills + amount };
        })
      );
    },
    [showToast]
  );

  const handleUpdateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleRequestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      return;
    }
    try {
      const result = await window.Notification.requestPermission();
      setNotificationPermission(result);
      if (result === 'granted') {
        handleUpdateSettings({ browserNotificationsEnabled: true });
        showToast('Device medication reminders enabled.');
      }
    } catch {
      // ignore
    }
  }, [handleUpdateSettings, showToast]);

  const handleTriggerTestReminder = useCallback(() => {
    const candidate =
      todayDoses.find((d) => d.status === 'pending' || d.status === 'snoozed') ??
      todayDoses[0];

    if (!candidate) {
      showToast('Add a medication first to preview a reminder.');
      return;
    }

    if (settings.soundEnabled) {
      playReminderChime(settings.chimeStyle);
    }
    setActiveReminder({ dose: candidate, isPreview: true });
  }, [todayDoses, settings.soundEnabled, settings.chimeStyle, showToast]);

  const handleTestSound = useCallback((style: ChimeStyle) => {
    playReminderChime(style);
  }, []);

  const handleSavePharmacyFromMap = useCallback(
    (pharmacyName: string, pharmacyPhone: string) => {
      setSettings((prev) => ({
        ...prev,
        caregiver: {
          ...prev.caregiver,
          pharmacyName,
          pharmacyPhone: pharmacyPhone || prev.caregiver.pharmacyPhone,
        },
      }));
      showToast(`Saved ${pharmacyName} as your pharmacy.`);
    },
    [showToast]
  );

  const navItems: Array<{
    id: NavTab;
    label: string;
    shortLabel: string;
    icon: typeof CalendarCheck;
  }> = [
    { id: 'today', label: 'Today', shortLabel: 'Today', icon: CalendarCheck },
    {
      id: 'adherence',
      label: 'Adherence',
      shortLabel: 'History',
      icon: ClipboardList,
    },
    {
      id: 'medications',
      label: 'Medications',
      shortLabel: 'Medicines',
      icon: Pill,
    },
    {
      id: 'nearby',
      label: 'Nearby Care',
      shortLabel: 'Nearby',
      icon: MapPin,
    },
    { id: 'alerts', label: 'Care & Alerts', shortLabel: 'Alerts', icon: Bell },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA] text-[#111C2D]">
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm print:hidden">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <OfflineIndicator />

      {/* Top Bar Contract: Desktop 3-zone header (Wordmark — 5 Nav Links — 1 Primary CTA), Mobile compact 52px bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#DCE3EC] print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element Brand Wordmark */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('today');
              setSelectedDateKey(todayKey);
            }}
            className="font-display text-xl font-bold tracking-tight text-[#111C2D] whitespace-nowrap shrink-0 cursor-pointer"
          >
            SteadyDose
          </button>

          {/* Zone 2: 5 clean single-line text links (Desktop) */}
          <nav
            className="hidden md:flex items-center gap-6"
            aria-label="Main navigation"
          >
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-2 text-sm font-semibold whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                    active
                      ? 'text-[#0E6B5E] border-[#0E6B5E]'
                      : 'text-[#475569] border-transparent hover:text-[#111C2D]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setFormModalState({ open: true, editing: null })}
              className="min-h-[44px] px-4 rounded-xl bg-[#0E6B5E] hover:bg-[#0B574C] text-white font-display font-semibold text-sm flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} />
              <span>Add Medicine</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 pb-28 md:pb-12">
        {activeTab === 'today' && (
          <TodayView
            now={now}
            selectedDateKey={selectedDateKey}
            onSelectDateKey={setSelectedDateKey}
            medications={medications}
            logs={logs}
            snoozeMinutes={settings.snoozeMinutes}
            onMarkTaken={handleMarkTaken}
            onUndoDose={handleUndoDose}
            onSnoozeDose={handleSnoozeDose}
            onOpenReminderForDose={(dose) =>
              setActiveReminder({ dose, isPreview: false })
            }
            onRefillMedication={handleRefillMed}
            onOpenAddMedication={() =>
              setFormModalState({ open: true, editing: null })
            }
            onTriggerTestReminder={handleTriggerTestReminder}
          />
        )}

        {activeTab === 'adherence' && (
          <AdherenceView
            now={now}
            medications={medications}
            logs={logs}
            onMarkTaken={handleMarkTaken}
            onUndoDose={handleUndoDose}
          />
        )}

        {activeTab === 'medications' && (
          <MedicationsView
            medications={medications}
            onOpenAdd={() => setFormModalState({ open: true, editing: null })}
            onEdit={(med) => setFormModalState({ open: true, editing: med })}
            onToggleActive={handleToggleActiveMed}
            onDelete={handleDeleteMed}
            onRefill={handleRefillMed}
          />
        )}

        {activeTab === 'nearby' && (
          <NearbyCareView
            savedPharmacyName={settings.caregiver.pharmacyName}
            onSavePharmacy={handleSavePharmacyFromMap}
          />
        )}

        {activeTab === 'alerts' && (
          <SettingsView
            settings={settings}
            todayDoses={todayDoses}
            notificationPermission={notificationPermission}
            onUpdateSettings={handleUpdateSettings}
            onRequestNotificationPermission={
              handleRequestNotificationPermission
            }
            onTestSound={handleTestSound}
            onTriggerTestReminder={handleTriggerTestReminder}
          />
        )}
      </main>

      {/* Fixed Mobile Bottom Navigation Bar (Natural Thumb Zone, 5 destinations) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DCE3EC] pb-safe print:hidden"
      >
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center min-h-[44px] transition-colors cursor-pointer ${
                  active ? 'text-[#0E6B5E]' : 'text-[#475569]'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon
                  className="w-[22px] h-[22px] shrink-0"
                  strokeWidth={active ? 2.4 : 1.9}
                />
                <span
                  className={`text-[11px] mt-1 leading-none whitespace-nowrap ${
                    active ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Accessible Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed z-40 bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm bg-[#111C2D] text-white px-5 py-3.5 rounded-2xl shadow-lg text-sm font-medium text-center md:text-left print:hidden"
        >
          {toastMessage}
        </div>
      )}

      {/* Full-Focus Timely Medication Reminder Overlay */}
      {activeReminder && (
        <ReminderOverlay
          dose={activeReminder.dose}
          snoozeMinutes={settings.snoozeMinutes}
          isPreview={activeReminder.isPreview}
          onTake={handleMarkTaken}
          onSnooze={handleSnoozeDose}
          onSkip={handleSkipDose}
          onDismiss={() => setActiveReminder(null)}
          onReplayChime={() => playReminderChime(settings.chimeStyle)}
        />
      )}

      {/* Add / Edit Medication Sheet */}
      {formModalState.open && (
        <MedicationFormModal
          initialMedication={formModalState.editing}
          onSave={handleSaveMedication}
          onClose={() => setFormModalState({ open: false, editing: null })}
        />
      )}
    </div>
  );
}
