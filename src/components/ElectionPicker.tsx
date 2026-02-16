import { useState, useMemo } from 'react';
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

interface CityMarker {
  name: string;
  stateId: string;
  x: number;
  y: number;
  labelSide?: 'left' | 'right';
  elections: Election[];
}

const CITIES: CityMarker[] = [
  {
    name: 'Frankfurt',
    stateId: 'he',
    x: 182,
    y: 510,
    labelSide: 'right',
    elections: [
      {
        slug: 'frankfurt-stvv',
        label: 'Stadtverordnetenversammlung',
        descriptionKey: 'stvvDesc',
        emoji: '🇩🇪',
        stimmen: 93,
        themeColor: '#003870',
      },
      {
        slug: 'frankfurt-kav',
        label: 'Kommunale Ausländervertretung',
        descriptionKey: 'kavDesc',
        emoji: '🌍',
        stimmen: 37,
        themeColor: '#003870',
      },
    ],
  },
  {
    name: 'Wiesbaden',
    stateId: 'he',
    x: 148,
    y: 493,
    labelSide: 'left',
    elections: [
      {
        slug: 'wiesbaden-stvv',
        label: 'Stadtverordnetenversammlung',
        descriptionKey: 'stvvDesc',
        emoji: '🇩🇪',
        stimmen: 81,
        themeColor: '#00594f',
      },
      {
        slug: 'wiesbaden-kav',
        label: 'Ausländerbeirat',
        descriptionKey: 'kavDesc',
        emoji: '🌍',
        stimmen: 31,
        themeColor: '#00594f',
      },
    ],
  },
  {
    name: 'Darmstadt',
    stateId: 'he',
    x: 190,
    y: 530,
    labelSide: 'right',
    elections: [
      {
        slug: 'darmstadt-stvv',
        label: 'Stadtverordnetenversammlung',
        descriptionKey: 'stvvDesc',
        emoji: '🇩🇪',
        stimmen: 71,
        themeColor: '#004e8a',
      },
    ],
  },
  {
    name: 'Kassel',
    stateId: 'he',
    x: 208,
    y: 435,
    labelSide: 'right',
    elections: [
      {
        slug: 'kassel-stvv',
        label: 'Stadtverordnetenversammlung',
        descriptionKey: 'stvvDesc',
        emoji: '🇩🇪',
        stimmen: 71,
        themeColor: '#004f9f',
      },
    ],
  },
  {
    name: 'Offenbach',
    stateId: 'he',
    x: 196,
    y: 517,
    labelSide: 'right',
    elections: [
      {
        slug: 'offenbach-stvv',
        label: 'Stadtverordnetenversammlung',
        descriptionKey: 'stvvDesc',
        emoji: '🇩🇪',
        stimmen: 71,
        themeColor: '#1a5276',
      },
    ],
  },
  {
    name: 'Hanau',
    stateId: 'he',
    x: 210,
    y: 505,
    labelSide: 'right',
    elections: [
      {
        slug: 'hanau-stvv',
        label: 'Stadtverordnetenversammlung',
        descriptionKey: 'stvvDesc',
        emoji: '🇩🇪',
        stimmen: 59,
        themeColor: '#c41e3a',
      },
    ],
  },
  {
    name: 'Gießen',
    stateId: 'he',
    x: 193,
    y: 470,
    labelSide: 'right',
    elections: [
      {
        slug: 'giessen-stvv',
        label: 'Stadtverordnetenversammlung',
        descriptionKey: 'stvvDesc',
        emoji: '🇩🇪',
        stimmen: 59,
        themeColor: '#006633',
      },
    ],
  },
  {
    name: 'Marburg',
    stateId: 'he',
    x: 192,
    y: 454,
    labelSide: 'left',
    elections: [
      {
        slug: 'marburg-stvv',
        label: 'Stadtverordnetenversammlung',
        descriptionKey: 'stvvDesc',
        emoji: '🇩🇪',
        stimmen: 59,
        themeColor: '#163455',
      },
    ],
  },
  {
    name: 'Fulda',
    stateId: 'he',
    x: 228,
    y: 468,
    labelSide: 'right',
    elections: [
      {
        slug: 'fulda-stvv',
        label: 'Stadtverordnetenversammlung',
        descriptionKey: 'stvvDesc',
        emoji: '🇩🇪',
        stimmen: 59,
        themeColor: '#8B0000',
      },
    ],
  },
  {
    name: 'Rüsselsheim',
    stateId: 'he',
    x: 170,
    y: 518,
    labelSide: 'left',
    elections: [
      {
        slug: 'ruesselsheim-stvv',
        label: 'Stadtverordnetenversammlung',
        descriptionKey: 'stvvDesc',
        emoji: '🇩🇪',
        stimmen: 45,
        themeColor: '#003399',
      },
    ],
  },
];

// Group cities by state for quick lookup
const CITIES_BY_STATE: Record<string, CityMarker[]> = {};
for (const city of CITIES) {
  (CITIES_BY_STATE[city.stateId] ??= []).push(city);
}

const STATES_WITH_CITIES = new Set(Object.keys(CITIES_BY_STATE));

type PickerStep =
  | { view: 'germany' }
  | { view: 'state'; stateId: string }
  | { view: 'city'; city: CityMarker };

/** Parse an SVG path `d` attr to extract bounding box (min/max x/y). */
function pathBBox(d: string): { x: number; y: number; w: number; h: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  // Parse path commands properly
  const commands = d.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
  let cx = 0, cy = 0; // current point

  for (const cmd of commands) {
    const type = cmd[0];
    const args: number[] = [];
    const numRe = /[-+]?\d*\.?\d+/g;
    let nm: RegExpExecArray | null;
    while ((nm = numRe.exec(cmd.slice(1))) !== null) args.push(parseFloat(nm[0]));

    const isRel = type === type.toLowerCase() && type !== 'z' && type !== 'Z';

    switch (type.toLowerCase()) {
      case 'm':
      case 'l':
      case 't':
        for (let i = 0; i < args.length; i += 2) {
          cx = isRel ? cx + args[i] : args[i];
          cy = isRel ? cy + args[i + 1] : args[i + 1];
          minX = Math.min(minX, cx); maxX = Math.max(maxX, cx);
          minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);
        }
        break;
      case 'h':
        for (const a of args) {
          cx = isRel ? cx + a : a;
          minX = Math.min(minX, cx); maxX = Math.max(maxX, cx);
        }
        break;
      case 'v':
        for (const a of args) {
          cy = isRel ? cy + a : a;
          minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);
        }
        break;
      case 'c':
        // cubic bezier: 6 args per segment (3 points)
        for (let i = 0; i < args.length; i += 6) {
          for (let j = 0; j < 6; j += 2) {
            const px = isRel ? cx + args[i + j] : args[i + j];
            const py = isRel ? cy + args[i + j + 1] : args[i + j + 1];
            minX = Math.min(minX, px); maxX = Math.max(maxX, px);
            minY = Math.min(minY, py); maxY = Math.max(maxY, py);
          }
          cx = isRel ? cx + args[i + 4] : args[i + 4];
          cy = isRel ? cy + args[i + 5] : args[i + 5];
        }
        break;
      case 's':
      case 'q':
        // smooth cubic / quadratic: 4 args per segment
        for (let i = 0; i < args.length; i += 4) {
          for (let j = 0; j < 4; j += 2) {
            const px = isRel ? cx + args[i + j] : args[i + j];
            const py = isRel ? cy + args[i + j + 1] : args[i + j + 1];
            minX = Math.min(minX, px); maxX = Math.max(maxX, px);
            minY = Math.min(minY, py); maxY = Math.max(maxY, py);
          }
          cx = isRel ? cx + args[i + 2] : args[i + 2];
          cy = isRel ? cy + args[i + 3] : args[i + 3];
        }
        break;
      case 'a':
        // arc: 7 args per segment, endpoint is last 2
        for (let i = 0; i < args.length; i += 7) {
          cx = isRel ? cx + args[i + 5] : args[i + 5];
          cy = isRel ? cy + args[i + 6] : args[i + 6];
          minX = Math.min(minX, cx); maxX = Math.max(maxX, cx);
          minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);
        }
        break;
      // z: no coords
    }
  }

  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

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

  // Precompute bounding boxes for states with cities
  const stateBBoxes = useMemo(() => {
    const boxes: Record<string, { x: number; y: number; w: number; h: number }> = {};
    for (const state of GERMANY_PATHS) {
      if (STATES_WITH_CITIES.has(state.id)) {
        boxes[state.id] = pathBBox(state.d);
      }
    }
    return boxes;
  }, []);

  // Compute center of each state for tooltip positioning
  const stateCenters = useMemo(() => {
    const centers: Record<string, { x: number; y: number }> = {};
    for (const state of GERMANY_PATHS) {
      const bb = pathBBox(state.d);
      centers[state.id] = { x: bb.x + bb.w / 2, y: bb.y + bb.h / 2 };
    }
    return centers;
  }, []);

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
                  x={stateCenters[stateId]?.x ?? 0}
                  y={stateCenters[stateId]?.y ?? 0}
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

  // --- View: Zoomed State ---
  if (step.view === 'state') {
    const { stateId } = step;
    const bb = stateBBoxes[stateId];
    const cities = CITIES_BY_STATE[stateId] || [];

    // Add 20% padding
    const pad = Math.max(bb.w, bb.h) * 0.2;
    const vb = `${bb.x - pad} ${bb.y - pad} ${bb.w + pad * 2} ${bb.h + pad * 2}`;

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          <button
            onClick={() => setStep({ view: 'germany' })}
            className="mb-4 text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            ← {t('back')}
          </button>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 text-gray-900">
            {STATE_NAMES[stateId] ?? stateId}
          </h2>
          <div className="relative mx-auto max-w-md">
            <svg viewBox={vb} className="w-full h-auto">
              {/* Render all states, dim non-target */}
              {GERMANY_PATHS.map(state => (
                <path
                  key={state.id}
                  d={state.d}
                  fill={state.id === stateId ? '#dbeafe' : '#f9fafb'}
                  stroke={state.id === stateId ? '#93c5fd' : '#e5e7eb'}
                  strokeWidth="1"
                  opacity={state.id === stateId ? 1 : 0.3}
                  className="pointer-events-none"
                />
              ))}

              {/* City markers */}
              {cities.map(city => (
                <g
                  key={city.name}
                  onClick={() => setStep({ view: 'city', city })}
                  className="cursor-pointer"
                  role="button"
                  tabIndex={0}
                  aria-label={city.name}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setStep({ view: 'city', city });
                    }
                  }}
                >
                  {/* Pulse ring */}
                  <circle
                    cx={city.x}
                    cy={city.y}
                    r="8"
                    fill="none"
                    stroke={city.elections[0].themeColor}
                    strokeWidth="1.5"
                    opacity="0.4"
                  />
                  {/* Marker dot */}
                  <circle
                    cx={city.x}
                    cy={city.y}
                    r="4"
                    fill={city.elections[0].themeColor}
                    stroke="white"
                    strokeWidth="1"
                    className="transition-opacity duration-150 hover:opacity-80"
                  />
                  {/* City name */}
                  <text
                    x={city.labelSide === 'left' ? city.x - 8 : city.x + 8}
                    y={city.y + 2}
                    fontSize="8"
                    fontWeight="600"
                    fill="#374151"
                    textAnchor={city.labelSide === 'left' ? 'end' : 'start'}
                    className="pointer-events-none select-none"
                  >
                    {city.name}
                  </text>
                </g>
              ))}
            </svg>
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
