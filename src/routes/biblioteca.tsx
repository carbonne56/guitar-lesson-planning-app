import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LibrarySearch } from "@/components/LibrarySearch";
import { libraryCategories } from "@/lib/selectors";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca — Aulas de Guitarra" },
      { name: "description", content: "Peças, estudos e objetivos reutilizáveis." },
      { property: "og:title", content: "Biblioteca — Aulas de Guitarra" },
      { property: "og:description", content: "Peças, estudos e objetivos reutilizáveis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Biblioteca,
});

function Biblioteca() {
  const { state } = useStore();
  const [last, setLast] = useState<string | null>(null);
  const categories = libraryCategories(state);

  return (
    <main className="page max-w-2xl">
      <h1 className="page-title mb-4">Biblioteca</h1>
      <div className="mb-6">
        <LibrarySearch placeholder="Procurar ou criar elemento…" onSelect={(i) => setLast(i.id)} />
      </div>
      <div className="space-y-5">
        {categories.map((cat) => (
          <section key={cat}>
            <h2 className="eyebrow mb-1.5">{cat}</h2>
            <ul className="surface divide-y">
              {state.library
                .filter((i) => i.category === cat)
                .sort((a, b) => a.name.localeCompare(b.name, "pt"))
                .map((i) => (
                  <li key={i.id} className={`px-4 py-2.5 text-sm ${last === i.id ? "bg-accent" : ""}`}>
                    {i.name}
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
