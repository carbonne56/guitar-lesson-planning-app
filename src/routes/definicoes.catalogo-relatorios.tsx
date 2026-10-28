import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { newId } from "@/lib/model";
import type {
  ReportCatalog,
  ReportDimension,
  ReportTopic,
  ReportFormulationOption,
} from "@/lib/model";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/definicoes/catalogo-relatorios")({
  head: () => ({
    meta: [
      { title: "Catálogo de formulações — Aulas de Guitarra" },
      {
        name: "description",
        content: "Gestão das formulações dos relatórios de avaliação.",
      },
    ],
  }),
  component: CatalogoRelatorios,
});

function CatalogoRelatorios() {
  const { state, update } = useStore();
  const [draft, setDraft] = useState<ReportCatalog>(() => structuredClone(state.reportCatalog));
  const [dimensionId, setDimensionId] = useState(() => state.reportCatalog.dimensions[0]?.id ?? "");
  const [topicId, setTopicId] = useState(
    () => state.reportCatalog.dimensions[0]?.topics[0]?.id ?? "",
  );
  const [optionId, setOptionId] = useState(
    () => state.reportCatalog.dimensions[0]?.topics[0]?.options[0]?.id ?? "",
  );
  const [message, setMessage] = useState("");

  const dimension = draft.dimensions.find((item) => item.id === dimensionId);
  const topic = dimension?.topics.find((item) => item.id === topicId);
  const option = topic?.options.find((item) => item.id === optionId);

  const updateCatalog = (transform: (catalog: ReportCatalog) => ReportCatalog) => {
    setDraft((current) => transform(current));
    setMessage("");
  };

  const selectDimension = (id: string) => {
    const next = draft.dimensions.find((item) => item.id === id);
    setDimensionId(id);
    setTopicId(next?.topics[0]?.id ?? "");
    setOptionId(next?.topics[0]?.options[0]?.id ?? "");
    setMessage("");
  };

  const selectTopic = (id: string) => {
    const next = dimension?.topics.find((item) => item.id === id);
    setTopicId(id);
    setOptionId(next?.options[0]?.id ?? "");
    setMessage("");
  };

  const addDimension = () => {
    const item: ReportDimension = {
      id: newId("dimension"),
      title: "",
      active: true,
      topics: [],
    };

    updateCatalog((current) => ({
      ...current,
      dimensions: [...current.dimensions, item],
    }));
    setDimensionId(item.id);
    setTopicId("");
    setOptionId("");
  };

  const addTopic = () => {
    if (!dimension) return;

    const item: ReportTopic = {
      id: newId("topic"),
      title: "",
      active: true,
      options: [],
    };

    updateCatalog((current) => ({
      ...current,
      dimensions: current.dimensions.map((entry) =>
        entry.id === dimension.id ? { ...entry, topics: [...entry.topics, item] } : entry,
      ),
    }));
    setTopicId(item.id);
    setOptionId("");
  };

  const addOption = () => {
    if (!dimension || !topic) return;

    const item: ReportFormulationOption = {
      id: newId("formulation"),
      label: "",
      summary: "",
      text: "",
      active: false,
    };

    updateCatalog((current) => ({
      ...current,
      dimensions: current.dimensions.map((entry) =>
        entry.id !== dimension.id
          ? entry
          : {
              ...entry,
              topics: entry.topics.map((topicEntry) =>
                topicEntry.id === topic.id
                  ? { ...topicEntry, options: [...topicEntry.options, item] }
                  : topicEntry,
              ),
            },
      ),
    }));
    setOptionId(item.id);
  };

  const updateDimension = (changes: Partial<ReportDimension>) => {
    if (!dimension) return;

    updateCatalog((current) => ({
      ...current,
      dimensions: current.dimensions.map((entry) =>
        entry.id === dimension.id ? { ...entry, ...changes } : entry,
      ),
    }));
  };

  const updateTopic = (changes: Partial<ReportTopic>) => {
    if (!dimension || !topic) return;

    updateCatalog((current) => ({
      ...current,
      dimensions: current.dimensions.map((entry) =>
        entry.id !== dimension.id
          ? entry
          : {
              ...entry,
              topics: entry.topics.map((topicEntry) =>
                topicEntry.id === topic.id ? { ...topicEntry, ...changes } : topicEntry,
              ),
            },
      ),
    }));
  };

  const updateOption = (changes: Partial<ReportFormulationOption>) => {
    if (!dimension || !topic || !option) return;

    updateCatalog((current) => ({
      ...current,
      dimensions: current.dimensions.map((entry) =>
        entry.id !== dimension.id
          ? entry
          : {
              ...entry,
              topics: entry.topics.map((topicEntry) =>
                topicEntry.id !== topic.id
                  ? topicEntry
                  : {
                      ...topicEntry,
                      options: topicEntry.options.map((optionEntry) =>
                        optionEntry.id === option.id ? { ...optionEntry, ...changes } : optionEntry,
                      ),
                    },
              ),
            },
      ),
    }));
  };

  const isComplete = (item: ReportFormulationOption) =>
    Boolean(item.label.trim() && item.summary.trim() && item.text.trim());

  const saveCatalog = () => {
    const incompleteActive: string[] = [];

    const cleanedDraft: ReportCatalog = {
      ...draft,
      dimensions: draft.dimensions.map((entry) => ({
        ...entry,
        topics: entry.topics.map((topicEntry) => ({
          ...topicEntry,
          options: topicEntry.options.map((optionEntry) => {
            if (optionEntry.active && !isComplete(optionEntry)) {
              incompleteActive.push(optionEntry.label.trim() || "Formulação sem nome");
              return { ...optionEntry, active: false };
            }
            return optionEntry;
          }),
        })),
      })),
    };

    if (
      incompleteActive.length > 0 &&
      !window.confirm(
        `As seguintes formulações têm pelo menos um campo vazio:\n\n${incompleteActive
          .map((name) => `• ${name}`)
          .join(
            "\n",
          )}\n\nSe avançar, as alterações serão guardadas e estas formulações ficarão inativas.\n\nSe quiser manter o conteúdo anterior e o estado de ativação anterior, clique em Cancelar.`,
      )
    ) {
      setDraft(structuredClone(state.reportCatalog));
      setDimensionId(state.reportCatalog.dimensions[0]?.id ?? "");
      setTopicId(state.reportCatalog.dimensions[0]?.topics[0]?.id ?? "");
      setOptionId(state.reportCatalog.dimensions[0]?.topics[0]?.options[0]?.id ?? "");
      setMessage("Edição cancelada. Foi recuperada a versão anteriormente guardada.");
      return;
    }

    update((current) => ({
      ...current,
      reportCatalog: cleanedDraft,
    }));
    setDraft(structuredClone(cleanedDraft));
    setMessage(
      incompleteActive.length > 0
        ? "Catálogo guardado. As formulações incompletas ficaram inativas."
        : "Catálogo guardado com sucesso.",
    );
  };

  return (
    <main className="page max-w-3xl space-y-6">
      <header>
        <Link
          to="/definicoes/"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar a Definições
        </Link>

        <h1 className="page-title">Catálogo de formulações</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Podes guardar conteúdos incompletos. Só as formulações completas e ativas ficam
          disponíveis nos relatórios.
        </p>
      </header>

      <section className="surface space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium" htmlFor="catalog-dimension">
            Dimensão
          </label>
          <button type="button" className="btn-secondary" onClick={addDimension}>
            <Plus className="size-4" />
            Nova dimensão
          </button>
        </div>

        <select
          id="catalog-dimension"
          className="field w-full"
          value={dimensionId}
          onChange={(event) => selectDimension(event.target.value)}
        >
          {draft.dimensions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title.trim() || "Dimensão sem título"}
              {!item.active ? " (inativa)" : ""}
            </option>
          ))}
        </select>

        {dimension && (
          <>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="dimension-title">
                Título da dimensão
              </label>
              <input
                id="dimension-title"
                className="field w-full"
                value={dimension.title}
                onChange={(event) => updateDimension({ title: event.target.value })}
                placeholder="Título da dimensão"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={dimension.active}
                disabled={!dimension.title.trim()}
                onChange={(event) => updateDimension({ active: event.target.checked })}
              />
              Dimensão ativa
            </label>

            {!dimension.title.trim() && (
              <p className="text-sm text-muted-foreground">
                Preenche o título da dimensão para a poderes ativar.
              </p>
            )}
          </>
        )}

        <div className="border-t pt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="text-sm font-medium" htmlFor="catalog-topic">
              Tópico
            </label>
            <button
              type="button"
              className="btn-secondary"
              disabled={!dimension}
              onClick={addTopic}
            >
              <Plus className="size-4" />
              Novo tópico
            </button>
          </div>

          <select
            id="catalog-topic"
            className="field w-full"
            value={topicId}
            onChange={(event) => selectTopic(event.target.value)}
            disabled={!dimension || dimension.topics.length === 0}
          >
            {dimension?.topics.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title.trim() || "Tópico sem título"}
                {!item.active ? " (inativo)" : ""}
              </option>
            ))}
          </select>
        </div>

        {topic && (
          <>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="topic-title">
                Título do tópico
              </label>
              <input
                id="topic-title"
                className="field w-full"
                value={topic.title}
                onChange={(event) => updateTopic({ title: event.target.value })}
                placeholder="Título do tópico"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={topic.active}
                disabled={!topic.title.trim()}
                onChange={(event) => updateTopic({ active: event.target.checked })}
              />
              Tópico ativo
            </label>

            {!topic.title.trim() && (
              <p className="text-sm text-muted-foreground">
                Preenche o título do tópico para o poderes ativar.
              </p>
            )}

            <div className="border-t pt-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-sm font-medium" htmlFor="catalog-option">
                  Formulação
                </label>
                <button type="button" className="btn-secondary" onClick={addOption}>
                  <Plus className="size-4" />
                  Nova formulação
                </button>
              </div>

              <select
                id="catalog-option"
                className="field w-full"
                value={optionId}
                onChange={(event) => {
                  setOptionId(event.target.value);
                  setMessage("");
                }}
                disabled={topic.options.length === 0}
              >
                {topic.options.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label.trim() || "Formulação sem nome"}
                    {!item.active ? " (inativa)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {option && (
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="catalog-label">
                Nome da formulação
              </label>
              <input
                id="catalog-label"
                className="field w-full"
                value={option.label}
                onChange={(event) => updateOption({ label: event.target.value })}
                placeholder="Nome da formulação"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="catalog-summary">
                Resumo
              </label>
              <textarea
                id="catalog-summary"
                className="field min-h-20 w-full"
                value={option.summary}
                onChange={(event) => updateOption({ summary: event.target.value })}
                placeholder="Resumo breve"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="catalog-text">
                Texto completo da formulação
              </label>
              <textarea
                id="catalog-text"
                className="field min-h-48 w-full"
                value={option.text}
                onChange={(event) => updateOption({ text: event.target.value })}
                placeholder="Texto completo"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={option.active}
                disabled={!isComplete(option)}
                onChange={(event) => updateOption({ active: event.target.checked })}
              />
              Formulação ativa
            </label>

            {!isComplete(option) && (
              <p className="text-sm text-muted-foreground">
                Para ativar esta formulação, preenche o nome, o resumo e o texto completo.
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
          <button type="button" className="btn-primary" onClick={saveCatalog}>
            <Save className="size-4" />
            Guardar catálogo
          </button>

          {message && (
            <p role="status" className="text-sm text-muted-foreground">
              {message}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
