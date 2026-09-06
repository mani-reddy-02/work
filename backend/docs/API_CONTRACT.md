# API Contract

## Standard Response Format
**Success**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [] // Optional validation issues
  }
}
```

## Phase 1A Endpoints
- `GET /api/v1/health`: Basic server heartbeat.
- `GET /api/v1/health/db`: Database connection check.
- `POST /api/v1/auth/login`: Authenticates user, returns JWT.
- `POST /api/v1/auth/register`: Complex onboarding transaction (Hospital + Departments + Admin User).
- `GET /api/v1/users/me`: Retrieves authenticated user details.
