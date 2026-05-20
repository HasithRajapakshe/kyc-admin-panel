# KYC Admin Panel

A secure, role-based admin panel for monitoring and managing Digital KYC customer onboarding sessions.

## Stack

- **Frontend:** Next.js 14, Tailwind CSS, shadcn/ui
- **Backend:** Python 3.11, FastAPI, SQLAlchemy
- **Database:** PostgreSQL
- **Auth:** JWT (httpOnly cookies)

## Roles

- **User** — Review and action assigned applications
- **Admin** — All user permissions + watchlist management
- **Super Admin** — Full access including user management

## Branches

- `main` — production
- `develop` — integration (all features merge here first)
- `feature/*` — one branch per phase or feature
