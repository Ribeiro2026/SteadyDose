import { useState } from 'react';
import {
  PackagePlus,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { Medication } from '../types/medication';
import { PillVisual } from './PillVisual';

interface MedicationsViewProps {
  medications: Medication[];
  onOpenAdd: () => void;
  onEdit: (med: Medication) => void;
  onToggleActive: (medId: string) => void;
  onDelete: (medId: string) => void;
  onRefill: (medId: string, amount: number) => void;
}

export function MedicationsView({
  medications,
  onOpenAdd,
  onEdit,
  onToggleActive,
  onDelete,
  onRefill,
}: MedicationsViewProps) {
  const { t, formatTime, getDisplayMed } = useLanguage();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const activeMeds = medications.filter((m) => m.active);
  const pausedMeds = medications.filter((m) => !m.active);

  const renderMedCard = (med: Medication) => {
    const dispMed = getDisplayMed(med);
    const isLow = med.active && med.remainingPills <= med.refillThreshold;
    const isConfirming = confirmDeleteId === med.id;
    const colorName = t.pills.colors[med.color].label;
    const shapeName = t.pills.shapes[med.shape];

    return (
      <article
        key={med.id}
        className={`surface-card rounded-3xl bg-white border border-[#DCE3EC] p-5 sm:p-6 flex flex-col justify-between gap-5 ${
          !med.active ? 'opacity-75' : ''
        }`}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <PillVisual shape={med.shape} color={med.color} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-xl font-bold text-[#111C2D] leading-snug">
                  {dispMed.name} {dispMed.dosage}
                </h2>
                {!med.active && (
                  <span className="text-sm font-semibold text-[#64748B]">
                    {t.medications.paused}
                  </span>
                )}
              </div>
              <p className="text-sm text-[#475569] mt-0.5">
                {dispMed.quantityLabel} · {colorName} {shapeName} · {dispMed.purpose}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm border-t border-[#E5ECF3] pt-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[#475569]">{t.medications.reminderTimes}</span>
              <span
                dir="ltr"
                className="font-mono font-semibold text-[#111C2D] text-end tabular-nums"
              >
                {med.times.map(formatTime).join(' · ')}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[#475569]">{t.medications.instructions}</span>
              <span className="text-[#111C2D] text-end">
                {dispMed.instructions}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[#475569]">{t.medications.supplyOnHand}</span>
              <span
                className={`font-mono font-semibold tabular-nums ${
                  isLow ? 'text-[#B45309]' : 'text-[#111C2D]'
                }`}
              >
                {t.medications.pillsCount(med.remainingPills)}
                {isLow ? t.medications.refillSoonSuffix : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isConfirming ? (
          <div className="rounded-2xl bg-[#FEF2F2] border border-[#FECACA] p-3.5 space-y-3">
            <p className="text-sm font-semibold text-[#991B1B]">
              {t.medications.confirmRemove(dispMed.name)}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onDelete(med.id);
                  setConfirmDeleteId(null);
                }}
                className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                {t.medications.yesRemove}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 min-h-[44px] px-4 rounded-xl bg-white border border-[#CBD5E1] text-[#334155] font-semibold text-sm hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                {t.medications.cancel}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#E5ECF3]">
            <button
              type="button"
              onClick={() => onRefill(med.id, 30)}
              className="min-h-[46px] px-3.5 rounded-xl bg-[#0E6B5E]/10 hover:bg-[#0E6B5E]/15 text-[#0E6B5E] font-semibold text-sm flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <PackagePlus className="w-4 h-4 shrink-0" />
              <span>{t.medications.refill30}</span>
            </button>

            <button
              type="button"
              onClick={() => onEdit(med)}
              className="min-h-[46px] px-3.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#111C2D] font-semibold text-sm flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Pencil className="w-4 h-4 shrink-0" />
              <span>{t.medications.edit}</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleActive(med.id)}
              className="min-h-[46px] px-3.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#334155] font-semibold text-sm flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              {med.active ? (
                <>
                  <PauseCircle className="w-4 h-4 shrink-0" />
                  <span>{t.medications.pause}</span>
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 shrink-0 text-[#0E6B5E]" />
                  <span>{t.medications.resume}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setConfirmDeleteId(med.id)}
              className="min-h-[46px] min-w-[46px] ms-auto rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#FEF2F2] hover:border-[#FECACA] text-[#475569] hover:text-[#B91C1C] flex items-center justify-center transition-colors cursor-pointer"
              aria-label={t.medications.removeAria(dispMed.name)}
              title={t.medications.removeTitle}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#475569]">
            {t.medications.eyebrow}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111C2D] tracking-tight mt-0.5">
            {t.medications.title(activeMeds.length)}
          </h1>
        </div>

        <button
          type="button"
          onClick={onOpenAdd}
          className="self-start sm:self-auto min-h-[50px] px-5 rounded-2xl bg-[#0E6B5E] hover:bg-[#0B574C] text-white font-display font-semibold text-base flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-5 h-5 shrink-0" />
          <span>{t.medications.addMedicine}</span>
        </button>
      </div>

      {activeMeds.length === 0 ? (
        <div className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-8 text-center space-y-3">
          <h2 className="font-display text-xl font-bold text-[#111C2D]">
            {t.medications.emptyTitle}
          </h2>
          <p className="text-base text-[#475569]">
            {t.medications.emptyBody}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeMeds.map(renderMedCard)}
        </div>
      )}

      {pausedMeds.length > 0 && (
        <section className="space-y-3 pt-2">
          <h2 className="font-display text-lg font-bold text-[#475569]">
            {t.medications.pausedSectionTitle(pausedMeds.length)}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pausedMeds.map(renderMedCard)}
          </div>
        </section>
      )}
    </div>
  );
}
