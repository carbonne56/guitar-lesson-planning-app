import { Link } from "@tanstack/react-router";
import { BookOpen, CalendarDays, Sun, Users } from "lucide-react";

const items = [
  { to: "/", label: "Hoje", icon: Sun, exact: true },
  { to: "/alunos", label: "Alunos", icon: Users, exact: false },
  { to: "/biblioteca", label: "Biblioteca", icon: BookOpen, exact: false },
  { to: "/calendario", label: "Calendário", icon: CalendarDays, exact: false },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-xl">
        {items.map(({ to, label, icon: Icon, exact }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact }}
              className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-muted-foreground data-[status=active]:text-primary"
            >
              <Icon className="size-5" strokeWidth={1.8} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
