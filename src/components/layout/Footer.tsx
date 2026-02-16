import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation('common');
  const { t: te } = useTranslation('election');

  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-12">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <p className="text-xs text-gray-500 leading-relaxed">
          {te('disclaimer', { defaultValue: t('disclaimer') })}
        </p>
        <details className="text-xs text-gray-400 mt-3">
          <summary className="cursor-pointer hover:text-gray-600">Impressum</summary>
          <p className="mt-1">
            Dr. Muad Abd El Hay · Guentherstr. 8, 60528 Frankfurt am Main ·{' '}
            <a href="mailto:muad.abdelhay@gmail.com" className="underline hover:text-gray-600">
              muad.abdelhay@gmail.com
            </a>
          </p>
        </details>
        <p className="text-xs text-gray-400 mt-3">
          {te('madeWith', { defaultValue: t('madeWith') })}
        </p>
      </div>
    </footer>
  );
}
