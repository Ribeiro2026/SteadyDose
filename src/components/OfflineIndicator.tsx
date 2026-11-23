import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { useLanguage } from '../i18n/LanguageContext';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const { t } = useLanguage();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-[#FEF3C7] border-b border-[#FDE68A] text-[#92400E] px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 print:hidden"
    >
      <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>{t.offline.banner}</span>
    </div>
  );
}
