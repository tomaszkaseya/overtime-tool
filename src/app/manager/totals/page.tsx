"use client";
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';

function ym(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export default function TotalsPage() {
  const [month, setMonth] = useState(ym(new Date()));
  const [totals, setTotals] = useState<any[]>([]);
  const [toast, setToast] = useState<{ open: boolean; title?: string; description?: string }>({ open: false });
  const [allEntries, setAllEntries] = useState<any[] | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  async function load() {
    const res = await fetch(`/api/manager/totals?month=${month}`);
    const data = await res.json();
    setTotals(data.totals || []);
  }

  useEffect(() => { load(); }, [month]);
  useEffect(() => { setAllEntries(null); setExpanded({}); }, [month]);

  async function ensureEntries() {
    if (allEntries) return allEntries;
    const res = await fetch(`/api/manager/approvals?month=${month}`, { cache: 'no-store' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setToast({ open: true, title: 'Error', description: data.error || 'Failed to load entries' });
      return [] as any[];
    }
    const data = await res.json();
    setAllEntries(Array.isArray(data.entries) ? data.entries : []);
    return Array.isArray(data.entries) ? data.entries : [];
  }

  function downloadAllCsv() {
    if (!allEntries || allEntries.length === 0) return;
    const header = ['Member','Date','Start','End','150% (h)','200% (h)','Notes'];
    const toHours = (m: number) => Math.round((m / 60) * 100) / 100;
    const approved = allEntries.filter(e => e.status === 'approved');
    const rows = approved.map(e => [
      e.user_name,
      e.date,
      e.startTime,
      e.endTime,
      toHours(e.minutes150 || 0).toString(),
      toHours(e.minutes200 || 0).toString(),
      (e.note || '').replace(/"/g, '""')
    ]);
    // Per-user totals
    const byUser: Record<string, { m150: number; m200: number }> = {};
    for (const e of approved) {
      const key = e.user_name;
      byUser[key] = byUser[key] || { m150: 0, m200: 0 };
      byUser[key].m150 += (e.minutes150 || 0);
      byUser[key].m200 += (e.minutes200 || 0);
    }
    const totalsRows: string[][] = [];
    for (const [name, t] of Object.entries(byUser)) {
      totalsRows.push([`TOTAL ${name}`,'','','', toHours(t.m150).toString(), toHours(t.m200).toString(), '']);
    }
    const grand150 = Object.values(byUser).reduce((s, t) => s + t.m150, 0);
    const grand200 = Object.values(byUser).reduce((s, t) => s + t.m200, 0);
    const grandRow = ['GRAND TOTAL','','','', toHours(grand150).toString(), toHours(grand200).toString(), ''];

    const all = [header, ...rows, [], ...totalsRows, grandRow];
    const csv = all.map(r => r.map(v => (v && /[",\n]/.test(v) ? `"${v}"` : (v || ''))).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `overtime_${month}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function toHours(mins: number | undefined | null) {
    return Math.round((((mins || 0) / 60)) * 100) / 100;
  }

  async function clearAll() {
    if (!confirm('This will delete ALL overtime entries for ALL users. Continue?')) return;
    const res = await fetch('/api/manager/overtime/clear', { method: 'POST' });
    if (res.ok) {
      setToast({ open: true, title: 'Cleared', description: 'All overtime entries deleted.' });
      await load();
    } else {
      const data = await res.json().catch(() => ({}));
      setToast({ open: true, title: 'Error', description: data.error || 'Failed to clear' });
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Monthly Totals</h1>
      <div className="flex items-center gap-2">
        <label>Month</label>
        <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
        <div className="ml-auto">
          <Button variant="outline" size="sm" className="mr-2" onClick={async () => { await ensureEntries(); downloadAllCsv(); }}>Download CSV (All)</Button>
          <Button variant="outline" size="sm" onClick={clearAll}>Clear All Overtime</Button>
        </div>
      </div>
      <table className="w-full border rounded">
        <thead>
          <tr className="text-left">
            <th className="p-2 border-b">Member</th>
            <th className="p-2 border-b">Approved 150% (h)</th>
            <th className="p-2 border-b">Approved 200% (h)</th>
            <th className="p-2 border-b">Pending 150% (h)</th>
            <th className="p-2 border-b">Pending 200% (h)</th>
            <th className="p-2 border-b">Details</th>
          </tr>
        </thead>
        <tbody>
          {totals.map(t => (
            <>
              <tr key={t.user_id}>
                <td className="p-2 border-b">{t.user_name}</td>
                <td className="p-2 border-b">{toHours(t.approved_minutes_150)}</td>
                <td className="p-2 border-b">{toHours(t.approved_minutes_200)}</td>
                <td className="p-2 border-b">{toHours(t.pending_minutes_150)}</td>
                <td className="p-2 border-b">{toHours(t.pending_minutes_200)}</td>
                <td className="p-2 border-b">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await ensureEntries();
                      setExpanded((e) => ({ ...e, [t.user_id]: !e[t.user_id] }));
                    }}
                  >
                    {expanded[t.user_id] ? 'Hide' : 'View'}
                  </Button>
                </td>
              </tr>
              {expanded[t.user_id] && (
                <tr>
                  <td colSpan={6} className="p-0 border-b">
                    <UserDetails userId={t.user_id} userName={t.user_name} entries={allEntries || []} />
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
      <Toast title={toast.title} description={toast.description} open={toast.open} onOpenChange={(o) => setToast(t => ({ ...t, open: o }))} />
    </div>
  );
}

function UserDetails({ userId, userName, entries }: { userId: number; userName: string; entries: any[] }) {
  const mine = entries.filter(e => e.user_id === userId && e.status === 'approved');
  const sum150 = mine.reduce((s, e) => s + (e.minutes150 || 0), 0);
  const sum200 = mine.reduce((s, e) => s + (e.minutes200 || 0), 0);
  const toHours = (m: number) => Math.round((m / 60) * 100) / 100;
  function toCsv() {
    const header = ['Date','Start','End','150% (h)','200% (h)','Notes'];
    const rows = mine.map(e => [
      e.date,
      e.startTime,
      e.endTime,
      toHours(e.minutes150 || 0).toString(),
      toHours(e.minutes200 || 0).toString(),
      (e.note || '').replace(/"/g, '""')
    ]);
    const all = [header, ...rows, ['Sum','','', toHours(sum150).toString(), toHours(sum200).toString(), '']];
    const csv = all.map(r => r.map(v => /[",\n]/.test(v) ? `"${v}"` : v).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${userName.replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  return (
    <div className="p-3 bg-foreground/5">
      <div className="text-sm font-medium mb-2 flex items-center justify-between">
        <span>{userName} — Details</span>
        <Button variant="outline" size="sm" onClick={toCsv}>Download CSV</Button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="p-2">Date</th>
            <th className="p-2">Time</th>
            <th className="p-2">150% (h)</th>
            <th className="p-2">200% (h)</th>
            <th className="p-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {mine.map(e => (
            <tr key={e.id} className="border-t">
              <td className="p-2 align-top">{e.date}</td>
              <td className="p-2 align-top">{e.startTime}–{e.endTime}</td>
              <td className="p-2 align-top">{toHours(e.minutes150 || 0)}</td>
              <td className="p-2 align-top">{toHours(e.minutes200 || 0)}</td>
              <td className="p-2 align-top">{e.note || ''}</td>
            </tr>
          ))}
          <tr className="border-t font-medium">
            <td className="p-2" colSpan={2}>Sum</td>
            <td className="p-2">{toHours(sum150)}</td>
            <td className="p-2">{toHours(sum200)}</td>
            <td className="p-2"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}



