import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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

import commonUk from './locales/uk/common.json';
import ballotUk from './locales/uk/ballot.json';
import walkthroughUk from './locales/uk/walkthrough.json';
import infoUk from './locales/uk/info.json';

import commonRu from './locales/ru/common.json';
import ballotRu from './locales/ru/ballot.json';
import walkthroughRu from './locales/ru/walkthrough.json';
import infoRu from './locales/ru/info.json';

i18n
  .use(initReactI18next)
  .init({
    lng: 'de',
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
      uk: {
        common: commonUk,
        ballot: ballotUk,
        walkthrough: walkthroughUk,
        info: infoUk,
      },
      ru: {
        common: commonRu,
        ballot: ballotRu,
        walkthrough: walkthroughRu,
        info: infoRu,
      },
    },
    fallbackLng: 'de',
    supportedLngs: ['de', 'en', 'tr', 'ar', 'uk', 'ru'],
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
