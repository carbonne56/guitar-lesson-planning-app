
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Download, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AppState } from "@/lib/model";
import { useStore } from "@/lib/store";
import {
  applyTeacherScheduleImport,
  parseTeacherScheduleImport,
  previewTeacherScheduleImport,
  type TeacherScheduleImport,
  type TeacherScheduleImportPreview,
  type TeacherScheduleImportResult,
} from "@/lib/teacherScheduleImport";

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

  if (raw["app"] !== APP_ID || raw["version"] !== EXPORT_VERSION) {
    return false;
  }

  if (!raw["state"] || typeof raw["state"] !== "object") {
    return false;
  }

  const state = raw["state"] as Record<string, unknown>;

  return (
    state["version"] === 2 &&
    Array.isArray(state["students"]) &&
    Array.isArray(state["schoolYears"]) &&
    Array.isArray(state["library"]) &&
    !!state["settings"] &&
    typeof state["settings"] === "object"
  );
}

export const Route = createFileRoute("/definicoes/")({
  head: () => ({
    meta: [
      { title: "Definições — Aulas de Guitarra" },
      {
        name: "description",
        content: "Definições e gestão dos dados da aplicação.",
      },
      { property: "og:title", content: "Definições — Aulas de Guitarra" },
      {
        property: "og:description",
        content: "Definições e gestão dos dados da aplicação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Definicoes,
});

function Definicoes() {
  const { state, update } = useStore();

  // Cópia de segurança: comportamento independente da importação de horários.
  const [message, setMessage] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [pendingImport, setPendingImport] = useState<AppState | null>(null);
  const [importError, setImportError] = useState("");

  // Importação de horários do teacher-schedule.
  const [scheduleText, setScheduleText] = useState("");
  const [includeWaiting, setIncludeWaiting] = useState(false);
  const [scheduleData, setScheduleData] =
    useState<TeacherScheduleImport | null>(null);
  const [schedulePreview, setSchedulePreview] =
    useState<TeacherScheduleImportPreview | null>(null);
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleResult, setScheduleResult] =
    useState<TeacherScheduleImportResult | null>(null);
  const [confirmScheduleImport, setConfirmScheduleImport] = useState(false);

  const activeYearId = state.settings.activeSchoolYearId;
  const activeYear = state.schoolYears.find(
    (year) => year.id === activeYearId,
  );

  const handleExport = async () => {
    const backup = {
      app: APP_ID,
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      state,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(backup, null, 2));
      setMessage("Dados copiados para o clipboard.");
    } catch {
      setMessage("Não foi possível copiar os dados.");
    }
  };

  const handleImport = () => {
    setImportError("");

    try {
      const backup: unknown = JSON.parse(importText);

      if (!validateBackup(backup)) {
        throw new Error("Os dados não são válidos ou não pertencem a esta aplicação.");
      }

      setPendingImport(backup.state);
    } catch (error) {
      setImportError(
        error instanceof SyntaxError
          ? "O texto não contém JSON válido. Verifica se copiaste todos os dados."
          : error instanceof Error
            ? error.message
            : "Não foi possível importar os dados.",
      );
    }
  };

  const confirmBackupImport = () => {
    if (!pendingImport) return;

    update(() => pendingImport);

    setPendingImport(null);
    setImportText("");
    setShowImport(false);
    setMessage("Dados importados com sucesso.");
  };

  const cancelBackupImport = () => {
    setPendingImport(null);
  };

  const resetScheduleImport = () => {
    setScheduleText("");
    setIncludeWaiting(false);
    setScheduleData(null);
    setSchedulePreview(null);
    setScheduleError("");
    setScheduleResult(null);
    setConfirmScheduleImport(false);
  };

  const analyzeScheduleImport = () => {
    setScheduleError("");
    setSchedulePreview(null);
    setScheduleData(null);
    setScheduleResult(null);

    try {
      if (!activeYear) {
        throw new Error("Seleciona primeiro um ano letivo ativo no Calendário.");
      }

      const parsed = parseTeacherScheduleImport(scheduleText);
      const preview = previewTeacherScheduleImport(state, parsed, includeWaiting);

      setScheduleData(parsed);
      setSchedulePreview(preview);
    } catch (error) {
      setScheduleError(
        error instanceof Error ? error.message : "Não foi possível analisar os dados.",
      );
    }
  };

  const handleIncludeWaitingChange = (checked: boolean) => {
    setIncludeWaiting(checked);
    setSchedulePreview(null);
    setScheduleData(null);
    setScheduleResult(null);
    setScheduleError("");
  };

  const confirmScheduleImportAction = () => {
    if (!scheduleData || !schedulePreview || !activeYear) return;

    try {
      const result = applyTeacherScheduleImport(state, scheduleData, includeWaiting);

      update(() => result.state);
      setScheduleResult(result);
      setSchedulePreview(null);
      setScheduleData(null);
      setConfirmScheduleImport(false);
      setScheduleError("");
    } catch (error) {
      setScheduleError(
        error instanceof Error ? error.message : "Não foi possível importar os horários.",
      );
      setConfirmScheduleImport(false);
    }
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
              Guarda ou transfere todos os dados da aplicação entre
              dispositivos. A importação substitui os dados atuais.
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
                  setImportError("");
                  setShowImport(true);
                }}
              >
                <Download className="size-4" />
                Importar cópia de segurança
              </button>
            </div>

            {message && (
              <p className="mt-3 text-sm text-muted-foreground">{message}</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Importação de horários
        </h2>

        <div className="surface px-4 py-4">
          <div className="flex items-start gap-3">
            <Users className="mt-1 size-5 shrink-0 text-muted-foreground" />
            <div>
              <h3 className="font-medium">Importar do teacher-schedule</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Cola aqui o JSON exportado da aplicação de horários. Os
                alunos e horários serão integrados no ano letivo ativo, sem
                substituir os restantes dados.
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm">
            Ano letivo ativo:{" "}
            <strong>{activeYear?.name ?? "Nenhum selecionado"}</strong>
          </p>

          <label className="mt-4 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={includeWaiting}
              onChange={(event) =>
                handleIncludeWaitingChange(event.target.checked)
              }
            />
            <span>
              Incluir também os alunos que estão na área de espera, sem
              horário
            </span>
          </label>

          <textarea
            className="field mt-4 min-h-52 resize-y font-mono text-xs"
            value={scheduleText}
            onChange={(event) => {
              setScheduleText(event.target.value);
              setSchedulePreview(null);
              setScheduleData(null);
              setScheduleResult(null);
              setScheduleError("");
            }}
            placeholder="Cola aqui o JSON exportado pelo teacher-schedule..."
          />

          {scheduleError && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {scheduleError}
            </p>
          )}

          {schedulePreview && (
            <div className="mt-4 rounded-md border p-4">
              <h3 className="font-medium">Pré-visualização</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Ano letivo: {schedulePreview.yearName}
              </p>

              <ul className="mt-3 space-y-1 text-sm">
                <li>
                  Alunos abrangidos: {schedulePreview.totalPeople}
                </li>
                <li>Novos alunos: {schedulePreview.newStudents}</li>
                <li>
                  Alunos já existentes: {schedulePreview.existingStudents}
                </li>
                <li>
                  Alunos com horário: {schedulePreview.scheduledPeople}
                </li>
                <li>Horários a importar: {schedulePreview.schedules}</li>
                <li>
                  Alunos sem horário a incluir: {schedulePreview.waitingPeople}
                </li>
              </ul>

              <p className="mt-3 text-sm text-muted-foreground">
                Os alunos que não constam do JSON não serão alterados. As
                aulas existentes e os respetivos conteúdos serão preservados
                sempre que possível.
              </p>
            </div>
          )}

          {scheduleResult && (
            <div
              role="status"
              className="mt-4 rounded-md border p-4 text-sm"
            >
              <h3 className="font-medium">Importação concluída</h3>
              <ul className="mt-2 space-y-1">
                <li>Novos alunos: {scheduleResult.importedStudents}</li>
                <li>
                  Alunos atualizados: {scheduleResult.updatedStudents}
                </li>
                <li>Horários importados: {scheduleResult.importedSchedules}</li>
                <li>
                  Alunos importados sem horário:{" "}
                  {scheduleResult.importedWithoutSchedule}
                </li>
              </ul>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={analyzeScheduleImport}
              disabled={!scheduleText.trim() || !activeYear}
            >
              Analisar JSON
            </button>

            {schedulePreview && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setConfirmScheduleImport(true)}
              >
                Confirmar importação
              </button>
            )}

            {(scheduleText || scheduleResult || scheduleError) && (
              <button
                type="button"
                className="btn-secondary"
                onClick={resetScheduleImport}
              >
                Limpar
              </button>
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
            <DialogTitle>Importar cópia de segurança</DialogTitle>
          </DialogHeader>

          <textarea
            className="field min-h-52 resize-y font-mono text-xs"
            value={importText}
            onChange={(event) => {
              setImportText(event.target.value);
              setImportError("");
            }}
            placeholder="Cola aqui os dados exportados..."
          />
          {importError && (
            <p role="alert" className="text-sm text-destructive">
              {importError}
            </p>
          )}
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
          if (!open) cancelBackupImport();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar importação da cópia de segurança</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Importar estes dados irá substituir os dados atuais da aplicação.
          </p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={cancelBackupImport}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={confirmBackupImport}
            >
              Importar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmScheduleImport}
        onOpenChange={setConfirmScheduleImport}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar importação de horários</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Serão integrados {schedulePreview?.totalPeople ?? 0} alunos no
            ano letivo ativo. Os alunos que não constam do JSON não serão
            alterados. Esta operação não substitui a cópia de segurança nem
            gera automaticamente aulas para alunos novos.
          </p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setConfirmScheduleImport(false)}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={confirmScheduleImportAction}
            >
              Importar horários
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
