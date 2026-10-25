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
  const [addingEvent, setAddingEvent] = useState(false);
  const [viewingEventId, setViewingEventId] = useState<string | null>(null);

  const generateLessons = () => {
    if (!year) return;

    update((state) => generateLessonsForAllStudents(state, year.id));
  };

  
  const generationCandidates = year
    ? year.students.flatMap((ctx) => {
        const student = state.students.find((s) => s.id === ctx.studentId);

        if (
          !student ||
          ctx.created ||
          !student.active ||
          student.schedules.length === 0
        ) {
          return [];
        }

        return [
          {
            name: student.name,
            schedules: student.schedules,
          },
        ];
      })
    : [];


  const generatedCount = year
    ? year.students.filter((ctx) => ctx.created).length
    : 0;

  const unavailableCount = year
    ? year.students.filter((ctx) => {
        if (ctx.created) return false;

        const student = state.students.find((s) => s.id === ctx.studentId);

        return !student || !student.active || student.schedules.length === 0;
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
          <section>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <h2 className="eyebrow">Eventos</h2>

              <button
                className="btn-soft"
                onClick={() => setAddingEvent(true)}
              >
                <Plus className="size-4" />
                Adicionar evento
              </button>
            </div>

            {year.events.length === 0 ? (
              <div className="surface px-4 py-3 text-sm text-muted-foreground">
                Ainda não foram definidos eventos.
              </div>
              ) : (
              <ul className="surface divide-y">
                {[...year.events]
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((event) => (
                    <li
                      key={event.id}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm"
                    >
                      <span className="w-16 shrink-0 text-muted-foreground">
                        {formatShort(event.date)}
                      </span>

                      <button
                        type="button"
                        className="flex-1 text-left font-medium hover:text-accent-foreground hover:underline"
                        onClick={() => setViewingEventId(event.id)}
                      >
                        {event.name}
                      </button>

                      <button
                        className="btn-ghost"
                        title="Eliminar evento"
                        aria-label={`Eliminar ${event.name}`}
                        onClick={() =>
                          update((s) => ({
                            ...s,
                            schoolYears: s.schoolYears.map((y) =>
                              y.id !== year.id
                                ? y
                                : {
                                    ...y,
                                    events: y.events.filter(
                                      (e) => e.id !== event.id,
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
          <DialogContent className="flex max-h-[85dvh] max-w-sm flex-col">
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
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="eyebrow mb-2 shrink-0">Aulas a gerar</div>

                                    
                  <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto text-sm">
                    {generationCandidates.map((student) => (
                      <li key={student.name}>
                        <span className="font-medium">{student.name}</span>
                        <ul className="ml-3 text-muted-foreground">
                          {student.schedules.map((schedule, index) => (
                            <li key={`${student.name}-${schedule.weekday}-${schedule.time}-${index}`}>
                              {WEEKDAYS[schedule.weekday]?.replace("-feira", "") ?? "Dia desconhecido"},{" "}
                              {schedule.time} · {schedule.duration} min
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>

                </div>

                <p className="shrink-0 text-sm text-muted-foreground">
                  Já gerado: {generatedCount} · Inativo ou sem horário: {unavailableCount}
                </p>

                <p className="shrink-0 text-sm text-muted-foreground">
                  As aulas serão criadas até ao fim do ano letivo, respeitando férias e feriados.
                </p>

                <div className="flex shrink-0 justify-end gap-2">
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
      {addingEvent && year && (
        <NewEventDialog yearId={year.id} onClose={() => setAddingEvent(false)} />
      )}
      {viewingEventId && year && (
        <EventProgramDialog
          eventId={viewingEventId}
          year={year}
          onClose={() => setViewingEventId(null)}
          state={state}
        />
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

function NewEventDialog({ yearId, onClose }: { yearId: string; onClose: () => void }) {
  const { update } = useStore();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");

  const save = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !date) return;

    const event = {
      id: newId("event"),
      name: name.trim(),
      date,
      program: [],
    };

    update((s) => ({
      ...s,
      schoolYears: s.schoolYears.map((y) =>
        y.id !== yearId
          ? y
          : {
              ...y,
              events: [...y.events, event],
            },
      ),
    }));

    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Adicionar evento</DialogTitle>
        </DialogHeader>

        <form onSubmit={save} className="space-y-3">
          <input
            className="field"
            placeholder="ex.: Audição de Natal"
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
              min={yearId ? undefined : undefined}
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

function EventProgramDialog({
  eventId,
  year,
  state,
  onClose,
}: {
  eventId: string;
  year: NonNullable<ReturnType<typeof activeYear>>;
  state: ReturnType<typeof useStore>["state"];
  onClose: () => void;
}) {

  const { update } = useStore();

  const event = year.events.find((item) => item.id === eventId);

  if (!event) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85dvh] max-w-lg flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle>{event.name}</DialogTitle>

            <button
              type="button"
              className="btn-soft shrink-0"
              onClick={async () => {
                const programText = [
                  event.name,
                  formatLong(event.date),
                  "",
                  ...event.program.map((entry, index) => {
                    const student = state.students.find(
                      (item) => item.id === entry.studentId,
                    );

                    const libraryItem = state.library.find(
                      (item) => item.id === entry.libraryItemId,
                    );

                    return `${student?.name ?? "Aluno removido"} — ${
                      libraryItem?.name ?? "Elemento removido"
                    }`;
                  }),
                ].join("\n");

                try {
                  await navigator.clipboard.writeText(programText);
                  window.alert("Programa copiado!");
                } catch {
                  window.alert(
                    "Não foi possível copiar o programa. Verifica as permissões do navegador.",
                  );
                }
              }}
            >
              Copiar programa
            </button>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          <div className="text-sm text-muted-foreground">
            {formatLong(event.date)}
          </div>

          {event.program.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há elementos no programa.
            </p>
          ) : (
            <ol className="surface divide-y">
              {event.program.map((entry, index) => {
                const student = state.students.find(
                  (item) => item.id === entry.studentId,
                );

                const libraryItem = state.library.find(
                  (item) => item.id === entry.libraryItemId,
                );

                return (
                  <li
                    key={entry.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", entry.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();

                      const draggedId = e.dataTransfer.getData("text/plain");
                      if (!draggedId || draggedId === entry.id) return;

                      const fromIndex = event.program.findIndex(
                        (item) => item.id === draggedId,
                      );

                      const toIndex = event.program.findIndex(
                        (item) => item.id === entry.id,
                      );

                      if (fromIndex === -1 || toIndex === -1) return;

                      update((s) => ({
                        ...s,
                        schoolYears: s.schoolYears.map((y) =>
                          y.id !== year.id
                            ? y
                            : {
                                ...y,
                                events: y.events.map((currentEvent) => {
                                  if (currentEvent.id !== event.id) {
                                    return currentEvent;
                                  }

                                  const program = [...currentEvent.program];
                                  const [moved] = program.splice(fromIndex, 1);
                                  if (!moved) return currentEvent;
                                  program.splice(toIndex, 0, moved);

                                  return {
                                    ...currentEvent,
                                    program,
                                  };
                                }),
                              },
                        ),
                      }));
                    }}
                    className="cursor-grab px-3 py-2.5 text-sm active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">
                        {index + 1}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">
                          {student?.name ?? "Aluno removido"}
                        </span>

                        <span className="block text-muted-foreground">
                          {libraryItem?.name ?? "Elemento removido"}
                        </span>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
