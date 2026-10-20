import type { ISODate } from "./model";

export const WEEKDAYS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

export const WEEKDAYS_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

const pad = (n: number) => String(n).padStart(2, "0");

export function toISO(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISO(s: ISODate): Date {
  const [y = 0, m = 1, d = 1] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): ISODate {
  return toISO(new Date());
}

export function addDays(s: ISODate, n: number): ISODate {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function weekdayOf(s: ISODate): number {
  return parseISO(s).getDay();
}

export function ageFrom(birthDate: ISODate | null, on: ISODate = todayISO()): number | null {
  if (!birthDate) return null;
  const b = parseISO(birthDate);
  const t = parseISO(on);
  let age = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate()))
    age--;
  return age;
}

const longFmt = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long", year: "numeric" });
const shortFmt = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short" });

export function formatLong(s: ISODate): string {
  return longFmt.format(parseISO(s));
}

export function formatShort(s: ISODate): string {
  return shortFmt.format(parseISO(s)).replace(".", "");
}
