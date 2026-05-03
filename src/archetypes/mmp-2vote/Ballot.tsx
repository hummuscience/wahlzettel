import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useElection } from '../../elections/ElectionContext';

interface WahlkreisCandidate {
  id: string;
  party: string;
  lastName: string;
  firstName: string;
  profession: string;
  birthYear: number;
}

interface Wahlkreis {
  number: number;
  name: string;
  candidates: WahlkreisCandidate[];
}

interface Landesliste {
  listNumber: number;
  shortName: string;
  fullName: string;
  candidates: { position: number; lastName: string; firstName: string; profession: string }[];
}

interface LandtagswahlData {
  election: string;
  type: string;
  name: string;
  date: string;
  wahlkreise: Wahlkreis[];
  landeslisten: Landesliste[];
}

interface LandtagswahlBallotProps {
  data: LandtagswahlData;
}

export function LandtagswahlBallot({ data }: LandtagswahlBallotProps) {
  const { t } = useTranslation('election');
  const config = useElection();

  const [selectedWahlkreis, setSelectedWahlkreis] = useState<number | null>(null);
  const [wahlkreisSearch, setWahlkreisSearch] = useState('');
  const [erststimme, setErststimme] = useState<string | null>(null);
  const [zweitstimme, setZweitstimme] = useState<number | null>(null);

  const wahlkreis = useMemo(
    () => data.wahlkreise.find(wk => wk.number === selectedWahlkreis) ?? null,
    [data.wahlkreise, selectedWahlkreis],
  );

  const filteredWahlkreise = useMemo(() => {
    if (!wahlkreisSearch.trim()) return data.wahlkreise;
    const q = wahlkreisSearch.toLowerCase();
    return data.wahlkreise.filter(
      wk => wk.name.toLowerCase().includes(q) || String(wk.number).includes(q),
    );
  }, [data.wahlkreise, wahlkreisSearch]);

  const voteSummary = useMemo(() => {
    const erstCandidate = wahlkreis?.candidates.find(c => c.id === erststimme) ?? null;
    const zweitPartei = data.landeslisten.find(ll => ll.listNumber === zweitstimme) ?? null;
    return { erstCandidate, zweitPartei };
  }, [erststimme, zweitstimme, wahlkreis, data.landeslisten]);

  const bothVotesUsed = erststimme !== null && zweitstimme !== null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {t('title', { defaultValue: data.name })}
        </h1>
        <p className="text-gray-500 mt-1">{t('ballotSubtitle', { defaultValue: data.date })}</p>
      </div>

      {/* Vote summary bar */}
      <div
        className="rounded-xl p-4 mb-6 border-2"
        style={{
          borderColor: bothVotesUsed ? config.themeColor : '#e5e7eb',
          backgroundColor: bothVotesUsed ? config.themeColorLight : '#fafafa',
        }}
      >
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm">
          <div className="flex-1">
            <span className="font-semibold text-gray-700">{t('erststimme', { defaultValue: 'Erststimme' })}:</span>{' '}
            {voteSummary.erstCandidate ? (
              <span className="text-gray-900">
                {voteSummary.erstCandidate.lastName}, {voteSummary.erstCandidate.firstName}{' '}
                <span className="text-gray-500">({voteSummary.erstCandidate.party})</span>
              </span>
            ) : (
              <span className="text-gray-400">{t('noErststimme', { defaultValue: '—' })}</span>
            )}
          </div>
          <div className="flex-1">
            <span className="font-semibold text-gray-700">{t('zweitstimme', { defaultValue: 'Zweitstimme' })}:</span>{' '}
            {voteSummary.zweitPartei ? (
              <span className="text-gray-900">{voteSummary.zweitPartei.shortName}</span>
            ) : (
              <span className="text-gray-400">{t('noZweitstimme', { defaultValue: '—' })}</span>
            )}
          </div>
        </div>
        {bothVotesUsed && (
          <p className="text-center mt-2 font-semibold text-sm" style={{ color: config.themeColor }}>
            {t('bothVotesUsed', { defaultValue: 'Beide Stimmen vergeben!' })}
          </p>
        )}
      </div>

      {/* Wahlkreis selector */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {t('wahlkreis', { defaultValue: 'Wahlkreis' })}
        </label>
        {selectedWahlkreis === null ? (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                value={wahlkreisSearch}
                onChange={e => setWahlkreisSearch(e.target.value)}
                placeholder={t('wahlkreisSearch', { defaultValue: 'Wahlkreis suchen...' })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {filteredWahlkreise.map(wk => (
                <button
                  key={wk.number}
                  onClick={() => {
                    setSelectedWahlkreis(wk.number);
                    setErststimme(null);
                    setWahlkreisSearch('');
                  }}
                  className="w-full text-start px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm border-b border-gray-50 last:border-b-0"
                >
                  <span className="font-medium text-gray-900">{wk.number}.</span>{' '}
                  <span className="text-gray-700">{wk.name}</span>
                  <span className="text-gray-400 ml-2">({wk.candidates.length})</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-900">
              {selectedWahlkreis}. {wahlkreis?.name}
            </span>
            <button
              onClick={() => {
                setSelectedWahlkreis(null);
                setErststimme(null);
              }}
              className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
            >
              {t('wahlkreisSelect', { defaultValue: 'ändern' })}
            </button>
          </div>
        )}
      </div>

      {/* Two-column ballot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Erststimme */}
        <div className="rounded-xl border-2 border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-900 text-white">
            <h2 className="font-bold text-lg">{t('erststimme', { defaultValue: 'Erststimme' })}</h2>
            <p className="text-gray-300 text-xs mt-0.5">
              {t('erststimmeDesc', { defaultValue: 'Wählen Sie eine Bewerberin / einen Bewerber Ihres Wahlkreises' })}
            </p>
          </div>

          {!wahlkreis ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              {t('wahlkreisSelect', { defaultValue: 'Bitte zuerst einen Wahlkreis auswählen' })}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {wahlkreis.candidates.map(candidate => {
                const isSelected = erststimme === candidate.id;
                const partyColor = config.partyColors[candidate.party] ?? '#888';
                return (
                  <label
                    key={candidate.id}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-gray-50' : 'hover:bg-gray-50/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="erststimme"
                      checked={isSelected}
                      onChange={() => setErststimme(isSelected ? null : candidate.id)}
                      onClick={() => isSelected && setErststimme(null)}
                      className="mt-1 shrink-0 accent-gray-900"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: partyColor }}
                        />
                        <span className="text-xs font-semibold text-gray-500">{candidate.party}</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">
                        {candidate.lastName}, {candidate.firstName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {candidate.profession}
                        {candidate.birthYear ? `, *${candidate.birthYear}` : ''}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Zweitstimme */}
        <div className="rounded-xl border-2 border-gray-200 overflow-hidden">
          <div className="px-4 py-3" style={{ backgroundColor: config.themeColor }}>
            <h2 className="font-bold text-lg text-white">{t('zweitstimme', { defaultValue: 'Zweitstimme' })}</h2>
            <p className="text-white/70 text-xs mt-0.5">
              {t('zweitstimmeDesc', { defaultValue: 'Wählen Sie eine Landesliste' })}
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {data.landeslisten.map(liste => {
              const isSelected = zweitstimme === liste.listNumber;
              const partyColor = config.partyColors[liste.shortName] ?? '#888';
              return (
                <label
                  key={liste.listNumber}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-gray-50' : 'hover:bg-gray-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="zweitstimme"
                    checked={isSelected}
                    onChange={() => setZweitstimme(isSelected ? null : liste.listNumber)}
                    onClick={() => isSelected && setZweitstimme(null)}
                    className="mt-1 shrink-0"
                    style={{ accentColor: config.themeColor }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: partyColor }}
                      />
                      <span className="font-semibold text-gray-900 text-sm">{liste.shortName}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{liste.fullName}</p>
                    {liste.candidates.length > 0 && (
                      <div className="mt-1 text-xs text-gray-400">
                        {liste.candidates.slice(0, 5).map((c, i) => (
                          <span key={i}>
                            {i > 0 && ', '}
                            {c.lastName}
                          </span>
                        ))}
                        {liste.candidates.length > 5 && ', ...'}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-gray-400 mt-8 max-w-2xl mx-auto">
        {t('disclaimer', { defaultValue: '' })}
      </p>
    </div>
  );
}
