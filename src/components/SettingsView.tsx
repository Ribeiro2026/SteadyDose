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
import { useLanguage } from '../i18n/LanguageContext';
import {
  AppSettings,
  ChimeStyle,
  ScheduledDose,
  TextScale,
} from '../types/medication';
import { LanguageSwitcher } from './LanguageSwitcher';
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
  const { t, formatTime, formatTimestamp, getDisplayMed } = useLanguage();
  const [caregiverForm, setCaregiverForm] = useState(settings.caregiver);
  const [savedCaregiver, setSavedCaregiver] = useState(false);
  const [copiedUpdate, setCopiedUpdate] = useState(false);

  const chimeOptions: Array<{ value: ChimeStyle; label: string; desc: string }> =
    [
      { value: 'bell', label: t.settings.chimeBell, desc: t.settings.chimeBellDesc },
      { value: 'warm', label: t.settings.chimeWarm, desc: t.settings.chimeWarmDesc },
      { value: 'clear', label: t.settings.chimeClear, desc: t.settings.chimeClearDesc },
    ];

  const textScaleOptions: Array<{ value: TextScale; label: string }> = [
    { value: 'standard', label: t.settings.textStandard },
    { value: 'large', label: t.settings.textLarge },
    { value: 'xlarge', label: t.settings.textXLarge },
  ];

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
      t.settings.checkinHeader(taken, total),
      ...todayDoses.map((d) => {
        const dispMed = getDisplayMed(d.medication);
        const status =
          d.status === 'taken'
            ? t.settings.checkinTakenAt(formatTimestamp(d.log?.takenAt))
            : d.status === 'skipped'
              ? t.settings.checkinSkipped
              : d.isOverdue
                ? t.settings.checkinStillDue
                : t.settings.checkinScheduled(formatTime(d.scheduledTime));
        return `- ${dispMed.name} (${dispMed.dosage}): ${status}`;
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
          {t.settings.eyebrow}
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111C2D] tracking-tight mt-0.5">
          {t.settings.title}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Language, Sound, Alerts & Accessibility */}
        <div className="lg:col-span-7 space-y-6">
          {/* Language Picker */}
          <LanguageSwitcher variant="settings" />

          {/* Reminder Sound & Alerts */}
          <section className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-5 sm:p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold text-[#111C2D]">
                  {t.settings.chimeTitle}
                </h2>
                <p className="text-sm text-[#475569] mt-0.5">
                  {t.settings.chimeDesc}
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
                    <span>{t.settings.soundOn}</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 shrink-0" />
                    <span>{t.settings.muted}</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#111C2D]">
                {t.settings.chimeToneLabel}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {chimeOptions.map((option) => {
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
                      className={`min-h-[58px] p-3 rounded-2xl border text-start transition-colors cursor-pointer ${
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
                {t.settings.snoozeDuration}
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
                      {t.settings.minutesLabel(mins)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Browser notifications */}
            <div className="pt-4 border-t border-[#E5ECF3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-base text-[#111C2D]">
                  {t.settings.deviceNotifications}
                </p>
                <p className="text-sm text-[#475569]">
                  {notificationPermission === 'granted'
                    ? t.settings.notifGranted
                    : notificationPermission === 'denied'
                      ? t.settings.notifDenied
                      : notificationPermission === 'unsupported'
                        ? t.settings.notifUnsupported
                        : t.settings.notifDefault}
                </p>
              </div>
              {notificationPermission === 'default' && (
                <button
                  type="button"
                  onClick={onRequestNotificationPermission}
                  className="min-h-[48px] px-4 rounded-xl bg-[#111C2D] hover:bg-[#1E293B] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <BellRing className="w-4 h-4 shrink-0" />
                  <span>{t.settings.enableAlerts}</span>
                </button>
              )}
              {notificationPermission === 'granted' && (
                <span className="text-sm font-semibold text-[#0E6B5E] whitespace-nowrap">
                  {t.settings.enabled}
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
                <span>{t.settings.testFullReminder}</span>
              </button>
            </div>
          </section>

          {/* Accessibility: Text Size & High Contrast */}
          <section className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-5 sm:p-6 space-y-5">
            <div>
              <h2 className="font-display text-lg font-bold text-[#111C2D]">
                {t.settings.readingComfortTitle}
              </h2>
              <p className="text-sm text-[#475569] mt-0.5">
                {t.settings.readingComfortDesc}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#111C2D]">
                {t.settings.textSize}
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {textScaleOptions.map((opt) => {
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
                  {t.settings.highContrastTitle}
                </p>
                <p className="text-sm text-[#475569]">
                  {t.settings.highContrastDesc}
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
                {settings.highContrast ? t.settings.on : t.settings.off}
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
                {t.settings.caregiverTitle}
              </h2>
              <p className="text-sm text-[#475569] leading-relaxed">
                {t.settings.caregiverDesc}
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
                  <span>{t.settings.checkinCopied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 shrink-0" />
                  <span>{t.settings.copyTodaysUpdate}</span>
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
                  {t.settings.caregiverName}
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
                    {t.settings.relationship}
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
                    {t.settings.phoneNumber}
                  </label>
                  <input
                    id="cg-phone"
                    type="tel"
                    dir="ltr"
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
                  {t.settings.pharmacyName}
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
                  {t.settings.pharmacyPhone}
                </label>
                <input
                  id="ph-phone"
                  type="tel"
                  dir="ltr"
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
                    <span>
                      {t.settings.callCaregiver(
                        caregiverForm.name.split(' ')[0] ||
                          t.settings.caregiverFallback
                      )}
                    </span>
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
                      <span>{t.settings.saved}</span>
                    </>
                  ) : (
                    <span>{t.settings.saveContacts}</span>
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
