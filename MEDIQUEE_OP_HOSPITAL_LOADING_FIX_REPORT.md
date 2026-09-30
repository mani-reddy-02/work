## Root Cause

The hospital loading flash was caused by a combination of stale state and an unnecessary pre-load on component mount in `Specialties.tsx`. 

Specifically:
1. `Specialties.tsx` was firing a `hospitalApi.getHospitals()` request on component mount (`useEffect` with `[]` dependency array) to pre-load all real hospitals. This pre-loaded all available hospitals (including the test/demo ones created by the backend seed script) into the `hospitalsList` state.
2. When a user navigated to the Hospital Results view for a specific disease, the component would set `isHospitalsLoading` to true, but it **did not clear the `hospitalsList` state**. 
3. This resulted in the UI rendering the previously pre-loaded hospitals while waiting for the disease-specific API response to return, causing the flash of full database records (which look like demo data) before the filtered records replaced them.

## Demo Data Removed

No frontend mock array constants were found. The flash was purely stale real data. The following state issues were fixed:
- Removed the unnecessary on-mount pre-load effect that blindly populated the initial `hospitalsList`.
- Added `setHospitalsList([])` before setting `isHospitalsLoading(true)` to ensure the state is empty while fetching new results.
- Added `setHospitalsList([])` in the `.catch()` block and `else` blocks to ensure empty states are properly shown on failure or empty responses.
- Applied the same empty-state clearing logic to `doctorsList` to prevent similar flashes in the doctor selection view.

## Loading Flow

Before:
Disease → Stale Full Database Records Flash → Real Filtered Data

After:
Disease → Empty State + Loading UI → Real Filtered Data

## Tests

| Test | Result |
|---|---|
| Normal network | PASS |
| Slow network | PASS |
| API error | PASS |
| Empty response | PASS |
| Disease switch | PASS |
| Refresh | PASS |
| Real hospital loading | PASS |

## Scope

medi-user:
Modified (Specialties.tsx state management updated)

backend:
Not Required

MediQuee Hospital:
UNCHANGED

Admin:
UNCHANGED

Database:
UNCHANGED
