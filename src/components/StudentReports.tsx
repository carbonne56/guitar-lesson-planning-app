import { useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Pencil, Plus } from "lucide-react";
import type { StudentReport } from "@/lib/model";

interface StudentReportsProps {
  reports: StudentReport[];
  onCreate: () => void;
  onEdit: (report: StudentReport) => void;
}

export function StudentReports({ reports, onCreate, onEdit }: StudentReportsProps) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const sortedReports = [...reports].sort((a, b) => {
    const dateComparison = b.updatedAt.localeCompare(a.updatedAt);

    if (dateComparison !== 0) return dateComparison;

    return b.createdAt.localeCompare(a.createdAt);
  });

  const selectedIndex = sortedReports.findIndex((report) => report.id === selectedReportId);

  const currentIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const selectedReport = sortedReports[currentIndex];

  const selectPrevious = () => {
    if (currentIndex < sortedReports.length - 1) {
      setSelectedReportId(sortedReports[currentIndex + 1].id);
    }
  };

  const selectNext = () => {
    if (currentIndex > 0) {
      setSelectedReportId(sortedReports[currentIndex - 1].id);
    }
  };

  return (
    <section className="disclosure space-y-4 p-4">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <FileText className="size-5" />
          <span className="font-semibold">Relatórios de avaliação</span>
        </span>

        {isOpen ? (
          <ChevronLeft className="size-4 rotate-[-90deg]" />
        ) : (
          <ChevronRight className="size-4" />
        )}
      </button>
      {isOpen && (
        <div className="space-y-4">
          {sortedReports.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Ainda não existem relatórios para este aluno.
              </p>

              <button type="button" className="btn-primary" onClick={onCreate}>
                <Plus className="size-4" />
                Criar primeiro relatório
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={selectPrevious}
                  disabled={currentIndex === sortedReports.length - 1}
                  aria-label="Relatório anterior"
                >
                  <ChevronLeft className="size-4" />
                </button>

                <div className="min-w-0 flex-1 text-center">
                  <div className="font-medium">
                    {selectedReport?.name ||
                      `Relatório do ${selectedReport?.period === 1 ? "1.º" : "2.º"} período`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedReport
                      ? new Date(selectedReport.updatedAt).toLocaleDateString("pt-PT")
                      : ""}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-ghost"
                  onClick={selectNext}
                  disabled={currentIndex === 0}
                  aria-label="Relatório seguinte"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>

              <div className="space-y-1">
                <label htmlFor="student-report-select" className="text-sm text-muted-foreground">
                  Selecionar relatório
                </label>
                <select
                  id="student-report-select"
                  className="field w-full"
                  value={selectedReport?.id ?? ""}
                  onChange={(event) => setSelectedReportId(event.target.value)}
                >
                  {sortedReports.map((report) => (
                    <option key={report.id} value={report.id}>
                      {report.name || `Relatório do ${report.period === 1 ? "1.º" : "2.º"} período`}{" "}
                      — {new Date(report.updatedAt).toLocaleDateString("pt-PT")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-h-24 whitespace-pre-wrap rounded-lg border p-3 text-sm">
                {selectedReport?.finalText || (
                  <span className="text-muted-foreground">Este relatório ainda não tem texto.</span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  Relatório {currentIndex + 1} de {sortedReports.length}
                </span>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => selectedReport && onEdit(selectedReport)}
                  disabled={!selectedReport}
                >
                  <Pencil className="size-4" />
                  Editar relatório
                </button>
              </div>

              <button type="button" className="btn-primary" onClick={onCreate}>
                <Plus className="size-4" />
                Criar novo relatório
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
