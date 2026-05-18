export interface ScheduleDateRange {
  from: string;
  to: string;
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Período padrão: hoje até +30 dias */
export function getDefaultSchedulePeriod(): ScheduleDateRange {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 30);
  return {
    from: toDateInputValue(from),
    to: toDateInputValue(to),
  };
}

export function filterStreamsByDateRange<
  T extends { scheduledDate: string | Date },
>(streams: T[], range: ScheduleDateRange): T[] {
  if (!range.from && !range.to) return streams;

  return streams.filter((s) => {
    const d = new Date(s.scheduledDate);
    d.setHours(0, 0, 0, 0);

    if (range.from) {
      const from = new Date(range.from);
      from.setHours(0, 0, 0, 0);
      if (d < from) return false;
    }

    if (range.to) {
      const to = new Date(range.to);
      to.setHours(23, 59, 59, 999);
      if (d > to) return false;
    }

    return true;
  });
}
