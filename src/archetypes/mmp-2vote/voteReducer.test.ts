import { describe, it, expect } from 'vitest';
import { mmp2VoteReducer, mmp2VoteInitialState } from './voteReducer';

describe('mmp-2vote reducer', () => {
  it('sets a Wahlkreis and clears any prior Erststimme', () => {
    const s = mmp2VoteReducer(
      { ...mmp2VoteInitialState, selectedWahlkreis: 12, erststimme: 'cand-1' },
      { type: 'SET_WAHLKREIS', wahlkreis: 13 },
    );
    expect(s.selectedWahlkreis).toBe(13);
    expect(s.erststimme).toBeNull();
  });

  it('records a Bezirksliste Zweitstimme', () => {
    const s = mmp2VoteReducer(mmp2VoteInitialState, {
      type: 'SET_ZWEITSTIMME',
      listType: 'bezirksliste',
      listNumber: 3,
    });
    expect(s.zweitstimme).toEqual({ listType: 'bezirksliste', listNumber: 3 });
  });

  it('CLEAR_ZWEITSTIMME removes the choice', () => {
    const s = mmp2VoteReducer(
      { ...mmp2VoteInitialState, zweitstimme: { listType: 'landesliste', listNumber: 1 } },
      { type: 'CLEAR_ZWEITSTIMME' },
    );
    expect(s.zweitstimme).toBeNull();
  });

  it('CLEAR_WAHLKREIS clears selectedWahlkreis and erststimme but preserves zweitstimme', () => {
    const s = mmp2VoteReducer(
      { selectedWahlkreis: 7, erststimme: 'cand-1', zweitstimme: { listType: 'landesliste', listNumber: 2 } },
      { type: 'CLEAR_WAHLKREIS' },
    );
    expect(s.selectedWahlkreis).toBeNull();
    expect(s.erststimme).toBeNull();
    expect(s.zweitstimme).toEqual({ listType: 'landesliste', listNumber: 2 });
  });

  it('RESET returns to initial', () => {
    const s = mmp2VoteReducer(
      { selectedWahlkreis: 5, erststimme: 'x', zweitstimme: { listType: 'landesliste', listNumber: 2 } },
      { type: 'RESET' },
    );
    expect(s).toEqual(mmp2VoteInitialState);
  });
});
