import { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  MoreVertical,
  Share,
  Smartphone,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'card' | 'settings';
}

export function PWAInstallButton({ variant = 'card' }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } =
    usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // Suppress on standalone installed app for dashboard card; show calm confirmation in Settings
  if (isInstalled) {
    if (variant === 'card') {
      return null;
    }
    return (
      <section className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-5 sm:p-6 flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#0E6B5E] flex items-center justify-center shrink-0">
          <Check className="w-5 h-5" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="font-display text-base font-bold text-[#111C2D]">
            Installed on This Device
          </h2>
          <p className="text-sm text-[#475569]">
            SteadyDose is already saved to your home screen for quick, offline
            access.
          </p>
        </div>
      </section>
    );
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setJustInstalled(true);
      }
      return;
    }
    setShowGuide(true);
  };

  const handleCopyUrl = async () => {
    const url = window.location.origin;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const area = document.createElement('textarea');
      area.value = url;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <>
      <section className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-5 sm:p-6 space-y-3.5">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#0E6B5E]/10 text-[#0E6B5E] flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <h3 className="font-display text-lg font-bold text-[#111C2D] leading-snug">
              Install on Smartphone
            </h3>
            <p className="text-sm text-[#475569] leading-relaxed">
              Add SteadyDose to your phone’s home screen for one-tap access and
              offline medication tracking.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleClick()}
          className="w-full min-h-[50px] px-5 rounded-2xl bg-[#0E6B5E] hover:bg-[#0B574C] text-white font-display font-semibold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
        >
          {justInstalled ? (
            <>
              <Check className="w-5 h-5 shrink-0" />
              <span>App Installed</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5 shrink-0" />
              <span>Download App</span>
            </>
          )}
        </button>
      </section>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F172A]/60 backdrop-blur-sm p-0 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-guide-title"
        >
          <div className="surface-card w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-[#DCE3EC] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="sm:hidden pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-[#CBD5E1]" />
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5ECF3]">
              <h2
                id="pwa-install-guide-title"
                className="font-display text-xl font-bold text-[#111C2D]"
              >
                Install SteadyDose on Your Phone
              </h2>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#475569] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                aria-label="Close installation instructions"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <p className="text-base text-[#475569] leading-relaxed">
                SteadyDose installs directly from your phone’s web browser—no
                app store password needed.
              </p>

              {/* iPhone / iPad Instructions */}
              {!isAndroid && (
                <div className="rounded-2xl bg-[#F8FAFC] border border-[#DCE3EC] p-4 space-y-2.5">
                  <p className="font-display font-bold text-base text-[#111C2D]">
                    On iPhone or iPad (Safari)
                  </p>
                  <ol className="space-y-2 text-sm text-[#334155] leading-relaxed">
                    <li className="flex items-start gap-2.5">
                      <span className="font-mono font-bold text-[#0E6B5E] shrink-0">
                        1.
                      </span>
                      <span>
                        Tap the{' '}
                        <span className="inline-flex items-center gap-1 font-semibold text-[#111C2D]">
                          Share <Share className="w-3.5 h-3.5 inline" />
                        </span>{' '}
                        button at the bottom of Safari.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="font-mono font-bold text-[#0E6B5E] shrink-0">
                        2.
                      </span>
                      <span>
                        Scroll down and tap{' '}
                        <strong className="text-[#111C2D]">
                          Add to Home Screen
                        </strong>
                        .
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="font-mono font-bold text-[#0E6B5E] shrink-0">
                        3.
                      </span>
                      <span>
                        Tap <strong className="text-[#111C2D]">Add</strong> in
                        the top corner to place SteadyDose on your home screen.
                      </span>
                    </li>
                  </ol>
                </div>
              )}

              {/* Android Instructions */}
              {!isIOS && (
                <div className="rounded-2xl bg-[#F8FAFC] border border-[#DCE3EC] p-4 space-y-2.5">
                  <p className="font-display font-bold text-base text-[#111C2D]">
                    On Android (Chrome)
                  </p>
                  <ol className="space-y-2 text-sm text-[#334155] leading-relaxed">
                    <li className="flex items-start gap-2.5">
                      <span className="font-mono font-bold text-[#0E6B5E] shrink-0">
                        1.
                      </span>
                      <span>
                        Tap the{' '}
                        <span className="inline-flex items-center gap-0.5 font-semibold text-[#111C2D]">
                          Menu <MoreVertical className="w-3.5 h-3.5 inline" />
                        </span>{' '}
                        button in the top-right corner of Chrome.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="font-mono font-bold text-[#0E6B5E] shrink-0">
                        2.
                      </span>
                      <span>
                        Tap{' '}
                        <strong className="text-[#111C2D]">Install app</strong>{' '}
                        or{' '}
                        <strong className="text-[#111C2D]">
                          Add to Home screen
                        </strong>
                        .
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="font-mono font-bold text-[#0E6B5E] shrink-0">
                        3.
                      </span>
                      <span>
                        Confirm by tapping{' '}
                        <strong className="text-[#111C2D]">Install</strong>.
                      </span>
                    </li>
                  </ol>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => void handleCopyUrl()}
                  className="flex-1 min-h-[50px] px-4 rounded-2xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#111C2D] font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-[#0E6B5E] shrink-0" />
                      <span>App Link Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#334155] shrink-0" />
                      <span>Copy Link for Phone</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  className="min-h-[50px] px-6 rounded-2xl bg-[#111C2D] hover:bg-[#1E293B] text-white font-semibold text-base transition-colors cursor-pointer whitespace-nowrap"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
