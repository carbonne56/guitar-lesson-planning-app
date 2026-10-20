import { useMemo, useState } from "react";
import { newId, type LibraryItem } from "@/lib/model";
import { libraryCategories } from "@/lib/selectors";
import { useStore } from "@/lib/store";

const norm = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

/**
 * Incremental Library search. Selecting an existing element calls onSelect;
 * only when no exact match exists is "Criar novo elemento" offered.
 */
export function LibrarySearch({
  onSelect,
  defaultCategory,
  placeholder = "Procurar na biblioteca…",
  excludeIds = [],
}: {
  onSelect: (item: LibraryItem) => void;
  defaultCategory?: string;
  placeholder?: string;
  excludeIds?: string[];
}) {
  const { state, update } = useStore();
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [category, setCategory] = useState(defaultCategory ?? "");
  const categories = libraryCategories(state);

  const results = useMemo(() => {
    const nq = norm(q);
    if (!nq) return [];
    return state.library
      .filter((i) => !excludeIds.includes(i.id) && norm(i.name).includes(nq))
      .slice(0, 30);
  }, [q, state.library, excludeIds]);

  const exact = state.library.some((i) => norm(i.name) === norm(q));

  const pick = (item: LibraryItem) => {
    onSelect(item);
    setQ("");
    setCreating(false);
  };

  const create = () => {
    const name = q.trim();
    const cat = category.trim();
    if (!name || !cat) return;
    const item: LibraryItem = { id: newId("library"), name, category: cat };
    update((s) => ({ ...s, library: [...s.library, item] }));
    pick(item);
  };

  return (
    <div className="relative">
      <input
        className="field"
        value={q}
        placeholder={placeholder}
        onChange={(e) => {
          setQ(e.target.value);
          setCreating(false);
        }}
      />
      {q.trim() && (
        <div className="surface absolute inset-x-0 top-11 z-30 max-h-80 overflow-y-auto shadow-lg">
          {results.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => pick(i)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-secondary"
            >
              <span>{i.name}</span>
              <span className="text-xs text-muted-foreground">{i.category}</span>
            </button>
          ))}
          {!exact &&
            (creating ? (
              <div className="space-y-2 border-t p-3">
                <div className="text-sm">
                  Novo elemento: <strong>{q.trim()}</strong>
                </div>
                <input
                  className="field"
                  list="library-categories"
                  value={category}
                  placeholder="Categoria (existente ou nova)"
                  onChange={(e) => setCategory(e.target.value)}
                  autoFocus
                />
                <datalist id="library-categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <button type="button" className="btn-primary w-full" onClick={create} disabled={!category.trim()}>
                  Criar e adicionar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="w-full border-t px-3 py-2 text-left text-sm font-medium text-primary hover:bg-secondary"
              >
                ＋ Criar novo elemento
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
