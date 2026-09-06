# Database Schema

## Core Entities

### Hospital
The root tenant entity. Represents a physical hospital or laboratory facility.
- Contains business configuration, contact info, and location.
- Owns resources like Departments, Staff, and Patients.

### User
Represents a person authenticated to use the system.
- Can be a Super Admin (no hospital restriction) or Staff (tied to a specific `hospitalId`).
- Contains a `role` enum indicating their permissions.

### Department
Logical separation within a hospital.
- Uniquely identified by a combination of `hospitalId` and `name`.

### HospitalVerification
Documents and certificates uploaded during onboarding.
- Maintained separately to prevent bloating the `Hospital` row with unstructured files.

## Isolation Principle
Every query affecting hospital data must explicitly enforce `where: { hospitalId: req.user.hospitalId }`. The database heavily relies on foreign keys to `Hospital.id` to guarantee tenant isolation.
