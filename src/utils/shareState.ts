import type { VoteState } from '../types';

export type ElectionType = 'stvv' | 'kav';

/**
 * Minimal serialization shape — only non-zero candidate votes and active list selections.
 */
interface CompactState {
  /** election type */
  e?: ElectionType;
  /** [candidateId, partyListNumber, stimmen][] */
  c?: [string, number, number][];
  /** [partyListNumber, struckCandidateIds[]][] */
  l?: [number, string[]][];
}

function toCompact(state: VoteState, electionType: ElectionType): CompactState {
  const compact: CompactState = {};

  compact.e = electionType;

  const votes = Object.values(state.candidateVotes).filter(v => v.stimmen > 0);
  if (votes.length > 0) {
    compact.c = votes.map(v => [v.candidateId, v.partyListNumber, v.stimmen]);
  }

  const lists = Object.values(state.listSelections).filter(l => l.isSelected);
  if (lists.length > 0) {
    compact.l = lists.map(l => [l.partyListNumber, l.struckCandidateIds]);
  }

  return compact;
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
  const compact = toCompact(state, electionType);
  const json = JSON.stringify(compact);
  const encoded = new TextEncoder().encode(json);
  const compressed = await compress(encoded);
  return toBase64Url(compressed);
}

export interface DecodedShareState {
  electionType: ElectionType;
  state: VoteState;
}

export async function decodeVoteState(encoded: string): Promise<DecodedShareState> {
  const compressed = fromBase64Url(encoded);
  const decompressed = await decompress(compressed);
  const json = new TextDecoder().decode(decompressed);
  const compact: CompactState = JSON.parse(json);
  return {
    electionType: compact.e ?? 'stvv',
    state: fromCompact(compact),
  };
}
