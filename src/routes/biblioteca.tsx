
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Check, X, Trash2 } from "lucide-react";
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
  const { state, update } = useStore();
  const [last, setLast] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const categories = libraryCategories(state);

  const filteredLibrary = useMemo(() => {
    const normalizedQuery = query
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();

    return state.library.filter((item) => {
      const normalizedName = item.name
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();

      const normalizedCategory = item.category
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();

      return (
        normalizedName.includes(normalizedQuery) ||
        normalizedCategory.includes(normalizedQuery)
      );
    });
  }, [state.library, query]);

  const startEditing = (id: string, name: string, category: string) => {
    setEditingId(id);
    setEditName(name);
    setEditCategory(category);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditCategory("");
  };

  const saveEditing = () => {
    if (!editingId || !editName.trim() || !editCategory.trim()) return;

    update((current) => ({
      ...current,
      library: current.library.map((item) =>
        item.id === editingId
          ? {
              ...item,
              name: editName.trim(),
              category: editCategory.trim(),
            }
          : item,
      ),
    }));

    setLast(editingId);
    cancelEditing();
  };

  const deleteItem = (id: string, name: string) => {
    const confirmed = window.confirm(
      `Tens a certeza de que queres eliminar "${name}" da biblioteca?\n\nAs referências existentes nos planos e programas serão preservadas.`
    );

    if (!confirmed) return;

    update((current) => ({
      ...current,
      library: current.library.filter((item) => item.id !== id),
    }));

    if (last === id) {
      setLast(null);
    }
  };

  return (
    <main className="page max-w-2xl">
      <h1 className="page-title mb-4">Biblioteca</h1>

      <div className="mb-6">
        <LibrarySearch
          placeholder="Procurar ou criar elemento…"
          filterLibrary
          onQueryChange={setQuery}
          onSelect={(item) => setLast(item.id)}
        />
      </div>

      <div className="space-y-5">
        {categories.map((cat) => {
          const items = filteredLibrary
            .filter((item) => item.category === cat)
            .sort((a, b) => a.name.localeCompare(b.name, "pt"));

          if (items.length === 0) return null;

          return (
            <section key={cat}>
              <h2 className="eyebrow mb-1.5">{cat}</h2>

              <ul className="surface divide-y">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className={`px-4 py-2.5 text-sm ${last === item.id ? "bg-accent" : ""}`}
                  >
                    {editingId === item.id ? (
                      <div className="space-y-2">
                        <input
                          className="field"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          aria-label="Nome do elemento"
                          autoFocus
                        />

                        <input
                          className="field"
                          list="edit-library-categories"
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          aria-label="Categoria do elemento"
                        />

                        <datalist id="edit-library-categories">
                          {categories.map((category) => (
                            <option key={category} value={category} />
                          ))}
                        </datalist>

                        <div className="flex justify-end gap-2">
                          <button type="button" className="btn-ghost" onClick={cancelEditing}>
                            <X className="mr-1 inline size-4" />
                            Cancelar
                          </button>

                          <button
                            type="button"
                            className="btn-primary"
                            onClick={saveEditing}
                            disabled={!editName.trim() || !editCategory.trim()}
                          >
                            <Check className="mr-1 inline size-4" />
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 flex-1">{item.name}</span>

                        <button
                          type="button"
                          className="btn-ghost shrink-0"
                          title={`Editar ${item.name}`}
                          aria-label={`Editar ${item.name}`}
                          onClick={() => startEditing(item.id, item.name, item.category)}
                        >
                          <Pencil className="size-4" />
                        </button>

                        <button
                          type="button"
                          className="btn-ghost shrink-0 text-destructive"
                          title={`Eliminar ${item.name}`}
                          aria-label={`Eliminar ${item.name}`}
                          onClick={() => deleteItem(item.id, item.name)}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {filteredLibrary.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Não foram encontrados elementos correspondentes.
          </p>
        )}
      </div>
    </main>
  );
}
