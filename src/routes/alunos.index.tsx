import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { StudentForm } from "@/components/StudentForm";
import { WEEKDAYS_SHORT, ageFrom } from "@/lib/dates";
import { activeYear, yearContext } from "@/lib/selectors";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/alunos/")({
  head: () => ({
    meta: [
      { title: "Alunos — Aulas de Guitarra" },
      { name: "description", content: "Lista de alunos, com procura e ordenação." },
      { property: "og:title", content: "Alunos — Aulas de Guitarra" },
      { property: "og:description", content: "Lista de alunos, com procura e ordenação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Alunos,
});

type SortKey = "name" | "grade" | "age";

function Alunos() {
  const { state, update } = useStore();
  const year = activeYear(state);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [showInactive, setShowInactive] = useState(false);
  const [creating, setCreating] = useState(false);

  const rows = useMemo(() => {
    const nq = q.trim().toLowerCase();
    return state.students
      .filter((s) => (showInactive || s.active) && s.name.toLowerCase().includes(nq))
      .map((s) => ({ s, age: ageFrom(s.birthDate), grade: yearContext(year, s.id)?.grade ?? "" }))
      .sort((a, b) => {
        if (sort === "age") return (a.age ?? 999) - (b.age ?? 999) || a.s.name.localeCompare(b.s.name, "pt");
        if (sort === "grade")
          return a.grade.localeCompare(b.grade, "pt", { numeric: true }) || a.s.name.localeCompare(b.s.name, "pt");
        return a.s.name.localeCompare(b.s.name, "pt");
      });
  }, [state.students, year, q, sort, showInactive]);

  const toggleActive = (id: string) =>
    update((s) => ({ ...s, students: s.students.map((x) => (x.id === id ? { ...x, active: !x.active } : x)) }));

  return (
    <main className="page max-w-2xl">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="page-title">Alunos</h1>
        <button className="btn-primary h-9" onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Aluno
        </button>
      </header>

      <div className="mb-3 space-y-2">
        <input className="field" placeholder="Procurar por nome…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex gap-1">
            {(["name", "grade", "age"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setSort(k)}
                className={sort === k ? "chip bg-accent text-accent-foreground" : "chip"}
              >
                {{ name: "Nome", grade: "Grau", age: "Idade" }[k]}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" className="size-4 accent-primary" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Mostrar inativos
          </label>
        </div>
      </div>

      <ul className="surface divide-y">
        {rows.map(({ s, age, grade }) => (
          <li key={s.id} className={`flex items-center gap-3 px-4 py-2.5 ${s.active ? "" : "opacity-55"}`}>
            <Link to="/alunos/$studentId" params={{ studentId: s.id }} className="flex min-w-0 flex-1 items-baseline gap-3">
              <span className="truncate font-medium">{s.name}</span>
              <span className="ml-auto flex shrink-0 gap-3 text-sm text-muted-foreground tabular-nums">
                <span>{age != null ? `${age} anos` : "—"}</span>
                <span className="w-8">{grade || "—"}</span>
                <span className="w-8">{s.schedule ? WEEKDAYS_SHORT[s.schedule.weekday] : "—"}</span>
              </span>
            </Link>
            <button
              onClick={() => toggleActive(s.id)}
              className={s.active ? "chip bg-accent text-accent-foreground" : "chip"}
              title="Alternar ativo/inativo"
            >
              {s.active ? "Ativo" : "Inativo"}
            </button>
          </li>
        ))}
        {!rows.length && <li className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum aluno encontrado.</li>}
      </ul>

      {creating && <StudentForm open onOpenChange={setCreating} />}
    </main>
  );
}
