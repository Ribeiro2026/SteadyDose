import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { Medication, PillColor, PillShape } from '../types/medication';
import { PILL_COLOR_STYLES, PILL_SHAPES, PillVisual } from './PillVisual';

const PILL_COLOR_KEYS: PillColor[] = [
  'white',
  'sky',
  'butter',
  'coral',
  'sage',
  'amber',
];

interface MedicationFormModalProps {
  initialMedication?: Medication | null;
  onSave: (medication: Omit<Medication, 'id' | 'createdAt'>, existingId?: string) => void;
  onClose: () => void;
}

export function MedicationFormModal({
  initialMedication,
  onSave,
  onClose,
}: MedicationFormModalProps) {
  const { t, formatTime, getDisplayMed } = useLanguage();
  const displayInitial = initialMedication
    ? getDisplayMed(initialMedication)
    : null;

  const presetTimes: Array<{ label: string; time: string }> = [
    { label: t.form.presetMorning, time: '08:00' },
    { label: t.form.presetMidday, time: '12:30' },
    { label: t.form.presetEvening, time: '18:30' },
    { label: t.form.presetBedtime, time: '21:00' },
  ];

  const [name, setName] = useState(displayInitial?.name ?? '');
  const [dosage, setDosage] = useState(displayInitial?.dosage ?? '');
  const [quantityLabel, setQuantityLabel] = useState(
    displayInitial?.quantityLabel ?? t.form.defaultQty
  );
  const [purpose, setPurpose] = useState(displayInitial?.purpose ?? '');
  const [instructions, setInstructions] = useState(
    displayInitial?.instructions ?? t.form.defaultInstructions
  );
  const [times, setTimes] = useState<string[]>(
    initialMedication?.times?.length ? [...initialMedication.times] : ['08:00']
  );
  const [customTime, setCustomTime] = useState('09:00');
  const [shape, setShape] = useState<PillShape>(
    initialMedication?.shape ?? 'round'
  );
  const [color, setColor] = useState<PillColor>(
    initialMedication?.color ?? 'sky'
  );
  const [remainingPills, setRemainingPills] = useState<string>(
    String(initialMedication?.remainingPills ?? 30)
  );
  const [refillThreshold, setRefillThreshold] = useState<string>(
    String(initialMedication?.refillThreshold ?? 7)
  );
  const [error, setError] = useState('');

  const togglePresetTime = (timeVal: string) => {
    setError('');
    if (times.includes(timeVal)) {
      if (times.length === 1) return; // keep at least one time
      setTimes(times.filter((timeItem) => timeItem !== timeVal));
    } else {
      setTimes([...times, timeVal].sort());
    }
  };

  const addCustomTime = () => {
    if (!customTime) return;
    setError('');
    if (!times.includes(customTime)) {
      setTimes([...times, customTime].sort());
    }
  };

  const removeTime = (timeVal: string) => {
    if (times.length <= 1) return;
    setTimes(times.filter((timeItem) => timeItem !== timeVal));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t.form.errNameRequired);
      return;
    }
    if (times.length === 0) {
      setError(t.form.errTimeRequired);
      return;
    }

    onSave(
      {
        name: trimmedName,
        dosage: dosage.trim() || t.form.defaultDosage,
        quantityLabel: quantityLabel.trim() || t.form.defaultQty,
        purpose: purpose.trim() || t.form.defaultPurpose,
        instructions: instructions.trim() || t.form.defaultInstructions,
        times: [...times].sort(),
        shape,
        color,
        remainingPills: Math.max(0, Number.parseInt(remainingPills, 10) || 0),
        refillThreshold: Math.max(1, Number.parseInt(refillThreshold, 10) || 7),
        active: initialMedication?.active ?? true,
      },
      initialMedication?.id
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F172A]/55 backdrop-blur-sm p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="med-form-title"
    >
      <div className="surface-card w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl border border-[#DCE3EC] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Mobile drag affordance */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-[#CBD5E1]" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5ECF3]">
          <h2
            id="med-form-title"
            className="font-display text-xl font-bold text-[#111C2D]"
          >
            {initialMedication ? t.form.editTitle : t.form.addTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#475569] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
            aria-label={t.form.closeAria}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div
              role="alert"
              className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-4 py-3 text-sm font-medium text-[#991B1B]"
            >
              {error}
            </div>
          )}

          {/* Live visual preview */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FAFC] border border-[#DCE3EC]">
            <PillVisual shape={shape} color={color} size="md" />
            <div className="min-w-0">
              <p className="font-display font-bold text-lg text-[#111C2D] truncate">
                {name.trim() || t.form.previewFallbackName}{' '}
                <span className="font-normal text-[#475569]">
                  {dosage.trim() || '10 mg'}
                </span>
              </p>
              <p className="text-sm text-[#475569] mt-0.5 truncate">
                {quantityLabel || t.form.defaultQty} ·{' '}
                <span dir="ltr" className="inline-block">
                  {times.map(formatTime).join(', ')}
                </span>
              </p>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="med-name"
                className="block text-sm font-semibold text-[#111C2D] mb-1.5"
              >
                {t.form.medicineName}
              </label>
              <input
                id="med-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.form.medicineNamePlaceholder}
                className="w-full min-h-[48px] px-4 rounded-xl border border-[#CBD5E1] bg-white text-base text-[#111C2D] placeholder:text-[#94A3B8] focus:border-[#0E6B5E] focus:outline-none"
                required
              />
            </div>

            <div>
              <label
                htmlFor="med-dosage"
                className="block text-sm font-semibold text-[#111C2D] mb-1.5"
              >
                {t.form.strengthDosage}
              </label>
              <input
                id="med-dosage"
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder={t.form.strengthPlaceholder}
                className="w-full min-h-[48px] px-4 rounded-xl border border-[#CBD5E1] bg-white text-base text-[#111C2D] placeholder:text-[#94A3B8] focus:border-[#0E6B5E] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="med-qty"
                className="block text-sm font-semibold text-[#111C2D] mb-1.5"
              >
                {t.form.amountPerDose}
              </label>
              <input
                id="med-qty"
                type="text"
                value={quantityLabel}
                onChange={(e) => setQuantityLabel(e.target.value)}
                placeholder={t.form.amountPlaceholder}
                className="w-full min-h-[48px] px-4 rounded-xl border border-[#CBD5E1] bg-white text-base text-[#111C2D] placeholder:text-[#94A3B8] focus:border-[#0E6B5E] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="med-purpose"
                className="block text-sm font-semibold text-[#111C2D] mb-1.5"
              >
                {t.form.whatItHelpsWith}
              </label>
              <input
                id="med-purpose"
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder={t.form.purposePlaceholder}
                className="w-full min-h-[48px] px-4 rounded-xl border border-[#CBD5E1] bg-white text-base text-[#111C2D] placeholder:text-[#94A3B8] focus:border-[#0E6B5E] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="med-instructions"
              className="block text-sm font-semibold text-[#111C2D] mb-1.5"
            >
              {t.form.instructionsLabel}
            </label>
            <input
              id="med-instructions"
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={t.form.instructionsPlaceholder}
              className="w-full min-h-[48px] px-4 rounded-xl border border-[#CBD5E1] bg-white text-base text-[#111C2D] placeholder:text-[#94A3B8] focus:border-[#0E6B5E] focus:outline-none"
            />
          </div>

          {/* Reminder Times */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#111C2D]">
              {t.form.reminderTimesLabel}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presetTimes.map((preset) => {
                const active = times.includes(preset.time);
                return (
                  <button
                    key={preset.time}
                    type="button"
                    onClick={() => togglePresetTime(preset.time)}
                    className={`min-h-[52px] px-3 py-2 rounded-xl border text-center transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#0E6B5E] border-[#0E6B5E] text-white font-semibold'
                        : 'bg-white border-[#CBD5E1] text-[#111C2D] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span className="block text-sm leading-tight">
                      {preset.label}
                    </span>
                    <span
                      dir="ltr"
                      className={`block font-mono text-xs mt-0.5 tabular-nums ${
                        active ? 'text-white/90' : 'text-[#475569]'
                      }`}
                    >
                      {formatTime(preset.time)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="time"
                dir="ltr"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                aria-label={t.form.customTimeAria}
                className="min-h-[48px] px-3.5 rounded-xl border border-[#CBD5E1] bg-white font-mono text-base text-[#111C2D] tabular-nums"
              />
              <button
                type="button"
                onClick={addCustomTime}
                className="min-h-[48px] px-4 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#111C2D] font-semibold text-sm flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>{t.form.addCustomTime}</span>
              </button>
            </div>

            {times.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {times.map((timeVal) => (
                  <div
                    key={timeVal}
                    className="inline-flex items-center gap-2 ps-3.5 pe-1.5 py-1.5 rounded-xl bg-[#F1F5F9] border border-[#DCE3EC] text-sm font-mono font-medium text-[#111C2D] tabular-nums"
                  >
                    <span dir="ltr">{formatTime(timeVal)}</span>
                    {times.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTime(timeVal)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#475569] hover:bg-white hover:text-[#B91C1C] transition-colors cursor-pointer"
                        aria-label={t.form.removeTimeAria(formatTime(timeVal))}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pill Shape & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p className="text-sm font-semibold text-[#111C2D] mb-2">
                {t.form.pillShape}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PILL_SHAPES.map((item) => {
                  const selected = shape === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setShape(item.value)}
                      className={`min-h-[46px] px-3 rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#0E6B5E] border-[#0E6B5E] text-white'
                          : 'bg-white border-[#CBD5E1] text-[#111C2D] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {t.pills.shapes[item.value]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#111C2D] mb-2">
                {t.form.pillColor}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PILL_COLOR_KEYS.map((key) => {
                  const style = PILL_COLOR_STYLES[key];
                  const selected = color === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setColor(key)}
                      className={`min-h-[46px] px-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        selected
                          ? 'border-[#0E6B5E] ring-2 ring-[#0E6B5E]/30 bg-[#F0FDF9] text-[#111C2D]'
                          : 'border-[#CBD5E1] bg-white text-[#334155] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border shrink-0"
                        style={{
                          backgroundColor: style.fill,
                          borderColor: style.stroke,
                        }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{t.pills.colors[key].short}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Supply tracking */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="med-remaining"
                className="block text-sm font-semibold text-[#111C2D] mb-1.5"
              >
                {t.form.pillsOnHand}
              </label>
              <input
                id="med-remaining"
                type="number"
                dir="ltr"
                min={0}
                max={999}
                value={remainingPills}
                onChange={(e) => setRemainingPills(e.target.value)}
                className="w-full min-h-[48px] px-4 rounded-xl border border-[#CBD5E1] bg-white font-mono text-base text-[#111C2D] tabular-nums focus:border-[#0E6B5E] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="med-threshold"
                className="block text-sm font-semibold text-[#111C2D] mb-1.5"
              >
                {t.form.refillAlertBelow}
              </label>
              <input
                id="med-threshold"
                type="number"
                dir="ltr"
                min={1}
                max={90}
                value={refillThreshold}
                onChange={(e) => setRefillThreshold(e.target.value)}
                className="w-full min-h-[48px] px-4 rounded-xl border border-[#CBD5E1] bg-white font-mono text-base text-[#111C2D] tabular-nums focus:border-[#0E6B5E] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-[#E5ECF3]">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[52px] px-6 rounded-2xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#334155] font-semibold text-base transition-colors cursor-pointer"
            >
              {t.form.cancel}
            </button>
            <button
              type="submit"
              className="min-h-[52px] px-7 rounded-2xl bg-[#0E6B5E] hover:bg-[#0B574C] text-white font-display font-semibold text-base transition-colors cursor-pointer"
            >
              {initialMedication ? t.form.saveChanges : t.form.saveMedicine}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
