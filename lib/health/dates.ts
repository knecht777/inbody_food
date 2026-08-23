export function dateIdFor(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function monthIdFor(date: Date): string {
  return date.toISOString().slice(0, 7);
}

export function monthRange(monthId: string): { start: string; end: string } {
  const [year, month] = monthId.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return { start: dateIdFor(start), end: dateIdFor(end) };
}

function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}

export function weekIdFor(date: Date): string {
  const { year, week } = getISOWeek(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function weekRange(weekId: string): { start: string; end: string } {
  const [yearStr, weekStr] = weekId.split("-W");
  const year = Number(yearStr);
  const week = Number(weekStr);

  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dayOfWeek = simple.getUTCDay() || 7;
  const monday = new Date(simple);
  if (dayOfWeek <= 4) monday.setUTCDate(simple.getUTCDate() - dayOfWeek + 1);
  else monday.setUTCDate(simple.getUTCDate() + 8 - dayOfWeek);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return { start: dateIdFor(monday), end: dateIdFor(sunday) };
}
