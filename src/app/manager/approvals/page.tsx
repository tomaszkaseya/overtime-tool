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

export default function ApprovalsPage() {
  const [month, setMonth] = useState(ym(new Date()));
  const [entries, setEntries] = useState<any[]>([]);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ open: boolean; title?: string; description?: string }>({ open: false });

  async function load() {
    const res = await fetch(`/api/manager/approvals?month=${month}`);
    const data = await res.json();
    setEntries(data.entries || []);
  }

  useEffect(() => { load(); }, [month]);

  async function act(id: number, action: 'approve' | 'reject') {
    setPendingId(id);
    // Optimistic update
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: action === 'approve' ? 'approved' : 'rejected' } : e));
    const res = await fetch('/api/manager/approvals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId: id, action }),
    });
    if (res.ok) {
      setToast({ open: true, title: action === 'approve' ? 'Approved' : 'Rejected', description: `Entry ${action}d.` });
      await load();
    } else {
      setToast({ open: true, title: 'Error', description: 'Action failed.' });
      await load(); // revert optimistic update
    }
    setPendingId(null);
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Approvals</h1>
      <div className="flex items-center gap-2">
        <label>Month</label>
        <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
      </div>
      <ul className="space-y-2">
        {entries.map(e => (
          <li key={e.id} className="border rounded p-3 flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">{e.user_name} • {e.date} • {e.startTime}–{e.endTime} ({Number(e.hours).toFixed(2)}h)</div>
              <div className="text-xs">150%: {Math.round((e.minutes150 || 0) / 60 * 100) / 100}h • 200%: {Math.round((e.minutes200 || 0) / 60 * 100) / 100}h</div>
              {e.note && <div className="text-sm text-gray-600">{e.note}</div>}
              <div className="text-xs">
                <span
                  className={
                    e.status === 'approved'
                      ? 'inline-flex items-center rounded px-2 py-0.5 bg-green-100 text-green-800'
                      : e.status === 'rejected'
                      ? 'inline-flex items-center rounded px-2 py-0.5 bg-red-100 text-red-800'
                      : 'inline-flex items-center rounded px-2 py-0.5 bg-gray-100 text-gray-800'
                  }
                >
                  {e.status}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={e.status === 'approved' ? 'ghost' : 'outline'}
                size="sm"
                disabled={e.status === 'approved' || pendingId === e.id}
                onClick={() => act(e.id, 'approve')}
              >
                {e.status === 'approved' ? 'Approved' : 'Approve'}
              </Button>
              <Button
                variant={e.status === 'rejected' ? 'ghost' : 'outline'}
                size="sm"
                disabled={e.status === 'rejected' || pendingId === e.id}
                onClick={() => act(e.id, 'reject')}
              >
                {e.status === 'rejected' ? 'Rejected' : 'Reject'}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <Toast
        title={toast.title}
        description={toast.description}
        open={toast.open}
        onOpenChange={(o) => setToast(t => ({ ...t, open: o }))}
      />
    </div>
  );
}



