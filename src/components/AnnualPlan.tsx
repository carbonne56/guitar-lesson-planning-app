import type { AppState, YearStudent } from "@/lib/model";
import { summaryUsage } from "@/lib/selectors";

/** Annual plan grouped by Library category, with Summary usage counts. */
export function AnnualPlanList({
  state,
  ctx,
  onRemove,
  onSelect,
}: {
  state: AppState;
  ctx?: YearStudent;
  onRemove?: (id: string) => void;
  onSelect?: (id: string) => void;
}) {
  const items = (ctx?.annualPlan ?? [])
    .map((p) => state.library.find((l) => l.id === p.libraryItemId))
    .filter((x): x is NonNullable<typeof x> => !!x);

  if (!items.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Ainda sem elementos no plano deste ano.
      </p>
    );
  }

  const groups = new Map<string, typeof items>();

  for (const i of items) {
    groups.set(i.category, [
      ...(groups.get(i.category) ?? []),
      i,
    ]);
  }

  return (
    <div className="space-y-3">
      {[...groups].map(([cat, list]) => (
        <div key={cat}>
          <div className="eyebrow mb-1">{cat}</div>

          <ul className="divide-y">
            {list.map((i) => {
              const n = summaryUsage(ctx, i.id);

              return (
                <li
                  key={i.id}
                  className="flex items-center justify-between gap-2 py-1.5 text-sm"
                >
                  <span className="min-w-0">
                    {onSelect ? (
                      <button
                        type="button"
                        className="text-left hover:text-accent-foreground hover:underline"
                        onClick={() => onSelect(i.id)}
                      >
                        {i.name}
                      </button>
                    ) : (
                      i.name
                    )}
                  </span>

                  <span className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {n} {n === 1 ? "aula" : "aulas"}
                    </span>

                    {onRemove && (
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => onRemove(i.id)}
                        aria-label={`Remover ${i.name}`}
                      >
                        ✕
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
