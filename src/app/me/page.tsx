"use client";
import { useEffect, useState } from 'react';
import Calendar from '@/components/Calendar';

function ym(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export default function MyOvertimePage() {
  const [month, setMonth] = useState(ym(new Date()));
  const [date, setDate] = useState<string>('');
  const [hours, setHours] = useState<number>(1);
  const [note, setNote] = useState<string>('');
  const [entries, setEntries] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/overtime?month=${month}`);
    const data = await res.json();
    setEntries(data.entries || []);
  }

  useEffect(() => { load(); }, [month]);

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/overtime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, hours, note })
    });
    if (res.ok) {
      setDate('');
      setHours(1);
      setNote('');
      await load();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Failed to add');
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">My Overtime</h1>
      <div className="flex items-center gap-2">
        <label>Month</label>
        <input className="border p-2 rounded" type="month" value={month} onChange={e => setMonth(e.target.value)} />
      </div>

      <form onSubmit={addEntry} className="flex gap-4 items-start flex-wrap">
        <div className="flex flex-col gap-2">
          <label className="text-sm">Date</label>
          <Calendar value={date} onChange={setDate} initialMonth={month} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Hours</label>
          <input className="border p-2 rounded" type="number" step="0.25" min="0.25" max="24" value={hours} onChange={e => setHours(parseFloat(e.target.value))} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Note</label>
          <input className="border p-2 rounded" value={note} onChange={e => setNote(e.target.value)} />
        </div>
        <button className="bg-black text-white px-4 py-2 rounded" type="submit">Add</button>
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </form>

      <ul className="space-y-2">
        {entries.map(e => (
          <li key={e.id} className="border rounded p-3 flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">{e.date} • {e.hours}h</div>
              {e.note && <div className="text-sm text-gray-600">{e.note}</div>}
              <div className="text-xs">Status: {e.status}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}


