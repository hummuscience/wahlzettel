import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GERMANY_PATHS } from './germanyPaths';

const LANGUAGES = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', label: 'العربية', flag: '🌍' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
] as const;

const STATE_NAMES: Record<string, string> = {
  bw: 'Baden-Württemberg', by: 'Bayern', be: 'Berlin', bb: 'Brandenburg',
  hb: 'Bremen', hh: 'Hamburg', he: 'Hessen', ni: 'Niedersachsen',
  mv: 'Mecklenburg-Vorpommern', nw: 'Nordrhein-Westfalen',
  rp: 'Rheinland-Pfalz', sl: 'Saarland', sn: 'Sachsen',
  st: 'Sachsen-Anhalt', sh: 'Schleswig-Holstein', th: 'Thüringen',
};

interface Election {
  slug: string;
  label: string;
  descriptionKey: string;
  emoji: string;
  stimmen: number;
  themeColor: string;
}

interface CityEntry {
  name: string;
  stateId: string;
  elections: Election[];
}

const CITIES: CityEntry[] = [
  {
    name: 'Darmstadt',
    stateId: 'he',
    elections: [
      { slug: 'darmstadt-stvv', label: 'Stadtverordnetenversammlung', descriptionKey: 'stvvDesc', emoji: '🇩🇪', stimmen: 71, themeColor: '#004e8a' },
    ],
  },
  {
    name: 'Frankfurt',
    stateId: 'he',
    elections: [
      { slug: 'frankfurt-stvv', label: 'Stadtverordnetenversammlung', descriptionKey: 'stvvDesc', emoji: '🇩🇪', stimmen: 93, themeColor: '#003870' },
      { slug: 'frankfurt-kav', label: 'Kommunale Ausländervertretung', descriptionKey: 'kavDesc', emoji: '🌍', stimmen: 37, themeColor: '#003870' },
    ],
  },
  {
    name: 'Fulda',
    stateId: 'he',
    elections: [
      { slug: 'fulda-stvv', label: 'Stadtverordnetenversammlung', descriptionKey: 'stvvDesc', emoji: '🇩🇪', stimmen: 59, themeColor: '#8B0000' },
    ],
  },
  {
    name: 'Gießen',
    stateId: 'he',
    elections: [
      { slug: 'giessen-stvv', label: 'Stadtverordnetenversammlung', descriptionKey: 'stvvDesc', emoji: '🇩🇪', stimmen: 59, themeColor: '#006633' },
    ],
  },
  {
    name: 'Hanau',
    stateId: 'he',
    elections: [
      { slug: 'hanau-stvv', label: 'Stadtverordnetenversammlung', descriptionKey: 'stvvDesc', emoji: '🇩🇪', stimmen: 59, themeColor: '#c41e3a' },
    ],
  },
  {
    name: 'Kassel',
    stateId: 'he',
    elections: [
      { slug: 'kassel-stvv', label: 'Stadtverordnetenversammlung', descriptionKey: 'stvvDesc', emoji: '🇩🇪', stimmen: 71, themeColor: '#004f9f' },
    ],
  },
  {
    name: 'Marburg',
    stateId: 'he',
    elections: [
      { slug: 'marburg-stvv', label: 'Stadtverordnetenversammlung', descriptionKey: 'stvvDesc', emoji: '🇩🇪', stimmen: 59, themeColor: '#163455' },
    ],
  },
  {
    name: 'Offenbach',
    stateId: 'he',
    elections: [
      { slug: 'offenbach-stvv', label: 'Stadtverordnetenversammlung', descriptionKey: 'stvvDesc', emoji: '🇩🇪', stimmen: 71, themeColor: '#1a5276' },
    ],
  },
  {
    name: 'Rüsselsheim',
    stateId: 'he',
    elections: [
      { slug: 'ruesselsheim-stvv', label: 'Stadtverordnetenversammlung', descriptionKey: 'stvvDesc', emoji: '🇩🇪', stimmen: 45, themeColor: '#003399' },
    ],
  },
  {
    name: 'Wiesbaden',
    stateId: 'he',
    elections: [
      { slug: 'wiesbaden-stvv', label: 'Stadtverordnetenversammlung', descriptionKey: 'stvvDesc', emoji: '🇩🇪', stimmen: 81, themeColor: '#00594f' },
      { slug: 'wiesbaden-kav', label: 'Ausländerbeirat', descriptionKey: 'kavDesc', emoji: '🌍', stimmen: 31, themeColor: '#00594f' },
    ],
  },
];

// Group cities by state for quick lookup
const CITIES_BY_STATE: Record<string, CityEntry[]> = {};
for (const city of CITIES) {
  (CITIES_BY_STATE[city.stateId] ??= []).push(city);
}

const STATES_WITH_CITIES = new Set(Object.keys(CITIES_BY_STATE));

type PickerStep =
  | { view: 'germany' }
  | { view: 'state'; stateId: string }
  | { view: 'city'; city: CityEntry };

// Hand-tuned label centers for states with elections (SVG viewBox 0 0 586 793)
const STATE_LABEL_POS: Record<string, { x: number; y: number }> = {
  he: { x: 200, y: 476 },
};

interface ElectionPickerProps {
  onChoose: (slug: string) => void;
}

export function ElectionPicker({ onChoose }: ElectionPickerProps) {
  const { t, i18n } = useTranslation('common');
  const [step, setStep] = useState<PickerStep>({ view: 'germany' });
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const switchLanguage = (code: string) => {
    i18n.changeLanguage(code);
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = code;
  };


  // --- View: Germany ---
  if (step.view === 'germany') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-3xl w-full">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-gray-900">
            {t('citizenshipTitle')}
          </h2>
          <p className="text-center text-gray-500 mb-6 text-sm">
            {t('citizenshipSubtitle')}
          </p>
          <div className="relative mx-auto max-w-md md:max-w-xl lg:max-w-2xl">
            <svg viewBox="0 0 586 793" className="w-full h-auto">
              {GERMANY_PATHS.map(state => {
                const hasCities = STATES_WITH_CITIES.has(state.id);
                const isHovered = hoveredState === state.id;
                return (
                  <path
                    key={state.id}
                    d={state.d}
                    fill={
                      hasCities
                        ? isHovered ? '#3b82f6' : '#93c5fd'
                        : '#f3f4f6'
                    }
                    stroke={hasCities && isHovered ? '#1d4ed8' : '#d1d5db'}
                    strokeWidth="1"
                    className={`transition-colors duration-150 ${hasCities ? 'cursor-pointer' : ''}`}
                    style={{ pointerEvents: hasCities ? 'auto' : 'none' }}
                    onClick={() => hasCities && setStep({ view: 'state', stateId: state.id })}
                    onMouseEnter={() => hasCities && setHoveredState(state.id)}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                );
              })}
              {/* Labels for states with elections */}
              {Array.from(STATES_WITH_CITIES).map(stateId => (
                <text
                  key={`label-${stateId}`}
                  x={STATE_LABEL_POS[stateId]?.x ?? 0}
                  y={STATE_LABEL_POS[stateId]?.y ?? 0}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="700"
                  fill={hoveredState === stateId ? '#1d4ed8' : '#1e3a5f'}
                  className="pointer-events-none select-none transition-colors duration-150"
                  style={{ textShadow: '0 0 4px white, 0 0 4px white, 0 0 4px white' }}
                >
                  {STATE_NAMES[stateId]}
                </text>
              ))}
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // --- View: City List ---
  if (step.view === 'state') {
    const { stateId } = step;
    const cities = CITIES_BY_STATE[stateId] || [];

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full">
          <button
            onClick={() => setStep({ view: 'germany' })}
            className="mb-4 text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            ← {t('back')}
          </button>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-gray-900">
            {STATE_NAMES[stateId] ?? stateId}
          </h2>
          <p className="text-center text-gray-500 mb-6 text-sm">
            {t('citizenshipSubtitle')}
          </p>

          <div className="flex flex-col gap-2">
            {cities.map(city => (
              <button
                key={city.name}
                onClick={() => {
                  // If city has only one election, go directly to it
                  if (city.elections.length === 1) {
                    onChoose(city.elections[0].slug);
                  } else {
                    setStep({ view: 'city', city });
                  }
                }}
                className="flex items-center justify-between rounded-xl border border-gray-200 hover:border-gray-400 hover:shadow-sm px-5 py-4 transition-all bg-white group text-start"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: city.elections[0].themeColor }}
                  />
                  <span className="font-semibold text-gray-900 group-hover:text-gray-700">
                    {city.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {city.elections.length > 1 && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {city.elections.length} Wahlen
                    </span>
                  )}
                  <span className="text-gray-300 group-hover:text-gray-500 transition-colors">›</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- View: City Elections ---
  const { city } = step;
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <button
          onClick={() => setStep({ view: 'state', stateId: city.stateId })}
          className="mb-4 text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
        >
          ← {t('back')}
        </button>

        {/* Language selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => switchLanguage(lang.code)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                i18n.language === lang.code
                  ? 'bg-[#003870] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-[#003870] hover:text-[#003870]'
              }`}
            >
              {lang.flag} {lang.label}
            </button>
          ))}
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-gray-900">
          {city.name}
        </h2>
        <p className="text-center text-gray-500 mb-8 text-sm">
          {t('citizenshipSubtitle')}
        </p>

        {/* Election cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {city.elections.map(election => (
            <button
              key={election.slug}
              onClick={() => onChoose(election.slug)}
              className="text-start rounded-xl border border-gray-200 hover:border-[color:var(--btn-color)] hover:shadow-md p-5 transition-all group bg-white"
              style={{ '--btn-color': election.themeColor } as React.CSSProperties}
            >
              <span className="text-3xl mb-3 block">{election.emoji}</span>
              <p className="text-base font-semibold text-gray-900 group-hover:text-[color:var(--btn-color)] transition-colors">
                {election.label}
              </p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {t(election.descriptionKey)}
              </p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {election.stimmen} {t('stimmen', { ns: 'ballot' })}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
