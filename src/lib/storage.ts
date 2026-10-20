import type { AppState, Lesson } from "./model";
import { createSeed } from "./seed";

const KEY = "guitarra-aulas:v1";

function migrateLesson(lesson: Lesson): Lesson {
  const raw = lesson as unknown as Record<string, unknown>;

  return {
    ...lesson,

    objectives:
      typeof raw.objectives === "string"
        ? raw.objectives
        : "",

    summary:
      typeof raw.summary === "string"
        ? raw.summary
        : "",

    objectiveLibraryItemIds:
      Array.isArray(raw.objectiveLibraryItemIds)
        ? raw.objectiveLibraryItemIds.filter(
            (id): id is string => typeof id === "string",
          )
        : [],

    summaryLibraryItemIds:
      Array.isArray(raw.summaryLibraryItemIds)
        ? raw.summaryLibraryItemIds.filter(
            (id): id is string => typeof id === "string",
          )
        : [],
  };
}

function migrateState(state: AppState): AppState {
  return {
    ...state,
    schoolYears: state.schoolYears.map((year) => ({
      ...year,
      students: year.students.map((ctx) => ({
        ...ctx,
        lessons: ctx.lessons.map(migrateLesson),
      })),
    })),
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") return createSeed();

  try {
    const raw = window.localStorage.getItem(KEY);

    if (raw) {
      return migrateState(JSON.parse(raw) as AppState);
    }
  } catch {
    // Fall through to seed state.
  }

  const seed = createSeed();
  saveState(seed);
  return seed;
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(KEY, JSON.stringify(state));
}
