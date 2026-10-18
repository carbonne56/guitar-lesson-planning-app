import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatLong, formatShort, WEEKDAYS } from "@/lib/dates";
import { newId } from "@/lib/model";
import { activeYear } from "@/lib/selectors";
import { generateLessonsForAllStudents } from "@/lib/lessonGeneration";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendário — Aulas de Guitarra" },
      { name: "description", content: "Ano letivo, férias, feriados e eventos." },
      { property: "og:title", content: "Calendário — Aulas de Guitarra" },
      { property: "og:description", content: "Ano letivo, férias, feriados e eventos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Calendario,
});

function Calendario() {
  const { state, update } = useStore();
  const year = activeYear(state);
  const [creating, setCreating] = useState(false);
  const [confirmingGeneration, setConfirmingGeneration] = useState(false);
  const [addingHoliday, setAddingHoliday] = useState(false);
  const [addingPublicHoliday, setAddingPublicHoliday] = useState(false);

  const generateLessons = () => {
    if (!year) return;

    update((state) => generateLessonsForAllStudents(state, year.id));
  };

  const generationCandidates = year
    ? year.students
        .map((ctx) => {
          const student = state.students.find((s) => s.id === ctx.studentId);
          if (!student || ctx.created || !student.active || !student.schedule) return null;

          return {
            name: student.name,
            weekday: student.schedule.weekday,
            time: student.schedule.time,
          };
        })
        .filter(
          (student): student is { name: string; weekday: number; time: string } =>
            student !== null,
        )
    : [];

  const generatedCount = year
    ? year.students.filter((ctx) => ctx.created).length
    : 0;

  const unavailableCount = year
    ? year.students.filter((ctx) => {
        if (ctx.created) return false;

        const student = state.students.find((s) => s.id === ctx.studentId);

        return !student || !student.active || !student.schedule;
      }).length
    : 0;

  const overview = year
    ? [
        { date: year.startDate, label: "Início do ano letivo", kind: "marco" },
        ...year.holidays.map((h) => ({
          date: h.startDate,
          label: `${h.name || "Férias"} · até ${formatShort(h.endDate)}`,
          kind: "Férias",
        })),
        ...year.events.map((e) => ({
          date: e.date,
          label: e.name,
          kind: "Evento",
        })),
        { date: year.endDate, label: "Fim do ano letivo", kind: "marco" },
      ].sort((a, b) => a.date.localeCompare(b.date))
    : [];

  return (
    <main className="page max-w-2xl">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h1 className="page-title">Calendário</h1>
        <div className="flex items-center gap-2">
          <select
            className="field h-9 w-auto"
            value={state.settings.activeSchoolYearId ?? ""}
            onChange={(e) =>
              update((s) => ({
                ...s,
                settings: { ...s.settings, activeSchoolYearId: e.target.value },
              }))
            }
            aria-label="Ano letivo ativo"
          >
            {state.schoolYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </select>
          <button className="btn-soft" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Ano letivo
          </button>
        </div>
      </header>

      {!year ? (
        <p className="text-sm text-muted-foreground">Crie um ano letivo para começar.</p>
      ) : (
        <div className="space-y-5">
          <div className="surface px-4 py-3 text-sm">
            <div className="eyebrow mb-1">Ano letivo {year.name}</div>
            <div className="flex items-center justify-between gap-3">
              <span>
                {formatLong(year.startDate)} — {formatLong(year.endDate)}
              </span>

              <button
                className="btn-primary shrink-0"
                onClick={() => setConfirmingGeneration(true)}
              >
                Gerar aulas
              </button>
            </div>
          </div>

          <section>
            <h2 className="eyebrow mb-1.5">Visão geral</h2>
            <ol className="surface divide-y">
              {overview.map((o, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="w-16 shrink-0 text-muted-foreground tabular-nums">{formatShort(o.date)}</span>
                  <span className="flex-1">{o.label}</span>
                  {o.kind !== "marco" && <span className="chip">{o.kind}</span>}
                </li>
              ))}
            </ol>
          </section>
          <section>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <h2 className="eyebrow">Férias</h2>

              <button className="btn-soft" onClick={() => setAddingHoliday(true)}>
                <Plus className="size-4" />
                Adicionar férias
              </button>
            </div>

            {year.holidays.length === 0 ? (
              <div className="surface px-4 py-3 text-sm text-muted-foreground">
                Ainda não foram definidas férias.
              </div>
            ) : (
              <ul className="surface divide-y">
                {[...year.holidays]
                  .sort((a, b) => a.startDate.localeCompare(b.startDate))
                  .map((holiday) => (
                    <li key={holiday.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                      <span className="flex-1">
                        <span className="block font-medium">{holiday.name || "Férias"}</span>
                        <span className="text-muted-foreground">
                          {formatShort(holiday.startDate)} —{" "}
                          {formatShort(holiday.endDate)}
                        </span>
                      </span>

                      <button
                        className="btn-ghost"
                        title="Eliminar férias"
                        aria-label={`Eliminar ${holiday.name || "férias"}`}
                        onClick={() =>
                          update((s) => ({
                            ...s,
                            schoolYears: s.schoolYears.map((y) =>
                              y.id !== year.id
                                ? y
                                : {
                                    ...y,
                                    holidays: y.holidays.filter((h) => h.id !== holiday.id),
                                  },
                            ),
                          }))
                        }
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </section>
          <section>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <h2 className="eyebrow">Feriados</h2>

              <button className="btn-soft" onClick={() => setAddingPublicHoliday(true)}>
                <Plus className="size-4" />
                Adicionar feriado
              </button>
            </div>

            {year.publicHolidays.length === 0 ? (
              <div className="surface px-4 py-3 text-sm text-muted-foreground">
                Ainda não foram definidos feriados.
              </div>
            ) : (
              <ul className="surface divide-y">
                {[...year.publicHolidays]
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((holiday) => (
                    <li key={holiday.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                      <span className="w-16 shrink-0 text-muted-foreground">
                        {formatShort(holiday.date)}
                      </span>

                      <span className="flex-1">{holiday.name}</span>

                      <button
                        className="btn-ghost"
                        title="Eliminar feriado"
                        aria-label={`Eliminar ${holiday.name}`}
                        onClick={() =>
                          update((s) => ({
                            ...s,
                            schoolYears: s.schoolYears.map((y) =>
                              y.id !== year.id
                                ? y
                                : {
                                    ...y,
                                    publicHolidays: y.publicHolidays.filter(
                                      (h) => h.id !== holiday.id,
                                    ),
                                  },
                            ),
                          }))
                        }
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {creating && <NewYearDialog onClose={() => setCreating(false)} />}
      {confirmingGeneration && year && (
        <Dialog open onOpenChange={(open) => !open && setConfirmingGeneration(false)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>
                Gerar aulas para {generationCandidates.length}{" "}
                {generationCandidates.length === 1 ? "aluno?" : "alunos?"}
              </DialogTitle>
            </DialogHeader>

            {generationCandidates.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Todos os alunos elegíveis já têm as aulas geradas ou não têm geração.
                </p>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setConfirmingGeneration(false)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="eyebrow mb-2">Aulas a gerar</div>

                  <ul className="space-y-1.5 text-sm">
                    {generationCandidates.map((student) => (
                      <li key={student.name}>
                        {student.name} —{" "}
                        {WEEKDAYS[student.weekday].replace("-feira", "")},{" "}
                        {student.time}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-sm text-muted-foreground">
                  Já gerado: {generatedCount} · Inativo ou sem horário: {unavailableCount}
                </p>

                <p className="text-sm text-muted-foreground">
                  As aulas serão criadas até ao fim do ano letivo, respeitando férias e feriados.
                </p>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setConfirmingGeneration(false)}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      generateLessons();
                      setConfirmingGeneration(false);
                    }}
                  >
                    Gerar aulas
                  </button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
      {addingHoliday && year && (
        <NewHolidayDialog yearId={year.id} onClose={() => setAddingHoliday(false)} />
      )}
      {addingPublicHoliday && year && (
        <NewPublicHolidayDialog yearId={year.id} onClose={() => setAddingPublicHoliday(false)} />
      )}
    </main>
  );
}

function NewYearDialog({ onClose }: { onClose: () => void }) {
  const { update } = useStore();
  const [name, setName] = useState("");
  const [startDate, setStart] = useState("");
  const [endDate, setEnd] = useState("");

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) return;
    const id = newId("year");
    // New year starts empty: annual plans are never copied, lessons are not generated.
    update((s) => ({
      ...s,
      schoolYears: [
        ...s.schoolYears,
        {
          id,
          name,
          startDate,
          endDate,
          holidays: [],
          publicHolidays: [],
          events: [],
          students: [],
        },
      ],
      settings: { ...s.settings, activeSchoolYearId: id },
    }));
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Novo ano letivo</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <input
            className="field"
            placeholder="ex.: 2027/28"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-xs text-muted-foreground">
              Início
              <input
                className="field"
                type="date"
                value={startDate}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Fim
              <input
                className="field"
                type="date"
                value={endDate}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn-primary">Criar</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function NewHolidayDialog({ yearId, onClose }: { yearId: string; onClose: () => void }) {
  const { update } = useStore();

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const save = (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate || startDate > endDate) return;

    const holiday = {
      id: newId("holiday"),
      name: name.trim(),
      startDate,
      endDate,
    };

    update((s) => ({
      ...s,
      schoolYears: s.schoolYears.map((y) =>
        y.id !== yearId
          ? y
          : {
              ...y,
              holidays: [...y.holidays, holiday],
            },
      ),
    }));

    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Adicionar férias</DialogTitle>
        </DialogHeader>

        <form onSubmit={save} className="space-y-3">
          <input
            className="field"
            placeholder="ex.: Férias de Natal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-xs text-muted-foreground">
              Início
              <input
                className="field"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </label>

            <label className="space-y-1 text-xs text-muted-foreground">
              Fim
              <input
                className="field"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </label>
          </div>

          {startDate && endDate && startDate > endDate && (
            <p className="text-sm text-destructive">
              A data de fim deve ser posterior à data de início.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>

            <button
              className="btn-primary"
              disabled={!startDate || !endDate || startDate > endDate}
            >
              Adicionar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function NewPublicHolidayDialog({ yearId, onClose }: { yearId: string; onClose: () => void }) {
  const { update } = useStore();

  const [name, setName] = useState("");
  const [date, setDate] = useState("");

  const save = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !date) return;

    const holiday = {
      id: newId("public-holiday"),
      name: name.trim(),
      date,
    };

    update((s) => ({
      ...s,
      schoolYears: s.schoolYears.map((y) =>
        y.id !== yearId
          ? y
          : {
              ...y,
              publicHolidays: [...y.publicHolidays, holiday],
            },
      ),
    }));

    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Adicionar feriado</DialogTitle>
        </DialogHeader>

        <form onSubmit={save} className="space-y-3">
          <input
            className="field"
            placeholder="ex.: Dia de Portugal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <label className="block space-y-1 text-xs text-muted-foreground">
            Data
            <input
              className="field"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>

            <button className="btn-primary" disabled={!name.trim() || !date}>
              Adicionar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
