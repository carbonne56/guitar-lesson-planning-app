
import type {
  AppState,
  Schedule,
  Student,
  YearStudent,
} from "./model";
import { newId } from "./model";
import { reviewLessonsForStudent } from "./lessonGeneration";

const SOURCE_APP = "teacher-schedule";
const SOURCE_VERSION = 1;

type SourceLesson = {
  studentName: string;
  location: string;
  duration?: number;
  day?: number;
  startMinutes?: number;
};

export type TeacherScheduleImport = {
  people: {
    name: string;
    schedules: Schedule[];
    hasWaitingRecord: boolean;
  }[];
};

export type TeacherScheduleImportPreview = {
  yearName: string;
  totalPeople: number;
  scheduledPeople: number;
  waitingPeople: number;
  newStudents: number;
  existingStudents: number;
  schedules: number;
  includedWaiting: boolean;
};

export type TeacherScheduleImportResult = {
  state: AppState;
  importedStudents: number;
  updatedStudents: number;
  importedSchedules: number;
  importedWithoutSchedule: number;
};

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
}

function sameSchedule(a: Schedule, b: Schedule): boolean {
  return (
    a.weekday === b.weekday &&
    a.time === b.time &&
    a.duration === b.duration
  );
}

function validateSourceLesson(
  value: unknown,
  index: number,
): SourceLesson {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`O elemento ${index + 1} não é válido.`);
  }

  const item = value as Record<string, unknown>;

  if (
    typeof item["studentName"] !== "string" ||
    !item["studentName"].trim()
  ) {
    throw new Error(
      `O elemento ${index + 1} não tem um nome de aluno válido.`,
    );
  }

  if (
    typeof item["location"] !== "string" ||
    !item["location"].trim()
  ) {
    throw new Error(
      `O elemento ${index + 1} não tem uma localização válida.`,
    );
  }

  const lesson: SourceLesson = {
    studentName: item["studentName"].trim().replace(/\s+/g, " "),
    location: item["location"].trim(),
  };

  if (lesson.location === "schedule") {
    if (
      !Number.isInteger(item["day"]) ||
      (item["day"] as number) < 0 ||
      (item["day"] as number) > 6
    ) {
      throw new Error(
        `O horário de ${lesson.studentName} tem um dia da semana inválido.`,
      );
    }

    if (
      !Number.isInteger(item["startMinutes"]) ||
      (item["startMinutes"] as number) < 0 ||
      (item["startMinutes"] as number) > 1439
    ) {
      throw new Error(
        `O horário de ${lesson.studentName} tem uma hora de início inválida.`,
      );
    }

    if (
      !Number.isInteger(item["duration"]) ||
      (item["duration"] as number) <= 0
    ) {
      throw new Error(
        `O horário de ${lesson.studentName} tem uma duração inválida.`,
      );
    }

    lesson.day = item["day"] as number;
    lesson.startMinutes = item["startMinutes"] as number;
    lesson.duration = item["duration"] as number;
  }

  return lesson;
}

export function parseTeacherScheduleImport(
  text: string,
): TeacherScheduleImport {
  let raw: unknown;

  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("O texto não contém JSON válido.");
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("O conteúdo importado não tem o formato esperado.");
  }

  const data = raw as Record<string, unknown>;

  if (
    data["app"] !== SOURCE_APP ||
    data["version"] !== SOURCE_VERSION ||
    !Array.isArray(data["lessons"])
  ) {
    throw new Error(
      "O JSON não corresponde a uma exportação compatível do teacher-schedule.",
    );
  }

  const grouped = new Map<
    string,
    {
      name: string;
      schedules: Schedule[];
      hasWaitingRecord: boolean;
    }
  >();

  data["lessons"].forEach((rawLesson, index) => {
    const lesson = validateSourceLesson(rawLesson, index);
    const key = normalizeName(lesson.studentName);

    let person = grouped.get(key);

    if (!person) {
      person = {
        name: lesson.studentName,
        schedules: [],
        hasWaitingRecord: false,
      };
      grouped.set(key, person);
    }

    if (lesson.location === "schedule") {
      const schedule: Schedule = {
        weekday: (lesson.day! + 1) % 7,
        time: formatTime(lesson.startMinutes!),
        duration: lesson.duration!,
      };

      if (!person.schedules.some((item) => sameSchedule(item, schedule))) {
        person.schedules.push(schedule);
      }
    } else {
      person.hasWaitingRecord = true;
    }
  });

  const people = Array.from(grouped.values());

  for (const person of people) {
    person.schedules.sort(
      (a, b) =>
        a.weekday - b.weekday ||
        a.time.localeCompare(b.time) ||
        a.duration - b.duration,
    );
  }

  return { people };
}

function getActiveYear(state: AppState) {
  const yearId = state.settings.activeSchoolYearId;

  if (!yearId) {
    throw new Error("Não existe um ano letivo ativo.");
  }

  const year = state.schoolYears.find((item) => item.id === yearId);

  if (!year) {
    throw new Error("Não foi possível encontrar o ano letivo ativo.");
  }

  return year;
}

function findMatchingStudent(
  state: AppState,
  name: string,
): Student | undefined {
  const key = normalizeName(name);
  const matches = state.students.filter(
    (student) => normalizeName(student.name) === key,
  );

  if (matches.length > 1) {
    throw new Error(
      `Existem vários alunos chamados "${name}" (ignorando maiúsculas e espaços). Corrige esses nomes antes de importar.`,
    );
  }

  return matches[0];
}

function selectedPeople(
  data: TeacherScheduleImport,
  includeWaiting: boolean,
) {
  return data.people.filter(
    (person) => person.schedules.length > 0 || includeWaiting,
  );
}

export function previewTeacherScheduleImport(
  state: AppState,
  data: TeacherScheduleImport,
  includeWaiting: boolean,
): TeacherScheduleImportPreview {
  const year = getActiveYear(state);
  const people = selectedPeople(data, includeWaiting);

  let newStudents = 0;
  let existingStudents = 0;
  let schedules = 0;
  let scheduledPeople = 0;
  let waitingPeople = 0;

  for (const person of people) {
    const existing = findMatchingStudent(state, person.name);

    if (existing) {
      existingStudents++;
    } else {
      newStudents++;
    }

    if (person.schedules.length > 0) {
      scheduledPeople++;
      schedules += person.schedules.length;
    } else {
      waitingPeople++;
    }
  }

  return {
    yearName: year.name,
    totalPeople: people.length,
    scheduledPeople,
    waitingPeople,
    newStudents,
    existingStudents,
    schedules,
    includedWaiting: includeWaiting,
  };
}

export function applyTeacherScheduleImport(
  initialState: AppState,
  data: TeacherScheduleImport,
  includeWaiting: boolean,
): TeacherScheduleImportResult {
  const year = getActiveYear(initialState);
  const people = selectedPeople(data, includeWaiting);

  // Validamos todas as correspondências antes de alterar o estado.
  for (const person of people) {
    findMatchingStudent(initialState, person.name);
  }

  let state = initialState;
  let importedStudents = 0;
  let updatedStudents = 0;
  let importedSchedules = 0;
  let importedWithoutSchedule = 0;

  for (const person of people) {
    const schedules = person.schedules.map((schedule) => ({
      ...schedule,
    }));

    let student = findMatchingStudent(state, person.name);

    if (!student) {
      student = {
        id: newId("student"),
        name: person.name,
        birthDate: null,
        active: true,
        schedules,
      };

      state = {
        ...state,
        students: [...state.students, student],
      };

      importedStudents++;
    } else {
      state = {
        ...state,
        students: state.students.map((item) =>
          item.id === student!.id
            ? {
                ...item,
                schedules: schedules.map((schedule) => ({
                  ...schedule,
                })),
              }
            : item,
        ),
      };

      updatedStudents++;
    }

    const currentYear = state.schoolYears.find(
      (item) => item.id === year.id,
    )!;

    const context = currentYear.students.find(
      (item) => item.studentId === student!.id,
    );

    if (!context) {
      const newContext: YearStudent = {
        studentId: student.id,
        grade: "",
        schedules: schedules.map((schedule) => ({ ...schedule })),
        created: false,
        annualPlan: [],
        lessons: [],
      };

      state = {
        ...state,
        schoolYears: state.schoolYears.map((item) =>
          item.id !== year.id
            ? item
            : {
                ...item,
                students: [...item.students, newContext],
              },
        ),
      };
    } else if (context.created) {
      // Preserva os dados das aulas e reconcilia apenas os horários futuros.
      state = applyReview(state, year.id, student.id, schedules);
    } else {
      // As aulas ainda não foram geradas: atualizamos apenas o horário.
      state = {
        ...state,
        schoolYears: state.schoolYears.map((item) =>
          item.id !== year.id
            ? item
            : {
                ...item,
                students: item.students.map((entry) =>
                  entry.studentId !== student!.id
                    ? entry
                    : {
                        ...entry,
                        schedules: schedules.map((schedule) => ({
                          ...schedule,
                        })),
                      },
                ),
              },
        ),
      };
    }

    importedSchedules += schedules.length;

    if (schedules.length === 0) {
      importedWithoutSchedule++;
    }
  }

  return {
    state,
    importedStudents,
    updatedStudents,
    importedSchedules,
    importedWithoutSchedule,
  };
}

function applyReview(
  state: AppState,
  yearId: string,
  studentId: string,
  schedules: Schedule[],
): AppState {
  return reviewLessonsForStudent(
    state,
    yearId,
    studentId,
    schedules,
  ).state;
}
