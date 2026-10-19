import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { newId, type Student } from "@/lib/model";
import { WEEKDAYS, todayISO } from "@/lib/dates";
import { activeYear, yearContext } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { reviewLessonsForStudent } from "@/lib/lessonGeneration";

/** Shared create/edit form. Saving never rewrites existing lessons. */
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
  const [weekday, setWeekday] = useState<string>(student?.schedule ? String(student.schedule.weekday) : "");
  const [time, setTime] = useState(student?.schedule?.time ?? "16:00");
  const [duration, setDuration] = useState(String(student?.schedule?.duration ?? 45));
  const [active, setActive] = useState(student?.active ?? true);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const schedule =
      weekday === ""
        ? null
        : {
            weekday: Number(weekday),
            time,
            duration: Number(duration) || 45,
          };

    const id = student?.id ?? newId("student");

    const scheduleChanged =
      !!student &&
      JSON.stringify(student.schedule) !==
        JSON.stringify(schedule);

    if (scheduleChanged && year && ctx) {
      const futureNormalLessons = ctx.lessons.filter(
        (lesson) =>
          lesson.type === "normal" &&
          lesson.date >= todayISO(),
      );

      if (futureNormalLessons.length > 0) {
        const confirmed = window.confirm(
          `O horário deste aluno foi alterado.\n\n` +
            `Todas as ${futureNormalLessons.length} ocorrências futuras ` +
            `serão atualizadas de acordo com o novo horário, ` +
            `tendo em conta férias e feriados.\n\n` +
            `Aulas passadas, transferidas e extraordinárias ` +
            `não serão alteradas.\n\n` +
            `Quer continuar?`,
        );

        if (!confirmed) return;
      }
    }

    const next: Student = {
      id,
      name: name.trim(),
      birthDate: birthDate || null,
      active,
      schedule,
    };

    update((s) => {
      const students = student
        ? s.students.map((x) =>
            x.id === id ? next : x,
          )
        : [...s.students, next];

      let nextState = {
        ...s,
        students,
      };

      const currentYear = nextState.schoolYears.find(
        (y) =>
          y.id ===
          nextState.settings.activeSchoolYearId,
      );

      if (!currentYear) return nextState;

      const has = currentYear.students.some(
        (c) => c.studentId === id,
      );

      nextState = {
        ...nextState,
        schoolYears: nextState.schoolYears.map((y) => {
          if (y.id !== currentYear.id) return y;

          return {
            ...y,
            students: has
              ? y.students.map((c) =>
                  c.studentId === id
                    ? {
                        ...c,
                        grade,
                      }
                    : c,
                )
              : [
                  ...y.students,
                  {
                    studentId: id,
                    grade,
                    schedule,
                    created: false,
                    annualPlan: [],
                    enrolledEventIds: [],
                    lessons: [],
                  },
                ],
          };
        }),
      };

      if (
        scheduleChanged &&
        year &&
        ctx &&
        schedule
      ) {
        return reviewLessonsForStudent(
          nextState,
          year.id,
          id,
          schedule,
        ).state;
      }

      return nextState;
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{student ? "Editar aluno" : "Novo aluno"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <Field label="Nome">
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data de nascimento">
              <input className="field" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </Field>
            <Field label={`Grau${year ? ` (${year.name})` : ""}`}>
              <input className="field" value={grade} placeholder="ex.: 8.º" onChange={(e) => setGrade(e.target.value)} />
            </Field>
          </div>
          <Field label="Dia da semana">
            <select className="field" value={weekday} onChange={(e) => setWeekday(e.target.value)}>
              <option value="">Sem horário</option>
              {WEEKDAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          {weekday !== "" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Hora">
                <input className="field" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </Field>
              <Field label="Duração (min)">
                <input className="field" type="number" min={15} step={5} value={duration} onChange={(e) => setDuration(e.target.value)} />
              </Field>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 accent-primary" />
            Ativo
          </label>
          {student && (
            <p className="text-xs text-muted-foreground">
              Ao alterar o horário, as aulas futuras serão atualizadas após confirmação.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => onOpenChange(false)}>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
