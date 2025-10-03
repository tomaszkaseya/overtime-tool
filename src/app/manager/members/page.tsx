"use client";
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { Dialog, DialogTrigger, DialogContent, DialogClose } from '@/components/ui/dialog';

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [tempPassword, setTempPassword] = useState('Temp1234');
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState<{ open: boolean; title: string; description?: string } | null>(null);
  const [openForUserId, setOpenForUserId] = useState<number | null>(null);
  const [periodsByUser, setPeriodsByUser] = useState<Record<number, any[]>>({});

  async function load() {
    const res = await fetch('/api/manager/members');
    const data = await res.json();
    const list = data.members || [];
    setMembers(list);
    // Preload periods for each member
    for (const m of list) {
      loadPeriods(m.id);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function loadPeriods(userId: number) {
    const res = await fetch(`/api/manager/periods?userId=${userId}`, { cache: 'no-store' });
    const data = await res.json();
    setPeriodsByUser(prev => ({ ...prev, [userId]: data.periods || [] }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/manager/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, tempPassword }),
    });
    if (res.ok) {
      setEmail('');
      setName('');
      await load();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Failed to add member');
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Team Members</h1>
      <form onSubmit={onSubmit} className="flex gap-2 items-end flex-wrap">
        <div className="flex flex-col">
          <label className="text-sm">Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Email</label>
          <Input value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Temp Password</label>
          <Input value={tempPassword} onChange={e => setTempPassword(e.target.value)} />
        </div>
        <Button type="submit">Add</Button>
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </form>

      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.id} className="border rounded p-3">
            <div className="font-medium">{m.name}</div>
            <div className="text-sm text-gray-600">{m.email}</div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => { setOpenForUserId(m.id); setStartDate(''); setEndDate(''); setReason(''); }}
              >Open Period</Button>
              <Button
                variant="outline"
                onClick={() => loadPeriods(m.id)}
              >Refresh Periods</Button>
            </div>

            {/* Periods list */}
            <div className="mt-3">
              <div className="text-sm font-medium mb-1">Open Periods</div>
              <ul className="space-y-1">
                {(periodsByUser[m.id] || []).map((p) => (
                  <li key={p.id} className="text-sm flex items-center justify-between border rounded px-2 py-1">
                    <div>
                      {p.startDate} – {p.endDate}
                      {p.reason ? <span className="text-gray-600"> • {p.reason}</span> : null}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const ok = confirm('Remove this period?');
                        if (!ok) return;
                        const res = await fetch(`/api/manager/periods?id=${p.id}`, { method: 'DELETE' });
                        if (res.ok) {
                          setToast({ open: true, title: 'Removed', description: `${p.startDate} → ${p.endDate}` });
                          await loadPeriods(m.id);
                        } else {
                          const data = await res.json().catch(() => ({}));
                          setError(data.error || 'Failed to delete period');
                        }
                      }}
                    >Remove</Button>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
      {/* Open Period Modal */}
      <Dialog open={openForUserId !== null} onOpenChange={(o) => { if (!o) setOpenForUserId(null); }}>
        <DialogContent>
          <div className="space-y-3">
            <div className="text-lg font-semibold">Open Overtime Period</div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex flex-col">
                <label className="text-sm">Start</label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="flex flex-col">
                <label className="text-sm">End</label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <div className="flex flex-col">
                <label className="text-sm">Reason</label>
                <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Why is this period opened?" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={async () => {
                  if (!openForUserId) return;
                  setError(null);
                  if (!startDate || !endDate) { setError('Start and End required'); return; }
                  const res = await fetch('/api/manager/periods', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: openForUserId, startDate, endDate, reason }),
                  });
                  if (res.ok) {
                    setToast({ open: true, title: 'Period opened', description: `${startDate} → ${endDate}` });
                    await loadPeriods(openForUserId);
                    setOpenForUserId(null);
                  } else {
                    const data = await res.json().catch(() => ({}));
                    setError(data.error || 'Failed to open period');
                  }
                }}
              >Save</Button>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
          </div>
        </DialogContent>
      </Dialog>
      <Toast title={error ? 'Error' : toast?.title} description={error ? error : toast?.description} open={Boolean(error) || Boolean(toast?.open)} onOpenChange={(o) => { if (!o) { setError(null); setToast(null); } }} />
    </div>
  );
}



