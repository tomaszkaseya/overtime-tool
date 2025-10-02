# Overtime Tool

A lightweight, role‑based app for tracking and approving employee overtime. Employees can log their own overtime; managers can manage team members, review requests, and see monthly totals.

## Features

- **Authentication**: Email/password login with session-based auth
- **Role-based access**: Manager vs. Employee views
- **Employee – My Overtime**: Log and view your own overtime entries (`/me`)
- **Manager – Team Members**: Add and view team members (`/manager/members`)
- **Manager – Approvals**: Review and approve/reject overtime requests (`/manager/approvals`)
- **Manager – Totals**: View monthly hours per member (`/manager/totals`)
- **Logout**: End session from the dashboard
- **Tech stack**: Next.js App Router, TypeScript, Tailwind CSS

## Getting Started

1. Install dependencies

```bash
npm install
```

2. Run the development server

```bash
npm run dev
```

3. Open `http://localhost:3000/login`

- Demo manager credentials (for local/dev): `manager@example.com` / `password123`

## Key Routes

- `/login` – Sign in
- `/` – Dashboard (role-aware)
- `/me` – Employee overtime
- `/manager/members` – Team members
- `/manager/approvals` – Approvals
- `/manager/totals` – Monthly totals

## Project Structure (high level)

- `src/app/page.tsx` – Dashboard
- `src/app/login/page.tsx` – Login page
- `src/app/me` – Employee area
- `src/app/manager/*` – Manager tools

## Notes

- The authentication endpoints live under `/api/auth/*`. Swap these out to integrate with your own identity provider or user store.
