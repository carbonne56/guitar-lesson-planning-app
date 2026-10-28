import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, Save, X } from "lucide-react";
import { REPORT_FORMULATIONS } from "@/lib/REPORT_FORMULATIONS";
import { newId, type StudentReport } from "@/lib/model";
import { useStore } from "@/lib/store";

interface ReportEditorProps {
  studentId: string;
  schoolYearId: string;
  report?: StudentReport | null;
  onClose: () => void;
  onSaved: (report: StudentReport) => void;
}

export function ReportEditor({
  studentId,
  schoolYearId,
  report = null,
  onClose,
  onSaved,
}: ReportEditorProps) {
  const { state, update } = useStore();

  const [period, setPeriod] = useState<1 | 2>(report?.period ?? 1);
  const [name, setName] = useState(
    report?.name ??
 `Relatório do ${(report?.period ?? 1) === 1 ? "1.º" : "2.º"} período`,
  );
  const [selections, setSelections] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (report?.selections ?? []).map((selection) => [selection.topicId, selection.optionId]),
    ),
  );
  const [finalText, setFinalText] = useState(report?.finalText ?? "");
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const dimensions = useMemo(
    () =>
      state.reportCatalog?.dimensions?.length
        ? state.reportCatalog.dimensions
        : REPORT_FORMULATIONS.map((dimension) => ({
            ...dimension,
            active: true,
            topics: dimension.topics.map((topic) => ({
              ...topic,
              active: true,
              options: topic.options.map((option) => ({
                ...option,
                active: true,
              })),
            })),
          })),
    [state.reportCatalog],
  );

  const existingReport = state.studentReports.find(
    (item) =>
      item.studentId === studentId &&
      item.schoolYearId === schoolYearId &&
      item.period === period &&
      item.id !== report?.id,
  );

  const selectedFormulations = dimensions.flatMap((dimension) =>
    dimension.topics.flatMap((topic) => {
      const optionId = selections[topic.id];
      const option = topic.options.find((item) => item.id === optionId);

      if (!option) return [];

      return [
        {
          dimensionId: dimension.id,
          topicId: topic.id,
          optionId: option.id,
          topicTitle: topic.title,
          optionLabel: option.label,
          text: option.text,
        },
      ];
    }),
  );

  const generatedText = dimensions
    .map((dimension) => {
      const texts = selectedFormulations
        .filter((selection) => selection.dimensionId === dimension.id)
        .map((selection) => selection.text);

      if (!texts.length) return "";

      return `${dimension.title}\n\n${texts.join("\n\n")}`;
    })
    .filter(Boolean)
    .join("\n\n");

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((previous) => {
      const next = new Set(previous);

      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }

      return next;
    });
  };

  const selectOption = (topicId: string, optionId: string) => {
    setSelections((previous) => {
      const next = { ...previous };

      if (next[topicId] === optionId) {
        delete next[topicId];
      } else {
        next[topicId] = optionId;
      }

      return next;
    });
  };

  const saveReport = () => {
    if (existingReport) return;

    const now = new Date().toISOString();

    const savedSelections = selectedFormulations.map((selection) => {
      const originalSelection = report?.selections.find(
        (item) => item.topicId === selection.topicId,
      );

      // Se a opção não mudou, conserva a formulação original.
      if (originalSelection?.optionId === selection.optionId) {
        return originalSelection;
      }

      return selection;
    });

    const savedReport: StudentReport = {
      id: report?.id ?? newId("report"),
      name: name.trim() || "Relatório de avaliação",
      studentId,
      schoolYearId,
      period,
      createdAt: report?.createdAt ?? now,
      updatedAt: now,
      selections: savedSelections,
      finalText,
    };

    update((current) => ({
      ...current,
      studentReports: report
        ? current.studentReports.map((item) => (item.id === report.id ? savedReport : item))
        : [...current.studentReports, savedReport],
    }));

    onSaved(savedReport);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            {report ? "Editar relatório" : "Novo relatório"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Seleciona as formulações que melhor descrevem o percurso do aluno.
          </p>
        </div>

        <button type="button" className="btn-ghost" onClick={onClose} aria-label="Fechar editor">
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="report-editor-period">
          Período de avaliação
        </label>
        <select
          id="report-editor-period"
          className="field w-full sm:max-w-xs"
          value={period}
          onChange={(event) => setPeriod(Number(event.target.value) as 1 | 2)}
          disabled={!!report}
        >
          <option value={1}>1.º período</option>
          <option value={2}>2.º período</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="report-editor-name">
          Nome do relatório
        </label>
        <input
          id="report-editor-name"
          className="field w-full sm:max-w-md"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: Avaliação de outubro"
          required
        />
      </div>

      {existingReport && (
        <p className="text-sm text-destructive">
          Já existe um relatório para este aluno e período neste ano letivo.
        </p>
      )}

      {dimensions.map((dimension) => {
        const topics = dimension.topics.filter(
          (topic) => topic.active && topic.options.some((option) => option.active),
        );

        if (!dimension.active || !topics.length) return null;

        return (
          <section key={dimension.id} className="space-y-3">
            <h3 className="text-base font-semibold">{dimension.title}</h3>

            {topics.map((topic) => {
              const activeOptions = topic.options.filter((option) => option.active);
              const selectedOption = activeOptions.find(
                (option) => option.id === selections[topic.id],
              );
              const expanded = expandedTopics.has(topic.id);

              return (
                <div key={topic.id} className="rounded-lg border">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 p-3 text-left"
                    onClick={() => toggleTopic(topic.id)}
                    aria-expanded={expanded}
                  >
                    <span className="min-w-0">
                      <span className="block font-medium">{topic.title}</span>
                      <span className="block text-sm text-muted-foreground">
                        {selectedOption
                          ? `${selectedOption.label}: ${selectedOption.summary}`
                          : "Sem formulação selecionada"}
                      </span>
                    </span>
                    {expanded ? (
                      <ChevronUp className="size-4 shrink-0" />
                    ) : (
                      <ChevronDown className="size-4 shrink-0" />
                    )}
                  </button>

                  {expanded && (
                    <div className="space-y-2 border-t p-3">
                      <button
                        type="button"
                        className="text-sm text-muted-foreground underline"
                        onClick={() => {
                          setSelections((previous) => {
                            const next = { ...previous };
                            delete next[topic.id];
                            return next;
                          });
                        }}
                      >
                        Limpar seleção
                      </button>

                      {activeOptions.map((option) => {
                        const selected = selections[topic.id] === option.id;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            title={option.text}
                            aria-pressed={selected}
                            className={`block w-full rounded-lg border p-3 text-left ${
                              selected ? "border-primary bg-primary/10" : "hover:bg-muted"
                            }`}
                            onClick={() => selectOption(topic.id, option.id)}
                          >
                            <span className="flex items-center justify-between gap-2 font-medium">
                              {option.label}
                              {selected && <Check className="size-4" />}
                            </span>
                            <span className="mt-1 block text-sm text-muted-foreground">
                              {option.summary}
                            </span>
                            <span className="mt-2 block text-sm">{option.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        );
      })}

      <section className="space-y-2 border-t pt-4">
        <div>
          <h3 className="font-semibold">Texto final do relatório</h3>
          <p className="text-sm text-muted-foreground">
            Podes editar livremente o texto antes de guardar.
          </p>
        </div>

        <button type="button" className="btn-secondary" onClick={() => setFinalText(generatedText)}>
          Atualizar texto a partir das seleções
        </button>

        <textarea
          className="field min-h-64 w-full"
          value={finalText}
          onChange={(event) => setFinalText(event.target.value)}
          placeholder="O texto do relatório aparecerá aqui. Podes também escrevê-lo diretamente."
        />
      </section>

      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={saveReport}
          disabled={!!existingReport}
        >
          <Save className="size-4" />
          Guardar relatório
        </button>
      </div>
    </div>
  );
}
