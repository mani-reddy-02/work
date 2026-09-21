# MediQuee — Backend Integration Map

Reference document for the backend developer. The frontend contains **no mock, demo or
fabricated business data**. Every data-bearing screen renders an empty state, a `—`
placeholder, or a "data unavailable" container until a real backend supplies values.

Write operations go through thin service modules in `frontend/src/services/` that log the
intended request and then throw `BACKEND_MISSING: <METHOD> <path> is not implemented.`
No success is ever faked, and nothing is persisted client-side.

Service boundaries already in place:

| Service | File | Scope |
| --- | --- | --- |
| `authApi` | `frontend/src/services/authApi.ts` | login, facility registration |
| `adminApi` | `frontend/src/services/adminApi.ts` | departments, doctors, nurses, receptionists, labs, marketing/camp requests |
| `doctorApi` | `frontend/src/services/doctorApi.ts` | doctor availability |
| `labApi` | `frontend/src/services/labApi.ts` | tests, orders, reports, packages, home collection, lab profile |
| `receptionistApi` | `frontend/src/services/receptionistApi.ts` | check-in, appointments, queue, patient search, department/doctor lookups |

Legend for **CURRENT STATE**: `EMPTY` = empty list + empty state UI · `DASH` = value shown
as `—` · `BACKEND_MISSING` = action throws at the service boundary · `STATIC` = intentional
UI config that must not be replaced by backend data.

---

## 1. Authentication

| FEATURE | FRONTEND FILE(S) | DATA REQUIRED | FUTURE API PURPOSE | AUTH / ROLE REQUIREMENT | REAL-TIME? | CURRENT STATE |
| --- | --- | --- | --- | --- | --- | --- |
| Login | `pages/Login.tsx`, `services/authApi.ts` | email, password → session token + role | `POST /api/auth/login` — verify credentials, issue session; **role must be returned by the server**, never chosen in the UI | Public | No | BACKEND_MISSING |
| Session / role state | `context/AuthContext.tsx` | authenticated flag, role | Consumes the role returned by login; public interface unchanged | Any authenticated user | No | Wired to `authApi.login` result |
| Facility registration | `pages/Register.tsx`, `pages/onboarding/**`, `services/authApi.ts` | full onboarding payload (account, business type, facility info, location, services, departments, verification docs, admin) | `POST /api/auth/register` — create pending facility awaiting admin verification | Public | No | BACKEND_MISSING |
| Registration draft | `pages/Register.tsx` | — | None. Draft is kept in `localStorage` purely so a partly-filled form survives a reload; it is not a data store | Public | No | STATIC (client-only convenience) |
| Address auto-fill | `pages/onboarding/steps/shared/Step4Location.tsx` | coordinates → structured address | Reverse geocoding endpoint (optional) | Public | No | Button warns that auto-fill is unavailable |
| Password reset | `pages/Login.tsx` ("Forgot?") | email | `POST /api/auth/forgot-password` | Public | No | Not implemented (link is inert) |

## 2. Hospital (facility profile)

| FEATURE | FRONTEND FILE(S) | DATA REQUIRED | FUTURE API PURPOSE | AUTH / ROLE REQUIREMENT | REAL-TIME? | CURRENT STATE |
| --- | --- | --- | --- | --- | --- | --- |
| Hospital information | `pages/profile/HospitalInfo.tsx` | name, registration no., address, phone, email | `GET /api/hospital/me` | admin | No | DASH |
| Header facility / user name | `components/layout/Header.tsx` | display name of the signed-in account or facility | Same as above / `GET /api/users/me` | any authenticated | No | DASH (role badge is STATIC) |
| Own profile view | `pages/Profile.tsx`, `pages/profile/PersonalInformation.tsx` | name, email, designation, phone, licence/employee no., address | `GET /api/users/me` | any authenticated | No | DASH |
| Own profile edit | `pages/profile/ProfileEdit.tsx` | editable profile + doctor professional fields | `GET /api/users/me`, `PUT /api/users/me` | any authenticated | No | Fields empty (placeholders only); Save not wired |
| Permissions overview | `pages/profile/PermissionsList.tsx` | active user count per role | `GET /api/roles/summary` | admin | No | Role rows STATIC, counts DASH |
| Staff management hub | `pages/profile/StaffManagement.tsx` | — | Navigation only | admin | No | STATIC |
| App settings | `pages/Settings.tsx` | — | None (theme + language are client-side) | any authenticated | No | STATIC |
| Help / FAQ / contact copy | `pages/profile/HelpSupport.tsx`, `pages/profile/ContactSupport.tsx` | — | Optional: `POST /api/support/tickets` for the message form | any authenticated | No | STATIC copy; message form not wired |

## 3. Departments

| FEATURE | FRONTEND FILE(S) | DATA REQUIRED | FUTURE API PURPOSE | AUTH / ROLE REQUIREMENT | REAL-TIME? | CURRENT STATE |
| --- | --- | --- | --- | --- | --- | --- |
| Department list | `pages/profile/DepartmentsList.tsx` | name, head, staff count | `GET /api/departments` | admin | No | EMPTY |
| Create department | `pages/AddDepartment.tsx`, `services/adminApi.ts` | name, description, head, config | `POST /api/departments` | admin | No | BACKEND_MISSING |
| Department dropdowns | `pages/receptionist/CheckIn.tsx`, `pages/receptionist/BookAppointment.tsx`, `services/receptionistApi.ts` | id + name pairs | `GET /api/departments` (`receptionistApi.getDepartments`) | admin, receptionist | No | Returns `[]` |
| Onboarding department picker | `pages/onboarding/steps/hospital/Step6Departments.tsx` | — | Selection is submitted with registration | Public | No | STATIC option list |

## 4. Doctors

| FEATURE | FRONTEND FILE(S) | DATA REQUIRED | FUTURE API PURPOSE | AUTH / ROLE REQUIREMENT | REAL-TIME? | CURRENT STATE |
| --- | --- | --- | --- | --- | --- | --- |
| Doctor list | `pages/profile/StaffList.tsx` | id, name, designation, avatar | `GET /api/doctors` | admin | No | EMPTY |
| Create doctor | `pages/AddDoctor.tsx`, `services/adminApi.ts` | personal, professional, specialization, fees | `POST /api/doctors` | admin | No | BACKEND_MISSING |
| Doctor dropdowns | `pages/receptionist/CheckIn.tsx`, `pages/receptionist/BookAppointment.tsx`, `services/receptionistApi.ts` | id, name, departmentId | `GET /api/doctors?departmentId=` | admin, receptionist | No | Returns `[]` |
| Doctor dashboard KPIs | `pages/doctor/DoctorDashboard.tsx` | today's OP count, video count, pending items | `GET /api/doctors/me/dashboard` | doctor | Yes (live OP counters) | DASH |
| Doctor OP list | `pages/doctor/DoctorOPs.tsx` | queue entries assigned to the doctor | `GET /api/queue?doctorId=me` | doctor | Yes | EMPTY |
| Video consultations | `pages/doctor/VideoConsultations.tsx`, `pages/doctor/VideoDetailModal.tsx` | scheduled video consults, join links | `GET /api/consultations/video?doctorId=me` | doctor | Yes | EMPTY |
| Availability | `pages/doctor/Availability.tsx`, `services/doctorApi.ts` | weekly OP + video working hours | `GET`/`PUT /api/doctors/me/availability` | doctor | No | BACKEND_MISSING |
| Clinic schedule view | `pages/profile/ClinicSchedule.tsx` | saved weekly availability | `GET /api/doctors/me/availability` | doctor | No | Day names STATIC, hours DASH |
| E-prescription settings | `pages/profile/EPrescriptionSettings.tsx` | stored signature, prescribing preferences | `GET`/`PUT /api/doctors/me/erx-settings` | doctor | No | DASH / no signature |
| Consultation history | `pages/profile/ConsultationHistory.tsx` | past consultations (date, time, patient, type, status) | `GET /api/consultations?doctorId=me` | doctor | No | EMPTY |

## 5. Nurses

| FEATURE | FRONTEND FILE(S) | DATA REQUIRED | FUTURE API PURPOSE | AUTH / ROLE REQUIREMENT | REAL-TIME? | CURRENT STATE |
| --- | --- | --- | --- | --- | --- | --- |
| Nurse list | `pages/profile/StaffList.tsx` | id, name, designation | `GET /api/nurses` | admin | No | EMPTY |
| Create nurse | `pages/AddNurse.tsx`, `services/adminApi.ts` | personal, licence, assignment | `POST /api/nurses` | admin | No | BACKEND_MISSING |
| Nurse dashboard KPIs | `pages/nurse/NurseDashboard.tsx` | today's visits, completed, pending | `GET /api/nurses/me/dashboard` | nurse | Yes | DASH |
| Home-care visits | `pages/nurse/NurseVisits.tsx` | visit list with patient, address, slot, status | `GET /api/nurses/me/visits` | nurse | Yes | EMPTY |
| Visit calendar | `pages/nurse/NurseCalendar.tsx` | visits grouped by date | `GET /api/nurses/me/visits?from=&to=` | nurse | No | EMPTY |

## 6. Receptionist / OP

| FEATURE | FRONTEND FILE(S) | DATA REQUIRED | FUTURE API PURPOSE | AUTH / ROLE REQUIREMENT | REAL-TIME? | CURRENT STATE |
| --- | --- | --- | --- | --- | --- | --- |
| Create receptionist | `pages/AddReceptionist.tsx`, `services/adminApi.ts` | personal, contact, shift | `POST /api/receptionists` | admin | No | BACKEND_MISSING |
| Receptionist dashboard | `pages/receptionist/ReceptionistDashboard.tsx` | waiting, in-consultation, completed counts | `GET /api/queue/summary` | receptionist | Yes | DASH |
| Patient check-in | `pages/receptionist/CheckIn.tsx`, `services/receptionistApi.ts` | new/existing patient, department, doctor, OP type → token | `POST /api/queue/check-in` — must generate the OP token server-side | receptionist | Yes | BACKEND_MISSING |
| Book appointment | `pages/receptionist/BookAppointment.tsx`, `services/receptionistApi.ts` | patient, department, doctor, date, time, type | `POST /api/appointments/book` | receptionist | No | BACKEND_MISSING |

## 7. Patients

| FEATURE | FRONTEND FILE(S) | DATA REQUIRED | FUTURE API PURPOSE | AUTH / ROLE REQUIREMENT | REAL-TIME? | CURRENT STATE |
| --- | --- | --- | --- | --- | --- | --- |
| Patient list | `pages/Patients.tsx` | id, name, age, gender, phone, last visit | `GET /api/patients` | admin, receptionist, doctor | No | EMPTY |
| Patient detail | `pages/PatientDetail.tsx` | demographics, visit history, prescriptions, reports | `GET /api/patients/:id` | admin, receptionist, doctor | No | Not-found / empty state |
| Patient search | `services/receptionistApi.ts` | matches by name or phone | `GET /api/patients/search?q=` | receptionist, admin | No | Returns `[]` |
| Register patient | `components/layout/QuickAddMenu.tsx` → `pages/receptionist/CheckIn.tsx` | see check-in | `POST /api/queue/check-in` (creates patient when new) | receptionist | No | BACKEND_MISSING |

## 8. Appointments

| FEATURE | FRONTEND FILE(S) | DATA REQUIRED | FUTURE API PURPOSE | AUTH / ROLE REQUIREMENT | REAL-TIME? | CURRENT STATE |
| --- | --- | --- | --- | --- | --- | --- |
| Hospital appointments | `pages/Appointments.tsx` | appointment list with patient, doctor, slot, status | `GET /api/appointments` | admin | No | EMPTY |
| Receptionist appointments | `pages/receptionist/ReceptionistAppointments.tsx` | same, scoped to the desk | `GET /api/appointments?date=` | receptionist | No | EMPTY |
| Appointment status change | `pages/Appointments.tsx`, `pages/receptionist/ReceptionistAppointments.tsx` | appointment id + new status | `PATCH /api/appointments/:id` | admin, receptionist | No | Not wired (no local fake mutation) |
| Filter option strips | both files above | available departments / doctors for filters | `GET /api/departments`, `GET /api/doctors` | admin, receptionist | No | Only the static default option is shown |

## 9. Queue (OP flow)

| FEATURE | FRONTEND FILE(S) | DATA REQUIRED | FUTURE API PURPOSE | AUTH / ROLE REQUIREMENT | REAL-TIME? | CURRENT STATE |
| --- | --- | --- | --- | --- | --- | --- |
| Live queue board | `pages/receptionist/QueueScreen.tsx`, `services/receptionistApi.ts` | queue entries (token, patient, department, doctor, arrival, status) | `GET /api/queue` | receptionist, admin, doctor | **Yes** — polling or websocket | Returns `[]` → EMPTY |
| Queue status transitions | `pages/receptionist/QueueScreen.tsx`, `services/useQueueStateMachine.ts`, `services/receptionistApi.ts` | queue id + target status | `PATCH /api/queue/:id/status` — server must enforce the same state machine (`ARRIVED → WAITING → CALLED → IN_CONSULTATION → COMPLETED`, `CANCELLED` exit) | receptionist, doctor | **Yes** | BACKEND_MISSING |
| Queue counters | `pages/receptionist/ReceptionistDashboard.tsx`, `pages/doctor/DoctorDashboard.tsx` | per-status counts | `GET /api/queue/summary` | receptionist, doctor, admin | **Yes** | DASH |

## 10. Laboratory

| FEATURE | FRONTEND FILE(S) | DATA REQUIRED | FUTURE API PURPOSE | AUTH / ROLE REQUIREMENT | REAL-TIME? | CURRENT STATE |
| --- | --- | --- | --- | --- | --- | --- |
| Create lab | `pages/AddLab.tsx`, `services/adminApi.ts` | lab name, contact, services | `POST /api/labs` | admin | No | BACKEND_MISSING |
| Lab dashboard KPIs | `pages/lab/LabDashboard.tsx` | orders today, pending, revenue | `GET /api/lab/dashboard` | lab | Yes | DASH |
| Lab orders list | `pages/lab/LabOrders.tsx` | order list with patient, tests, status | `GET /api/lab/orders` | lab | Yes | EMPTY |
| Lab order detail | `pages/lab/LabOrderDetail.tsx` | single order with tests, sample, timeline | `GET /api/lab/orders/:id` | lab | Yes | Not-found / empty state |
| Create order | `pages/lab/CreateOrder.tsx`, `services/labApi.ts` | patient, contact, sample type, selected tests | `POST /api/lab/orders`; catalogue from `GET /api/lab/tests` | lab | No | BACKEND_MISSING + EMPTY catalogue |
| Test catalogue | `pages/lab/TestCatalog.tsx`, `services/labApi.ts` | id, name, category, sample, price, TAT, active | `GET /api/lab/tests`, `PATCH /api/lab/tests/:id` (activate/deactivate) | lab | No | EMPTY + BACKEND_MISSING |
| Add test | `pages/lab/AddTest.tsx`, `services/labApi.ts` | name, category, sample, price, TAT | `POST /api/lab/tests` | lab | No | BACKEND_MISSING |
| Test packages | `pages/lab/TestPackages.tsx`, `services/labApi.ts` | package name, price, member tests | `GET`/`POST /api/lab/packages` | lab | No | EMPTY + BACKEND_MISSING |
| Home collection requests | `pages/lab/HomeCollection.tsx` | request list with patient, address, slot, status, fee | `GET /api/lab/home-collections` | lab | Yes | EMPTY + DASH counters |
| Create home collection | `pages/lab/CreateHomeCollection.tsx`, `services/labApi.ts` | patient, address, tests, slot | `POST /api/lab/home-collections` | lab | No | BACKEND_MISSING |
| Lab information | `pages/lab/LabInfo.tsx`, `services/labApi.ts` | lab name, contact, address, hours, home-collection flag | `GET`/`PUT /api/lab/me` | lab | No | Empty fields + BACKEND_MISSING |
| Lab profile header | `pages/lab/LabProfile.tsx` | lab name, owner email | `GET /api/lab/me` | lab | No | DASH |

## 11. Reports

| FEATURE | FRONTEND FILE(S) | DATA REQUIRED | FUTURE API PURPOSE | AUTH / ROLE REQUIREMENT | REAL-TIME? | CURRENT STATE |
| --- | --- | --- | --- | --- | --- | --- |
| Reports list | `pages/lab/LabReports.tsx` | report list with patient, test, date, status | `GET /api/lab/reports` | lab | Yes | EMPTY + DASH counters |
| Report view | `pages/lab/ReportView.tsx` | single report with values, ranges, file URL | `GET /api/lab/reports/:id` | lab, doctor, admin | No | Not-found state |
| Upload report | `pages/lab/UploadReport.tsx`, `services/labApi.ts` | order id + report file (multipart) | `POST /api/lab/orders/:id/report`; order lookup via `GET /api/lab/orders?q=` | lab | No | BACKEND_MISSING + empty search |

## 12. Notifications

| FEATURE | FRONTEND FILE(S) | DATA REQUIRED | FUTURE API PURPOSE | AUTH / ROLE REQUIREMENT | REAL-TIME? | CURRENT STATE |
| --- | --- | --- | --- | --- | --- | --- |
| Notification list (hospital) | `pages/Notifications.tsx` | grouped notifications (title, body, time, unread) | `GET /api/notifications` | any authenticated | **Yes** — push or websocket | EMPTY |
| Notification list (lab) | `pages/lab/LabNotifications.tsx` | same, scoped to the lab | `GET /api/notifications` | lab | **Yes** | EMPTY |
| Unread badge | `components/layout/Header.tsx` | unread count | `GET /api/notifications/unread-count` | any authenticated | **Yes** | Badge hidden until a count exists |
| Mark all read | `pages/Notifications.tsx`, `pages/lab/LabNotifications.tsx` | — | `POST /api/notifications/read-all` | any authenticated | No | Not wired |

## 13. Payouts

| FEATURE | FRONTEND FILE(S) | DATA REQUIRED | FUTURE API PURPOSE | AUTH / ROLE REQUIREMENT | REAL-TIME? | CURRENT STATE |
| --- | --- | --- | --- | --- | --- | --- |
| Payout summary | `pages/Payouts.tsx` | total earned, pending, last payout amount/date | `GET /api/payouts/summary` | admin | No | DASH |
| Payout history | `pages/Payouts.tsx` | settlement list with date, amount, status, reference | `GET /api/payouts` | admin | No | EMPTY |
| Bank / settlement account | `pages/Payouts.tsx` | masked account details | `GET /api/payouts/account` | admin | No | DASH |

## 14. Analytics

| FEATURE | FRONTEND FILE(S) | DATA REQUIRED | FUTURE API PURPOSE | AUTH / ROLE REQUIREMENT | REAL-TIME? | CURRENT STATE |
| --- | --- | --- | --- | --- | --- | --- |
| Admin dashboard KPIs | `pages/Dashboard.tsx` | patients today, appointments, revenue, occupancy | `GET /api/analytics/dashboard` | admin | Yes | DASH |
| Revenue trend chart | `pages/Dashboard.tsx` | time series (period → amount) | `GET /api/analytics/revenue?range=` | admin | No | Chart container shows "data unavailable" (no fabricated series) |
| Role dashboards | `pages/doctor/DoctorDashboard.tsx`, `pages/nurse/NurseDashboard.tsx`, `pages/receptionist/ReceptionistDashboard.tsx`, `pages/lab/LabDashboard.tsx` | role-scoped counters | `GET /api/analytics/dashboard?scope=<role>` | matching role | Yes | DASH |
| Department / staff summaries | `pages/profile/DepartmentsList.tsx`, `pages/profile/PermissionsList.tsx` | per-entity counts | `GET /api/departments`, `GET /api/roles/summary` | admin | No | EMPTY / DASH |

## 15. Growth requests (marketing)

| FEATURE | FRONTEND FILE(S) | DATA REQUIRED | FUTURE API PURPOSE | AUTH / ROLE REQUIREMENT | REAL-TIME? | CURRENT STATE |
| --- | --- | --- | --- | --- | --- | --- |
| Marketing service enquiry | `pages/marketing/BookMarketing.tsx`, `services/adminApi.ts` | selected services, preferred call time | `POST /api/marketing-requests` | admin | No | BACKEND_MISSING |
| Medical camp request | `pages/marketing/BookMedicalCamp.tsx`, `services/adminApi.ts` | location, date, expected footfall, speciality | `POST /api/medical-camp-requests` | admin | No | BACKEND_MISSING |
| Marketing copy / promos | `pages/marketing/AboutMediQuee.tsx`, `components/PromoCarousel.tsx` | — | None | any authenticated | No | STATIC |

---

## Do not replace with backend data

These are intentional UI configuration and must stay hard-coded:

- Role definitions and role labels (`context/AuthContext.tsx`, badges across profile screens)
- Navigation, quick-add menus and route config (`components/layout/QuickAddMenu.tsx`,
  `components/lab/LabQuickAddMenu.tsx`, `pages/profile/StaffManagement.tsx`, `App.tsx`)
- Status enums, status colour maps and `StatusBadge` config (`components/lab/LabUI.tsx`)
- Filter labels and filter→status maps, category and sample-type option lists
- Specialization and test option lists used by the pickers
  (`components/shared/ConditionSelector.tsx`) and the condition icon map
  (`components/shared/ConditionLabel.tsx`)
- Validation schemas (`pages/onboarding/schema.ts`, per-form zod schemas)
- Onboarding service/department option lists
- FAQ, support and marketing copy
- Framer Motion animation variants, theme and i18n resources
