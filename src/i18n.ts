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
    ns: ['common', 'ballot', 'walkthrough', 'info', 'election'],
    interpolation: {
      escapeValue: false,
    },
  });

// Set initial dir/lang attributes based on detected language
const lang = i18n.language;
document.documentElement.lang = lang;
document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

const SUPPORTED_LANGS = ['de', 'en', 'tr', 'ar', 'uk', 'ru'] as const;

type ElectionI18nModule = { default: Record<string, string> };

const I18N_IMPORTERS: Record<string, Record<string, () => Promise<ElectionI18nModule>>> = {
  'frankfurt-stvv': {
    de: () => import('./elections/frankfurt-stvv/i18n/de.json'),
    en: () => import('./elections/frankfurt-stvv/i18n/en.json'),
    tr: () => import('./elections/frankfurt-stvv/i18n/tr.json'),
    ar: () => import('./elections/frankfurt-stvv/i18n/ar.json'),
    uk: () => import('./elections/frankfurt-stvv/i18n/uk.json'),
    ru: () => import('./elections/frankfurt-stvv/i18n/ru.json'),
  },
  'frankfurt-kav': {
    de: () => import('./elections/frankfurt-kav/i18n/de.json'),
    en: () => import('./elections/frankfurt-kav/i18n/en.json'),
    tr: () => import('./elections/frankfurt-kav/i18n/tr.json'),
    ar: () => import('./elections/frankfurt-kav/i18n/ar.json'),
    uk: () => import('./elections/frankfurt-kav/i18n/uk.json'),
    ru: () => import('./elections/frankfurt-kav/i18n/ru.json'),
  },
  'wiesbaden-stvv': {
    de: () => import('./elections/wiesbaden-stvv/i18n/de.json'),
    en: () => import('./elections/wiesbaden-stvv/i18n/en.json'),
    tr: () => import('./elections/wiesbaden-stvv/i18n/tr.json'),
    ar: () => import('./elections/wiesbaden-stvv/i18n/ar.json'),
    uk: () => import('./elections/wiesbaden-stvv/i18n/uk.json'),
    ru: () => import('./elections/wiesbaden-stvv/i18n/ru.json'),
  },
  'wiesbaden-kav': {
    de: () => import('./elections/wiesbaden-kav/i18n/de.json'),
    en: () => import('./elections/wiesbaden-kav/i18n/en.json'),
    tr: () => import('./elections/wiesbaden-kav/i18n/tr.json'),
    ar: () => import('./elections/wiesbaden-kav/i18n/ar.json'),
    uk: () => import('./elections/wiesbaden-kav/i18n/uk.json'),
    ru: () => import('./elections/wiesbaden-kav/i18n/ru.json'),
  },
};

export async function loadElectionI18n(electionId: string): Promise<void> {
  const importers = I18N_IMPORTERS[electionId];
  if (!importers) return;

  await Promise.all(
    SUPPORTED_LANGS.map(async (lng) => {
      const importer = importers[lng];
      if (!importer) return;
      try {
        const mod = await importer();
        const translations = mod.default ?? mod;
        i18n.addResourceBundle(lng, 'election', translations, true, true);
      } catch {
        // Silently skip missing translations
      }
    }),
  );
}

export default i18n;
