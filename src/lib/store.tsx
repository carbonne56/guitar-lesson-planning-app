import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { AppState, Lesson, SchoolYear, YearStudent } from "./model";
import { loadState, saveState } from "./storage";

interface Store {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
}

const Ctx = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => setState(loadState()), []);

  const update = useCallback((fn: (s: AppState) => AppState) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      saveState(next);
      return next;
    });
  }, []);

  if (!state) return <div className="min-h-screen bg-background" />;
  return <Ctx.Provider value={{ state, update }}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}

// Immutable update helpers
export function mapYear(s: AppState, yearId: string, fn: (y: SchoolYear) => SchoolYear): AppState {
  return { ...s, schoolYears: s.schoolYears.map((y) => (y.id === yearId ? fn(y) : y)) };
}

export function mapCtx(
  s: AppState,
  yearId: string,
  studentId: string,
  fn: (c: YearStudent) => YearStudent,
): AppState {
  return mapYear(s, yearId, (y) => ({
    ...y,
    students: y.students.map((c) => (c.studentId === studentId ? fn(c) : c)),
  }));
}

export function mapLesson(s: AppState, lessonId: string, fn: (l: Lesson) => Lesson): AppState {
  return {
    ...s,
    schoolYears: s.schoolYears.map((y) => ({
      ...y,
      students: y.students.map((c) =>
        c.lessons.some((l) => l.id === lessonId)
          ? {
              ...c,
              lessons: c.lessons.map((l) => {
                if (l.id !== lessonId) return l;

                const updatedLesson = fn(l);

                return {
                  ...updatedLesson,
                  updatedAt: new Date().toISOString(),
                };
              }),
            }
          : c,
      ),
    })),
  };
}
