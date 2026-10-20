import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LessonCard } from "@/components/LessonCard";
import { WEEKDAYS, addDays, formatLong, todayISO, weekdayOf } from "@/lib/dates";
import { activeYear, lessonsOnDate } from "@/lib/selectors";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): { d?: string } =>
    typeof s["d"] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s["d"]) ? { d: s["d"] } : {},
  head: () => ({
    meta: [
      { title: "Hoje — Aulas de Guitarra" },
      { name: "description", content: "As aulas de guitarra do dia, por ordem." },
      { property: "og:title", content: "Hoje — Aulas de Guitarra" },
      { property: "og:description", content: "As aulas de guitarra do dia, por ordem." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Hoje,
});

function Hoje() {
  const { state } = useStore();
  const { d } = Route.useSearch();
  const navigate = Route.useNavigate();
  const today = todayISO();
  const date = d ?? today;
  const go = (next: string) => navigate({ search: next === today ? {} : { d: next } });

  const lessons = lessonsOnDate(state, date);
  const events = (activeYear(state)?.events ?? []).filter((e) => e.date === date);

  return (
    <main className="page max-w-xl">
      <header className="mb-5">
        <div className="flex items-center justify-between">
          <button className="btn-ghost -ml-2" onClick={() => go(addDays(date, -1))} aria-label="Dia anterior">
            <ChevronLeft className="size-5" />
          </button>
          <label className="relative cursor-pointer text-center">
            <h1 className="page-title capitalize">{WEEKDAYS[weekdayOf(date)]}</h1>
            <div className="text-sm text-muted-foreground">{formatLong(date)}</div>
            <input
              type="date"
              value={date}
              onChange={(e) => e.target.value && go(e.target.value)}
              className="absolute inset-0 opacity-0"
              aria-label="Escolher data"
            />
          </label>
          <button className="btn-ghost -mr-2" onClick={() => go(addDays(date, 1))} aria-label="Dia seguinte">
            <ChevronRight className="size-5" />
          </button>
        </div>
        <div className="mt-2 flex h-7 items-center justify-center gap-3 text-xs text-muted-foreground">
          <span>
            {lessons.length} {lessons.length === 1 ? "aula" : "aulas"}
          </span>
          {date !== today && (
            <button className="chip hover:bg-accent" onClick={() => go(today)}>
              Hoje
            </button>
          )}
        </div>
      </header>

      <div className="space-y-2.5">
        {events.map((e) => (
          <div key={e.id} className="event-row">
            <span className="chip bg-card">Evento</span>
            {e.name}
          </div>
        ))}
        {lessons.map(({ lesson, student }) => (
          <LessonCard key={lesson.id} lesson={lesson} student={student} />
        ))}
        {!lessons.length && !events.length && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Sem aulas neste dia.{" "}
            <Link to="/alunos" className="text-primary underline-offset-2 hover:underline">
              Ver alunos
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
