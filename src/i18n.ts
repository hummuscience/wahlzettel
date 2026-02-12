import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonDe from './locales/de/common.json';
import ballotDe from './locales/de/ballot.json';
import walkthroughDe from './locales/de/walkthrough.json';
import infoDe from './locales/de/info.json';

import commonEn from './locales/en/common.json';
import ballotEn from './locales/en/ballot.json';
import walkthroughEn from './locales/en/walkthrough.json';
import infoEn from './locales/en/info.json';

import commonTr from './locales/tr/common.json';
import ballotTr from './locales/tr/ballot.json';
import walkthroughTr from './locales/tr/walkthrough.json';
import infoTr from './locales/tr/info.json';

import commonAr from './locales/ar/common.json';
import ballotAr from './locales/ar/ballot.json';
import walkthroughAr from './locales/ar/walkthrough.json';
import infoAr from './locales/ar/info.json';

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
      en: {
        common: commonEn,
        ballot: ballotEn,
        walkthrough: walkthroughEn,
        info: infoEn,
      },
      tr: {
        common: commonTr,
        ballot: ballotTr,
        walkthrough: walkthroughTr,
        info: infoTr,
      },
      ar: {
        common: commonAr,
        ballot: ballotAr,
        walkthrough: walkthroughAr,
        info: infoAr,
      },
    },
    fallbackLng: 'de',
    supportedLngs: ['de', 'en', 'tr', 'ar'],
    defaultNS: 'common',
    ns: ['common', 'ballot', 'walkthrough', 'info'],
    interpolation: {
      escapeValue: false,
    },
  });

// Set initial dir/lang attributes based on detected language
const lang = i18n.language;
document.documentElement.lang = lang;
document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

export default i18n;
