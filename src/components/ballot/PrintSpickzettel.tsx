import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ElectionData, VoteState, DerivedVoteState } from '../../types';
import { getPartyColor } from '../../data/partyColors';
import { useElection } from '../../elections/ElectionContext';
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
  stimmen: number;
  hasListVote: boolean;
  struckPositions: number[];
  individualVotes: { position: number; stimmen: number }[];
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
      <path d={paths.join('')} fill="var(--color-election-primary, #003870)" />
    </svg>
  );
}

/** Three circles: filled (●) or empty (○), representing up to 3 Stimmen */
function VoteDots({ stimmen }: { stimmen: number }) {
  return (
    <span className="ml-1 text-[10px] tracking-[1px]">
      {'●'.repeat(stimmen)}
      {'○'.repeat(3 - stimmen)}
    </span>
  );
}

/** Struck-through candidate: line through the dots */
function StrikeDots() {
  return (
    <span className="ml-1 text-[10px] text-gray-400 line-through decoration-red-500 decoration-2">
      ○○○
    </span>
  );
}

/** A single party box in the mini-ballot */
function PartyBox({ pg, color }: { pg: PartyPrintData; color: string }) {
  const hasDetails = pg.individualVotes.length > 0 || pg.struckPositions.length > 0;
  const isListOnly = pg.hasListVote && !hasDetails;

  return (
    <div
      className="border border-gray-300 rounded overflow-hidden"
      style={{ borderLeftWidth: '4px', borderLeftColor: color }}
    >
      {/* Party header row */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border-b border-gray-200">
        {isListOnly && (
          <span className="text-[16px] leading-none font-bold">☒</span>
        )}
        {pg.hasListVote && !isListOnly && (
          <span className="text-[11px] leading-none">☒</span>
        )}
        <span className="font-bold text-[11px] leading-tight">{pg.shortName}</span>
        <span className="ml-auto text-[10px] text-gray-500 tabular-nums">{pg.stimmen}</span>
      </div>

      {/* Candidate rows: individual votes and strikes merged by position */}
      {hasDetails && (
        <div className="px-2 py-0.5">
          {[
            ...pg.individualVotes.map(iv => ({ position: iv.position, type: 'vote' as const, stimmen: iv.stimmen })),
            ...pg.struckPositions.map(pos => ({ position: pos, type: 'strike' as const, stimmen: 0 })),
          ]
            .sort((a, b) => a.position - b.position)
            .map(row => (
              <div key={row.type === 'strike' ? `s${row.position}` : row.position} className="flex items-center gap-1 py-[2px]">
                <span className={`text-[10px] w-5 text-right tabular-nums shrink-0 ${row.type === 'strike' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {row.position}
                </span>
                {row.type === 'strike' ? <StrikeDots /> : <VoteDots stimmen={row.stimmen} />}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export function PrintSpickzettel({ electionData, state, derived, shareUrl }: PrintSpickzettelProps) {
  const { t } = useTranslation('ballot');
  const { t: te } = useTranslation('election');
  const { t: ti } = useTranslation('info');
  const electionConfig = useElection();
  const { partyColors } = electionConfig;
  const electionDate = te('electionDateValue', { defaultValue: ti('electionDateValue') });
  const moreInfoLink = te('moreInfoLink', { defaultValue: ti('moreInfoLink') });

  const partyGroups = useMemo(() => {
    const groups: PartyPrintData[] = [];

    for (const party of electionData.parties) {
      const partyStimmen = derived.stimmenPerParty[party.listNumber] || 0;
      if (partyStimmen === 0) continue;

      const listSel = state.listSelections[party.listNumber];
      const hasListVote = !!listSel?.isSelected;

      const struckPositions: number[] = [];
      if (hasListVote && listSel.struckCandidateIds.length > 0) {
        const struckSet = new Set(listSel.struckCandidateIds);
        for (const c of party.candidates) {
          if (struckSet.has(c.id)) {
            struckPositions.push(c.position);
          }
        }
      }

      const individualVotes: PartyPrintData['individualVotes'] = [];
      for (const c of party.candidates) {
        const vote = state.candidateVotes[c.id];
        if (vote && vote.stimmen > 0) {
          individualVotes.push({
            position: c.position,
            stimmen: vote.stimmen,
          });
        }
      }
      individualVotes.sort((a, b) => a.position - b.position);

      groups.push({
        listNumber: party.listNumber,
        shortName: party.shortName,
        stimmen: partyStimmen,
        hasListVote,
        struckPositions,
        individualVotes,
      });
    }

    groups.sort((a, b) => b.stimmen - a.stimmen);
    return groups;
  }, [electionData, state, derived]);

  const electionName = electionData.election === 'kav'
    ? t('kavName')
    : t('stadtverordnetenversammlung');

  const hasVotes = derived.totalStimmenUsed > 0;

  return (
    <div id="print-spickzettel" className="hidden print:block">
      <div className="max-w-[700px] mx-auto text-black">
        {/* Header */}
        <div className="text-center mb-2 pt-2">
          <h1 className="text-sm font-bold">{t('spickzettel')}</h1>
          <p className="text-[9px] text-gray-600 mt-0.5">
            {electionName} &middot; {electionDate} &middot;{' '}
            {t('stimmenVergeben', { count: derived.totalStimmenUsed, total: electionData.totalStimmen })}
          </p>
        </div>

        {!hasVotes ? (
          <p className="text-center text-gray-500 text-sm mt-8">{t('keineStimmen')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {partyGroups.map(pg => (
              <PartyBox
                key={pg.listNumber}
                pg={pg}
                color={getPartyColor(pg.shortName, partyColors)}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-1.5 border-t border-gray-300 flex items-end justify-between">
          <div className="text-[8px] text-gray-500">
            {derived.stimmenRemaining > 0 && (
              <p className="mb-0.5">
                {t('nichtVergeben', { count: derived.stimmenRemaining })}
              </p>
            )}
            <p>{moreInfoLink} &middot; {electionDate}</p>
          </div>
          {shareUrl && (
            <QRCodeSVG url={shareUrl} size={64} />
          )}
        </div>
      </div>
    </div>
  );
}
