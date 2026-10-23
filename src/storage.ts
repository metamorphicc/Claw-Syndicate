import { stateSchema } from './schema';
import { assertInvariants, STORAGE_KEY, type Economy } from './model';
export function decodeState(raw: string): Economy {
  const state = stateSchema.parse(JSON.parse(raw)) as Economy;
  assertInvariants(state);
  return state;
}
export function readSaved(): Economy | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? decodeState(raw) : null;
}
