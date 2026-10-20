import type { AppState } from "./model";
import { TRINITY_LIBRARY_ITEMS } from "./TRINITY_LIBRARY_ITEMS";

export function createSeed(): AppState {
  return {
    version: 2,
    students: [],
    library: [...TRINITY_LIBRARY_ITEMS],
    schoolYears: [],
    settings: {
      activeSchoolYearId: null,
    },
  };
}
