import { useTranslation } from 'react-i18next';

interface HeaderProps {
  onTourRestart?: () => void;
}

export function Header({ onTourRestart }: HeaderProps) {
  const { t } = useTranslation('common');

  return (
    <header className="bg-frankfurt-blue text-white">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{t('appTitle')}</h1>
          <p className="text-sm text-white/80 mt-0.5">{t('appSubtitle')}</p>
        </div>
        {onTourRestart && (
          <button
            onClick={onTourRestart}
            className="w-8 h-8 rounded-full border-2 border-white/40 text-white/70 hover:border-white hover:text-white flex items-center justify-center text-sm font-bold transition-colors shrink-0"
            title={t('tourRestart', { defaultValue: 'Anleitung erneut starten' })}
          >
            ?
          </button>
        )}
      </div>
    </header>
  );
}
