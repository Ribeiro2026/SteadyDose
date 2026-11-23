import { useState } from 'react';
import { Bell, Check, Clock, Volume2, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { ScheduledDose, SkipReason } from '../types/medication';
import { PillVisual } from './PillVisual';

const SKIP_REASONS: SkipReason[] = [
  'Forgot',
  'Not feeling well',
  'Ran out of pills',
  'Doctor advised',
];

interface ReminderOverlayProps {
  dose: ScheduledDose;
  snoozeMinutes: number;
  isPreview?: boolean;
  onTake: (dose: ScheduledDose) => void;
  onSnooze: (dose: ScheduledDose) => void;
  onSkip: (dose: ScheduledDose, reason: SkipReason) => void;
  onDismiss: () => void;
  onReplayChime: () => void;
}

export function ReminderOverlay({
  dose,
  snoozeMinutes,
  isPreview = false,
  onTake,
  onSnooze,
  onSkip,
  onDismiss,
  onReplayChime,
}: ReminderOverlayProps) {
  const { t, formatTime, getDisplayMed } = useLanguage();
  const [choosingSkipReason, setChoosingSkipReason] = useState(false);
  const dispMed = getDisplayMed(dose.medication);
  const colorLabel = t.pills.colors[dispMed.color].label;
  const shapeLabel = t.pills.shapes[dispMed.shape];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F172A]/65 backdrop-blur-sm p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminder-modal-title"
    >
      <div className="surface-card w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-[#DCE3EC] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top bar inside sheet */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#E5ECF3] bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5 text-[#0E6B5E]">
            <Bell className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span className="font-display font-semibold text-base text-[#111C2D]">
              {isPreview ? t.reminder.sampleTitle : t.reminder.dueTitle}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onReplayChime}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#334155] hover:bg-[#E2E8F0]/70 transition-colors cursor-pointer"
              aria-label={t.reminder.replayChimeAria}
              title={t.reminder.replayChimeTitle}
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#334155] hover:bg-[#E2E8F0]/70 transition-colors cursor-pointer"
              aria-label={t.reminder.closeAria}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="flex items-start gap-4">
            <PillVisual
              shape={dispMed.shape}
              color={dispMed.color}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-sm font-semibold text-[#0E6B5E] tabular-nums">
                {t.reminder.scheduledFor(formatTime(dose.scheduledTime))}
              </p>
              <h2
                id="reminder-modal-title"
                className="font-display text-2xl sm:text-3xl font-bold text-[#111C2D] mt-1 leading-tight"
              >
                {dispMed.name} {dispMed.dosage}
              </h2>
              <p className="text-base text-[#475569] mt-1.5">
                {dispMed.quantityLabel} · {colorLabel} {shapeLabel}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#F4F7FA] border border-[#DCE3EC] p-4 space-y-1.5">
            <p className="text-sm font-semibold text-[#334155]">
              {t.reminder.howToTakeIt}
            </p>
            <p className="text-base text-[#111C2D] leading-relaxed">
              {dispMed.instructions || t.reminder.defaultInstruction}
            </p>
            {dispMed.purpose && (
              <p className="text-sm text-[#475569] pt-1">
                {t.reminder.forPurpose(dispMed.purpose)}
              </p>
            )}
          </div>

          {!choosingSkipReason ? (
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => onTake(dose)}
                className="w-full min-h-[60px] px-6 py-4 rounded-2xl bg-[#0E6B5E] hover:bg-[#0B574C] active:scale-[0.99] text-white font-display font-semibold text-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <Check className="w-6 h-6 shrink-0" strokeWidth={2.5} />
                <span>{t.reminder.iTookItNow}</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onSnooze(dose)}
                  className="min-h-[54px] px-5 py-3.5 rounded-2xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#111C2D] font-semibold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Clock className="w-5 h-5 shrink-0 text-[#334155]" />
                  <span>{t.reminder.remindIn(snoozeMinutes)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChoosingSkipReason(true)}
                  className="min-h-[54px] px-5 py-3.5 rounded-2xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569] font-semibold text-base flex items-center justify-center transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>{t.reminder.skipThisDose}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <p className="text-base font-semibold text-[#111C2D]">
                {t.reminder.whySkipping}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SKIP_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => onSkip(dose, reason)}
                    className="min-h-[50px] px-4 py-3 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#111C2D] font-medium text-base text-start transition-colors cursor-pointer"
                  >
                    {t.skipReasons[reason]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setChoosingSkipReason(false)}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl text-[#475569] hover:text-[#111C2D] font-medium text-base cursor-pointer"
              >
                {t.reminder.backToReminder}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
