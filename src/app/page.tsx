import { getAuthUser } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogClose, DialogContent } from "@/components/ui/dialog";

export default async function Home() {
  const user = await getAuthUser();
  return (
    <main className="p-6 space-y-6">
      {/* Navbar now handles header actions */}

      <div className="space-y-2">
        <div>Signed in as <b>{user?.name}</b> ({user?.role})</div>
      </div>

      {user?.role === 'manager' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Team Members" href="/manager/members" description="Add and view team members" />
          <Card title="Approvals" href="/manager/approvals" description="Review and approve/reject overtime" />
          <Card title="Totals" href="/manager/totals" description="Monthly hours per member" />
          <Card title="My Overtime" href="/me" description="Log your own overtime" />
        </div>
      ) : (
        <div>
          <Card title="My Overtime" href="/me" description="Log and view your overtime" />
        </div>
      )}
    </main>
  );
}

function Card({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link href={href} className="block rounded p-4 border border-foreground/20 hover:bg-foreground/5">
      <div className="text-lg font-medium">{title}</div>
      <div className="text-sm text-gray-600">{description}</div>
    </Link>
  );
}
