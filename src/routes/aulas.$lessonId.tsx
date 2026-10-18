import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { AnnualPlanList } from "@/components/AnnualPlan";
import { LessonTextEditor } from "@/components/LessonTextEditor";
import { WEEKDAYS, formatLong, weekdayOf } from "@/lib/dates";
import type { Lesson } from "@/lib/model";
import { findLesson, getStudent } from "@/lib/selectors";
import { mapLesson, useStore } from "@/lib/store";

export const Route = createFileRoute("/aulas/$lessonId")({
  head: () => ({
    meta: [
      { title: "Aula — Aulas de Guitarra" },
      {
        name: "description",
        content: "Planeamento, objetivos e sumário da aula.",
      },
      {
        property: "og:title",
        content: "Aula — Aulas de Guitarra",
      },
      {
        property: "og:description",
        content: "Planeamento, objetivos e sumário da aula.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = Route.useParams();
  const { state, update } = useStore();

  const ref = findLesson(state, lessonId);

  if (!ref) throw notFound();

  const { lesson, ctx } = ref;
  const student = getStudent(state, ctx.studentId);

  const set = (fn: (l: Lesson) => Lesson) =>
    update((s) => mapLesson(s, lessonId, fn));

  const changeDate = (date: string) =>
    date &&
    set((l) => ({
      ...l,
      date,
      type: l.type === "normal" ? "transferred" : l.type,
    }));

  return (
    <main className="page max-w-2xl">
      <Link
        to="/alunos/$studentId"
        params={{ studentId: ctx.studentId }}
        className="btn-ghost -ml-2 mb-2"
      >
        <ChevronLeft className="size-4" />
        {student?.name ?? "Aluno"}
      </Link>

      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="page-title">{student?.name}</h1>

          <div className="text-sm text-muted-foreground">
            <span className="capitalize">
              {WEEKDAYS[weekdayOf(lesson.date)]}
            </span>
            , {formatLong(lesson.date)} · {lesson.time} ·{" "}
            {lesson.duration} min
          </div>

          {lesson.type !== "normal" && (
            <span className="chip chip-moved mt-1.5">
              {lesson.type === "extra" ? "Aula extra" : "Transferida"}
            </span>
          )}
        </div>

        <label
          className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium ${
            lesson.status === "absence"
              ? "border-absence/40 bg-absence-soft text-absence"
              : ""
          }`}
        >
          <input
            type="checkbox"
            className="size-4 accent-destructive"
            checked={lesson.status === "absence"}
            onChange={(e) =>
              set((l) => ({
                ...l,
                status: e.target.checked
                  ? "absence"
                  : "completed",
              }))
            }
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

          <div className="space-y-3 px-4 pb-4">
            <LessonTextEditor
              value={lesson.objectives}
              onChange={(objectives) =>
                set((l) => ({
                  ...l,
                  objectives,
                }))
              }
              library={state.library}
              selectedLibraryItemIds={
                lesson.objectiveLibraryItemIds
              }
              onLibraryItemsChange={(objectiveLibraryItemIds) =>
                set((l) => ({
                  ...l,
                  objectiveLibraryItemIds,
                }))
              }
              placeholder="O que pretendo trabalhar…"
              minHeight="5rem"
            />

            <button
              type="button"
              className="btn-secondary"
              disabled={!lesson.objectives.trim()}
              onClick={() =>
                set((l) => ({
                  ...l,
                  summary: l.summary.trim()
                    ? `${l.summary.trim()}\n\n${l.objectives.trim()}`
                    : l.objectives.trim(),
                  summaryLibraryItemIds: [
                    ...new Set([
                      ...l.summaryLibraryItemIds,
                      ...l.objectiveLibraryItemIds,
                    ]),
                  ],
                }))
              }
            >
              Replicar no sumário
            </button>
          </div>
        </details>

        <section className="pt-3">
          <h2 className="eyebrow mb-2">Sumário</h2>

          <LessonTextEditor
            value={lesson.summary}
            onChange={(summary) =>
              set((l) => ({
                ...l,
                summary,
              }))
            }
            library={state.library}
            selectedLibraryItemIds={
              lesson.summaryLibraryItemIds
            }
            onLibraryItemsChange={(summaryLibraryItemIds) =>
              set((l) => ({
                ...l,
                summaryLibraryItemIds,
              }))
            }
            placeholder="O que aconteceu na aula…"
            minHeight="12rem"
          />
        </section>
      </div>
    </main>
  );
}
