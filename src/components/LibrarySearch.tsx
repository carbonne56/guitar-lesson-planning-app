
import { useMemo, useState } from "react";
import { newId, type LibraryItem } from "@/lib/model";
import { libraryCategories } from "@/lib/selectors";
import { useStore } from "@/lib/store";

const norm = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

export function LibrarySearch({
  onSelect,
  defaultCategory,
  placeholder = "Procurar na biblioteca…",
  excludeIds = [],
  filterLibrary = false,
  onQueryChange,
}: {
  onSelect: (item: LibraryItem) => void;
  defaultCategory?: string;
  placeholder?: string;
  excludeIds?: string[];
  filterLibrary?: boolean;
  onQueryChange?: (query: string) => void;
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
    onQueryChange?.("");
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
          const nextQuery = e.target.value;
          setQ(nextQuery);
          onQueryChange?.(nextQuery);
          setCreating(false);
        }}
      />

      {q.trim() && (
        filterLibrary ? (
          !exact && (
            creating ? (
              <div className="mt-2 space-y-2 rounded-md border bg-background p-3">
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
                <button
                  type="button"
                  className="btn-primary w-full"
                  onClick={create}
                  disabled={!category.trim()}
                >
                  Criar elemento
                </button>
              </div>
            ) : (
              results.length === 0 && (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="mt-2 w-full rounded-md border px-3 py-2 text-left text-sm font-medium text-primary hover:bg-secondary"
                >
                  ＋ Criar novo elemento
                </button>
              )
            )
          )
        ) : (
          <div className="surface absolute inset-x-0 top-11 z-50 max-h-[min(20rem,calc(100dvh-12rem))] overflow-y-auto overscroll-contain shadow-lg">
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
                  <button
                    type="button"
                    className="btn-primary w-full"
                    onClick={create}
                    disabled={!category.trim()}
                  >
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
        )
      )}
    </div>
  );
}
