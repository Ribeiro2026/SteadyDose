import { useState } from 'react';
import {
  Bell,
  BellRing,
  Check,
  ClipboardCheck,
  Copy,
  Phone,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  AppSettings,
  ChimeStyle,
  ScheduledDose,
  TextScale,
} from '../types/medication';
import { formatTime12h, formatTimestamp12h } from '../utils/schedule';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  settings: AppSettings;
  todayDoses: ScheduledDose[];
  notificationPermission: NotificationPermission | 'unsupported';
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onRequestNotificationPermission: () => void;
  onTestSound: (style: ChimeStyle) => void;
  onTriggerTestReminder: () => void;
}

const CHIME_OPTIONS: Array<{ value: ChimeStyle; label: string; desc: string }> =
  [
    { value: 'bell', label: 'Gentle Bell', desc: 'Soft two-note chime' },
    { value: 'warm', label: 'Warm Triad', desc: 'Calm rising chord' },
    {
      value: 'clear',
      label: 'Clear Tone',
      desc: 'Brighter, easier to hear',
    },
  ];

const TEXT_SCALE_OPTIONS: Array<{ value: TextScale; label: string }> = [
  { value: 'standard', label: 'Standard' },
  { value: 'large', label: 'Large Text' },
  { value: 'xlarge', label: 'Extra Large' },
];

const SNOOZE_OPTIONS: Array<10 | 15 | 30> = [10, 15, 30];

export function SettingsView({
  settings,
  todayDoses,
  notificationPermission,
  onUpdateSettings,
  onRequestNotificationPermission,
  onTestSound,
  onTriggerTestReminder,
}: SettingsViewProps) {
  const [caregiverForm, setCaregiverForm] = useState(settings.caregiver);
  const [savedCaregiver, setSavedCaregiver] = useState(false);
  const [copiedUpdate, setCopiedUpdate] = useState(false);

  const handleSaveCaregiver = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({ caregiver: caregiverForm });
    setSavedCaregiver(true);
    window.setTimeout(() => setSavedCaregiver(false), 2500);
  };

  const handleCopyCaregiverUpdate = async () => {
    const taken = todayDoses.filter((d) => d.status === 'taken').length;
    const total = todayDoses.length;
    const lines = [
      `Medication check-in for today: ${taken} of ${total} doses taken.`,
      ...todayDoses.map((d) => {
        const status =
          d.status === 'taken'
            ? `Taken at ${formatTimestamp12h(d.log?.takenAt)}`
            : d.status === 'skipped'
              ? 'Skipped'
              : d.isOverdue
                ? 'Still due'
                : `Scheduled ${formatTime12h(d.scheduledTime)}`;
        return `- ${d.medication.name} (${d.medication.dosage}): ${status}`;
      }),
    ];
    const message = lines.join('\n');
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      const area = document.createElement('textarea');
      area.value = message;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    setCopiedUpdate(true);
    window.setTimeout(() => setCopiedUpdate(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-[#475569]">
          Care, Alerts & Comfort
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111C2D] tracking-tight mt-0.5">
          Reminders & Reading Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Sound, Alerts & Accessibility */}
        <div className="lg:col-span-7 space-y-6">
          {/* Reminder Sound & Alerts */}
          <section className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-5 sm:p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold text-[#111C2D]">
                  Reminder Chime & Alerts
                </h2>
                <p className="text-sm text-[#475569] mt-0.5">
                  Play a pleasant sound and show a clear full-screen alert when a
                  dose is due.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.soundEnabled}
                onClick={() =>
                  onUpdateSettings({ soundEnabled: !settings.soundEnabled })
                }
                className={`min-h-[46px] px-4 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  settings.soundEnabled
                    ? 'bg-[#0E6B5E] text-white'
                    : 'bg-[#F1F5F9] text-[#475569]'
                }`}
              >
                {settings.soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 shrink-0" />
                    <span>Sound On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 shrink-0" />
                    <span>Muted</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#111C2D]">
                Chime Tone (tap to preview)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {CHIME_OPTIONS.map((option) => {
                  const selected = settings.chimeStyle === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onUpdateSettings({
                          chimeStyle: option.value,
                          soundEnabled: true,
                        });
                        onTestSound(option.value);
                      }}
                      className={`min-h-[58px] p-3 rounded-2xl border text-left transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#F0FDF9] border-[#0E6B5E] text-[#111C2D]'
                          : 'bg-white border-[#CBD5E1] text-[#111C2D] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <span className="block font-semibold text-sm">
                        {option.label}
                      </span>
                      <span className="block text-xs text-[#475569] mt-0.5">
                        {option.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#111C2D]">
                Snooze Duration
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {SNOOZE_OPTIONS.map((mins) => {
                  const selected = settings.snoozeMinutes === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => onUpdateSettings({ snoozeMinutes: mins })}
                      className={`min-h-[48px] px-3 rounded-xl border text-sm font-semibold transition-colors cursor-pointer tabular-nums ${
                        selected
                          ? 'bg-[#0E6B5E] border-[#0E6B5E] text-white'
                          : 'bg-white border-[#CBD5E1] text-[#111C2D] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {mins} minutes
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Browser notifications */}
            <div className="pt-4 border-t border-[#E5ECF3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-base text-[#111C2D]">
                  Device Notifications
                </p>
                <p className="text-sm text-[#475569]">
                  {notificationPermission === 'granted'
                    ? 'Device alerts are turned on for scheduled medication times.'
                    : notificationPermission === 'denied'
                      ? 'Notifications are blocked in your browser settings. In-app alerts still work.'
                      : notificationPermission === 'unsupported'
                        ? 'Your browser uses in-app reminders and chimes.'
                        : 'Allow alerts even when this tab is in the background.'}
                </p>
              </div>
              {notificationPermission === 'default' && (
                <button
                  type="button"
                  onClick={onRequestNotificationPermission}
                  className="min-h-[48px] px-4 rounded-xl bg-[#111C2D] hover:bg-[#1E293B] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <BellRing className="w-4 h-4 shrink-0" />
                  <span>Enable Alerts</span>
                </button>
              )}
              {notificationPermission === 'granted' && (
                <span className="text-sm font-semibold text-[#0E6B5E] whitespace-nowrap">
                  Enabled
                </span>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onTriggerTestReminder}
                className="w-full min-h-[52px] px-5 rounded-2xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#111C2D] font-semibold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Bell className="w-5 h-5 shrink-0 text-[#0E6B5E]" />
                <span>Test Full Reminder Screen Now</span>
              </button>
            </div>
          </section>

          {/* Accessibility: Text Size & High Contrast */}
          <section className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-5 sm:p-6 space-y-5">
            <div>
              <h2 className="font-display text-lg font-bold text-[#111C2D]">
                Reading Comfort & Accessibility
              </h2>
              <p className="text-sm text-[#475569] mt-0.5">
                Adjust text size and border contrast for effortless reading.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#111C2D]">Text Size</p>
              <div className="grid grid-cols-3 gap-2.5">
                {TEXT_SCALE_OPTIONS.map((opt) => {
                  const selected = settings.textScale === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onUpdateSettings({ textScale: opt.value })}
                      className={`min-h-[50px] px-3 rounded-xl border text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        selected
                          ? 'bg-[#0E6B5E] border-[#0E6B5E] text-white'
                          : 'bg-white border-[#CBD5E1] text-[#111C2D] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-3 border-t border-[#E5ECF3]">
              <div>
                <p className="font-semibold text-base text-[#111C2D]">
                  Extra High Contrast Borders
                </p>
                <p className="text-sm text-[#475569]">
                  Strengthens card outlines and foreground text contrast.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.highContrast}
                onClick={() =>
                  onUpdateSettings({ highContrast: !settings.highContrast })
                }
                className={`min-h-[46px] px-4 rounded-xl font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  settings.highContrast
                    ? 'bg-[#111C2D] text-white'
                    : 'bg-[#F1F5F9] text-[#475569]'
                }`}
              >
                {settings.highContrast ? 'On' : 'Off'}
              </button>
            </div>
          </section>
        </div>

        {/* Right column: Install App, Caregiver & Pharmacy Info */}
        <div className="lg:col-span-5 space-y-6">
          <PWAInstallButton variant="settings" />

          <section className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-lg font-bold text-[#111C2D]">
                Family Caregiver Check-In
              </h2>
              <p className="text-sm text-[#475569] leading-relaxed">
                Keep a family member updated with one tap, and store your
                pharmacy number handy for refills.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyCaregiverUpdate}
              className="w-full min-h-[52px] px-4 rounded-2xl bg-[#0E6B5E] hover:bg-[#0B574C] text-white font-semibold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copiedUpdate ? (
                <>
                  <ClipboardCheck className="w-5 h-5 shrink-0" />
                  <span>Today’s Check-In Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 shrink-0" />
                  <span>Copy Today’s Update</span>
                </>
              )}
            </button>

            <form
              onSubmit={handleSaveCaregiver}
              className="space-y-4 pt-3 border-t border-[#E5ECF3]"
            >
              <div>
                <label
                  htmlFor="cg-name"
                  className="block text-sm font-semibold text-[#111C2D] mb-1"
                >
                  Caregiver Name
                </label>
                <input
                  id="cg-name"
                  type="text"
                  value={caregiverForm.name}
                  onChange={(e) =>
                    setCaregiverForm({ ...caregiverForm, name: e.target.value })
                  }
                  className="w-full min-h-[48px] px-3.5 rounded-xl border border-[#CBD5E1] bg-white text-base text-[#111C2D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="cg-rel"
                    className="block text-sm font-semibold text-[#111C2D] mb-1"
                  >
                    Relationship
                  </label>
                  <input
                    id="cg-rel"
                    type="text"
                    value={caregiverForm.relation}
                    onChange={(e) =>
                      setCaregiverForm({
                        ...caregiverForm,
                        relation: e.target.value,
                      })
                    }
                    className="w-full min-h-[48px] px-3.5 rounded-xl border border-[#CBD5E1] bg-white text-base text-[#111C2D]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cg-phone"
                    className="block text-sm font-semibold text-[#111C2D] mb-1"
                  >
                    Phone Number
                  </label>
                  <input
                    id="cg-phone"
                    type="tel"
                    value={caregiverForm.phone}
                    onChange={(e) =>
                      setCaregiverForm({
                        ...caregiverForm,
                        phone: e.target.value,
                      })
                    }
                    className="w-full min-h-[48px] px-3.5 rounded-xl border border-[#CBD5E1] bg-white text-base text-[#111C2D]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="ph-name"
                  className="block text-sm font-semibold text-[#111C2D] mb-1"
                >
                  Pharmacy Name
                </label>
                <input
                  id="ph-name"
                  type="text"
                  value={caregiverForm.pharmacyName}
                  onChange={(e) =>
                    setCaregiverForm({
                      ...caregiverForm,
                      pharmacyName: e.target.value,
                    })
                  }
                  className="w-full min-h-[48px] px-3.5 rounded-xl border border-[#CBD5E1] bg-white text-base text-[#111C2D]"
                />
              </div>

              <div>
                <label
                  htmlFor="ph-phone"
                  className="block text-sm font-semibold text-[#111C2D] mb-1"
                >
                  Pharmacy Phone
                </label>
                <input
                  id="ph-phone"
                  type="tel"
                  value={caregiverForm.pharmacyPhone}
                  onChange={(e) =>
                    setCaregiverForm({
                      ...caregiverForm,
                      pharmacyPhone: e.target.value,
                    })
                  }
                  className="w-full min-h-[48px] px-3.5 rounded-xl border border-[#CBD5E1] bg-white text-base text-[#111C2D]"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                {caregiverForm.phone ? (
                  <a
                    href={`tel:${caregiverForm.phone.replace(/[^0-9+]/g, '')}`}
                    className="min-h-[48px] px-4 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#111C2D] font-semibold text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap"
                  >
                    <Phone className="w-4 h-4 text-[#0E6B5E]" />
                    <span>Call {caregiverForm.name.split(' ')[0] || 'Caregiver'}</span>
                  </a>
                ) : (
                  <span />
                )}

                <button
                  type="submit"
                  className="min-h-[48px] px-5 rounded-xl bg-[#111C2D] hover:bg-[#1E293B] text-white font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {savedCaregiver ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <span>Save Contacts</span>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
