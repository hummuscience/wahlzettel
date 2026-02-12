import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonDe from './locales/de/common.json';
import ballotDe from './locales/de/ballot.json';
import walkthroughDe from './locales/de/walkthrough.json';
import infoDe from './locales/de/info.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: {
        common: commonDe,
        ballot: ballotDe,
        walkthrough: walkthroughDe,
        info: infoDe,
      },
    },
    lng: 'de',
    fallbackLng: 'de',
    defaultNS: 'common',
    ns: ['common', 'ballot', 'walkthrough', 'info'],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
