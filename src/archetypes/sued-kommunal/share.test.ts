import { describe, it, expect } from 'vitest';
import { encodeVoteState, decodeVoteState } from './share';
import type { SuedKommunalState } from './types';

describe('Süd-Kommunal share encoding', () => {
  it('round-trips a candidate-only vote state for frankfurt-stvv (legacy short-prefix IDs)', async () => {
    const state: SuedKommunalState = {
      candidateVotes: {
        'stvv-1-3': { candidateId: 'stvv-1-3', partyListNumber: 1, stimmen: 3 },
        'stvv-2-1': { candidateId: 'stvv-2-1', partyListNumber: 2, stimmen: 1 },
      },
      listSelections: {},
    };
    const encoded = encodeVoteState(state, 'frankfurt-stvv');
    const decoded = await decodeVoteState((await encoded).replace(/^#b=/, ''), 'binary');
    expect(decoded.electionType).toBe('frankfurt-stvv');
    expect(decoded.state.candidateVotes).toEqual(state.candidateVotes);
  });

  it('round-trips a list selection with strikes for frankfurt-stvv', async () => {
    const state: SuedKommunalState = {
      candidateVotes: {},
      listSelections: {
        1: {
          partyListNumber: 1,
          isSelected: true,
          struckCandidateIds: ['stvv-1-5', 'stvv-1-7'],
        },
      },
    };
    const encoded = encodeVoteState(state, 'frankfurt-stvv');
    const decoded = await decodeVoteState((await encoded).replace(/^#b=/, ''), 'binary');
    expect(decoded.state.listSelections[1].isSelected).toBe(true);
    expect(decoded.state.listSelections[1].struckCandidateIds).toEqual([
      'stvv-1-5',
      'stvv-1-7',
    ]);
  });
});
