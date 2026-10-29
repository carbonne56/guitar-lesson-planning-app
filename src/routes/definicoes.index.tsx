import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Download, Users, Pencil, Trash2, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type {
  AppState,
  Lesson,
  PlanEntry,
  LibraryItem,
  ReportCatalog,
  StudentReport,
} from "@/lib/model";
import { useStore } from "@/lib/store";
import { SchoolManager } from "@/components/SchoolManager";
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
  transferType?: "full-backup";
  version: number;
  exportedAt: string;
  state: AppState;
};

type PartialLessonTransfer = {
  app: string;
  transferType: "partial-lessons";
  version: number;
  exportedAt: string;
  since: string;
  schoolYears: {
    id: string;
    students: {
      studentId: string;
      lessons: Lesson[];
      annualPlan?: PlanEntry[];
      annualPlanUpdatedAt?: string;
      libraryItems?: LibraryItem[];
    }[];
  }[];
};

type ReportCatalogTransfer = {
  app: string;
  transferType: "reports-and-catalog";
  version: number;
  exportedAt: string;
  since: string;
  reportCatalog: ReportCatalog;
  studentReports: StudentReport[];
};

function validateBackup(backup: unknown): backup is Backup {
  if (!backup || typeof backup !== "object") return false;

  const raw = backup as Record<string, unknown>;

  if (
    raw["app"] !== APP_ID ||
    raw["version"] !== EXPORT_VERSION ||
    (raw["transferType"] !== undefined && raw["transferType"] !== "full-backup")
  ) {
    return false;
  }

  if (!raw["state"] || typeof raw["state"] !== "object") {
    return false;
  }

  const state = raw["state"] as Record<string, unknown>;

  return (
    (state["version"] === 2 || state["version"] === 3 || state["version"] === 4) &&
    Array.isArray(state["students"]) &&
    Array.isArray(state["schoolYears"]) &&
    Array.isArray(state["library"]) &&
    !!state["settings"] &&
    typeof state["settings"] === "object"
  );
}

function validatePartialLessonTransfer(value: unknown): value is PartialLessonTransfer {
  if (!value || typeof value !== "object") return false;

  const raw = value as Record<string, unknown>;

  if (
    raw["app"] !== APP_ID ||
    raw["transferType"] !== "partial-lessons" ||
    raw["version"] !== EXPORT_VERSION ||
    typeof raw["exportedAt"] !== "string" ||
    typeof raw["since"] !== "string" ||
    Number.isNaN(Date.parse(raw["since"] as string)) ||
    !Array.isArray(raw["schoolYears"])
  ) {
    return false;
  }

  return raw["schoolYears"].every((year: unknown) => {
    if (!year || typeof year !== "object") return false;

    const yearData = year as Record<string, unknown>;

    if (typeof yearData["id"] !== "string" || !Array.isArray(yearData["students"])) {
      return false;
    }

    return yearData["students"].every((student: unknown) => {
      if (!student || typeof student !== "object") return false;

      const studentData = student as Record<string, unknown>;

      if (typeof studentData["studentId"] !== "string" || !Array.isArray(studentData["lessons"])) {
        return false;
      }

      const validLessons = studentData["lessons"].every((lesson: unknown) => {
        if (!lesson || typeof lesson !== "object") return false;

        const item = lesson as Record<string, unknown>;

        return (
          typeof item["id"] === "string" &&
          typeof item["date"] === "string" &&
          typeof item["time"] === "string" &&
          typeof item["updatedAt"] === "string" &&
          !Number.isNaN(Date.parse(item["updatedAt"] as string))
        );
      });

      if (!validLessons) return false;

      if (studentData["annualPlan"] !== undefined) {
        if (!Array.isArray(studentData["annualPlan"])) return false;

        if (
          !studentData["annualPlan"].every(
            (entry: unknown) =>
              !!entry &&
              typeof entry === "object" &&
              typeof (entry as Record<string, unknown>)["libraryItemId"] === "string",
          )
        ) {
          return false;
        }

        if (
          typeof studentData["annualPlanUpdatedAt"] !== "string" ||
          Number.isNaN(Date.parse(studentData["annualPlanUpdatedAt"] as string))
        ) {
          return false;
        }

        if (
          studentData["libraryItems"] !== undefined &&
          (!Array.isArray(studentData["libraryItems"]) ||
            !studentData["libraryItems"].every(
              (item: unknown) =>
                !!item &&
                typeof item === "object" &&
                typeof (item as Record<string, unknown>)["id"] === "string" &&
                typeof (item as Record<string, unknown>)["name"] === "string" &&
                typeof (item as Record<string, unknown>)["category"] === "string",
            ))
        ) {
          return false;
        }
      }

      return true;
    });
  });
}

function validateReportCatalogTransfer(
  value: unknown,
): value is ReportCatalogTransfer {
  if (!value || typeof value !== "object") return false;

  const raw = value as Record<string, unknown>;

  if (
    raw["app"] !== APP_ID ||
    raw["transferType"] !== "reports-and-catalog" ||
    raw["version"] !== EXPORT_VERSION ||
    typeof raw["exportedAt"] !== "string" ||
    typeof raw["since"] !== "string" ||
    Number.isNaN(Date.parse(raw["since"] as string)) ||
    !raw["reportCatalog"] ||
    typeof raw["reportCatalog"] !== "object" ||
    !Array.isArray(raw["studentReports"])
  ) {
    return false;
  }

  const catalog = raw["reportCatalog"] as Record<string, unknown>;

  if (!Array.isArray(catalog["dimensions"])) return false;

  const validCatalog = catalog["dimensions"].every((dimension: unknown) => {
    if (!dimension || typeof dimension !== "object") return false;

    const dimensionData = dimension as Record<string, unknown>;

    if (
      typeof dimensionData["id"] !== "string" ||
      typeof dimensionData["title"] !== "string" ||
      typeof dimensionData["active"] !== "boolean" ||
      !Array.isArray(dimensionData["topics"])
    ) {
      return false;
    }

    return dimensionData["topics"].every((topic: unknown) => {
      if (!topic || typeof topic !== "object") return false;

      const topicData = topic as Record<string, unknown>;

      if (
        typeof topicData["id"] !== "string" ||
        typeof topicData["title"] !== "string" ||
        typeof topicData["active"] !== "boolean" ||
        !Array.isArray(topicData["options"])
      ) {
        return false;
      }

      return topicData["options"].every((option: unknown) => {
        if (!option || typeof option !== "object") return false;

        const optionData = option as Record<string, unknown>;

        return (
          typeof optionData["id"] === "string" &&
          typeof optionData["label"] === "string" &&
          typeof optionData["summary"] === "string" &&
          typeof optionData["text"] === "string" &&
          typeof optionData["active"] === "boolean"
        );
      });
    });
  });

  if (!validCatalog) return false;

  return raw["studentReports"].every((report: unknown) => {
    if (!report || typeof report !== "object") return false;

    const reportData = report as Record<string, unknown>;

    return (
      typeof reportData["id"] === "string" &&
      typeof reportData["name"] === "string" &&
      typeof reportData["studentId"] === "string" &&
      typeof reportData["schoolYearId"] === "string" &&
      (reportData["period"] === 1 || reportData["period"] === 2) &&
      typeof reportData["createdAt"] === "string" &&
      !Number.isNaN(Date.parse(reportData["createdAt"] as string)) &&
      typeof reportData["updatedAt"] === "string" &&
      !Number.isNaN(Date.parse(reportData["updatedAt"] as string)) &&
      Array.isArray(reportData["selections"]) &&
      reportData["selections"].every((selection: unknown) => {
        if (!selection || typeof selection !== "object") return false;

        const selectionData = selection as Record<string, unknown>;

        return (
          typeof selectionData["dimensionId"] === "string" &&
          typeof selectionData["topicId"] === "string" &&
          typeof selectionData["optionId"] === "string" &&
          typeof selectionData["topicTitle"] === "string" &&
          typeof selectionData["optionLabel"] === "string" &&
          typeof selectionData["text"] === "string"
        );
      }) &&
      typeof reportData["finalText"] === "string"
    );
  });
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

  const [partialSince, setPartialSince] = useState("");
  const [pendingPartialImport, setPendingPartialImport] = useState<PartialLessonTransfer | null>(
    null,
  );

  // Importação de horários do teacher-schedule.
  const [scheduleText, setScheduleText] = useState("");
  const [includeWaiting, setIncludeWaiting] = useState(false);
  const [scheduleData, setScheduleData] = useState<TeacherScheduleImport | null>(null);
  const [schedulePreview, setSchedulePreview] = useState<TeacherScheduleImportPreview | null>(null);
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleResult, setScheduleResult] = useState<TeacherScheduleImportResult | null>(null);
  const [confirmScheduleImport, setConfirmScheduleImport] = useState(false);

  const [pendingReportTransfer, setPendingReportTransfer] = useState<ReportCatalogTransfer | null>(
    null,
  );

  const activeYearId = state.settings.activeSchoolYearId;
  const activeYear = state.schoolYears.find((year) => year.id === activeYearId);

  const reportsWithMissingStudents =
    pendingReportTransfer?.studentReports.filter(
      (report) => !state.students.some((student) => student.id === report.studentId),
    ) ?? [];

  const handleExport = async () => {
    const backup = {
      app: APP_ID,
      transferType: "full-backup",
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

  const handlePartialExport = async () => {
    if (!partialSince) {
      setMessage("Seleciona a data e hora de referência.");
      return;
    }

    const sinceDate = new Date(partialSince);

    if (Number.isNaN(sinceDate.getTime())) {
      setMessage("A data de referência não é válida.");
      return;
    }

    const since = sinceDate.toISOString();

    const schoolYears = state.schoolYears
      .map((year) => ({
        id: year.id,
        students: year.students
          .map((ctx) => {
            const lessons = ctx.lessons.filter(
              (lesson) =>
                typeof lesson.updatedAt === "string" &&
                !Number.isNaN(Date.parse(lesson.updatedAt)) &&
                lesson.updatedAt > since,
            );

            // Só consideramos o plano quando este foi alterado
            // depois da data de referência.
            const planChanged =
              typeof ctx.annualPlanUpdatedAt === "string" &&
              !Number.isNaN(Date.parse(ctx.annualPlanUpdatedAt)) &&
              ctx.annualPlanUpdatedAt > since;

            // Só excluímos o aluno quando não há aulas nem plano alterados.
            if (lessons.length === 0 && !planChanged) return null;

            const result: PartialLessonTransfer["schoolYears"][number]["students"][number] = {
              studentId: ctx.studentId,
              lessons,
            };

            if (planChanged) {
              result.annualPlan = ctx.annualPlan;
              result.annualPlanUpdatedAt = ctx.annualPlanUpdatedAt;

              // Inclui os elementos do plano que não existem
              // no destino? Isso será decidido na importação.
              // Para já, exportamos os elementos do plano
              // disponíveis na biblioteca de origem.
              const planIds = new Set(ctx.annualPlan.map((entry) => entry.libraryItemId));

              result.libraryItems = state.library.filter((item) => planIds.has(item.id));
            }

            return result;
          })
          .filter((ctx): ctx is NonNullable<typeof ctx> => ctx !== null),
      }))
      .filter((year) => year.students.length > 0);

    const lessonCount = schoolYears.reduce(
      (total, year) =>
        total + year.students.reduce((yearTotal, ctx) => yearTotal + ctx.lessons.length, 0),
      0,
    );

    const planCount = schoolYears.reduce(
      (total, year) =>
        total + year.students.filter((student) => student.annualPlan !== undefined).length,
      0,
    );

    if (lessonCount === 0 && planCount === 0) {
      setMessage("Não foram encontradas aulas nem planos anuais alterados após essa data.");
      return;
    }

    const transfer: PartialLessonTransfer = {
      app: APP_ID,
      transferType: "partial-lessons",
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      since,
      schoolYears,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(transfer, null, 2));

      setMessage(`${lessonCount} aulas e ${planCount} planos anuais copiados para o clipboard.`);
    } catch {
      setMessage("Não foi possível copiar os dados.");
    }
  };

  const handleImport = () => {
    setImportError("");

    let parsed: unknown;

    try {
      parsed = JSON.parse(importText);
    } catch {
      setImportError("O texto não contém JSON válido.");
      return;
    }
    if (
      parsed &&
      typeof parsed === "object" &&
      "transferType" in parsed &&
      parsed.transferType === "reports-and-catalog"
    ) {
      if (!validateReportCatalogTransfer(parsed)) {
        setImportError("A transferência do catálogo e dos relatórios não tem um formato válido.");
        return;
      }

      setPendingImport(null);
      setPendingPartialImport(null);
      setPendingReportTransfer(parsed);
      return;
    }
    if (
      parsed &&
      typeof parsed === "object" &&
      "transferType" in parsed &&
      parsed.transferType === "partial-lessons"
    ) {
      if (!validatePartialLessonTransfer(parsed)) {
        setImportError("A transferência parcial não tem um formato válido.");
        return;
      }

      // Verificar se todos os anos e alunos existem no destino.
      for (const year of parsed.schoolYears) {
        const localYear = state.schoolYears.find((item) => item.id === year.id);

        if (!localYear) {
          setImportError(
            `O ano letivo "${year.id}" não existe nesta aplicação. A importação foi cancelada.`,
          );
          return;
        }

        for (const student of year.students) {
          const localStudent = localYear.students.find(
            (item) => item.studentId === student.studentId,
          );

          if (!localStudent) {
            setImportError(
              `O aluno "${student.studentId}" não existe no ano letivo "${year.id}". A importação foi cancelada.`,
            );
            return;
          }
        }
      }

      setPendingImport(null);
      setPendingPartialImport(parsed);
      return;
    }

    if (!validateBackup(parsed)) {
      setImportError(
        "O ficheiro não é uma cópia de segurança válida nem uma transferência parcial reconhecida.",
      );
      return;
    }

    setPendingPartialImport(null);
    setPendingImport(parsed.state);
  };

  const confirmBackupImport = () => {
    if (!pendingImport) return;

    const importedState: AppState = {
      ...pendingImport,
      version: 4,
      schools: pendingImport.schools ?? [],
      students: pendingImport.students.map((student) => ({
        ...student,
        schoolId: student.schoolId ?? null,
      })),
      reportCatalog: pendingImport.reportCatalog ?? createSeed().reportCatalog,
      studentReports: pendingImport.studentReports ?? [],
    };

    update(() => importedState);

    setPendingImport(null);
    setImportText("");
    setShowImport(false);
    setMessage("Dados importados com sucesso.");
  };

  const confirmPartialImport = () => {
    if (!pendingPartialImport) return;

    const transfer = pendingPartialImport;

    // Calcular os planos que serão efetivamente atualizados.
    const plansToApply: {
      yearId: string;
      studentId: string;
    }[] = [];

    const libraryIdsToAdd = new Set<string>();

    for (const incomingYear of transfer.schoolYears) {
      const localYear = state.schoolYears.find((year) => year.id === incomingYear.id);

      if (!localYear) continue;

      for (const incomingStudent of incomingYear.students) {
        const localStudent = localYear.students.find(
          (student) => student.studentId === incomingStudent.studentId,
        );

        if (!localStudent) continue;

        const incomingPlan = incomingStudent.annualPlan;
        const incomingPlanDate = incomingStudent.annualPlanUpdatedAt;

        const shouldApplyPlan =
          incomingPlan !== undefined &&
          incomingPlanDate !== undefined &&
          (localStudent.annualPlanUpdatedAt === undefined ||
            Date.parse(incomingPlanDate) > Date.parse(localStudent.annualPlanUpdatedAt));

        if (!shouldApplyPlan) continue;

        plansToApply.push({
          yearId: incomingYear.id,
          studentId: incomingStudent.studentId,
        });

        for (const item of incomingStudent.libraryItems ?? []) {
          const existsLocally = state.library.some((localItem) => localItem.id === item.id);

          if (!existsLocally) {
            libraryIdsToAdd.add(item.id);
          }
        }
      }
    }

    const appliedPlanCount = plansToApply.length;
    const addedLibraryCount = libraryIdsToAdd.size;

    update((current) => {
      const schoolYears = current.schoolYears.map((year) => {
        const incomingYear = transfer.schoolYears.find((item) => item.id === year.id);

        if (!incomingYear) return year;

        return {
          ...year,
          students: year.students.map((student) => {
            const incomingStudent = incomingYear.students.find(
              (item) => item.studentId === student.studentId,
            );

            if (!incomingStudent) return student;

            // Manter a lógica das aulas já testada.
            const incomingIds = new Set(incomingStudent.lessons.map((lesson) => lesson.id));

            let nextStudent = {
              ...student,
              lessons: [
                ...student.lessons.filter((lesson) => !incomingIds.has(lesson.id)),
                ...incomingStudent.lessons,
              ],
            };

            const shouldApplyPlan = plansToApply.some(
              (plan) => plan.yearId === year.id && plan.studentId === student.studentId,
            );

            if (shouldApplyPlan) {
              nextStudent = {
                ...nextStudent,
                annualPlan: incomingStudent.annualPlan!,
                annualPlanUpdatedAt: incomingStudent.annualPlanUpdatedAt!,
              };
            }

            return nextStudent;
          }),
        };
      });

      const existingLibraryIds = new Set(current.library.map((item) => item.id));

      const libraryItemsToAdd: LibraryItem[] = [];

      for (const year of transfer.schoolYears) {
        for (const incomingStudent of year.students) {
          const shouldApplyPlan = plansToApply.some(
            (plan) => plan.yearId === year.id && plan.studentId === incomingStudent.studentId,
          );

          if (!shouldApplyPlan) continue;

          for (const item of incomingStudent.libraryItems ?? []) {
            if (!existingLibraryIds.has(item.id)) {
              existingLibraryIds.add(item.id);
              libraryItemsToAdd.push(item);
            }
          }
        }
      }

      return {
        ...current,
        schoolYears,
        library: [...current.library, ...libraryItemsToAdd],
      };
    });

    const lessonCount = transfer.schoolYears.reduce(
      (total, year) =>
        total + year.students.reduce((sum, student) => sum + student.lessons.length, 0),
      0,
    );

    setPendingPartialImport(null);
    setShowImport(false);
    setImportText("");
    setImportError("");
    setMessage(
      `Importação concluída: ${lessonCount} aulas atualizadas ou acrescentadas, ${appliedPlanCount} planos atualizados e ${addedLibraryCount} elementos da biblioteca acrescentados.`,
    );
  };

  const confirmReportTransferImport = () => {
    if (!pendingReportTransfer) return;

    const transfer = pendingReportTransfer;

    const incomingReportsById = new Map(
      transfer.studentReports.map((report) => [report.id, report]),
    );

    update((current) => {
      const existingIds = new Set(current.studentReports.map((report) => report.id));

      const mergedReports = current.studentReports.map(
        (report) => incomingReportsById.get(report.id) ?? report,
      );

      const newReports = transfer.studentReports.filter(
        (report) => !existingIds.has(report.id),
      );

      return {
        ...current,
        reportCatalog: transfer.reportCatalog,
        studentReports: [...mergedReports, ...newReports],
      };
    });

    const incomingExistingCount = transfer.studentReports.filter((report) =>
      state.studentReports.some((existing) => existing.id === report.id),
    ).length;

    const incomingNewCount = transfer.studentReports.length - incomingExistingCount;

    setPendingReportTransfer(null);
    setShowImport(false);
    setImportText("");
    setImportError("");

    setMessage(
      `Importação concluída: catálogo substituído, ${incomingNewCount} relatório(s) acrescentado(s) e ${incomingExistingCount} atualizado(s).`,
    );
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
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Relatórios de avaliação
        </h2>

        <Link
          to="/definicoes/catalogo-relatorios"
          className="surface flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-muted/50"
        >
          <div>
            <h3 className="font-medium">Catálogo de formulações</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Editar os tópicos, os resumos e os textos dos relatórios.
            </p>
          </div>
          <Pencil className="size-5 shrink-0 text-muted-foreground" />
        </Link>
      </section>
      <SchoolManager />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Dados
        </h2>

        <div className="surface divide-y">
          <div className="px-4 py-4">
            <h3 className="font-medium">Exportar e importar dados</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Guarda ou transfere todos os dados da aplicação entre dispositivos. A importação
              substitui os dados atuais.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={handleExport}>
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

            <div className="mt-5 border-t pt-4">
              <h4 className="font-medium">Exportação parcial de aulas</h4>

              <p className="mt-1 text-sm text-muted-foreground">
                Exporta as aulas alteradas depois da data e hora escolhidas.
              </p>

              <label className="mt-3 block text-sm font-medium">Alterações posteriores a</label>

              <input
                type="datetime-local"
                className="field mt-1"
                value={partialSince}
                onChange={(event) => setPartialSince(event.target.value)}
              />

              <button type="button" className="btn-secondary mt-3" onClick={handlePartialExport}>
                <Copy className="size-4" />
                Exportar aulas alteradas
              </button>
            </div>

            {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
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
                Cola aqui o JSON exportado da aplicação de horários. Os alunos e horários serão
                integrados no ano letivo ativo, sem substituir os restantes dados.
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm">
            Ano letivo ativo: <strong>{activeYear?.name ?? "Nenhum selecionado"}</strong>
          </p>

          <label className="mt-4 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={includeWaiting}
              onChange={(event) => handleIncludeWaitingChange(event.target.checked)}
            />
            <span>Incluir também os alunos que estão na área de espera, sem horário</span>
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
                <li>Alunos abrangidos: {schedulePreview.totalPeople}</li>
                <li>Novos alunos: {schedulePreview.newStudents}</li>
                <li>Alunos já existentes: {schedulePreview.existingStudents}</li>
                <li>Alunos com horário: {schedulePreview.scheduledPeople}</li>
                <li>Horários a importar: {schedulePreview.schedules}</li>
                <li>Alunos sem horário a incluir: {schedulePreview.waitingPeople}</li>
              </ul>

              <p className="mt-3 text-sm text-muted-foreground">
                Os alunos que não constam do JSON não serão alterados. As aulas existentes e os
                respetivos conteúdos serão preservados sempre que possível.
              </p>
            </div>
          )}

          {scheduleResult && (
            <div role="status" className="mt-4 rounded-md border p-4 text-sm">
              <h3 className="font-medium">Importação concluída</h3>
              <ul className="mt-2 space-y-1">
                <li>Novos alunos: {scheduleResult.importedStudents}</li>
                <li>Alunos atualizados: {scheduleResult.updatedStudents}</li>
                <li>Horários importados: {scheduleResult.importedSchedules}</li>
                <li>Alunos importados sem horário: {scheduleResult.importedWithoutSchedule}</li>
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
              <button type="button" className="btn-secondary" onClick={resetScheduleImport}>
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
            <button type="button" className="btn-secondary" onClick={() => setShowImport(false)}>
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
        open={
          pendingImport !== null || pendingPartialImport !== null || pendingReportTransfer !== null
        }
        onOpenChange={(open) => {
          if (!open) {
            setPendingImport(null);
            setPendingPartialImport(null);
            setPendingReportTransfer(null);
          }
        }}
      >
        <DialogContent>
          <DialogTitle>
            {pendingReportTransfer
              ? "Confirmar importação do catálogo e relatórios"
              : pendingPartialImport
                ? "Confirmar importação parcial de aulas"
                : "Confirmar importação da cópia de segurança"}
          </DialogTitle>

          {pendingReportTransfer ? (
            <>
              <p>
                O catálogo atual será substituído integralmente. Serão acrescentados{" "}
                {
                  pendingReportTransfer.studentReports.filter(
                    (report) =>
                      !state.studentReports.some((existing) => existing.id === report.id),
                  ).length
                }{" "}
                relatórios novos e atualizados{" "}
                {
                  pendingReportTransfer.studentReports.filter((report) =>
                    state.studentReports.some((existing) => existing.id === report.id),
                  ).length
                }{" "}
                relatórios existentes. Os restantes relatórios e os outros dados da
                aplicação serão preservados.
              </p>

              {reportsWithMissingStudents.length > 0 && (
                <p role="alert" className="mt-3 rounded-md border p-3 text-sm">
                  <strong>Atenção:</strong>{" "}
                  {reportsWithMissingStudents.length === 1
                    ? "1 relatório refere-se a um aluno que não existe"
                    : `${reportsWithMissingStudents.length} relatórios referem-se a alunos que não existem`}{" "}
                  neste dispositivo. Estes relatórios serão importados normalmente, mas não estarão
                  disponíveis na página de um aluno até que o aluno correspondente seja adicionado.
                  Podes continuar a importação; os restantes dados não serão afetados.
                </p>
              )}
            </>
          ) : pendingPartialImport ? (
            <p>
                {pendingPartialImport.schoolYears.reduce(
                (total, year) =>
                    total +
                    year.students.reduce(
                    (sum, student) => sum + student.lessons.length,
                    0,
                    ),
                0,
                )}{" "}
                aulas. As aulas correspondentes serão atualizadas e as novas serão
                acrescentadas. Os restantes dados serão preservados.
            </p>
            ) : (
            <p>Importar estes dados irá substituir os dados atuais da aplicação.</p>
            )}

          <div className="flex justify-end gap-2">
            <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                setPendingImport(null);
                setPendingPartialImport(null);
                setPendingReportTransfer(null);
                }}
            >
                Cancelar
            </button>

            <button
                type="button"
                className="btn-primary"
                onClick={
                pendingReportTransfer
                    ? confirmReportTransferImport
                    : pendingPartialImport
                    ? confirmPartialImport
                    : confirmBackupImport
                }
            >
                Importar
            </button>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmScheduleImport} onOpenChange={setConfirmScheduleImport}>
        <DialogContent className="flex max-h-[85dvh] flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>Confirmar importação de horários</DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <p className="text-sm text-muted-foreground">
              Serão integrados {schedulePreview?.totalPeople ?? 0} alunos no ano letivo ativo. Os
              alunos que não constam do JSON não serão alterados. Esta operação não substitui a
              cópia de segurança nem gera automaticamente aulas para alunos novos.
            </p>

            {/* Mantém aqui a lista de alunos que já tens no diálogo, se existir. */}
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t pt-4">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setConfirmScheduleImport(false)}
            >
              Cancelar
            </button>

            <button type="button" className="btn-primary" onClick={confirmScheduleImportAction}>
              Importar horários
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
