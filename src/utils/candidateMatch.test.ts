import { describe, it, expect } from 'vitest';
import { candidateKey, indexResultsParty, lookupCandidate } from './candidateMatch';
import type { ResultsParty } from '../types/results';

describe('candidateMatch', () => {
  it('builds a "Lastname, Firstname" key', () => {
    expect(candidateKey('Kößler', 'Nils')).toBe('Kößler, Nils');
  });

  it('preserves title prefixes already present in lastName', () => {
    // The data file stores "Dr. Kößler" as the lastName already — we round-trip it.
    expect(candidateKey('Dr. Kößler', 'Nils')).toBe('Dr. Kößler, Nils');
  });

  it('normalises curly apostrophes to straight ones', () => {
    // Frankfurt data has 'O‘Sullivan' (U+2018), results have "O'Sullivan" (U+0027).
    expect(candidateKey('O‘Sullivan', 'Eileen')).toBe("O'Sullivan, Eileen");
  });

  const party: ResultsParty = {
    shortName: 'CDU',
    fullName: 'CDU full',
    color: '#000',
    percent: 25,
    votesAbsolute: null,
    votesWeighted: null,
    seats: 2,
    elected: [
      { name: 'Dr. Kößler, Nils', stimmen: 75628 },
      { name: "O'Sullivan, Eileen", stimmen: 49219 },
      { name: 'Bäppler-Wolf, Thomas (Künstlern.: Bäppi La Belle)', stimmen: 11872 },
    ],
  };

  it('looks up by exact key', () => {
    const idx = indexResultsParty(party);
    const found = lookupCandidate(idx, 'Dr. Kößler', 'Nils');
    expect(found?.stimmen).toBe(75628);
  });

  it('matches a curly-apostrophe ballot name against straight-apostrophe results', () => {
    const idx = indexResultsParty(party);
    const found = lookupCandidate(idx, 'O‘Sullivan', 'Eileen');
    expect(found?.stimmen).toBe(49219);
  });

  it('strips parenthetical suffixes from results names', () => {
    const idx = indexResultsParty(party);
    const found = lookupCandidate(idx, 'Bäppler-Wolf', 'Thomas');
    expect(found?.stimmen).toBe(11872);
  });

  it('returns null for non-elected candidates', () => {
    const idx = indexResultsParty(party);
    expect(lookupCandidate(idx, 'Mustermann', 'Erika')).toBeNull();
  });
});
