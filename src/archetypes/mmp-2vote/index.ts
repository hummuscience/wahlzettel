// Spickzettel deferred — added per archetype as needed (see plan Wave 2/3).
export { Ballot } from './Ballot';
export { useMmp2VoteState, mmp2VoteReducer, mmp2VoteInitialState } from './voteReducer';
export { encodeMmp2VoteState, decodeMmp2VoteState } from './share';
export type { Mmp2VoteConfig, Mmp2VoteState, Mmp2VoteAction } from './types';
export type { Mmp2VoteData, Mmp2VoteCandidate, Mmp2VoteWahlkreis, Mmp2VoteListe } from './dataSchema';
