import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ElectionData, VoteState, DerivedVoteState } from '../../types';
import { getPartyColor } from '../../data/partyColors';
import { getQRMatrix } from './ShareDialog';

interface PrintSpickzettelProps {
  electionData: ElectionData;
  state: VoteState;
  derived: DerivedVoteState;
  shareUrl: string | null;
}

interface PartyPrintData {
  listNumber: number;
  shortName: string;
  fullName: string;
  stimmen: number;
  hasListVote: boolean;
  struckCandidates: { position: number; name: string }[];
  individualVotes: { position: number; name: string; stimmen: number }[];
}

function QRCodeSVG({ url, size }: { url: string; size: number }) {
  const matrix = useMemo(() => getQRMatrix(url), [url]);
  const margin = 2;
  const totalModules = matrix.size + margin * 2;
  const scale = size / totalModules;

  const paths: string[] = [];
  for (let row = 0; row < matrix.size; row++) {
    for (let col = 0; col < matrix.size; col++) {
      if (matrix.data[row * matrix.size + col]) {
        const x = (col + margin) * scale;
        const y = (row + margin) * scale;
        const s = Math.ceil(scale);
        paths.push(`M${x},${y}h${s}v${s}h-${s}z`);
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={size} height={size} fill="white" />
      <path d={paths.join('')} fill="#003870" />
    </svg>
  );
}

export function PrintSpickzettel({ electionData, state, derived, shareUrl }: PrintSpickzettelProps) {
  const { t } = useTranslation('ballot');

  const partyGroups = useMemo(() => {
    const groups: PartyPrintData[] = [];

    for (const party of electionData.parties) {
      const partyStimmen = derived.stimmenPerParty[party.listNumber] || 0;
      if (partyStimmen === 0) continue;

      const listSel = state.listSelections[party.listNumber];
      const hasListVote = !!listSel?.isSelected;

      // Struck candidates (only relevant when list vote active)
      const struckCandidates: PartyPrintData['struckCandidates'] = [];
      if (hasListVote && listSel.struckCandidateIds.length > 0) {
        const struckSet = new Set(listSel.struckCandidateIds);
        for (const c of party.candidates) {
          if (struckSet.has(c.id)) {
            struckCandidates.push({
              position: c.position,
              name: `${c.lastName}, ${c.firstName}`,
            });
          }
        }
      }

      // Individual votes (candidates with manually assigned stimmen)
      const individualVotes: PartyPrintData['individualVotes'] = [];
      for (const c of party.candidates) {
        const vote = state.candidateVotes[c.id];
        if (vote && vote.stimmen > 0) {
          individualVotes.push({
            position: c.position,
            name: `${c.lastName}, ${c.firstName}`,
            stimmen: vote.stimmen,
          });
        }
      }
      // Sort individual votes by stimmen descending, then position ascending
      individualVotes.sort((a, b) => b.stimmen - a.stimmen || a.position - b.position);

      groups.push({
        listNumber: party.listNumber,
        shortName: party.shortName,
        fullName: party.fullName,
        stimmen: partyStimmen,
        hasListVote,
        struckCandidates,
        individualVotes,
      });
    }

    // Sort by stimmen descending
    groups.sort((a, b) => b.stimmen - a.stimmen);
    return groups;
  }, [electionData, state, derived]);

  const electionName = electionData.election === 'kav'
    ? t('kavName')
    : t('stadtverordnetenversammlung');

  const hasVotes = derived.totalStimmenUsed > 0;

  return (
    <div id="print-spickzettel" className="hidden print:block">
      <div className="max-w-[700px] mx-auto text-[11px] leading-tight text-black">
        {/* Header */}
        <div className="text-center mb-3 pt-2">
          <h1 className="text-base font-bold">{t('spickzettel')}</h1>
          <p className="text-[10px] text-gray-600 mt-0.5">
            {electionName} &middot; 15. März 2026 &middot;{' '}
            {t('stimmenVergeben', { count: derived.totalStimmenUsed, total: electionData.totalStimmen })}
          </p>
        </div>

        {!hasVotes ? (
          <p className="text-center text-gray-500 text-sm mt-8">{t('keineStimmen')}</p>
        ) : (
          /* Party groups */
          <div className="space-y-2">
            {partyGroups.map(pg => (
              <div key={pg.listNumber} className="border-b border-gray-200 pb-1.5">
                {/* Party header */}
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: getPartyColor(pg.shortName) }}
                  />
                  <span>
                    {pg.hasListVote && <span className="mr-1">☑</span>}
                    {pg.shortName}
                    {pg.hasListVote && (
                      <span className="font-normal text-gray-600 ml-1">({t('listeGewaehlt')})</span>
                    )}
                  </span>
                  <span className="ml-auto tabular-nums">
                    {pg.stimmen} {pg.stimmen === 1 ? t('stimme') : t('stimmen')}
                  </span>
                </div>

                {/* Struck candidates */}
                {pg.struckCandidates.length > 0 && (
                  <div className="ml-4 text-[10px] text-gray-500 mt-0.5">
                    {pg.struckCandidates.map(sc => (
                      <div key={sc.position}>
                        ✗ {sc.position}. {sc.name} ({t('gestrichen')})
                      </div>
                    ))}
                  </div>
                )}

                {/* Individual votes */}
                {pg.individualVotes.length > 0 && (
                  <div className="ml-4 text-[10px] mt-0.5">
                    {pg.individualVotes.map(iv => (
                      <div key={iv.position}>
                        {iv.stimmen}× {iv.position}. {iv.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-gray-300 flex items-end justify-between">
          <div className="text-[9px] text-gray-500">
            {derived.stimmenRemaining > 0 && (
              <p className="mb-1">
                {t('nichtVergeben', { count: derived.stimmenRemaining })}
              </p>
            )}
            <p>frankfurt.de/wahlen &middot; 15. März 2026</p>
          </div>
          {shareUrl && (
            <QRCodeSVG url={shareUrl} size={72} />
          )}
        </div>
      </div>
    </div>
  );
}
