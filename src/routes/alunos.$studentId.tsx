import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Pencil } from "lucide-react";
import { AnnualPlanList } from "@/components/AnnualPlan";
import { LessonCard } from "@/components/LessonCard";
import { LibrarySearch } from "@/components/LibrarySearch";
import { StudentForm } from "@/components/StudentForm";
import { WEEKDAYS, ageFrom, formatShort, todayISO } from "@/lib/dates";
import { newId } from "@/lib/model";
import { activeYear, getStudent, lessonStats, sortLessons, yearContext } from "@/lib/selectors";
import { mapCtx, useStore } from "@/lib/store";

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
  const [extraDate, setExtraDate] = useState("");
  const student = getStudent(state, studentId);
  if (!student) throw notFound();
  const year = activeYear(state);
  const ctx = yearContext(year, studentId);
  const stats = lessonStats(ctx);
  const age = ageFrom(student.birthDate);
  const lessons = sortLessons(ctx?.lessons ?? []);
  const today = todayISO();

  const ensureCtx = () => {
    if (!year || ctx) return;
    update((s) => ({
      ...s,
      schoolYears: s.schoolYears.map((y) =>
        y.id === year.id
          ? { ...y, students: [...y.students, { studentId, grade: "", schedule: student.schedule, created: false, annualPlan: [], enrolledEventIds: [], lessons: [] }] }
          : y,
      ),
    }));
  };

  const addExtra = () => {
    if (!year || !extraDate) return;
    ensureCtx();
    update((s) =>
      mapCtx(s, year.id, studentId, (c) => ({
        ...c,
        lessons: [
          ...c.lessons,
          {
            id: newId("lesson"),
            date: extraDate,
            time: student.schedule?.time ?? "16:00",
            duration: student.schedule?.duration ?? 45,
            type: "extra",
            status: "completed",
            objectives: [],
            summary: [],
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
              {student.schedule
                ? `${WEEKDAYS[student.schedule.weekday]}, ${student.schedule.time} · ${student.schedule.duration} min`
                : "Sem horário"}
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
          <ul className="space-y-1 px-4 pb-3">
            {(year?.events ?? []).map((e) => {
              const enrolled = ctx?.enrolledEventIds.includes(e.id) ?? false;
              const until = lessons.filter((l) => l.type !== "extra" && l.date >= today && l.date < e.date).length;
              return (
                <li key={e.id}>
                  <label className="flex items-center gap-2 py-1 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={enrolled}
                      disabled={!ctx}
                      onChange={() =>
                        year &&
                        update((s) =>
                          mapCtx(s, year.id, studentId, (c) => ({
                            ...c,
                            enrolledEventIds: enrolled ? c.enrolledEventIds.filter((x) => x !== e.id) : [...c.enrolledEventIds, e.id],
                          })),
                        )
                      }
                    />
                    <span className="flex-1">{e.name}</span>
                    <span className="text-xs text-muted-foreground">{formatShort(e.date)}</span>
                  </label>
                  {enrolled && <div className="pl-6 text-xs text-muted-foreground">{until} aulas até ao evento</div>}
                </li>
              );
            })}
            {!year?.events.length && <li className="text-sm text-muted-foreground">Sem eventos neste ano letivo.</li>}
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
            <AnnualPlanList
              state={state}
              ctx={ctx}
              onRemove={(id) =>
                year && update((s) => mapCtx(s, year.id, studentId, (c) => ({ ...c, annualPlan: c.annualPlan.filter((p) => p.libraryItemId !== id) })))
              }
            />
            {ctx && year && (
              <LibrarySearch
                placeholder="Adicionar ao plano…"
                excludeIds={ctx.annualPlan.map((p) => p.libraryItemId)}
                onSelect={(item) =>
                  update((s) => mapCtx(s, year.id, studentId, (c) => ({ ...c, annualPlan: [...c.annualPlan, { libraryItemId: item.id }] })))
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
        {lessons.map((l) => (
          <LessonCard key={l.id} lesson={l} student={student} showStudent={false} />
        ))}
      </div>
      {!lessons.length && <p className="text-sm text-muted-foreground">Ainda sem aulas neste ano letivo.</p>}

      {year && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">＋ Adicionar aula…</span>
          <input type="date" className="field h-9 w-auto" value={extraDate} min={year.startDate} max={year.endDate} onChange={(e) => setExtraDate(e.target.value)} />
          <button className="btn-soft" disabled={!extraDate} onClick={addExtra}>
            Adicionar
          </button>
        </div>
      )}

      {editing && <StudentForm open onOpenChange={setEditing} student={student} />}
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
