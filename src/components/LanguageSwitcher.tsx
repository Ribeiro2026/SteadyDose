import { Globe } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { LANGUAGE_OPTIONS } from '../i18n/translations';

interface LanguageSwitcherProps {
  variant?: 'segmented' | 'settings';
}

export function LanguageSwitcher({
  variant = 'segmented',
}: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLanguage();

  if (variant === 'settings') {
    return (
      <section className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0E6B5E]/10 text-[#0E6B5E] flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-[#111C2D]">
              {t.settings.languageTitle}
            </h2>
            <p className="text-sm text-[#475569] mt-0.5">
              {t.settings.languageDesc}
            </p>
          </div>
        </div>

        <div
          className="grid grid-cols-3 gap-2.5"
          role="group"
          aria-label={t.meta.chooseLanguageAria}
        >
          {LANGUAGE_OPTIONS.map((opt) => {
            const active = language === opt.code;
            return (
              <button
                key={opt.code}
                type="button"
                lang={opt.code}
                dir={opt.dir}
                onClick={() => setLanguage(opt.code)}
                aria-pressed={active}
                className={`min-h-[50px] px-3 rounded-xl border text-sm sm:text-base font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#0E6B5E] border-[#0E6B5E] text-white'
                    : 'bg-white border-[#CBD5E1] text-[#111C2D] hover:bg-[#F8FAFC]'
                }`}
              >
                {opt.nativeLabel}
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-2xl bg-[#E8EEF5] self-start sm:self-auto"
      role="group"
      aria-label={t.meta.chooseLanguageAria}
    >
      <span
        className="px-2 text-[#475569] inline-flex items-center"
        aria-hidden="true"
      >
        <Globe className="w-4 h-4 shrink-0" />
      </span>
      {LANGUAGE_OPTIONS.map((opt) => {
        const active = language === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            lang={opt.code}
            dir={opt.dir}
            onClick={() => setLanguage(opt.code)}
            aria-pressed={active}
            className={`min-h-[40px] px-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              active
                ? 'bg-white text-[#111C2D] shadow-sm'
                : 'text-[#475569] hover:text-[#111C2D]'
            }`}
          >
            {opt.nativeLabel}
          </button>
        );
      })}
    </div>
  );
}
