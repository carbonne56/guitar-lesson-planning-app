
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { newId, type Schedule, type Student } from "@/lib/model";
import { WEEKDAYS, todayISO } from "@/lib/dates";
import { activeYear, yearContext } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { reviewLessonsForStudent } from "@/lib/lessonGeneration";

type ScheduleDraft = {
  weekday: string;
  time: string;
  duration: string;
};

function emptySchedule(): ScheduleDraft {
  return {
    weekday: "",
    time: "16:00",
    duration: "45",
  };
}

function scheduleToDraft(schedule: Schedule): ScheduleDraft {
  return {
    weekday: String(schedule.weekday),
    time: schedule.time,
    duration: String(schedule.duration),
  };
}

function sameSchedules(a: Schedule[], b: Schedule[]): boolean {
  const normalize = (schedules: Schedule[]) =>
    [...schedules]
      .map(({ weekday, time, duration }) => ({
        weekday,
        time,
        duration,
      }))
      .sort(
        (a, b) =>
          a.weekday - b.weekday ||
          a.time.localeCompare(b.time) ||
          a.duration - b.duration,
      );

  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}

/** Shared create/edit form. Saving never rewrites past lessons. */
export function StudentForm({
  open,
  onOpenChange,
  student,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  student?: Student;
}) {
  const { state, update } = useStore();
  const year = activeYear(state);
  const ctx = student ? yearContext(year, student.id) : undefined;

  const [name, setName] = useState(student?.name ?? "");
  const [birthDate, setBirthDate] = useState(student?.birthDate ?? "");
  const [grade, setGrade] = useState(ctx?.grade ?? "");
  const [schoolId, setSchoolId] = useState<string | null>(student?.schoolId ?? null);
  const [schedules, setSchedules] = useState<ScheduleDraft[]>(() => {
    const existing = student?.schedules.map(scheduleToDraft) ?? [];
    return existing.length > 0 ? existing : [emptySchedule()];
  });
  const [active, setActive] = useState(student?.active ?? true);

  const updateSchedule = (
    index: number,
    field: keyof ScheduleDraft,
    value: string,
  ) => {
    setSchedules((current) =>
      current.map((schedule, i) =>
        i === index ? { ...schedule, [field]: value } : schedule,
      ),
    );
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    const nextSchedules: Schedule[] = schedules
      .filter((schedule) => schedule.weekday !== "")
      .map((schedule) => ({
        weekday: Number(schedule.weekday),
        time: schedule.time,
        duration: Number(schedule.duration) || 45,
      }));

    if (!student && nextSchedules.length === 0) {
      window.alert("Para criar um aluno, indica pelo menos um horário.");
      return;
    }

    const scheduleKeys = nextSchedules.map((schedule) =>
      `${schedule.weekday}|${schedule.time}|${schedule.duration}`,
    );

    if (new Set(scheduleKeys).size !== scheduleKeys.length) {
      window.alert("Existem horários duplicados. Verifica os horários indicados.");
      return;
    }

    const id = student?.id ?? newId("student");
    const scheduleChanged =
      !!student && !sameSchedules(student.schedules, nextSchedules);

    if (scheduleChanged && year && ctx?.created && active) {
      const futureNormalLessons = ctx.lessons.filter(
        (lesson) =>
          lesson.type === "normal" && lesson.date >= todayISO(),
      );

      if (futureNormalLessons.length > 0) {
        const confirmed = window.confirm(
          "Os horários deste aluno foram alterados.\n\n" +
            "As aulas futuras normais correspondentes aos horários removidos " +
            "serão eliminadas e serão criadas aulas para os horários novos. " +
            "Os horários que se mantêm serão preservados.\n\n" +
            "As aulas passadas, transferidas e extraordinárias não serão eliminadas.\n\n" +
            "Quer continuar?",
        );

        if (!confirmed) return;
      }
    }

    const next: Student = {
      id,
      name: name.trim(),
      birthDate: birthDate || null,
      schoolId,
      active,
      schedules: nextSchedules,
    };

    update((s) => {
      const students = student
        ? s.students.map((item) => (item.id === id ? next : item))
        : [...s.students, next];

      let nextState = {
        ...s,
        students,
      };

      const currentYear = nextState.schoolYears.find(
        (item) => item.id === nextState.settings.activeSchoolYearId,
      );

      if (!currentYear) return nextState;

      const existingContext = currentYear.students.find(
        (item) => item.studentId === id,
      );

      nextState = {
        ...nextState,
        schoolYears: nextState.schoolYears.map((item) => {
          if (item.id !== currentYear.id) return item;

          return {
            ...item,
            students: existingContext
              ? item.students.map((context) =>
                  context.studentId === id
                    ? { ...context, grade }
                    : context,
                )
              : [
                  ...item.students,
                  {
                    studentId: id,
                    grade,
                    schedules: nextSchedules.map((schedule) => ({
                      ...schedule,
                    })),
                    created: false,
                    annualPlan: [],
                    lessons: [],
                  },
                ],
          };
        }),
      };

      if (
        student &&
        existingContext?.created &&
        scheduleChanged &&
        active
      ) {
        return reviewLessonsForStudent(
          nextState,
          currentYear.id,
          id,
          nextSchedules,
        ).state;
      }

      // Se as aulas ainda não foram geradas, apenas atualizamos os horários.
      // Se o aluno estiver inativo, preservamos as aulas existentes.
      return {
        ...nextState,
        schoolYears: nextState.schoolYears.map((item) =>
          item.id !== currentYear.id
            ? item
            : {
                ...item,
                students: item.students.map((context) =>
                  context.studentId !== id
                    ? context
                    : {
                        ...context,
                        schedules: nextSchedules.map((schedule) => ({
                          ...schedule,
                        })),
                      },
                ),
              },
        ),
      };
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {student ? "Editar aluno" : "Novo aluno"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={save} className="space-y-4">
          <Field label="Nome">
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
                    </Field>

          <Field label="Local de ensino">
            <select
              className="field"
              value={schoolId ?? ""}
              onChange={(e) => setSchoolId(e.target.value || null)}
            >
              <option value="">Sem local atribuído</option>
              {state.schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Data de nascimento">
              <input
                className="field"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </Field>

            <Field label={`Grau${year ? ` (${year.name})` : ""}`}>
              <input
                className="field"
                value={grade}
                placeholder="ex.: 8.º"
                onChange={(e) => setGrade(e.target.value)}
              />
            </Field>
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Horários semanais</h3>
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setSchedules((current) => [...current, emptySchedule()])
                }
              >
                + Adicionar horário
              </button>
            </div>

            {schedules.map((schedule, index) => (
              <div
                key={index}
                className="space-y-3 rounded-lg border p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Horário {index + 1}
                  </span>

                  <button
                    type="button"
                    className="btn-ghost text-xs"
                    onClick={() =>
                      setSchedules((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Remover
                  </button>
                </div>

                <Field label="Dia da semana">
                  <select
                    className="field"
                    value={schedule.weekday}
                    onChange={(e) =>
                      updateSchedule(index, "weekday", e.target.value)
                    }
                  >
                    <option value="">Selecionar dia</option>
                    {WEEKDAYS.map((day, i) => (
                      <option key={day} value={i}>
                        {day}
                      </option>
                    ))}
                  </select>
                </Field>

                {schedule.weekday !== "" && (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Hora">
                      <input
                        className="field"
                        type="time"
                        value={schedule.time}
                        onChange={(e) =>
                          updateSchedule(index, "time", e.target.value)
                        }
                        required
                      />
                    </Field>

                    <Field label="Duração (min)">
                      <input
                        className="field"
                        type="number"
                        min={15}
                        step={5}
                        value={schedule.duration}
                        onChange={(e) =>
                          updateSchedule(index, "duration", e.target.value)
                        }
                        required
                      />
                    </Field>
                  </div>
                )}
              </div>
            ))}
          </section>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="size-4 accent-primary"
            />
            Ativo
          </label>

          {student && (
            <p className="text-xs text-muted-foreground">
              Ao alterar horários de um aluno com aulas já geradas, poderás
              confirmar a atualização das aulas futuras. As aulas passadas
              serão preservadas.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
