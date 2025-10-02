"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

type User = { id: number; email: string; name: string; role: "admin" | "manager" | "member"; manager_id?: number | null; manager_name?: string | null };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({ email: "", name: "", tempPassword: "", role: "member" as "admin" | "manager" | "member", managerId: "" as string | "" });
  const [toast, setToast] = useState<{ open: boolean; title?: string; description?: string }>({ open: false });

  async function load() {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    if (!res.ok) { setToast({ open: true, title: "Error", description: "Failed to load users" }); return; }
    const data = await res.json();
    setUsers(data.users || []);
  }

  useEffect(() => { load(); }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        name: form.name,
        tempPassword: form.tempPassword,
        role: form.role,
        managerId: form.role === 'member' && form.managerId ? Number(form.managerId) : undefined,
      })
    });
    if (res.ok) {
      setForm({ email: "", name: "", tempPassword: "", role: "member", managerId: "" });
      setToast({ open: true, title: "Created", description: "User created." });
      await load();
    } else {
      const data = await res.json().catch(() => ({}));
      setToast({ open: true, title: "Error", description: data.error || "Create failed" });
    }
  }

  async function deleteUser(id: number) {
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== id));
      setToast({ open: true, title: "Deleted", description: "User removed." });
    } else {
      const data = await res.json().catch(() => ({}));
      setToast({ open: true, title: "Error", description: data.error || "Delete failed" });
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Admin — Users</h1>

      <form onSubmit={createUser} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label className="text-sm">Email</label>
          <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Name</label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Temp Password</label>
          <Input type="password" value={form.tempPassword} onChange={e => setForm(f => ({ ...f, tempPassword: e.target.value }))} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Role</label>
          <select className="border p-2 rounded" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}>
            <option value="member">member</option>
            <option value="manager">manager</option>
            <option value="admin">admin</option>
          </select>
        </div>
        {form.role === 'member' && (
          <div className="flex flex-col">
            <label className="text-sm">Manager</label>
            <select className="border p-2 rounded" value={form.managerId} onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))}>
              <option value="">Select manager…</option>
              {users.filter(u => u.role === 'manager').map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
              ))}
            </select>
          </div>
        )}
        <Button type="submit">Create</Button>
      </form>

      <table className="w-full border rounded text-sm">
        <thead>
          <tr className="text-left">
            <th className="p-2 border-b">ID</th>
            <th className="p-2 border-b">Email</th>
            <th className="p-2 border-b">Name</th>
            <th className="p-2 border-b">Role</th>
            <th className="p-2 border-b">Manager</th>
            <th className="p-2 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td className="p-2 border-b">{u.id}</td>
              <td className="p-2 border-b">{u.email}</td>
              <td className="p-2 border-b">{u.name}</td>
              <td className="p-2 border-b">{u.role}</td>
              <td className="p-2 border-b">{u.manager_name || '-'}</td>
              <td className="p-2 border-b">
                <Button variant="outline" size="sm" onClick={() => deleteUser(u.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Toast title={toast.title} description={toast.description} open={toast.open} onOpenChange={(o) => setToast(t => ({ ...t, open: o }))} />
    </div>
  );
}


