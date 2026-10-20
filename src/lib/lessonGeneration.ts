
import type { AppState, ISODate, Schedule } from "./model";
import { getStudent, yearContext } from "./selectors";
import { addDays, todayISO, weekdayOf } from "./dates";
import { newId } from "./model";

function isHoliday(
  year: AppState["schoolYears"][number],
  date: ISODate,
): boolean {
  const period = year.holidays.some(
    (holiday) => date >= holiday.startDate && date <= holiday.endDate,
  );

  const publicHoliday = year.publicHolidays.some(
    (holiday) => holiday.date === date,
  );

  return period || publicHoliday;
}

function sameSchedule(a: Schedule, b: Schedule): boolean {
  return (
    a.weekday === b.weekday &&
    a.time === b.time &&
    a.duration === b.duration
  );
}

function matchesSchedule(
  lesson: {
    date: ISODate;
    time: string;
    duration: number;
  },
  schedule: Schedule,
): boolean {
  return (
    weekdayOf(lesson.date) === schedule.weekday &&
    lesson.time === schedule.time &&
    lesson.duration === schedule.duration
  );
}

function createLessonsForSchedule(
  year: AppState["schoolYears"][number],
  schedule: Schedule,
  startDate: ISODate,
  includeMargins: boolean,
) {
  const dates: ISODate[] = [];

  for (
    let date = startDate;
    date <= year.endDate;
    date = addDays(date, 1)
  ) {
    if (weekdayOf(date) !== schedule.weekday) continue;
    dates.push(date);
  }

  const lessons = dates.map((date) => ({
    id: newId("lesson"),
    date,
    time: schedule.time,
    duration: schedule.duration,
    type: "normal" as const,
    status: "completed" as const,
    blocked: isHoliday(year, date),
    objectives: "",
    summary: "",
    objectiveLibraryItemIds: [],
    summaryLibraryItemIds: [],
  }));

  if (!includeMargins) return lessons;

  let previousMarginDate = addDays(year.startDate, -1);
  while (weekdayOf(previousMarginDate) !== schedule.weekday) {
    previousMarginDate = addDays(previousMarginDate, -1);
  }

  let nextMarginDate = addDays(year.endDate, 1);
  while (weekdayOf(nextMarginDate) !== schedule.weekday) {
    nextMarginDate = addDays(nextMarginDate, 1);
  }

  return [
    {
      id: newId("lesson"),
      date: previousMarginDate,
      time: schedule.time,
      duration: schedule.duration,
      type: "normal" as const,
      status: "completed" as const,
      blocked: true,
      objectives: "",
      summary: "",
      objectiveLibraryItemIds: [],
      summaryLibraryItemIds: [],
    },
    ...lessons,
    {
      id: newId("lesson"),
      date: nextMarginDate,
      time: schedule.time,
      duration: schedule.duration,
      type: "normal" as const,
      status: "completed" as const,
      blocked: true,
      objectives: "",
      summary: "",
      objectiveLibraryItemIds: [],
      summaryLibraryItemIds: [],
    },
  ];
}

export function generateLessonsForStudent(
  state: AppState,
  yearId: string,
  studentId: string,
): AppState {
  const year = state.schoolYears.find((item) => item.id === yearId);
  if (!year) return state;

  const student = getStudent(state, studentId);
  const ctx = yearContext(year, studentId);

  if (!student || !ctx) return state;
  if (ctx.created || !student.active || student.schedules.length === 0) {
    return state;
  }

  const today = todayISO();
  const startDate = today > year.startDate ? today : year.startDate;

  const lessons = student.schedules.flatMap((schedule) =>
    createLessonsForSchedule(year, schedule, startDate, true),
  );

  return {
    ...state,
    schoolYears: state.schoolYears.map((item) =>
      item.id !== yearId
        ? item
        : {
            ...item,
            students: item.students.map((context) =>
              context.studentId !== studentId
                ? context
                : {
                    ...context,
                    schedules: student.schedules.map((schedule) => ({
                      ...schedule,
                    })),
                    created: true,
                    lessons: [...context.lessons, ...lessons],
                  },
            ),
          },
    ),
  };
}

export function generateLessonsForAllStudents(
  state: AppState,
  yearId: string,
): AppState {
  const year = state.schoolYears.find((item) => item.id === yearId);
  if (!year) return state;

  let nextState = state;

  for (const ctx of year.students) {
    nextState = generateLessonsForStudent(
      nextState,
      yearId,
      ctx.studentId,
    );
  }

  return nextState;
}


/**
 * Reconcilia os horários de um aluno com as aulas futuras já geradas.
 *
 * - Horários iguais conservam as suas aulas.
 * - Horários alterados deslocam as aulas existentes, preservando os seus dados.
 * - Horários removidos eliminam as aulas futuras correspondentes.
 * - Horários novos geram novas aulas.
 * - As aulas passadas, transferidas e extra são preservadas.
 */
export function reviewLessonsForStudent(
  state: AppState,
  yearId: string,
  studentId: string,
  newSchedules: Schedule[],
): { state: AppState; count: number } {
  const year = state.schoolYears.find((item) => item.id === yearId);
  if (!year) return { state, count: 0 };

  const ctx = yearContext(year, studentId);
  if (!ctx) return { state, count: 0 };

  const today = todayISO();
  const oldSchedules = ctx.schedules;

  // Primeiro, identificamos os horários que permanecem exatamente iguais.
  const matchedOldIndexes = new Set<number>();
  const matchedNewIndexes = new Set<number>();

  oldSchedules.forEach((oldSchedule, oldIndex) => {
    const newIndex = newSchedules.findIndex(
      (newSchedule, index) =>
        !matchedNewIndexes.has(index) &&
        sameSchedule(oldSchedule, newSchedule),
    );

    if (newIndex !== -1) {
      matchedOldIndexes.add(oldIndex);
      matchedNewIndexes.add(newIndex);
    }
  });

  // Ordenamos os horários restantes cronologicamente na semana.
  const scheduleOrder = (a: Schedule, b: Schedule) =>
    a.weekday - b.weekday ||
    a.time.localeCompare(b.time) ||
    a.duration - b.duration;

  const unmatchedOld = oldSchedules
    .filter((_, index) => !matchedOldIndexes.has(index))
    .sort(scheduleOrder);

  const unmatchedNew = newSchedules
    .filter((_, index) => !matchedNewIndexes.has(index))
    .sort(scheduleOrder);

  // Associamos os horários restantes pela ordem cronológica.
  const changedPairs: {
    oldSchedule: Schedule;
    newSchedule: Schedule;
  }[] = [];

  const pairCount = Math.min(unmatchedOld.length, unmatchedNew.length);

  for (let index = 0; index < pairCount; index++) {
    const oldSchedule = unmatchedOld[index];
    const newSchedule = unmatchedNew[index];

    if (oldSchedule && newSchedule) {
      changedPairs.push({ oldSchedule, newSchedule });
    }
  }

  // Os horários antigos sem correspondência foram realmente removidos.
  const removedSchedules = unmatchedOld.slice(pairCount);

  // Os horários novos sem correspondência precisam de novas aulas.
  const addedSchedules = unmatchedNew.slice(pairCount);

  const lessonsToRemove = new Set<string>();

  for (const schedule of removedSchedules) {
    for (const lesson of ctx.lessons) {
      if (
        lesson.type === "normal" &&
        lesson.date >= today &&
        matchesSchedule(lesson, schedule)
      ) {
        lessonsToRemove.add(lesson.id);
      }
    }
  }

  // Calculamos as alterações às aulas sem criar novas identidades:
  // cada aula mantém o ID, os objetivos, o sumário e os elementos associados.
  const lessonUpdates = new Map<
    string,
    {
      date: ISODate;
      time: string;
      duration: number;
      blocked: boolean;
    }
  >();

  for (const { oldSchedule, newSchedule } of changedPairs) {
    const matchingLessons = ctx.lessons
      .filter(
        (lesson) =>
          lesson.type === "normal" &&
          lesson.date >= today &&
          matchesSchedule(lesson, oldSchedule),
      )
      .sort((a, b) => a.date.localeCompare(b.date));

    // Encontramos a primeira ocorrência do novo dia a partir de hoje.
    let firstDate: ISODate = today;

    while (weekdayOf(firstDate) !== newSchedule.weekday) {
      firstDate = addDays(firstDate, 1);
    }

    // Mantemos a ordem das aulas e os intervalos semanais.
    matchingLessons.forEach((lesson, index) => {
      const date = addDays(firstDate, index * 7);

      lessonUpdates.set(lesson.id, {
        date,
        time: newSchedule.time,
        duration: newSchedule.duration,
        blocked:
          date < year.startDate ||
          date > year.endDate ||
          isHoliday(year, date),
      });
    });
  }

  const startDate = today > year.startDate ? today : year.startDate;

  const addedLessons = addedSchedules.flatMap((schedule) =>
    createLessonsForSchedule(year, schedule, startDate, true),
  );

  const nextState: AppState = {
    ...state,
    schoolYears: state.schoolYears.map((item) =>
      item.id !== yearId
        ? item
        : {
            ...item,
            students: item.students.map((context) =>
              context.studentId !== studentId
                ? context
                : {
                    ...context,
                    schedules: newSchedules.map((schedule) => ({
                      ...schedule,
                    })),
                    lessons: [
                      ...context.lessons
                        .filter(
                          (lesson) => !lessonsToRemove.has(lesson.id),
                        )
                        .map((lesson) => {
                          const changes = lessonUpdates.get(lesson.id);
                          return changes
                            ? { ...lesson, ...changes }
                            : lesson;
                        }),
                      ...addedLessons,
                    ],
                  },
            ),
          },
    ),
  };

  return {
    state: nextState,
    count: lessonsToRemove.size,
  };
}
