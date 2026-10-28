import type { AppState } from "./model";
import { TRINITY_LIBRARY_ITEMS } from "./TRINITY_LIBRARY_ITEMS";
import { REPORT_FORMULATIONS } from "./REPORT_FORMULATIONS";

export function createSeed(): AppState {
  return {
    version: 4,
    students: [],
    schools: [],
    library: [...TRINITY_LIBRARY_ITEMS],
    schoolYears: [],
    reportCatalog: {
      dimensions: REPORT_FORMULATIONS.map((dimension) => ({
        ...dimension,
        active: true,
        topics: dimension.topics.map((topic) => ({
          ...topic,
          active: true,
          options: topic.options.map((option) => ({
            ...option,
            active: true,
          })),
        })),
      })),
    },
    studentReports: [],
    settings: {
      activeSchoolYearId: null,
    },
  };
}
