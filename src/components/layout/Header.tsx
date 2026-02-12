import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';

const LANGUAGES = [
  { code: 'de', label: 'DE', name: 'Deutsch' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'tr', label: 'TR', name: 'Türkçe' },
  { code: 'ar', label: 'عر', name: 'العربية', rtl: true },
] as const;

interface HeaderProps {
  onTourRestart?: () => void;
  onInfoToggle?: () => void;
  onWalkthroughToggle?: () => void;
  onShare?: () => void;
  shouldPulse?: boolean;
}

export function Header({ onTourRestart, onInfoToggle, onWalkthroughToggle, onShare, shouldPulse }: HeaderProps) {
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
    <header className="bg-frankfurt-blue text-white">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{t('appTitle')}</h1>
          <p className="text-sm text-white/80 mt-0.5">{t('appSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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

          {/* Share button */}
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
