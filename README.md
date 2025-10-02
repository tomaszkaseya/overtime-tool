# Overtime Tool

A lightweight, role‑based app for tracking and approving employee overtime. Employees can log their own overtime; managers can manage team members, review requests, and see monthly totals.

## Features

- **Authentication**: Email/password login with session-based auth
- **Role-based access**: Manager vs. Employee views
- **Employee – My Overtime**: Log and view your own overtime entries (`/me`)
  - Time-range entry (Start–End)
  - Auto split into 150% vs 200% minutes based on Polish Labour Code rules
  - Flags for Public Holiday and Designated Day Off
- **Manager – Team Members**: Add and view team members (`/manager/members`)
- **Manager – Approvals**: Review and approve/reject overtime requests (`/manager/approvals`)
  - Shows Start–End and 150%/200% split per entry
- **Manager – Totals**: View monthly hours per member (`/manager/totals`)
  - Per-user totals split into 150% and 200%
  - Per-user detail table (Date | Start–End | 150% | 200% | Notes) with sum row
  - Download CSV per user and Download CSV (All users for the month)
- **Logout**: End session from the dashboard
- **Manager – Admin action**: Clear all overtime entries
- **Theme**: Light by default, toggle Light/Dark in the navbar
- **Tech stack**: Next.js App Router, TypeScript, Tailwind CSS (v4), Radix primitives

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
- `/manager/totals` – Monthly totals, detail view and CSV export

### Add more managers

Admins (or devs locally) can create additional managers via an authenticated admin endpoint:

```bash
curl -X POST http://localhost:3000/api/admin/managers \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -d '{
    "email": "manager2@example.com",
    "name": "Manager Two",
    "tempPassword": "password123"
  }'
```

Set `ADMIN_TOKEN` in your environment before running the app. A team for the new manager is auto-created.

## Overtime split rules (150% vs 200%)

The app computes a split of overtime minutes into 150% and 200% according to simplified Polish Labour Code rules:

- 200% (+100% supplement) for overtime at night (21:00–07:00), on Sundays, public holidays, or designated days off (in exchange for Sunday/holiday work).
- 150% (+50% supplement) for all other overtime minutes.

Employees enter a date and exact start/end times. Managers see the split per entry and per user/month.

Notes:
- The night window is treated as 21:00–24:00 and 00:00–07:00 of the same date.
- If Public Holiday or Designated Day Off is checked for an entry, all minutes are counted at 200%.

## CSV exports

- Per-user CSV (Manager → Totals → View → Download CSV):
  - Columns: Date, Start, End, 150% (h), 200% (h), Notes
  - Includes a per-user sum row
- All users CSV (Manager → Totals → Download CSV (All)):
  - Columns: Member, Date, Start, End, 150% (h), 200% (h), Notes
  - Includes per-user TOTAL rows and a final GRAND TOTAL

## Database

- SQLite file `data.sqlite` in the project root.
- Schema includes `start_time`, `end_time`, `minutes_150`, `minutes_200`, `is_public_holiday`, `is_designated_day_off` on `overtime_entries`.
- Safe migrations run on startup to add missing columns if you upgrade from an older DB.

Resetting data:

```bash
rm -f data.sqlite data.sqlite-shm data.sqlite-wal
npm run dev
```
This re-creates the DB and seeds a demo manager user.

## Project Structure (high level)

- `src/app/page.tsx` – Dashboard
- `src/app/login/page.tsx` – Login page
- `src/app/me` – Employee area
- `src/app/manager/*` – Manager tools

## Notes

- The authentication endpoints live under `/api/auth/*`. Swap these out to integrate with your own identity provider or user store.
