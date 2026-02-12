import { useTranslation } from 'react-i18next';

interface KopfleisteCheckboxProps {
  isChecked: boolean;
  onToggle: () => void;
  stimmenFromList: number;
}

export function KopfleisteCheckbox({ isChecked, onToggle, stimmenFromList }: KopfleisteCheckboxProps) {
  const { t } = useTranslation('ballot');

  return (
    <div data-tour="kopfleiste" className={`px-3 py-2 border-b-2 border-gray-200 ${isChecked ? 'bg-frankfurt-blue-light' : 'bg-gray-50'}`}>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={onToggle}
          className="w-5 h-5 rounded border-gray-300 text-frankfurt-blue accent-frankfurt-blue"
        />
        <span className="font-medium text-sm">{t('dieseListeWaehlen')}</span>
        <span
          className="ml-1 text-gray-400 cursor-help"
          title={t('kopfleisteInfo')}
        >
          ⓘ
        </span>
      </label>
      {isChecked && (
        <p className="text-xs text-gray-600 mt-1 ml-7">
          {t('stimmenAufListe', { count: stimmenFromList })}
        </p>
      )}
    </div>
  );
}
