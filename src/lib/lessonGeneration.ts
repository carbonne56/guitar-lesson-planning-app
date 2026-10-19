import type { AppState, ISODate } from "./model";
import { getStudent, yearContext } from "./selectors";
import { addDays, todayISO, weekdayOf } from "./dates";
import { newId } from "./model";

function isHoliday(
  year: AppState["schoolYears"][number],
  date: ISODate,
): boolean {
  const period = year.holidays.some(
    (holiday) =>
      date >= holiday.startDate &&
      date <= holiday.endDate,
  );

  const publicHoliday = year.publicHolidays.some(
    (holiday) => holiday.date === date,
  );

  return period || publicHoliday;
}

export function generateLessonsForStudent(
  state: AppState,
  yearId: string,
  studentId: string,
): AppState {
  const year = state.schoolYears.find((y) => y.id === yearId);
  if (!year) return state;

  const student = getStudent(state, studentId);
  const ctx = yearContext(year, studentId);

  if (!student || !ctx) return state;

  if (ctx.created) return state;
  if (!student.active) return state;
  if (!student.schedule) return state;

  const schedule = student.schedule;

  const startDate =
    todayISO() > year.startDate
      ? todayISO()
      : year.startDate;

  const dates: ISODate[] = [];

  for (
    let date = startDate;
    date <= year.endDate;
    date = addDays(date, 1)
  ) {
    if (weekdayOf(date) !== schedule.weekday) continue;
    dates.push(date);
  }

  /*
   * Margem temporal:
   * criamos uma ocorrência adicional antes do início e outra depois
   * do fim do ano letivo. Ambas ficam blocked e permitem que uma
   * alteração do dia da semana possa deslocar uma ocorrência para
   * dentro do ano sem ser necessário criar aulas especiais.
   */

  let previousMarginDate = addDays(year.startDate, -1);
  while (weekdayOf(previousMarginDate) !== schedule.weekday) {
    previousMarginDate = addDays(previousMarginDate, -1);
  }

  let nextMarginDate = addDays(year.endDate, 1);
  while (weekdayOf(nextMarginDate) !== schedule.weekday) {
    nextMarginDate = addDays(nextMarginDate, 1);
  }

  const lessons = [
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
    ...dates.map((date) => ({
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
    })),
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

  return {
    ...state,
    schoolYears: state.schoolYears.map((y) =>
      y.id !== yearId
        ? y
        : {
            ...y,
            students: y.students.map((c) =>
              c.studentId !== studentId
                ? c
                : {
                    ...c,
                    schedule: { ...schedule },
                    created: true,
                    lessons: [...c.lessons, ...lessons],
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
  const year = state.schoolYears.find(
    (y) => y.id === yearId,
  );

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

export function reviewLessonsForStudent(
  state: AppState,
  yearId: string,
  studentId: string,
  newSchedule: {
    weekday: number;
    time: string;
    duration: number;
  },
): { state: AppState; count: number } {
  const year = state.schoolYears.find((y) => y.id === yearId);

  if (!year) {
    return { state, count: 0 };
  }

  const ctx = yearContext(year, studentId);

  if (!ctx) {
    return { state, count: 0 };
  }

  const today = todayISO();

  const futureNormalLessons = ctx.lessons
    .filter(
      (lesson) =>
        lesson.type === "normal" &&
        lesson.date >= today,
    )
    .sort((a, b) =>
      (a.date + a.time).localeCompare(
        b.date + b.time,
      ),
    );

  if (!futureNormalLessons.length) {
    return { state, count: 0 };
  }

  /*
   * As margens são criadas apenas na geração inicial das aulas.
   * Na revisão do horário nunca criamos novas ocorrências:
   * apenas deslocamos as ocorrências futuras já existentes.
   */

  const reviewedLessons = futureNormalLessons.map((lesson) => {
    const currentWeekday = weekdayOf(lesson.date);

    const daysToAdd = newSchedule.weekday - currentWeekday;

    const newDate = addDays(lesson.date, daysToAdd);

    const outsideYear = newDate < year.startDate || newDate > year.endDate;

    return {
      ...lesson,
      date: newDate,
      time: newSchedule.time,
      duration: newSchedule.duration,
      blocked: outsideYear ? true : isHoliday(year, newDate),
    };
  });

  const nextState: AppState = {
    ...state,
    schoolYears: state.schoolYears.map((y) =>
      y.id !== yearId
        ? y
        : {
            ...y,
            students: y.students.map((c) =>
              c.studentId !== studentId
                ? c
                : {
                    ...c,
                    schedule: {
                      ...newSchedule,
                    },
                    lessons: c.lessons.map(
                      (lesson) =>
                        reviewedLessons.find(
                          (reviewed) =>
                            reviewed.id ===
                            lesson.id,
                        ) ?? lesson,
                    ),
                  },
            ),
          },
    ),
  };

  return {
    state: nextState,
    count: futureNormalLessons.filter(
      (lesson) =>
        lesson.date >= today &&
        lesson.date <= year.endDate,
    ).length,
  };
}
