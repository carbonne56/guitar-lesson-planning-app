import type { AppState } from "./model";
import { createSeed } from "./seed";

// Persistence layer. Swap this module to change the storage backend.
const KEY = "guitarra-aulas:v1";

export function loadState(): AppState {
  if (typeof window === "undefined") return createSeed();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    // fall through to seed
  }
  const seed = createSeed();
  saveState(seed);
  return seed;
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}
