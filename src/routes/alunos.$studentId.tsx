import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Pencil, Plus } from "lucide-react";
import { AnnualPlanList } from "@/components/AnnualPlan";
import { LessonCard } from "@/components/LessonCard";
import { LibrarySearch } from "@/components/LibrarySearch";
import { StudentForm } from "@/components/StudentForm";
import { WEEKDAYS, WEEKDAYS_SHORT, ageFrom, formatShort, todayISO, weekdayOf } from "@/lib/dates";
import { newId } from "@/lib/model";
import { activeYear, getStudent, lessonStats, sortLessons, yearContext } from "@/lib/selectors";
import { mapCtx, useStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/alunos/$studentId")({
  head: () => ({
    meta: [
      { title: "Aluno — Aulas de Guitarra" },
      { name: "description", content: "Plano anual e aulas do aluno." },
      { property: "og:title", content: "Aluno — Aulas de Guitarra" },
      { property: "og:description", content: "Plano anual e aulas do aluno." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentPage,
});

function StudentPage() {
  const { studentId } = Route.useParams();
  const { state, update } = useStore();
  const [editing, setEditing] = useState(false);
  const [showExtraDialog, setShowExtraDialog] = useState(false);
  const [extraDate, setExtraDate] = useState("");
  const [extraTime, setExtraTime] = useState("16:00");
  const [extraDuration, setExtraDuration] = useState(45);
  const student = getStudent(state, studentId);
  if (!student) throw notFound();
  const year = activeYear(state);
  const ctx = yearContext(year, studentId);
  const stats = lessonStats(ctx);
  const age = ageFrom(student.birthDate);
  const lessons = sortLessons((ctx?.lessons ?? []).filter((lesson) => !lesson.blocked));

  const enrolledEvents = (year?.events ?? []).filter((event) =>
    event.program.some((entry) => entry.studentId === studentId),
  );

  const normalLessons = lessons.filter(
  (lesson) => lesson.type === "normal",
);

const nextLessonId = normalLessons
  .filter((lesson) => {
    if (lesson.date > todayISO()) return true;
    if (lesson.date < todayISO()) return false;
    return lesson.time >= new Date().toTimeString().slice(0, 5);
  })
  .sort((a, b) => {
    const dateTimeA = `${a.date}T${a.time}`;
    const dateTimeB = `${b.date}T${b.time}`;
    return dateTimeA.localeCompare(dateTimeB);
  })[0]?.id;

  const timeline = [
    ...lessons.map((lesson) => ({
      type: "lesson" as const,
      date: lesson.date,
      time: lesson.time,
      lesson,
      timeStatus:
        lesson.date < todayISO()
          ? ("past" as const)
          : lesson.id === nextLessonId
            ? ("next" as const)
            : ("future" as const),
    })),
    ...enrolledEvents.map((event) => ({
      type: "event" as const,
      date: event.date,
      time: "",
      event,
    })),
  ].sort((a, b) => {
    const dateComparison = a.date.localeCompare(b.date);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    // No mesmo dia, as aulas aparecem antes dos eventos.
    if (a.type !== b.type) {
      return a.type === "lesson" ? -1 : 1;
    }

    return a.time.localeCompare(b.time);
  });

  const today = todayISO();

  const ensureCtx = () => {
    if (!year || ctx) return;

    update((s) => ({
      ...s,
      schoolYears: s.schoolYears.map((y) =>
        y.id === year.id
          ? {
              ...y,
              students: [
                ...y.students,
                {
                  studentId,
                  grade: "",
                  schedules: student.schedules.map((schedule) => ({ ...schedule })),
                  created: false,
                  annualPlan: [],
                  lessons: [],
                },
              ],
            }
          : y,
      ),
    }));
  };

  const addExtra = () => {
    if (!year || !extraDate || !extraTime) return;

    ensureCtx();

    update((s) =>
      mapCtx(s, year.id, studentId, (c) => ({
        ...c,
        lessons: [
          ...c.lessons,
          {
            id: newId("lesson"),
            updatedAt: new Date().toISOString(),
            date: extraDate,
            time: extraTime,
            duration: extraDuration,
            type: "extra",
            status: "completed",
            blocked: false,
            objectives: "",
            summary: "",
            objectiveLibraryItemIds: [],
            summaryLibraryItemIds: [],
          },
        ],
      })),
    );

    setExtraDate("");
  };

  const copyAnnualPlan = async () => {
    if (!ctx) return;

    const text = ctx.annualPlan
      .map((entry) => state.library.find((item) => item.id === entry.libraryItemId)?.name)
      .filter((name): name is string => !!name)
      .map((name) => `${name}.`)
      .join("\n");

    if (!text) return;

    await navigator.clipboard.writeText(text);
  };

  return (
    <main className="page">
      <Link to="/alunos" className="btn-ghost -ml-2 mb-2">
        <ChevronLeft className="size-4" /> Alunos
      </Link>

      <header className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="page-title">{student.name}</h1>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {[age != null && `${age} anos`, ctx?.grade && `${ctx.grade} grau`, !student.active && "Inativo"]
                .filter(Boolean)
                .join(" · ")}
            </div>
            <div className="text-sm text-muted-foreground">
              {student.schedules.length > 0 ? (
                student.schedules.map((schedule, index) => (
                  <div key={`${schedule.weekday}-${schedule.time}-${index}`}>
                    {WEEKDAYS[schedule.weekday]}, {schedule.time} · {schedule.duration} min
                  </div>
                ))
              ) : (
                "Sem horário"
              )}
            </div>
          </div>
          <button className="btn-ghost" onClick={() => setEditing(true)}>
            <Pencil className="size-4" /> Editar
          </button>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Previstas" value={stats.expected} />
          <Stat label="Realizadas" value={stats.performed} />
          <Stat label="Faltas" value={stats.absences} />
        </dl>
      </header>

      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <details className="disclosure">
          <summary>Eventos</summary>
          <ul className="max-h-80 space-y-3 overflow-y-auto px-4 pb-3">
            {(year?.events ?? []).map((e) => {
              const programEntries = e.program.filter(
                (entry) => entry.studentId === studentId,
              );

              const until = lessons.filter(
                (l) =>
                  l.type !== "extra" &&
                  l.date >= today &&
                  l.date < e.date,
              ).length;

              return (
                <li key={e.id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{e.name}</span>

                    <span className="text-xs text-muted-foreground">
                      {formatShort(e.date)}
                    </span>
                  </div>

                  {programEntries.length > 0 ? (
                    <div className="mt-2 space-y-1 border-l-2 border-border pl-3">
                      {programEntries.map((entry) => {
                        const item = state.library.find(
                          (libraryItem) =>
                            libraryItem.id === entry.libraryItemId,
                        );

                        return (
                          <div
                            key={entry.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="flex-1">
                              {item?.name ?? "Elemento removido"}
                            </span>

                            <button
                              type="button"
                              className="text-xs text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                year &&
                                update((s) => ({
                                  ...s,
                                  schoolYears: s.schoolYears.map((y) =>
                                    y.id !== year.id
                                      ? y
                                      : {
                                          ...y,
                                          events: y.events.map((event) =>
                                            event.id !== e.id
                                              ? event
                                              : {
                                                  ...event,
                                                  program: event.program.filter(
                                                    (programEntry) =>
                                                      programEntry.id !== entry.id,
                                                  ),
                                                },
                                          ),
                                        },
                                  ),
                                }))
                              }
                              aria-label={`Remover ${item?.name ?? "elemento"}`}
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Ainda sem elementos no programa.
                    </div>
                  )}

                  {ctx?.annualPlan.length ? (
                    <details className="mt-3 border-t-2 border-border pt-3">
                      <summary className="cursor-pointer rounded-md bg-secondary/60 px-2 py-2 text-xs font-medium text-accent-foreground">
                        ＋ Adicionar elemento
                      </summary>

                      <div className="mt-2 space-y-1 rounded-md bg-muted p-2">
                        {ctx.annualPlan.map((planEntry) => {
                          const item = state.library.find(
                            (libraryItem) =>
                              libraryItem.id === planEntry.libraryItemId,
                          );

                          if (!item) return null;

                          return (
                            <button
                              key={item.id}
                              type="button"
                              className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary"
                              onClick={() =>
                                year &&
                                update((s) => ({
                                  ...s,
                                  schoolYears: s.schoolYears.map((y) =>
                                    y.id !== year.id
                                      ? y
                                      : {
                                          ...y,
                                          events: y.events.map((event) =>
                                            event.id !== e.id
                                              ? event
                                              : {
                                                  ...event,
                                                  program: [
                                                    ...event.program,
                                                    {
                                                      id: newId("program"),
                                                      studentId,
                                                      libraryItemId: item.id,
                                                    },
                                                  ],
                                                },
                                          ),
                                        },
                                  ),
                                }))
                              }
                            >
                              {item.name}
                            </button>
                          );
                        })}
                      </div>
                    </details>
                  ) : (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Adicione primeiro elementos ao plano anual deste aluno.
                    </div>
                  )}

                  <div className="mt-1 text-xs text-muted-foreground">
                    {until} {until === 1 ? "aula" : "aulas"} até ao evento
                  </div>
                </li>
              );
            })}

            {!year?.events.length && (
              <li className="text-sm text-muted-foreground">
                Sem eventos neste ano letivo.
              </li>
            )}
          </ul>
        </details>

        <details className="disclosure">
          <summary className="flex items-center justify-between gap-2">
            <span>
              Plano anual{" "}
              {year && <span className="ml-1 font-normal text-muted-foreground">{year.name}</span>}
            </span>

            {ctx?.annualPlan.length ? (
              <button
                type="button"
                className="btn-ghost"
                onClick={(e) => {
                  e.preventDefault();
                  copyAnnualPlan();
                }}
              >
                Copiar planeamento
              </button>
            ) : null}
          </summary>

          <div className="space-y-3 px-4 pb-4">
            {ctx && (
              <AnnualPlanList
                state={state}
                ctx={ctx}
                onRemove={(id) =>
                  year &&
                  update((s) =>
                    mapCtx(s, year.id, studentId, (c) => ({
                      ...c,
                      annualPlan: c.annualPlan.filter(
                        (p) => p.libraryItemId !== id,
                      ),
                      annualPlanUpdatedAt: new Date().toISOString(),
                    })),
                  )
                }
              />
            )}
            {ctx && year && (
              <LibrarySearch
                placeholder="Adicionar ao plano…"
                excludeIds={ctx.annualPlan.map((p) => p.libraryItemId)}
                onSelect={(item) =>
                  update((s) =>
                    mapCtx(s, year.id, studentId, (c) => ({
                      ...c,
                      annualPlan: [
                        ...c.annualPlan,
                        { libraryItemId: item.id },
                      ],
                      annualPlanUpdatedAt: new Date().toISOString(),
                    })),
                  )
                }
              />
            )}
          </div>
        </details>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="eyebrow">Aulas</h2>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {timeline.map((item) =>
          item.type === "lesson" ? (
            <LessonCard
              key={item.lesson.id}
              lesson={item.lesson}
              student={student}
              showStudent={false}
              timeStatus={item.timeStatus}
            />
          ) : (
            <div
              key={item.event.id}
              className="rounded-xl border-2 border-primary bg-primary/10 p-4"
            >
              <div className="text-sm text-muted-foreground">
                {WEEKDAYS_SHORT[weekdayOf(item.event.date)]}, {formatShort(item.event.date)}
              </div>

              <div className="mt-1 font-semibold">
                {item.event.name}
              </div>

              <div className="mt-2 space-y-0.5">
                {item.event.program
                  .filter((entry) => entry.studentId === studentId)
                  .map((entry) => {
                    const libraryItem = state.library.find(
                      (libraryItem) =>
                        libraryItem.id === entry.libraryItemId,
                    );

                    return (
                      <div
                        key={entry.id}
                        className="text-sm italic"
                      >
                        {libraryItem?.name ?? "Elemento removido"}
                      </div>
                    );
                  })}
              </div>
            </div>
          ),
        )}
      </div>

            
      {!timeline.length && (
        <p className="text-sm text-muted-foreground">
          Ainda sem aulas ou eventos neste ano letivo.
        </p>
      )}

      {year && (
        <div className="mt-4">
          <button
            type="button"
            className="btn-soft"
            onClick={() => {
              setExtraDate("");
              setExtraTime("16:00");
              setExtraDuration(45);
              setShowExtraDialog(true);
            }}
          >
            <Plus className="size-4" />
            Adicionar aula extra
          </button>

          <Dialog
            open={showExtraDialog}
            onOpenChange={setShowExtraDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar aula extra</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="extra-date">
                    Data
                  </label>
                  <input
                    id="extra-date"
                    type="date"
                    className="field w-full"
                    value={extraDate}
                    min={year.startDate}
                    max={year.endDate}
                    onChange={(e) => setExtraDate(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium" htmlFor="extra-time">
                      Hora de início
                    </label>
                    <input
                      id="extra-time"
                      type="time"
                      className="field w-full"
                      value={extraTime}
                      onChange={(e) => setExtraTime(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      className="text-sm font-medium"
                      htmlFor="extra-duration"
                    >
                      Duração
                    </label>
                    <select
                      id="extra-duration"
                      className="field w-full"
                      value={extraDuration}
                      onChange={(e) => setExtraDuration(Number(e.target.value))}
                    >
                      <option value={30}>30 minutos</option>
                      <option value={45}>45 minutos</option>
                      <option value={50}>50 minutos</option>
                      <option value={60}>60 minutos</option>
                    </select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowExtraDialog(false)}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  disabled={!extraDate || !extraTime}
                  onClick={() => {
                    addExtra();
                    setShowExtraDialog(false);
                  }}
                >
                  Adicionar aula
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}


      {editing && (
        <StudentForm open onOpenChange={setEditing} student={student} />
      )}

    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface py-2">
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
      <dt className="text-xs text-muted-foreground">{label}</dt>
    </div>
  );
}
