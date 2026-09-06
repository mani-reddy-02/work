# Backend Architecture

## Overview
The MediQuee backend provides a unified, multi-tenant foundation serving the Hospital Dashboard, User Application, and Super Admin panel. It is built with Node.js, Express, TypeScript, and Prisma (PostgreSQL).

## File Structure
- `src/app.ts`: Express application setup, global middleware, error handlers.
- `src/server.ts`: Bootstrap, database connection.
- `src/config/`: Environment variable parsing (Zod) and Prisma client.
- `src/middleware/`: Reusable Express middleware (Auth, Validation, Error Handling).
- `src/modules/`: Feature-based grouping (e.g., `auth`, `users`).
  - `*.routes.ts`: API route definitions.
  - `*.controller.ts`: Request/Response parsing and HTTP status handling.
  - `*.service.ts`: Core business logic and database interactions.
  - `*.schema.ts`: Zod validation schemas for requests.

## Key Principles
1. **Multi-Tenancy via Hospital ID**: The system strictly isolates data per hospital. `hospitalId` is inferred securely from the authenticated token, never from a client request payload.
2. **API Versioning**: All routes are prefixed with `/api/v1`.
3. **Thin Controllers**: Controllers should only parse input, call the service layer, and format the output.
4. **Validation-First**: All request payloads are strictly validated using Zod before reaching business logic.
