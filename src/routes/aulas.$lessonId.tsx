import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, X } from "lucide-react";
import { AnnualPlanList } from "@/components/AnnualPlan";
import { LibrarySearch } from "@/components/LibrarySearch";
import { WEEKDAYS, formatLong, weekdayOf } from "@/lib/dates";
import type { Lesson, Segment } from "@/lib/model";
import { findLesson, getStudent, segmentsText } from "@/lib/selectors";
import { mapLesson, useStore } from "@/lib/store";

export const Route = createFileRoute("/aulas/$lessonId")({
  head: () => ({
    meta: [
      { title: "Aula — Aulas de Guitarra" },
      { name: "description", content: "Planeamento, objetivos e sumário da aula." },
      { property: "og:title", content: "Aula — Aulas de Guitarra" },
      { property: "og:description", content: "Planeamento, objetivos e sumário da aula." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LessonPage,
});

const refs = (segs: Segment[]) =>
  segs.filter((s): s is Extract<Segment, { type: "libraryItem" }> => s.type === "libraryItem").map((s) => s.libraryItemId);

/** Replace the text part of segments, keep library references. */
const withText = (segs: Segment[], text: string): Segment[] => [
  ...(text ? [{ type: "text" as const, content: text }] : []),
  ...segs.filter((s) => s.type === "libraryItem"),
];

function LessonPage() {
  const { lessonId } = Route.useParams();
  const { state, update } = useStore();
  const ref = findLesson(state, lessonId);
  if (!ref) throw notFound();
  const { lesson, ctx } = ref;
  const student = getStudent(state, ctx.studentId);
  const set = (fn: (l: Lesson) => Lesson) => update((s) => mapLesson(s, lessonId, fn));

  const changeDate = (date: string) =>
    date && set((l) => ({ ...l, date, type: l.type === "normal" ? "transferred" : l.type }));

  return (
    <main className="page max-w-2xl">
      <Link to="/alunos/$studentId" params={{ studentId: ctx.studentId }} className="btn-ghost -ml-2 mb-2">
        <ChevronLeft className="size-4" /> {student?.name ?? "Aluno"}
      </Link>

      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="page-title">{student?.name}</h1>
          <div className="text-sm text-muted-foreground">
            <span className="capitalize">{WEEKDAYS[weekdayOf(lesson.date)]}</span>, {formatLong(lesson.date)} · {lesson.time} · {lesson.duration} min
          </div>
          {lesson.type !== "normal" && (
            <span className="chip chip-moved mt-1.5">{lesson.type === "extra" ? "Aula extra" : "Transferida"}</span>
          )}
        </div>
        <label
          className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium ${lesson.status === "absence" ? "border-absence/40 bg-absence-soft text-absence" : ""}`}
        >
          <input
            type="checkbox"
            className="size-4 accent-destructive"
            checked={lesson.status === "absence"}
            onChange={(e) => set((l) => ({ ...l, status: e.target.checked ? "absence" : "completed" }))}
          />
          Falta
        </label>
      </header>

      <div className="space-y-3">
        <details className="disclosure">
          <summary>Planeamento</summary>
          <div className="px-4 pb-4">
            <AnnualPlanList state={state} ctx={ctx} />
          </div>
        </details>

        <details className="disclosure">
          <summary>Objetivos</summary>
          <div className="space-y-2 px-4 pb-4">
            <textarea
              className="field-area min-h-20"
              placeholder="O que pretendo trabalhar…"
              value={segmentsText(lesson.objectives)}
              onChange={(e) => set((l) => ({ ...l, objectives: withText(l.objectives, e.target.value) }))}
            />
          </div>
        </details>

        <details className="disclosure">
          <summary>Data e hora</summary>
          <div className="flex flex-wrap gap-2 px-4 pb-4">
            <input type="date" className="field w-auto" value={lesson.date} onChange={(e) => changeDate(e.target.value)} />
            <input type="time" className="field w-auto" value={lesson.time} onChange={(e) => set((l) => ({ ...l, time: e.target.value }))} />
            {lesson.type === "normal" && (
              <p className="w-full text-xs text-muted-foreground">Alterar a data marca a aula como transferida.</p>
            )}
          </div>
        </details>

        <section className="pt-3">
          <h2 className="eyebrow mb-2">Sumário</h2>
          <textarea
            className="field-area min-h-48"
            placeholder="O que aconteceu na aula…"
            value={segmentsText(lesson.summary)}
            onChange={(e) => set((l) => ({ ...l, summary: withText(l.summary, e.target.value) }))}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {refs(lesson.summary).map((id) => {
              const item = state.library.find((i) => i.id === id);
              return (
                <span key={id} className="chip bg-accent text-accent-foreground">
                  {item?.name ?? "Elemento removido"}
                  <button
                    aria-label="Remover"
                    onClick={() =>
                      set((l) => ({ ...l, summary: l.summary.filter((s) => !(s.type === "libraryItem" && s.libraryItemId === id)) }))
                    }
                  >
                    <X className="size-3" />
                  </button>
                </span>
              );
            })}
          </div>
          <div className="mt-2">
            <LibrarySearch
              placeholder="Adicionar elemento da biblioteca ao sumário…"
              excludeIds={refs(lesson.summary)}
              onSelect={(item) => set((l) => ({ ...l, summary: [...l.summary, { type: "libraryItem", libraryItemId: item.id }] }))}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
