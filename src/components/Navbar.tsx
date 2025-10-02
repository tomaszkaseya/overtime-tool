"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function Navbar({ user }: { user: { name: string; role: string } | null }) {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-40 w-full border-b border-foreground/20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-semibold">Overtime</Link>
          {user?.role === 'manager' && (
            <div className="hidden md:flex items-center gap-2 text-sm">
              <NavLink href="/manager/members" active={pathname.startsWith('/manager/members')}>Members</NavLink>
              <NavLink href="/manager/approvals" active={pathname.startsWith('/manager/approvals')}>Approvals</NavLink>
              <NavLink href="/manager/totals" active={pathname.startsWith('/manager/totals')}>Totals</NavLink>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'admin' && (
            <Link href="/admin/users" className="text-sm underline hidden md:inline">Admin</Link>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">Theme</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => document.documentElement.classList.remove('dark')}>Light</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => document.documentElement.classList.add('dark')}>Dark</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {user ? (
            <form action="/api/auth/logout" method="post">
              <Button size="sm" type="submit">Logout</Button>
            </form>
          ) : (
            <Link href="/login" className="text-sm underline">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded px-2 py-1 bg-foreground/10"
          : "rounded px-2 py-1 hover:bg-foreground/5"
      }
    >
      {children}
    </Link>
  );
}


