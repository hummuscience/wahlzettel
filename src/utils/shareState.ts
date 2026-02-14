import type { VoteState } from '../types';

export type ElectionType = 'stvv' | 'kav';

// ---------- v1 JSON compact format (kept for decoding legacy #v= links) ----------

interface CompactState {
  e?: ElectionType;
  c?: [string, number, number][];
  l?: [number, string[]][];
}

function fromCompact(compact: CompactState): VoteState {
  const state: VoteState = { candidateVotes: {}, listSelections: {} };

  if (compact.c) {
    for (const [candidateId, partyListNumber, stimmen] of compact.c) {
      state.candidateVotes[candidateId] = { candidateId, partyListNumber, stimmen };
    }
  }

  if (compact.l) {
    for (const [partyListNumber, struckCandidateIds] of compact.l) {
      state.listSelections[partyListNumber] = {
        partyListNumber,
        isSelected: true,
        struckCandidateIds: struckCandidateIds || [],
      };
    }
  }

  return state;
}

// ---------- v2 binary format ----------

const ELECTION_TYPE_MAP: Record<ElectionType, number> = { stvv: 0, kav: 1 };
const ELECTION_TYPE_REV: ElectionType[] = ['stvv', 'kav'];

function toBinary(state: VoteState, electionType: ElectionType): Uint8Array {
  const electionNum = ELECTION_TYPE_MAP[electionType] ?? 0;

  const selectedLists = Object.values(state.listSelections).filter(l => l.isSelected);
  const hasListVote = selectedLists.length > 0;
  const listSel = hasListVote ? selectedLists[0] : null;
  const listParty = listSel ? listSel.partyListNumber : 0;

  // Struck positions (from candidateId "{election}-{list}-{position}")
  const struckPositions: number[] = [];
  if (listSel) {
    for (const id of listSel.struckCandidateIds) {
      const pos = Number(id.split('-')[2]);
      if (pos > 0 && pos <= 255) struckPositions.push(pos);
    }
  }

  const candidateVotes = Object.values(state.candidateVotes).filter(v => v.stimmen > 0);

  // Calculate total size
  const headerSize = 2;
  const struckSize = hasListVote ? 1 + struckPositions.length : 0;
  const votesSize = 1 + candidateVotes.length * 2;
  const totalSize = headerSize + struckSize + votesSize;

  const buf = new Uint8Array(totalSize);
  let offset = 0;

  // Header byte 0: [7:2]=version(0) | [1:0]=electionType
  buf[offset++] = electionNum & 0x03;

  // Header byte 1: [7]=hasListVote | [6:2]=listVoteParty-1 | [1:0]=0
  buf[offset++] = (hasListVote ? 0x80 : 0) | ((hasListVote ? (listParty - 1) & 0x1F : 0) << 2);

  // Struck candidates (only if list vote)
  if (hasListVote) {
    buf[offset++] = struckPositions.length & 0xFF;
    for (const pos of struckPositions) {
      buf[offset++] = pos & 0xFF;
    }
  }

  // Candidate votes
  buf[offset++] = candidateVotes.length & 0xFF;
  for (const v of candidateVotes) {
    // partyListNumber-1 in [15:11] (5 bits)
    // position-1 in [10:4] (7 bits)
    // stimmen-1 in [3:2] (2 bits)
    const pos = Number(v.candidateId.split('-')[2]);
    const word =
      (((v.partyListNumber - 1) & 0x1F) << 11) |
      (((pos - 1) & 0x7F) << 4) |
      (((v.stimmen - 1) & 0x03) << 2);
    buf[offset++] = (word >> 8) & 0xFF;
    buf[offset++] = word & 0xFF;
  }

  return buf;
}

function fromBinary(bytes: Uint8Array): { electionType: ElectionType; state: VoteState } {
  let offset = 0;

  // Header
  const electionNum = bytes[offset++] & 0x03;
  const electionType = ELECTION_TYPE_REV[electionNum] ?? 'stvv';
  const electionPrefix = electionType;

  const byte1 = bytes[offset++];
  const hasListVote = (byte1 & 0x80) !== 0;
  const listParty = hasListVote ? ((byte1 >> 2) & 0x1F) + 1 : 0;

  const state: VoteState = { candidateVotes: {}, listSelections: {} };

  // Struck candidates
  if (hasListVote) {
    const struckCount = bytes[offset++];
    const struckIds: string[] = [];
    for (let i = 0; i < struckCount; i++) {
      const pos = bytes[offset++];
      struckIds.push(`${electionPrefix}-${listParty}-${pos}`);
    }
    state.listSelections[listParty] = {
      partyListNumber: listParty,
      isSelected: true,
      struckCandidateIds: struckIds,
    };
  }

  // Candidate votes
  const voteCount = bytes[offset++];
  for (let i = 0; i < voteCount; i++) {
    const hi = bytes[offset++];
    const lo = bytes[offset++];
    const word = (hi << 8) | lo;
    const partyListNumber = ((word >> 11) & 0x1F) + 1;
    const position = ((word >> 4) & 0x7F) + 1;
    const stimmen = ((word >> 2) & 0x03) + 1;
    const candidateId = `${electionPrefix}-${partyListNumber}-${position}`;
    state.candidateVotes[candidateId] = { candidateId, partyListNumber, stimmen };
  }

  return { electionType, state };
}

async function compress(data: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream('deflate-raw');
  const writer = cs.writable.getWriter();
  writer.write(data as Uint8Array<ArrayBuffer>);
  writer.close();

  const chunks: Uint8Array[] = [];
  const reader = cs.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

async function decompress(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(data as Uint8Array<ArrayBuffer>);
  writer.close();

  const chunks: Uint8Array[] = [];
  const reader = ds.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function encodeVoteState(state: VoteState, electionType: ElectionType): Promise<string> {
  const binary = toBinary(state, electionType);
  const compressed = await compress(binary);
  return toBase64Url(compressed);
}

export interface DecodedShareState {
  electionType: ElectionType;
  state: VoteState;
}

export async function decodeVoteState(encoded: string, format: 'binary' | 'json' = 'binary'): Promise<DecodedShareState> {
  const compressed = fromBase64Url(encoded);
  const decompressed = await decompress(compressed);

  if (format === 'json') {
    const json = new TextDecoder().decode(decompressed);
    const compact: CompactState = JSON.parse(json);
    return {
      electionType: compact.e ?? 'stvv',
      state: fromCompact(compact),
    };
  }

  return fromBinary(decompressed);
}
