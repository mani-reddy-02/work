# Authorization Foundation

## Flow
1. **Authentication (JWT)**: Validates identity and extracts `{ userId, role, hospitalId }`.
2. **Identity Verification**: Database check ensures user is still active and retrieves authoritative role and hospitalId.
3. **Role Checks**: Express middleware (`requireRole`) validates that the user's role is permitted to execute the route logic.
4. **Hospital Isolation**: The service layer implicitly adds `hospitalId: req.user.hospitalId` to Prisma queries.

## Rule of Trust
We NEVER trust `hospitalId` or `role` provided in a request body or URL parameter. The `req.user` payload extracted by the authentication middleware is the sole source of truth for authorization boundaries.
