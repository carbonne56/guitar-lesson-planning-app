import type { AppState, Lesson, SchoolYear, Segment, Student, YearStudent } from "./model";
import { todayISO } from "./dates";

export function activeYear(state: AppState): SchoolYear | null {
  return state.schoolYears.find((y) => y.id === state.settings.activeSchoolYearId) ?? null;
}

export function getStudent(state: AppState, id: string): Student | undefined {
  return state.students.find((s) => s.id === id);
}

export function yearContext(year: SchoolYear | null, studentId: string): YearStudent | undefined {
  return year?.students.find((c) => c.studentId === studentId);
}

export function sortLessons(lessons: Lesson[]): Lesson[] {
  return [...lessons].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

export interface LessonRef {
  year: SchoolYear;
  ctx: YearStudent;
  lesson: Lesson;
}

export function findLesson(state: AppState, lessonId: string): LessonRef | null {
  for (const year of state.schoolYears)
    for (const ctx of year.students) {
      const lesson = ctx.lessons.find((l) => l.id === lessonId);
      if (lesson) return { year, ctx, lesson };
    }
  return null;
}

/** Lessons on a date in the active year, excluding inactive students. */
export function lessonsOnDate(state: AppState, date: string) {
  const year = activeYear(state);
  if (!year) return [];
  const out: { student: Student; lesson: Lesson }[] = [];
  for (const ctx of year.students) {
    const student = getStudent(state, ctx.studentId);
    if (!student || !student.active) continue;
    for (const lesson of ctx.lessons) if (lesson.date === date) out.push({ student, lesson });
  }
  return out.sort((a, b) => a.lesson.time.localeCompare(b.lesson.time));
}

/** Extra lessons are excluded from expected/performed totals. */
export function lessonStats(ctx: YearStudent | undefined, today = todayISO()) {
  const counted = (ctx?.lessons ?? []).filter((l) => l.type !== "extra");
  return {
    expected: counted.length,
    performed: counted.filter((l) => l.status === "completed" && l.date <= today).length,
    absences: (ctx?.lessons ?? []).filter((l) => l.status === "absence").length,
  };
}

/** Number of lessons whose Summary references the library item. */
export function summaryUsage(ctx: YearStudent, libraryItemId: string): number {
  return ctx.lessons.filter((lesson) => lesson.summaryLibraryItemIds.includes(libraryItemId))
    .length;
}

export function segmentsText(segments: Segment[]): string {
  return segments
    .filter((s): s is Extract<Segment, { type: "text" }> => s.type === "text")
    .map((s) => s.content)
    .join("\n");
}

export function libraryCategories(state: AppState): string[] {
  return [...new Set(state.library.map((i) => i.category))].sort((a, b) => a.localeCompare(b, "pt"));
}
