// Conceptual data model. Students are global; year contexts hold per-year data.

export type ISODate = string; // "YYYY-MM-DD"

export interface Schedule {
  weekday: number; // 0 = domingo … 6 = sábado
  time: string; // "HH:MM"
  duration: number; // minutes
}

export interface Student {
  id: string;
  name: string;
  birthDate: ISODate | null;
  active: boolean; // only source of truth for active status
  schedules: Schedule[];
}

export interface LibraryItem {
  id: string;
  name: string;
  category: string;
}

/**
 * Legacy type.
 *
 * Kept temporarily while the lesson editor is being migrated from
 * structured segments to plain text + library references.
 */

export type LessonType = "normal" | "transferred" | "extra";
export type LessonStatus = "completed" | "absence";

export interface Lesson {
  id: string;
  date: ISODate;
  time: string;
  duration: number;
  type: LessonType;
  status: LessonStatus;
  blocked: boolean;

  // Free text written by the teacher.
  objectives: string;
  summary: string;

  // Structured record of library elements selected for this lesson.
  // These are independent from the text itself.
  objectiveLibraryItemIds: string[];
  summaryLibraryItemIds: string[];
}

export interface PlanEntry {
  libraryItemId: string;
}

export interface YearStudent {
  studentId: string;
  grade: string;
  schedules: Schedule[];
  created: boolean;
  annualPlan: PlanEntry[];
  lessons: Lesson[];
}

export interface HolidayPeriod {
  id: string;
  name: string;
  startDate: ISODate;
  endDate: ISODate;
}

export interface PublicHoliday {
  id: string;
  name: string;
  date: ISODate;
}

export interface EventProgramEntry {
  id: string;
  studentId: string;
  libraryItemId: string;
}

export interface SchoolEvent {
  id: string;
  name: string;
  date: ISODate;
  program: EventProgramEntry[];
}

export interface SchoolYear {
  id: string;
  name: string;
  startDate: ISODate;
  endDate: ISODate;
  holidays: HolidayPeriod[];
  publicHolidays: PublicHoliday[];
  events: SchoolEvent[];
  students: YearStudent[];
}

export interface AppState {
  version: 2;
  students: Student[];
  schoolYears: SchoolYear[];
  library: LibraryItem[];
  settings: {
    activeSchoolYearId: string | null;
  };
}

export function newId(prefix: string): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${prefix}-${Date.now().toString(36)}-${rnd}`;
}
