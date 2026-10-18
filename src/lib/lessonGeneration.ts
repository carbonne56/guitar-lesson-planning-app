import type { AppState, ISODate } from "./model";
import { getStudent, yearContext } from "./selectors";
import { addDays, todayISO, weekdayOf } from "./dates";
import { newId } from "./model";

function isHoliday(year: AppState["schoolYears"][number], date: ISODate): boolean {
  const period = year.holidays.some(
    (holiday) => date >= holiday.startDate && date <= holiday.endDate,
  );

  const publicHoliday = year.publicHolidays.some((holiday) => holiday.date === date);

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

  // As aulas deste aluno já foram geradas.
  if (ctx.created) return state;

  // Aluno inativo não gera aulas.
  if (!student.active) return state;

  // Sem horário não gera aulas.
  if (!student.schedule) return state;

  const schedule = student.schedule;

  const startDate = todayISO() > year.startDate ? todayISO() : year.startDate;

  const dates: ISODate[] = [];

  for (let date = startDate; date <= year.endDate; date = addDays(date, 1)) {
    if (weekdayOf(date) !== schedule.weekday) continue;
    if (isHoliday(year, date)) continue;

    dates.push(date);
  }

  const lessons = dates.map((date) => ({
    id: newId("lesson"),
    date,
    time: schedule.time,
    duration: schedule.duration,
    type: "normal" as const,
    status: "completed" as const,
    objectives: [],
    summary: [],
  }));

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

export function generateLessonsForAllStudents(state: AppState, yearId: string): AppState {
  const year = state.schoolYears.find((y) => y.id === yearId);
  if (!year) return state;

  let nextState = state;

  for (const ctx of year.students) {
    nextState = generateLessonsForStudent(nextState, yearId, ctx.studentId);
  }

  return nextState;
}
