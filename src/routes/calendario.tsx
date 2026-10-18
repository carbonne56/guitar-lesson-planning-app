import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatLong, formatShort } from "@/lib/dates";
import { newId } from "@/lib/model";
import { activeYear } from "@/lib/selectors";
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

  const overview = year
    ? [
        { date: year.startDate, label: "Início do ano letivo", kind: "marco" },
        ...year.holidays.map((h) => ({ date: h.startDate, label: `${h.name || "Férias"} · até ${formatShort(h.endDate)}`, kind: "Férias" })),
        ...year.events.map((e) => ({ date: e.date, label: e.name, kind: "Evento" })),
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
            onChange={(e) => update((s) => ({ ...s, settings: { ...s.settings, activeSchoolYearId: e.target.value } }))}
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
            {formatLong(year.startDate)} — {formatLong(year.endDate)}
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

          <details className="disclosure">
            <summary>Feriados ({year.publicHolidays.length})</summary>
            <ul className="divide-y px-4 pb-3">
              {[...year.publicHolidays].sort((a, b) => a.date.localeCompare(b.date)).map((p) => (
                <li key={p.id} className="flex gap-3 py-2 text-sm">
                  <span className="w-16 text-muted-foreground">{formatShort(p.date)}</span>
                  {p.name}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {creating && <NewYearDialog onClose={() => setCreating(false)} />}
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
      schoolYears: [...s.schoolYears, { id, name, startDate, endDate, holidays: [], publicHolidays: [], events: [], students: [] }],
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
          <input className="field" placeholder="ex.: 2027/28" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-xs text-muted-foreground">
              Início
              <input className="field" type="date" value={startDate} onChange={(e) => setStart(e.target.value)} required />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Fim
              <input className="field" type="date" value={endDate} onChange={(e) => setEnd(e.target.value)} required />
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
