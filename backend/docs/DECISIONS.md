# Architecture Decisions

## 1. Monorepo vs Shared Backend
The backend is established as a single shared platform serving multiple frontends. To prevent tight coupling to just the Hospital Dashboard, the endpoints are strictly versioned (`/api/v1`) and domain-based (`/auth`, `/users`).

## 2. PostgreSQL + Prisma
Chosen for strict schema safety. Given the complex relationships between Hospitals, Departments, Staff, and Patients, a relational database is necessary.

## 3. Hospital Registration Transaction
Creating a hospital via the onboarding flow is complex. We use a Prisma interactive transaction to ensure `Hospital`, `HospitalVerification`, `Department`, and `User (Admin)` are created atomically. If any part fails, the system rolls back to avoid partial states.

## 4. User.hospitalId over HospitalMembership
To prevent over-engineering in Phase 1, we implemented a 1-to-many relationship where a `User` strictly belongs to a single `Hospital` via `hospitalId`. Super Admins can have a `null` hospitalId.
