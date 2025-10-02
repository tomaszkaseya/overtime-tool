"use client";
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

function ym(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export default function TotalsPage() {
  const [month, setMonth] = useState(ym(new Date()));
  const [totals, setTotals] = useState<any[]>([]);

  async function load() {
    const res = await fetch(`/api/manager/totals?month=${month}`);
    const data = await res.json();
    setTotals(data.totals || []);
  }

  useEffect(() => { load(); }, [month]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Monthly Totals</h1>
      <div className="flex items-center gap-2">
        <label>Month</label>
        <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
      </div>
      <table className="w-full border rounded">
        <thead>
          <tr className="text-left">
            <th className="p-2 border-b">Member</th>
            <th className="p-2 border-b">Approved Hours</th>
            <th className="p-2 border-b">Pending Hours</th>
          </tr>
        </thead>
        <tbody>
          {totals.map(t => (
            <tr key={t.user_id}>
              <td className="p-2 border-b">{t.user_name}</td>
              <td className="p-2 border-b">{Number(t.approved_hours || 0)}</td>
              <td className="p-2 border-b">{Number(t.pending_hours || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}



