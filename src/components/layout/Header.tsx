import { useTranslation } from 'react-i18next';

interface HeaderProps {
  onTourRestart?: () => void;
  onInfoToggle?: () => void;
  onWalkthroughToggle?: () => void;
  shouldPulse?: boolean;
}

export function Header({ onTourRestart, onInfoToggle, onWalkthroughToggle, shouldPulse }: HeaderProps) {
  const { t } = useTranslation('common');

  return (
    <header className="bg-frankfurt-blue text-white">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{t('appTitle')}</h1>
          <p className="text-sm text-white/80 mt-0.5">{t('appSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Walkthrough drawer toggle - mobile only */}
          {onWalkthroughToggle && (
            <button
              onClick={onWalkthroughToggle}
              className="lg:hidden w-8 h-8 rounded-full border-2 border-white/40 text-white/70 hover:border-white hover:text-white flex items-center justify-center text-sm transition-colors"
              title={t('walkthroughToggle', { defaultValue: 'Anleitung anzeigen' })}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          {/* Info drawer toggle - mobile only */}
          {onInfoToggle && (
            <button
              onClick={onInfoToggle}
              className="lg:hidden w-8 h-8 rounded-full border-2 border-white/40 text-white/70 hover:border-white hover:text-white flex items-center justify-center text-sm font-bold transition-colors"
              title={t('infoToggle', { defaultValue: 'Praktische Infos' })}
            >
              i
            </button>
          )}

          {/* Tour restart button */}
          {onTourRestart && (
            <button
              onClick={onTourRestart}
              className={`w-8 h-8 rounded-full border-2 border-white/40 text-white/70 hover:border-white hover:text-white flex items-center justify-center text-sm font-bold transition-colors ${shouldPulse ? 'animate-pulse-ring border-white text-white' : ''}`}
              title={t('tourRestart', { defaultValue: 'Anleitung erneut starten' })}
            >
              ?
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
