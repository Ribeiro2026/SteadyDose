import { createContext, ReactNode, useContext, useMemo } from 'react';
import { AppLanguage, Medication } from '../types/medication';
import {
  formatHumanDate,
  formatTimeForLanguage,
  formatTimestampForLanguage,
} from '../utils/schedule';
import {
  LANGUAGE_META,
  LanguageOption,
  SEED_MED_TRANSLATIONS,
  TRANSLATIONS,
  TranslationDict,
} from './translations';

export function detectBrowserLanguage(): AppLanguage {
  if (typeof navigator === 'undefined') return 'en';
  const candidates = [navigator.language, ...(navigator.languages ?? [])];
  for (const raw of candidates) {
    const code = (raw || '').toLowerCase();
    if (code.startsWith('he') || code.startsWith('iw')) return 'he';
    if (code.startsWith('pt')) return 'pt';
    if (code.startsWith('en')) return 'en';
  }
  return 'en';
}

const DEFAULT_SEED_ENGLISH_FIELDS: Record<
  string,
  {
    name: string;
    dosage: string;
    quantityLabel: string;
    purpose: string;
    instructions: string;
  }
> = {
  'med-lisinopril': {
    name: 'Lisinopril',
    dosage: '10 mg',
    quantityLabel: '1 tablet',
    purpose: 'Blood pressure',
    instructions: 'Take in the morning with a full glass of water',
  },
  'med-metformin': {
    name: 'Metformin',
    dosage: '500 mg',
    quantityLabel: '1 tablet',
    purpose: 'Blood sugar',
    instructions: 'Take with breakfast and dinner to settle stomach',
  },
  'med-vitamin-d': {
    name: 'Vitamin D3',
    dosage: '1000 IU',
    quantityLabel: '1 softgel',
    purpose: 'Bone strength',
    instructions: 'Take with lunch for best absorption',
  },
  'med-atorvastatin': {
    name: 'Atorvastatin',
    dosage: '20 mg',
    quantityLabel: '1 tablet',
    purpose: 'Cholesterol',
    instructions: 'Take before bed, with or without food',
  },
};

export function localizeMedicationForDisplay(
  med: Medication,
  language: AppLanguage
): Medication {
  if (language === 'en') return med;
  const translated = SEED_MED_TRANSLATIONS[language]?.[med.id];
  const baseEn = DEFAULT_SEED_ENGLISH_FIELDS[med.id];
  if (!translated || !baseEn) return med;

  // Only translate individual fields that still match the default English seed value,
  // preserving any custom edits the user made.
  return {
    ...med,
    name: med.name === baseEn.name ? translated.name : med.name,
    dosage: med.dosage === baseEn.dosage ? translated.dosage : med.dosage,
    quantityLabel:
      med.quantityLabel === baseEn.quantityLabel
        ? translated.quantityLabel
        : med.quantityLabel,
    purpose: med.purpose === baseEn.purpose ? translated.purpose : med.purpose,
    instructions:
      med.instructions === baseEn.instructions
        ? translated.instructions
        : med.instructions,
  };
}

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  meta: LanguageOption;
  isRTL: boolean;
  locale: string;
  t: TranslationDict;
  formatTime: (hhmm: string) => string;
  formatTimestamp: (iso?: string) => string;
  formatDate: (dateKey: string, todayKey: string) => string;
  formatDistance: (meters: number | null) => string | null;
  getDisplayMed: (med: Medication) => Medication;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

interface LanguageProviderProps {
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  children: ReactNode;
}

export function LanguageProvider({
  language,
  onChangeLanguage,
  children,
}: LanguageProviderProps) {
  const value = useMemo<LanguageContextValue>(() => {
    const meta = LANGUAGE_META[language] ?? LANGUAGE_META.en;
    const t = TRANSLATIONS[language] ?? TRANSLATIONS.en;

    const formatDistance = (meters: number | null): string | null => {
      if (meters == null || Number.isNaN(meters)) return null;
      if (meta.useMetric) {
        const km = meters / 1000;
        return km < 0.1
          ? `< 0.1 ${t.nearby.distanceUnit}`
          : `${km.toFixed(1)} ${t.nearby.distanceUnit}`;
      }
      const miles = meters / 1609.344;
      return miles < 0.1
        ? `< 0.1 ${t.nearby.distanceUnit}`
        : `${miles.toFixed(1)} ${t.nearby.distanceUnit}`;
    };

    return {
      language,
      setLanguage: onChangeLanguage,
      meta,
      isRTL: meta.dir === 'rtl',
      locale: meta.locale,
      t,
      formatTime: (hhmm: string) => formatTimeForLanguage(hhmm, language),
      formatTimestamp: (iso?: string) => formatTimestampForLanguage(iso, language),
      formatDate: (dateKey: string, todayKey: string) =>
        formatHumanDate(dateKey, todayKey, language),
      formatDistance,
      getDisplayMed: (med: Medication) =>
        localizeMedicationForDisplay(med, language),
    };
  }, [language, onChangeLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
