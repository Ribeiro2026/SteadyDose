import { useState } from 'react';
import {
  PackagePlus,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { Medication } from '../types/medication';
import { formatTime12h } from '../utils/schedule';
import { PILL_COLOR_STYLES, PillVisual } from './PillVisual';

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const activeMeds = medications.filter((m) => m.active);
  const pausedMeds = medications.filter((m) => !m.active);

  const renderMedCard = (med: Medication) => {
    const isLow = med.active && med.remainingPills <= med.refillThreshold;
    const isConfirming = confirmDeleteId === med.id;
    const colorName = PILL_COLOR_STYLES[med.color].label;

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
                  {med.name} {med.dosage}
                </h2>
                {!med.active && (
                  <span className="text-sm font-semibold text-[#64748B]">
                    Paused
                  </span>
                )}
              </div>
              <p className="text-sm text-[#475569] mt-0.5">
                {med.quantityLabel} · {colorName} {med.shape} · {med.purpose}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm border-t border-[#E5ECF3] pt-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[#475569]">Reminder times</span>
              <span className="font-mono font-semibold text-[#111C2D] text-right tabular-nums">
                {med.times.map(formatTime12h).join(' · ')}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[#475569]">Instructions</span>
              <span className="text-[#111C2D] text-right">
                {med.instructions}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[#475569]">Supply on hand</span>
              <span
                className={`font-mono font-semibold tabular-nums ${
                  isLow ? 'text-[#B45309]' : 'text-[#111C2D]'
                }`}
              >
                {med.remainingPills} pills
                {isLow ? ' · Refill soon' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isConfirming ? (
          <div className="rounded-2xl bg-[#FEF2F2] border border-[#FECACA] p-3.5 space-y-3">
            <p className="text-sm font-semibold text-[#991B1B]">
              Remove {med.name} from your schedule?
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
                Yes, Remove
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 min-h-[44px] px-4 rounded-xl bg-white border border-[#CBD5E1] text-[#334155] font-semibold text-sm hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                Cancel
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
              <span>+30 Refill</span>
            </button>

            <button
              type="button"
              onClick={() => onEdit(med)}
              className="min-h-[46px] px-3.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#111C2D] font-semibold text-sm flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Pencil className="w-4 h-4 shrink-0" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleActive(med.id)}
              className="min-h-[46px] px-3.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#334155] font-semibold text-sm flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              {med.active ? (
                <>
                  <PauseCircle className="w-4 h-4 shrink-0" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 shrink-0 text-[#0E6B5E]" />
                  <span>Resume</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setConfirmDeleteId(med.id)}
              className="min-h-[46px] min-w-[46px] ml-auto rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#FEF2F2] hover:border-[#FECACA] text-[#475569] hover:text-[#B91C1C] flex items-center justify-center transition-colors cursor-pointer"
              aria-label={`Remove ${med.name}`}
              title="Remove medicine"
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
          <p className="text-sm font-medium text-[#475569]">Medicine Cabinet</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111C2D] tracking-tight mt-0.5">
            My Medications ({activeMeds.length} Active)
          </h1>
        </div>

        <button
          type="button"
          onClick={onOpenAdd}
          className="self-start sm:self-auto min-h-[50px] px-5 rounded-2xl bg-[#0E6B5E] hover:bg-[#0B574C] text-white font-display font-semibold text-base flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-5 h-5 shrink-0" />
          <span>Add Medicine</span>
        </button>
      </div>

      {activeMeds.length === 0 ? (
        <div className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-8 text-center space-y-3">
          <h2 className="font-display text-xl font-bold text-[#111C2D]">
            No active medications
          </h2>
          <p className="text-base text-[#475569]">
            Add a medication to start receiving reminders and tracking your
            supply.
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
            Paused Medications ({pausedMeds.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pausedMeds.map(renderMedCard)}
          </div>
        </section>
      )}
    </div>
  );
}
