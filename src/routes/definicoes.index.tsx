import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AppState } from "@/lib/model";
import { useStore } from "@/lib/store";

const APP_ID = "guitar-lesson-planning";
const EXPORT_VERSION = 1;

type Backup = {
  app: string;
  version: number;
  exportedAt: string;
  state: AppState;
};

function validateBackup(backup: unknown): backup is Backup {
  if (!backup || typeof backup !== "object") {
    return false;
  }

  const raw = backup as Record<string, unknown>;

  if (raw.app !== APP_ID) {
    return false;
  }

  if (raw.version !== EXPORT_VERSION) {
    return false;
  }

  if (!raw.state || typeof raw.state !== "object") {
    return false;
  }

  const state = raw.state as Record<string, unknown>;

  if (state.version !== 1) {
    return false;
  }

  if (!Array.isArray(state.students)) {
    return false;
  }

  if (!Array.isArray(state.schoolYears)) {
    return false;
  }

  if (!Array.isArray(state.library)) {
    return false;
  }

  if (!state.settings || typeof state.settings !== "object") {
    return false;
  }

  return true;
}

export const Route = createFileRoute("/definicoes/")({
  head: () => ({
    meta: [
      { title: "Definições — Aulas de Guitarra" },
      { name: "description", content: "Definições e gestão dos dados da aplicação." },
      { property: "og:title", content: "Definições — Aulas de Guitarra" },
      { property: "og:description", content: "Definições e gestão dos dados da aplicação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Definicoes,
});

function Definicoes() {
  const { state, update } = useStore();
  const [message, setMessage] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [pendingImport, setPendingImport] = useState<AppState | null>(null);

  const handleExport = async () => {
    const backup = {
      app: APP_ID,
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      state,
    };

    const json = JSON.stringify(backup, null, 2);

    try {
      await navigator.clipboard.writeText(json);
      setMessage("Dados copiados para o clipboard.");
    } catch {
      setMessage("Não foi possível copiar os dados.");
    }
  };

  const handleImport = () => {
    try {
      const backup: unknown = JSON.parse(importText);

      if (!validateBackup(backup)) {
        throw new Error("Formato inválido");
      }

      setPendingImport(backup.state);
    } catch {
      setMessage("Os dados não são válidos ou não pertencem a esta aplicação.");
    }
  };

  const confirmImport = () => {
    if (!pendingImport) return;

    update(() => pendingImport);

    setPendingImport(null);
    setImportText("");
    setShowImport(false);
    setMessage("Dados importados com sucesso.");
  };

  const cancelImport = () => {
    setPendingImport(null);
  };

  return (
    <main className="page max-w-2xl">
      <header className="mb-6">
        <h1 className="page-title">Definições</h1>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Dados
        </h2>

        <div className="surface divide-y">
          <div className="px-4 py-4">
            <h3 className="font-medium">Exportar e importar dados</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Guarda ou transfere todos os dados da aplicação entre dispositivos.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary"
                onClick={handleExport}
              >
                <Copy className="size-4" />
                Exportar
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setMessage("");
                  setShowImport(true);
                }}
              >
                <Download className="size-4" />
                Importar
              </button>
            </div>

            {message && (
              <p className="mt-3 text-sm text-muted-foreground">
                {message}
              </p>
            )}
          </div>
        </div>
      </section>

      <Dialog
        open={showImport}
        onOpenChange={(open) => {
          setShowImport(open);

          if (!open) {
            setImportText("");
            setPendingImport(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar dados</DialogTitle>
          </DialogHeader>

          <textarea
            className="field min-h-52 resize-y font-mono text-xs"
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            placeholder="Cola aqui os dados exportados..."
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowImport(false)}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={handleImport}
              disabled={!importText.trim()}
            >
              Importar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingImport !== null}
        onOpenChange={(open) => {
          if (!open) cancelImport();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar importação</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Importar estes dados irá substituir os dados atuais da aplicação.
          </p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={cancelImport}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={confirmImport}
            >
              Importar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
