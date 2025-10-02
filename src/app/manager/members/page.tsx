"use client";
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [tempPassword, setTempPassword] = useState('Temp1234');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/manager/members');
    const data = await res.json();
    setMembers(data.members || []);
  }

  useEffect(() => {
    load();
  }, []);

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
          </li>
        ))}
      </ul>
      <Toast title={error ? 'Error' : undefined} description={error || undefined} open={Boolean(error)} onOpenChange={(o) => !o && setError(null)} />
    </div>
  );
}



