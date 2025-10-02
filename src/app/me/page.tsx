"use client";
import { useEffect, useState } from 'react';
import Calendar from '@/components/Calendar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';

function ym(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export default function MyOvertimePage() {
  const [month, setMonth] = useState(ym(new Date()));
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('18:00');
  const [endTime, setEndTime] = useState<string>('20:00');
  const [isPublicHoliday, setIsPublicHoliday] = useState<boolean>(false);
  const [isDesignatedDayOff, setIsDesignatedDayOff] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [entries, setEntries] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; title?: string; description?: string }>({ open: false });

  async function load() {
    try {
      const res = await fetch(`/api/overtime?month=${month}`, { cache: 'no-store' });
      const text = await res.text();
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
      if (!res.ok) {
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch (e: any) {
      setEntries([]);
    }
  }
  async function removeEntry(id: number) {
    const res = await fetch(`/api/overtime?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setEntries(prev => prev.filter(e => e.id !== id));
      setToast({ open: true, title: 'Deleted', description: 'Overtime entry removed.' });
    } else {
      const data = await res.json().catch(() => ({}));
      setToast({ open: true, title: 'Error', description: data.error || 'Delete failed' });
    }
  }

  useEffect(() => { load(); }, [month]);

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/overtime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, startTime, endTime, isPublicHoliday, isDesignatedDayOff, note })
    });
    if (res.ok) {
      setDate('');
      setStartTime('18:00');
      setEndTime('20:00');
      setIsPublicHoliday(false);
      setIsDesignatedDayOff(false);
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
      <Totals entries={entries} />
      <div className="flex items-center gap-2">
        <label>Month</label>
        <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
      </div>

      <form onSubmit={addEntry} className="flex gap-4 items-start flex-wrap">
        <div className="flex flex-col gap-2">
          <label className="text-sm">Date</label>
          <Calendar value={date} onChange={setDate} initialMonth={month} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Start Time</label>
          <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm">End Time</label>
          <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Public Holiday</label>
          <input type="checkbox" className="h-5 w-5" checked={isPublicHoliday} onChange={e => setIsPublicHoliday(e.target.checked)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Designated Day Off</label>
          <input type="checkbox" className="h-5 w-5" checked={isDesignatedDayOff} onChange={e => setIsDesignatedDayOff(e.target.checked)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Note</label>
          <Input value={note} onChange={e => setNote(e.target.value)} />
        </div>
        <Button type="submit">Add</Button>
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </form>

      <ul className="space-y-2">
        {entries.map(e => (
          <li key={e.id} className="border rounded p-3 flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">{e.date} • {e.startTime}–{e.endTime} ({(e.hours).toFixed(2)}h)</div>
              <div className="text-xs">150%: {Math.round((e.minutes150 || 0) / 60 * 100) / 100}h • 200%: {Math.round((e.minutes200 || 0) / 60 * 100) / 100}h</div>
              {e.note && <div className="text-sm text-gray-600">{e.note}</div>}
              <div className="text-xs">Status: {e.status}</div>
            </div>
            <div>
              <Button variant="outline" size="sm" onClick={() => removeEntry(e.id)}>Delete</Button>
            </div>
          </li>
        ))}
      </ul>
      <Toast title={toast.title} description={toast.description} open={toast.open} onOpenChange={(o) => setToast(t => ({ ...t, open: o }))} />
    </div>
  );
}

function Totals({ entries }: { entries: Array<any> }) {
  const minutes150 = entries.reduce((sum, e) => sum + (e.minutes150 || 0), 0);
  const minutes200 = entries.reduce((sum, e) => sum + (e.minutes200 || 0), 0);
  const h150 = Math.round((minutes150 / 60) * 100) / 100;
  const h200 = Math.round((minutes200 / 60) * 100) / 100;
  return (
    <div className="rounded border p-3 text-sm flex items-center gap-4">
      <div><span className="font-medium">150%:</span> {h150}h</div>
      <div><span className="font-medium">200%:</span> {h200}h</div>
    </div>
  );
}


