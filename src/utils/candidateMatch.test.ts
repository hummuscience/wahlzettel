import { describe, it, expect } from 'vitest';
import { indexResultsParty, lookupCandidate } from './candidateMatch';
import type { ResultsParty } from '../types/results';

const party: ResultsParty = {
  listNumber: 1,
  shortName: 'CDU',
  fullName: 'CDU full',
  color: '#000',
  percent: 25,
  votesAbsolute: null,
  votesWeighted: null,
  seats: 2,
  candidates: [
    { position: 1, lastName: 'Dr. Kößler', firstName: 'Nils', stimmen: 75628 },
    { position: 2, lastName: 'Serke', firstName: 'Susanne', stimmen: 72687 },
    // A non-elected position whose tally exists
    { position: 47, lastName: 'Mustermann', firstName: 'Erika', stimmen: 50123 },
    // A position present in the candidate list but with no vote tally
    { position: 94, lastName: 'Trinter', firstName: 'Thomas', stimmen: null },
  ],
};

describe('indexResultsParty + lookupCandidate', () => {
  it('finds an elected top candidate', () => {
    const idx = indexResultsParty(party);
    const found = lookupCandidate(idx, 1);
    expect(found?.lastName).toBe('Dr. Kößler');
    expect(found?.stimmen).toBe(75628);
  });

  it('finds a non-elected candidate that still has a vote tally', () => {
    const idx = indexResultsParty(party);
    const found = lookupCandidate(idx, 47);
    expect(found?.stimmen).toBe(50123);
  });

  it('returns the entry for a candidate whose stimmen is null (post-roster add)', () => {
    const idx = indexResultsParty(party);
    const found = lookupCandidate(idx, 94);
    expect(found).not.toBeNull();
    expect(found?.stimmen).toBeNull();
  });

  it('returns null for a position not in the index', () => {
    const idx = indexResultsParty(party);
    expect(lookupCandidate(idx, 999)).toBeNull();
  });
});
