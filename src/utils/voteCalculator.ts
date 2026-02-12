import type { ElectionData, VoteState, DerivedVoteState, CandidateVote, Party } from '../types';

/**
 * Calculate how many Stimmen a list vote distributes to each candidate.
 * Implements the official Kopfleiste cycling: distribute 1 Stimme per candidate
 * top-to-bottom, then repeat (up to 3 per candidate) until budget runs out.
 * Candidates with individual votes or struck candidates are skipped.
 */
export function calculateListVoteDistribution(
  party: Party,
  struckCandidateIds: string[],
  candidateVotes: Record<string, CandidateVote>,
  budgetForList: number,
): Record<string, number> {
  const allocation: Record<string, number> = {};
  const struckSet = new Set(struckCandidateIds);

  // Eligible candidates: not struck, in position order
  const eligible = party.candidates.filter(c => !struckSet.has(c.id));

  // Candidates with individual votes are handled by those votes, not list
  const eligibleForList = eligible.filter(c => {
    const vote = candidateVotes[c.id];
    return !vote || vote.stimmen === 0;
  });

  let remaining = budgetForList;

  // Cycle up to 3 passes (max 3 Stimmen per candidate)
  for (let pass = 0; pass < 3 && remaining > 0; pass++) {
    let anyAllocated = false;
    for (const candidate of eligibleForList) {
      const current = allocation[candidate.id] || 0;
      if (current < 3 && remaining > 0) {
        allocation[candidate.id] = current + 1;
        remaining--;
        anyAllocated = true;
      }
      if (remaining === 0) break;
    }
    if (!anyAllocated) break;
  }

  return allocation;
}

/**
 * Get the effective Stimmen for a candidate, considering both individual votes
 * and list vote allocation.
 */
export function getEffectiveStimmen(
  candidateId: string,
  candidateVotes: Record<string, CandidateVote>,
  listAllocation: Record<string, number> | null,
): number {
  const individualVotes = candidateVotes[candidateId]?.stimmen || 0;
  const listVotes = listAllocation?.[candidateId] || 0;
  // Individual votes take precedence; list votes apply to candidates without individual votes
  return individualVotes > 0 ? individualVotes : listVotes;
}

/**
 * Calculate the full derived state from the raw vote state and election data.
 */
export function calculateDerivedState(
  state: VoteState,
  electionData: ElectionData,
): DerivedVoteState {
  const { candidateVotes, listSelections } = state;
  const { totalStimmen, parties } = electionData;

  // Sum all individual votes
  let individualTotal = 0;
  for (const vote of Object.values(candidateVotes)) {
    individualTotal += vote.stimmen;
  }

  // Calculate list vote distributions
  const listAllocations: Record<number, Record<string, number>> = {};
  let listTotal = 0;

  for (const selection of Object.values(listSelections)) {
    if (!selection.isSelected) continue;
    const party = parties.find(p => p.listNumber === selection.partyListNumber);
    if (!party) continue;

    const budgetForList = totalStimmen - individualTotal;
    if (budgetForList <= 0) continue;

    const allocation = calculateListVoteDistribution(
      party,
      selection.struckCandidateIds,
      candidateVotes,
      budgetForList,
    );
    listAllocations[selection.partyListNumber] = allocation;

    for (const votes of Object.values(allocation)) {
      listTotal += votes;
    }
  }

  const totalUsed = individualTotal + listTotal;

  // Calculate Stimmen per party
  const stimmenPerParty: Record<number, number> = {};
  for (const party of parties) {
    let partyTotal = 0;
    const listAlloc = listAllocations[party.listNumber] || null;

    for (const candidate of party.candidates) {
      partyTotal += getEffectiveStimmen(candidate.id, candidateVotes, listAlloc);
    }
    if (partyTotal > 0) {
      stimmenPerParty[party.listNumber] = partyTotal;
    }
  }

  return {
    totalStimmenUsed: totalUsed,
    stimmenRemaining: totalStimmen - totalUsed,
    stimmenPerParty,
    isValid: totalUsed <= totalStimmen,
    isComplete: totalUsed === totalStimmen,
    isOverLimit: totalUsed > totalStimmen,
  };
}
