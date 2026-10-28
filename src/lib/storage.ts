import type { AppState, Lesson, Schedule } from "./model";
import { createSeed } from "./seed";

const KEY = "guitarra-aulas:v1";
const DATA_VERSION = 4;

function migrateLesson(lesson: Lesson, baselineTimestamp: string): Lesson {
  const raw = lesson as unknown as Record<string, unknown>;

  return {
    ...lesson,
    objectives: typeof raw["objectives"] === "string" ? raw["objectives"] : "",
    summary: typeof raw["summary"] === "string" ? raw["summary"] : "",
    objectiveLibraryItemIds: Array.isArray(raw["objectiveLibraryItemIds"])
      ? raw["objectiveLibraryItemIds"].filter((id): id is string => typeof id === "string")
      : [],
    summaryLibraryItemIds: Array.isArray(raw["summaryLibraryItemIds"])
      ? raw["summaryLibraryItemIds"].filter((id): id is string => typeof id === "string")
      : [],
    updatedAt:
      typeof raw["updatedAt"] === "string" && !Number.isNaN(Date.parse(raw["updatedAt"]))
        ? raw["updatedAt"]
        : baselineTimestamp,
  };
}

function migrateSchedule(raw: unknown): Schedule[] {
  if (raw && typeof raw === "object" && "weekday" in raw && "time" in raw && "duration" in raw) {
    return [raw as Schedule];
  }

  return [];
}

/**
 * Migração V1 → V2:
 * converte schedule para schedules, tanto nos alunos
 * permanentes como nos contextos dos anos letivos.
 */
function migrateV1ToV2(raw: Record<string, unknown>): Record<string, unknown> {
  const students = Array.isArray(raw["students"])
    ? raw["students"].map((entry) => {
        if (!entry || typeof entry !== "object") return entry;

        const student = entry as Record<string, unknown>;
        const { schedule, ...rest } = student;

        return {
          ...rest,
          schedules: migrateSchedule(schedule),
        };
      })
    : [];

  const schoolYears = Array.isArray(raw["schoolYears"])
    ? raw["schoolYears"].map((entry) => {
        if (!entry || typeof entry !== "object") return entry;

        const year = entry as Record<string, unknown>;

        return {
          ...year,
          students: Array.isArray(year["students"])
            ? year["students"].map((contextEntry) => {
                if (!contextEntry || typeof contextEntry !== "object") {
                  return contextEntry;
                }

                const context = contextEntry as Record<string, unknown>;
                const { schedule, ...rest } = context;

                return {
                  ...rest,
                  schedules: migrateSchedule(schedule),
                };
              })
            : [],
        };
      })
    : [];

  return {
    ...raw,
    version: 2,
    students,
    schoolYears,
  };
}
/**
 * Migração V2 → V3:
 * acrescenta a lista de locais de ensino e a associação opcional
 * de cada aluno a um local.
 */
function migrateV2ToV3(raw: Record<string, unknown>): Record<string, unknown> {
  const students = Array.isArray(raw["students"])
    ? raw["students"].map((entry) => {
        if (!entry || typeof entry !== "object") return entry;

        const student = entry as Record<string, unknown>;

        return {
          ...student,
          schoolId: typeof student["schoolId"] === "string" ? student["schoolId"] : null,
        };
      })
    : [];

  return {
    ...raw,
    version: 3,
    students,
    schools: Array.isArray(raw["schools"]) ? raw["schools"] : [],
  };
}

function migrateV3ToV4(raw: Record<string, unknown>): Record<string, unknown> {
  const seed = createSeed();

  return {
    ...raw,
    version: 4,
    reportCatalog:
      raw["reportCatalog"] &&
      typeof raw["reportCatalog"] === "object" &&
      Array.isArray((raw["reportCatalog"] as Record<string, unknown>)["dimensions"])
        ? raw["reportCatalog"]
        : seed.reportCatalog,
    studentReports: Array.isArray(raw["studentReports"]) ? raw["studentReports"] : [],
  };
}

function migrateState(state: AppState): AppState {
  const seed = createSeed();
  const baselineTimestamp = new Date().toISOString();

  const existingLibraryIds = new Set(state.library.map((item) => item.id));

  const newLibraryItems = seed.library.filter((item) => !existingLibraryIds.has(item.id));

  return {
    ...state,
    version: DATA_VERSION,
    schools: state.schools ?? [],
    students: state.students.map((student) => ({
      ...student,
      schoolId: student.schoolId ?? null,
    })),
    library: [...state.library, ...newLibraryItems],
    reportCatalog: state.reportCatalog,
    studentReports: state.studentReports,
    schoolYears: state.schoolYears.map((year) => ({
      ...year,
      students: year.students.map((ctx) => ({
        ...ctx,

        lessons: ctx.lessons.map((lesson) => migrateLesson(lesson, baselineTimestamp)),
      })),
    })),
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") return createSeed();

  const stored = window.localStorage.getItem(KEY);

  if (!stored) {
    const seed = createSeed();
    saveState(seed);
    return seed;
  }

  try {
    const raw: unknown = JSON.parse(stored);

    if (!raw || typeof raw !== "object") {
      throw new Error("Dados guardados inválidos.");
    }

    let data = raw as Record<string, unknown>;

    if (data["version"] === 1) {
      data = migrateV1ToV2(data);
    }

    if (data["version"] === 2) {
      data = migrateV2ToV3(data);
    }

    if (data["version"] === 3) {
      data = migrateV3ToV4(data);
    }

    if (data["version"] !== DATA_VERSION) {
      throw new Error("Versão de dados não suportada.");
    }

    const migratedState = migrateState(data as unknown as AppState);

    saveState(migratedState);

    return migratedState;
  } catch (error) {
    console.error("Não foi possível carregar os dados guardados:", error);

    throw error;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(KEY, JSON.stringify(state));
}
