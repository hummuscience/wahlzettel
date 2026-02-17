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
  'darmstadt-stvv': {
    de: () => import('./elections/darmstadt-stvv/i18n/de.json'),
    en: () => import('./elections/darmstadt-stvv/i18n/en.json'),
    tr: () => import('./elections/darmstadt-stvv/i18n/tr.json'),
    ar: () => import('./elections/darmstadt-stvv/i18n/ar.json'),
    uk: () => import('./elections/darmstadt-stvv/i18n/uk.json'),
    ru: () => import('./elections/darmstadt-stvv/i18n/ru.json'),
  },
  'kassel-stvv': {
    de: () => import('./elections/kassel-stvv/i18n/de.json'),
    en: () => import('./elections/kassel-stvv/i18n/en.json'),
    tr: () => import('./elections/kassel-stvv/i18n/tr.json'),
    ar: () => import('./elections/kassel-stvv/i18n/ar.json'),
    uk: () => import('./elections/kassel-stvv/i18n/uk.json'),
    ru: () => import('./elections/kassel-stvv/i18n/ru.json'),
  },
  'hanau-stvv': {
    de: () => import('./elections/hanau-stvv/i18n/de.json'),
    en: () => import('./elections/hanau-stvv/i18n/en.json'),
    tr: () => import('./elections/hanau-stvv/i18n/tr.json'),
    ar: () => import('./elections/hanau-stvv/i18n/ar.json'),
    uk: () => import('./elections/hanau-stvv/i18n/uk.json'),
    ru: () => import('./elections/hanau-stvv/i18n/ru.json'),
  },
  'offenbach-stvv': {
    de: () => import('./elections/offenbach-stvv/i18n/de.json'),
    en: () => import('./elections/offenbach-stvv/i18n/en.json'),
    tr: () => import('./elections/offenbach-stvv/i18n/tr.json'),
    ar: () => import('./elections/offenbach-stvv/i18n/ar.json'),
    uk: () => import('./elections/offenbach-stvv/i18n/uk.json'),
    ru: () => import('./elections/offenbach-stvv/i18n/ru.json'),
  },
  'giessen-stvv': {
    de: () => import('./elections/giessen-stvv/i18n/de.json'),
    en: () => import('./elections/giessen-stvv/i18n/en.json'),
    tr: () => import('./elections/giessen-stvv/i18n/tr.json'),
    ar: () => import('./elections/giessen-stvv/i18n/ar.json'),
    uk: () => import('./elections/giessen-stvv/i18n/uk.json'),
    ru: () => import('./elections/giessen-stvv/i18n/ru.json'),
  },
  'marburg-stvv': {
    de: () => import('./elections/marburg-stvv/i18n/de.json'),
    en: () => import('./elections/marburg-stvv/i18n/en.json'),
    tr: () => import('./elections/marburg-stvv/i18n/tr.json'),
    ar: () => import('./elections/marburg-stvv/i18n/ar.json'),
    uk: () => import('./elections/marburg-stvv/i18n/uk.json'),
    ru: () => import('./elections/marburg-stvv/i18n/ru.json'),
  },
  'fulda-stvv': {
    de: () => import('./elections/fulda-stvv/i18n/de.json'),
    en: () => import('./elections/fulda-stvv/i18n/en.json'),
    tr: () => import('./elections/fulda-stvv/i18n/tr.json'),
    ar: () => import('./elections/fulda-stvv/i18n/ar.json'),
    uk: () => import('./elections/fulda-stvv/i18n/uk.json'),
    ru: () => import('./elections/fulda-stvv/i18n/ru.json'),
  },
  'ruesselsheim-stvv': {
    de: () => import('./elections/ruesselsheim-stvv/i18n/de.json'),
    en: () => import('./elections/ruesselsheim-stvv/i18n/en.json'),
    tr: () => import('./elections/ruesselsheim-stvv/i18n/tr.json'),
    ar: () => import('./elections/ruesselsheim-stvv/i18n/ar.json'),
    uk: () => import('./elections/ruesselsheim-stvv/i18n/uk.json'),
    ru: () => import('./elections/ruesselsheim-stvv/i18n/ru.json'),
  },
  'muenchen-stadtrat': {
    de: () => import('./elections/muenchen-stadtrat/i18n/de.json'),
    en: () => import('./elections/muenchen-stadtrat/i18n/en.json'),
    tr: () => import('./elections/muenchen-stadtrat/i18n/tr.json'),
    ar: () => import('./elections/muenchen-stadtrat/i18n/ar.json'),
    uk: () => import('./elections/muenchen-stadtrat/i18n/uk.json'),
    ru: () => import('./elections/muenchen-stadtrat/i18n/ru.json'),
  },
  'nuernberg-stadtrat': {
    de: () => import('./elections/nuernberg-stadtrat/i18n/de.json'),
    en: () => import('./elections/nuernberg-stadtrat/i18n/en.json'),
    tr: () => import('./elections/nuernberg-stadtrat/i18n/tr.json'),
    ar: () => import('./elections/nuernberg-stadtrat/i18n/ar.json'),
    uk: () => import('./elections/nuernberg-stadtrat/i18n/uk.json'),
    ru: () => import('./elections/nuernberg-stadtrat/i18n/ru.json'),
  },
  'augsburg-stadtrat': {
    de: () => import('./elections/augsburg-stadtrat/i18n/de.json'),
    en: () => import('./elections/augsburg-stadtrat/i18n/en.json'),
    tr: () => import('./elections/augsburg-stadtrat/i18n/tr.json'),
    ar: () => import('./elections/augsburg-stadtrat/i18n/ar.json'),
    uk: () => import('./elections/augsburg-stadtrat/i18n/uk.json'),
    ru: () => import('./elections/augsburg-stadtrat/i18n/ru.json'),
  },
  'regensburg-stadtrat': {
    de: () => import('./elections/regensburg-stadtrat/i18n/de.json'),
    en: () => import('./elections/regensburg-stadtrat/i18n/en.json'),
    tr: () => import('./elections/regensburg-stadtrat/i18n/tr.json'),
    ar: () => import('./elections/regensburg-stadtrat/i18n/ar.json'),
    uk: () => import('./elections/regensburg-stadtrat/i18n/uk.json'),
    ru: () => import('./elections/regensburg-stadtrat/i18n/ru.json'),
  },
  'ingolstadt-stadtrat': {
    de: () => import('./elections/ingolstadt-stadtrat/i18n/de.json'),
    en: () => import('./elections/ingolstadt-stadtrat/i18n/en.json'),
    tr: () => import('./elections/ingolstadt-stadtrat/i18n/tr.json'),
    ar: () => import('./elections/ingolstadt-stadtrat/i18n/ar.json'),
    uk: () => import('./elections/ingolstadt-stadtrat/i18n/uk.json'),
    ru: () => import('./elections/ingolstadt-stadtrat/i18n/ru.json'),
  },
  'wuerzburg-stadtrat': {
    de: () => import('./elections/wuerzburg-stadtrat/i18n/de.json'),
    en: () => import('./elections/wuerzburg-stadtrat/i18n/en.json'),
    tr: () => import('./elections/wuerzburg-stadtrat/i18n/tr.json'),
    ar: () => import('./elections/wuerzburg-stadtrat/i18n/ar.json'),
    uk: () => import('./elections/wuerzburg-stadtrat/i18n/uk.json'),
    ru: () => import('./elections/wuerzburg-stadtrat/i18n/ru.json'),
  },
  'fuerth-stadtrat': {
    de: () => import('./elections/fuerth-stadtrat/i18n/de.json'),
    en: () => import('./elections/fuerth-stadtrat/i18n/en.json'),
    tr: () => import('./elections/fuerth-stadtrat/i18n/tr.json'),
    ar: () => import('./elections/fuerth-stadtrat/i18n/ar.json'),
    uk: () => import('./elections/fuerth-stadtrat/i18n/uk.json'),
    ru: () => import('./elections/fuerth-stadtrat/i18n/ru.json'),
  },
  'erlangen-stadtrat': {
    de: () => import('./elections/erlangen-stadtrat/i18n/de.json'),
    en: () => import('./elections/erlangen-stadtrat/i18n/en.json'),
    tr: () => import('./elections/erlangen-stadtrat/i18n/tr.json'),
    ar: () => import('./elections/erlangen-stadtrat/i18n/ar.json'),
    uk: () => import('./elections/erlangen-stadtrat/i18n/uk.json'),
    ru: () => import('./elections/erlangen-stadtrat/i18n/ru.json'),
  },
  'bamberg-stadtrat': {
    de: () => import('./elections/bamberg-stadtrat/i18n/de.json'),
    en: () => import('./elections/bamberg-stadtrat/i18n/en.json'),
    tr: () => import('./elections/bamberg-stadtrat/i18n/tr.json'),
    ar: () => import('./elections/bamberg-stadtrat/i18n/ar.json'),
    uk: () => import('./elections/bamberg-stadtrat/i18n/uk.json'),
    ru: () => import('./elections/bamberg-stadtrat/i18n/ru.json'),
  },
  'bayreuth-stadtrat': {
    de: () => import('./elections/bayreuth-stadtrat/i18n/de.json'),
    en: () => import('./elections/bayreuth-stadtrat/i18n/en.json'),
    tr: () => import('./elections/bayreuth-stadtrat/i18n/tr.json'),
    ar: () => import('./elections/bayreuth-stadtrat/i18n/ar.json'),
    uk: () => import('./elections/bayreuth-stadtrat/i18n/uk.json'),
    ru: () => import('./elections/bayreuth-stadtrat/i18n/ru.json'),
  },
};

export async function loadElectionI18n(electionId: string): Promise<void> {
  const importers = I18N_IMPORTERS[electionId];
  if (!importers) return;

  // Remove old election bundles so stale keys don't persist
  for (const lng of SUPPORTED_LANGS) {
    if (i18n.hasResourceBundle(lng, 'election')) {
      i18n.removeResourceBundle(lng, 'election');
    }
  }

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
