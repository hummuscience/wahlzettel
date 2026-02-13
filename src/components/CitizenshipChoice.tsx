import { useTranslation } from 'react-i18next';
import type { ElectionType } from '../utils/shareState';

const LANGUAGES = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', label: 'العربية', flag: '🌍' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
] as const;

interface CitizenshipChoiceProps {
  onChoose: (type: ElectionType) => void;
}

export function CitizenshipChoice({ onChoose }: CitizenshipChoiceProps) {
  const { t, i18n } = useTranslation('common');

  const switchLanguage = (code: string) => {
    i18n.changeLanguage(code);
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = code;
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Inline language selector */}
        <div className="flex justify-center gap-2 mb-8">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => switchLanguage(lang.code)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                i18n.language === lang.code
                  ? 'bg-frankfurt-blue text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-frankfurt-blue hover:text-frankfurt-blue'
              }`}
            >
              {lang.flag} {lang.label}
            </button>
          ))}
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-gray-900">
          {t('citizenshipTitle')}
        </h2>
        <p className="text-center text-gray-500 mb-8 text-sm">
          {t('citizenshipSubtitle')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onChoose('stvv')}
            className="bg-white rounded-xl border-2 border-gray-200 hover:border-frankfurt-blue shadow-sm hover:shadow-md p-6 text-start transition-all group"
          >
            <div className="text-3xl mb-3">🇩🇪</div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-frankfurt-blue transition-colors">
              {t('germanCitizen')}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {t('germanCitizenDesc')}
            </p>
            <div className="mt-4 text-xs font-semibold text-frankfurt-blue bg-frankfurt-blue-light rounded-full px-3 py-1 inline-block">
              93 Stimmen
            </div>
          </button>

          <button
            onClick={() => onChoose('kav')}
            className="bg-white rounded-xl border-2 border-gray-200 hover:border-frankfurt-blue shadow-sm hover:shadow-md p-6 text-start transition-all group"
          >
            <div className="text-3xl mb-3">🌍</div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-frankfurt-blue transition-colors">
              {t('nonGermanCitizen')}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {t('nonGermanCitizenDesc')}
            </p>
            <div className="mt-4 text-xs font-semibold text-frankfurt-blue bg-frankfurt-blue-light rounded-full px-3 py-1 inline-block">
              37 Stimmen
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
