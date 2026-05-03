// Spickzettel deferred — added per archetype as needed (see plan Wave 2/3).
export { LandtagswahlBallot as Ballot } from './Ballot';
export {
  useMmp2VoteState,
  mmp2VoteReducer,
  mmp2VoteInitialState,
} from './voteReducer';
export { encodeMmp2VoteState, decodeMmp2VoteState } from './share';
export type { Mmp2VoteConfig, Mmp2VoteState, Mmp2VoteAction } from './types';
