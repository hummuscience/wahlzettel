import { describe, it, expect } from 'vitest';
import { getElectionMode } from './electionMode';
import type { SuedKommunalConfig } from '../elections/types';
import type { ResultsData } from '../types/results';

const baseConfig: SuedKommunalConfig = {
  id: 'test',
  slug: 'test',
  shareTypeCode: 999,
  ballotKind: 'sued-kommunal',
  level: 'kommunal',
  date: '2026-03-15',
  region: { land: 'HE', gemeinde: 'Test' },
  totalStimmen: 93,
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: false,
  candidateNumbering: 'list-prefix',
  listenkreuzMode: 'cycling',
  themeColor: '#000',
  themeColorLight: '#eee',
  themeColorDark: '#111',
  dataFile: 'test.json',
  partyColors: {},
};

const stubResults: ResultsData = {
  election: 'test',
  stand: '2026-03-30',
  totalSeats: 93,
  totals: {
    validVotes: null, validBallots: null, turnout: null,
    kandidatenInsgesamt: null, frauenInsgesamt: null,
    ballotsWithListenkreuz: null, ballotsWithListenkreuzPercent: null,
  },
  parties: [],
  sources: [],
};

describe('getElectionMode', () => {
  it('returns pre on the election day itself', () => {
    expect(getElectionMode(baseConfig, stubResults, new Date('2026-03-15T12:00:00Z')))
      .toBe('pre');
  });

  it('returns post the day after', () => {
    expect(getElectionMode(baseConfig, stubResults, new Date('2026-03-16T08:00:00Z')))
      .toBe('post');
  });

  it('returns pre weeks before', () => {
    expect(getElectionMode(baseConfig, stubResults, new Date('2026-02-01T00:00:00Z')))
      .toBe('pre');
  });

  it('returns pre when results are not loaded yet, even after the date', () => {
    expect(getElectionMode(baseConfig, null, new Date('2026-04-01T00:00:00Z')))
      .toBe('pre');
  });

  it('returns pre for a future election with no results', () => {
    const future: SuedKommunalConfig = { ...baseConfig, date: '2027-09-20' };
    expect(getElectionMode(future, null, new Date('2026-05-04T00:00:00Z')))
      .toBe('pre');
  });
});
