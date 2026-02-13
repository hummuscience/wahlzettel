import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';

const LANGUAGES = [
  { code: 'de', label: 'DE', name: 'Deutsch' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'tr', label: 'TR', name: 'Türkçe' },
  { code: 'ar', label: 'عر', name: 'العربية', rtl: true },
  { code: 'uk', label: 'УК', name: 'Українська' },
  { code: 'ru', label: 'РУ', name: 'Русский' },
] as const;

interface HeaderProps {
  onTourRestart?: () => void;
  onInfoToggle?: () => void;
  onWalkthroughToggle?: () => void;
  onShare?: () => void;
  onPrint?: () => void;
  onSwitchBallot?: () => void;
  shouldPulse?: boolean;
}

export function Header({ onTourRestart, onInfoToggle, onWalkthroughToggle, onShare, onPrint, onSwitchBallot, shouldPulse }: HeaderProps) {
  const { t, i18n } = useTranslation('common');
  const [langOpen, setLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0];

  // Close dropdown on outside click
  useEffect(() => {
    if (!langOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [langOpen]);

  const switchLanguage = (code: string) => {
    i18n.changeLanguage(code);
    const isRtl = code === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = code;
    setLangOpen(false);
  };

  return (
    <header className="bg-frankfurt-blue text-white relative z-60">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{t('appTitle')}</h1>
          <p className="text-sm text-white/80 mt-0.5">{t('appSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Switch ballot button */}
          {onSwitchBallot && (
            <button
              onClick={onSwitchBallot}
              className="h-8 px-2.5 rounded-full border-2 border-white/40 text-white/70 hover:border-white hover:text-white flex items-center justify-center text-xs font-bold transition-colors gap-1"
              title={t('switchBallot')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.598a.75.75 0 00-.75.75v3.634a.75.75 0 001.5 0v-2.033l.312.311a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm-10.624-2.85a5.5 5.5 0 019.201-2.466l.312.311H11.77a.75.75 0 000 1.5h3.634a.75.75 0 00.75-.75V3.535a.75.75 0 00-1.5 0v2.033l-.312-.311A7 7 0 002.63 8.394a.75.75 0 001.45.39z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          {/* Language switcher */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setLangOpen(prev => !prev)}
              className="h-8 px-2 rounded-full border-2 border-white/40 text-white/70 hover:border-white hover:text-white flex items-center justify-center text-xs font-bold transition-colors"
              title={t('language')}
            >
              {currentLang.label}
            </button>
            {langOpen && (
              <div className="absolute end-0 top-full mt-1 bg-white text-gray-900 rounded-lg shadow-lg overflow-hidden z-50 min-w-[120px]">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => switchLanguage(lang.code)}
                    className={`w-full px-3 py-2 text-sm text-start hover:bg-frankfurt-blue-light flex items-center justify-between ${
                      lang.code === i18n.language ? 'bg-frankfurt-blue-light font-bold' : ''
                    }`}
                  >
                    <span>{lang.name}</span>
                    <span className="text-xs text-gray-400 ms-2">{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

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

          {/* Share & Print buttons */}
          {(onShare || onPrint) && (
            <div className="flex items-center gap-2" data-tour="share-print">
              {onShare && (
                <button
                  onClick={onShare}
                  className="w-8 h-8 rounded-full border-2 border-white/40 text-white/70 hover:border-white hover:text-white flex items-center justify-center transition-colors"
                  title={t('teilen', { ns: 'ballot', defaultValue: 'Teilen' })}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .799l6.733 3.366a2.5 2.5 0 11-.671 1.341l-6.733-3.366a2.5 2.5 0 110-3.483l6.733-3.366A2.52 2.52 0 0113 4.5z" />
                  </svg>
                </button>
              )}
              {onPrint && (
                <button
                  onClick={onPrint}
                  className="w-8 h-8 rounded-full border-2 border-white/40 text-white/70 hover:border-white hover:text-white flex items-center justify-center transition-colors"
                  title={t('drucken', { ns: 'ballot', defaultValue: 'Drucken' })}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.046.752.097 1.126.153A2.212 2.212 0 0118 8.653v4.097A2.25 2.25 0 0115.75 15h-.75v3.25a.75.75 0 01-.75.75h-8.5a.75.75 0 01-.75-.75V15h-.75A2.25 2.25 0 012 12.75V8.653c0-1.082.775-2.034 1.874-2.198.374-.056.749-.107 1.126-.153V2.75zm1.5 0v3.379a74.587 74.587 0 017 0V2.75a.25.25 0 00-.25-.25h-6.5a.25.25 0 00-.25.25zM7.25 15.25v2.5h5.5v-2.5h-5.5z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
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
