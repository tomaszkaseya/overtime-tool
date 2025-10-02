"use client";
import { useEffect, useMemo, useState } from "react";

type CalendarProps = {
  value?: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  initialMonth?: string; // YYYY-MM
};

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseYmd(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map((v) => Number(v));
  const dt = new Date(y, m - 1, d);
  if (isNaN(dt.getTime())) return null;
  return dt;
}

function parseYm(value: string): Date | null {
  if (!/^\d{4}-\d{2}$/.test(value)) return null;
  const [y, m] = value.split("-").map((v) => Number(v));
  const dt = new Date(y, m - 1, 1);
  if (isNaN(dt.getTime())) return null;
  return dt;
}

export default function Calendar({ value, onChange, initialMonth }: CalendarProps) {
  const selected = useMemo(() => (value ? parseYmd(value) : null), [value]);
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    if (selected) return new Date(selected.getFullYear(), selected.getMonth(), 1);
    const fromInitial = initialMonth ? parseYm(initialMonth) : null;
    return fromInitial ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });

  useEffect(() => {
    if (initialMonth) {
      const dt = parseYm(initialMonth);
      if (dt) setViewMonth(new Date(dt.getFullYear(), dt.getMonth(), 1));
    }
  }, [initialMonth]);

  const daysMatrix = useMemo(() => {
    const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const lastDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    const startWeekday = firstDay.getDay(); // 0 Sun ... 6 Sat
    const totalDays = lastDay.getDate();

    const cells: Array<Date | null> = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: Array<Array<Date | null>> = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [viewMonth]);

  function prevMonth() {
    setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextMonth() {
    setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  const monthLabel = useMemo(() => {
    return viewMonth.toLocaleString(undefined, { month: "long", year: "numeric" });
  }, [viewMonth]);

  return (
    <div className="border rounded p-3 w-full max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <button type="button" className="px-2 py-1 border rounded" onClick={prevMonth} aria-label="Previous month">‹</button>
        <div className="font-medium select-none">{monthLabel}</div>
        <button type="button" className="px-2 py-1 border rounded" onClick={nextMonth} aria-label="Next month">›</button>
      </div>
      <div className="grid grid-cols-7 text-xs text-gray-600 mb-1">
        <div className="text-center">Sun</div>
        <div className="text-center">Mon</div>
        <div className="text-center">Tue</div>
        <div className="text-center">Wed</div>
        <div className="text-center">Thu</div>
        <div className="text-center">Fri</div>
        <div className="text-center">Sat</div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {daysMatrix.flat().map((day, idx) => {
          if (!day) return <div key={idx} className="h-9" />;
          const ymd = toYmd(day);
          const isSelected = selected && toYmd(selected) === ymd;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(ymd)}
              className={
                "h-9 rounded text-sm transition-colors " +
                (isSelected
                  ? "bg-black text-white"
                  : "hover:bg-gray-100 border")
              }
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}



