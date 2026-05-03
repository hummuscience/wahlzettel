import { describe, it, expect } from 'vitest';
import { closedListReducer, closedListInitialState } from './voteReducer';

describe('closed-list reducer', () => {
  it('starts with no choice', () => {
    expect(closedListInitialState.choice).toBeNull();
  });

  it('SET_CHOICE replaces any prior choice', () => {
    const s1 = closedListReducer(closedListInitialState, { type: 'SET_CHOICE', listNumber: 1 });
    expect(s1.choice).toBe(1);
    const s2 = closedListReducer(s1, { type: 'SET_CHOICE', listNumber: 4 });
    expect(s2.choice).toBe(4);
  });

  it('CLEAR removes the choice', () => {
    const s = closedListReducer({ choice: 3 }, { type: 'CLEAR' });
    expect(s.choice).toBeNull();
  });

  it('RESET returns to initial', () => {
    const s = closedListReducer({ choice: 5 }, { type: 'RESET' });
    expect(s).toEqual(closedListInitialState);
  });
});
