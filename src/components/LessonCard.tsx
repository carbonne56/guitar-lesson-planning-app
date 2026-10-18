import { Link } from "@tanstack/react-router";
import type { Lesson, Student } from "@/lib/model";
import { WEEKDAYS_SHORT, formatShort, weekdayOf } from "@/lib/dates";
import { segmentsText } from "@/lib/selectors";

const TYPE_LABEL = { transferred: "Transferida", extra: "Extra" } as const;

/** The single lesson card used everywhere lessons are listed. */
export function LessonCard({
  lesson,
  student,
  showStudent = true,
}: {
  lesson: Lesson;
  student: Student;
  showStudent?: boolean;
}) {
  const tone = lesson.status === "absence" ? "absence" : lesson.type !== "normal" ? "moved" : "default";
  const summary = segmentsText(lesson.summary);
  return (
    <Link to="/aulas/$lessonId" params={{ lessonId: lesson.id }} className="lesson-card" data-tone={tone}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-semibold">
            {showStudent ? student.name : `${WEEKDAYS_SHORT[weekdayOf(lesson.date)]}, ${formatShort(lesson.date)}`}
          </div>
          <div className="text-sm text-muted-foreground">
            {showStudent && `${formatShort(lesson.date)} · `}
            {lesson.time} · {lesson.duration} min
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          {lesson.type !== "normal" && <span className="chip chip-moved">{TYPE_LABEL[lesson.type]}</span>}
          {lesson.status === "absence" && <span className="chip chip-absence">Falta</span>}
        </div>
      </div>
      {summary && <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{summary}</p>}
    </Link>
  );
}
