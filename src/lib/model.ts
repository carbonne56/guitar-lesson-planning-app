// Conceptual data model. Students are global; year contexts hold per-year data.

export type ISODate = string; // "YYYY-MM-DD"

export interface Schedule {
  weekday: number; // 0 = domingo … 6 = sábado
  time: string; // "HH:MM"
  duration: number; // minutes
}

export interface School {
  id: string;
  name: string;
  color: string;
}
export interface Student {
  id: string;
  name: string;
  birthDate: ISODate | null;
  active: boolean; // only source of truth for active status
  schoolId: string | null;
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
  objectiveLibraryItemIds: string[];
  summaryLibraryItemIds: string[];
  updatedAt?: string;
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
  annualPlanUpdatedAt?: string;
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

export type ReportDimensionId = string;

export interface ReportFormulationOption {
  id: string;
  label: string;
  summary: string;
  text: string;
  active: boolean;
}

export interface ReportTopic {
  id: string;
  title: string;
  active: boolean;
  options: ReportFormulationOption[];
}

export interface ReportDimension {
  id: ReportDimensionId;
  title: string;
  active: boolean;
  topics: ReportTopic[];
}

export interface ReportCatalog {
  dimensions: ReportDimension[];
}

export interface SelectedReportFormulation {
  dimensionId: ReportDimensionId;
  topicId: string;
  optionId: string;
  topicTitle: string;
  optionLabel: string;
  text: string;
}

export interface StudentReport {
  id: string;
  name: string;
  studentId: string;
  schoolYearId: string;
  period: 1 | 2;
  createdAt: string;
  updatedAt: string;
  selections: SelectedReportFormulation[];
  finalText: string;
}

export interface AppState {
  version: 4;
  students: Student[];
  schools: School[];
  schoolYears: SchoolYear[];
  library: LibraryItem[];
  reportCatalog: ReportCatalog;
  studentReports: StudentReport[];
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
