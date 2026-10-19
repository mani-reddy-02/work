# MediQuee Hospital Dashboard — Reviews & Ratings API Integration Contract

**Document Version:** 1.0.0  
**Target Audience:** Hospital Dashboard Frontend Developers  
**Service Base URL:** `http://localhost:5000/api/v1` (or your configured environment API base)  
**Authentication:** Standard JWT Bearer token via `Authorization: Bearer <token>`

---

## 1. Overview

The MediQuee Reviews & Ratings engine allows patients to submit verified ratings (1 to 5 stars) and optional written comments for:
1. **Hospital / Service Provider** (OP, Video, Lab Tests, Home Sample Collection, Home Nursing)
2. **Individual Doctors** (OP Consultations and Video Consultations)

All reviews are tied to genuine, completed bookings. Public and hospital metrics only compute from active, non-hidden reviews.

---

## 2. Hospital Portal Endpoint: Get Hospital & Doctor Reviews

Retrieve reviews for your authorized hospital and associated doctors.

### Request

```http
GET /api/v1/hospital/reviews
Authorization: Bearer <hospital_admin_or_doctor_token>
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `targetType` | `string` | No | `ALL` | Filter by `HOSPITAL`, `DOCTOR`, or `ALL` |
| `serviceType` | `string` | No | - | Filter by service: `OP_CONSULTATION`, `VIDEO_CONSULTATION`, `LAB_TEST`, `HOME_SAMPLE_COLLECTION`, `HOME_NURSING` |
| `doctorId` | `string` | No | - | Filter reviews for a specific doctor in your hospital |
| `rating` | `integer` | No | - | Filter by star rating (1 to 5) |
| `page` | `integer` | No | `1` | Page number |
| `limit` | `integer` | No | `10` | Page size (max 50) |

### Response (`200 OK`)

```json
{
  "success": true,
  "data": {
    "summary": {
      "hospital": {
        "averageRating": 4.8,
        "totalReviews": 42
      },
      "doctors": [
        {
          "doctorId": "doc-uuid-1",
          "doctorName": "Dr. Sarah Jenkins",
          "avatar": "https://...",
          "specialization": "Cardiologist",
          "averageRating": 4.9,
          "totalReviews": 28
        },
        {
          "doctorId": "doc-uuid-2",
          "doctorName": "Dr. Alan Vance",
          "avatar": "https://...",
          "specialization": "Neurologist",
          "averageRating": 4.6,
          "totalReviews": 14
        }
      ]
    },
    "reviews": [
      {
        "id": "rev-uuid-123",
        "bookingId": "bk-uuid-456",
        "targetType": "HOSPITAL",
        "serviceType": "OP_CONSULTATION",
        "rating": 5,
        "comment": "Exceptional care and clean facilities.",
        "createdAt": "2026-10-19T10:30:00.000Z",
        "doctor": null,
        "patientName": "Kavitha R."
      },
      {
        "id": "rev-uuid-124",
        "bookingId": "bk-uuid-456",
        "targetType": "DOCTOR",
        "serviceType": "OP_CONSULTATION",
        "rating": 5,
        "comment": "Dr. Sarah was very attentive and patient in explaining the diagnosis.",
        "createdAt": "2026-10-19T10:35:00.000Z",
        "doctor": {
          "id": "doc-uuid-1",
          "name": "Dr. Sarah Jenkins",
          "avatar": "https://...",
          "specialization": "Cardiologist"
        },
        "patientName": "Kavitha R."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 42,
      "totalPages": 5
    }
  }
}
```

---

## 3. Public Endpoints for Hospital & Doctor Summary / Reviews

These endpoints can be called without an authorization header to display ratings and reviews on public hospital or doctor pages.

### 3.1 Get Hospital Reviews & Rating Breakdown

```http
GET /api/v1/reviews/hospital/:hospitalId?page=1&limit=10&rating=5
```

#### Response (`200 OK`)

```json
{
  "success": true,
  "data": {
    "summary": {
      "averageRating": 4.8,
      "totalReviews": 42,
      "ratingDistribution": {
        "1": 0,
        "2": 1,
        "3": 3,
        "4": 8,
        "5": 30
      }
    },
    "reviews": [
      {
        "id": "rev-1",
        "rating": 5,
        "comment": "Quick consultation and very friendly staff.",
        "serviceType": "OP_CONSULTATION",
        "createdAt": "2026-10-19T11:00:00.000Z",
        "reviewerName": "Anand K."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 42,
      "totalPages": 5
    }
  }
}
```

### 3.2 Get Doctor Reviews & Rating Breakdown

```http
GET /api/v1/reviews/doctor/:doctorId?page=1&limit=10
```

#### Response (`200 OK`)

```json
{
  "success": true,
  "data": {
    "summary": {
      "averageRating": 4.9,
      "totalReviews": 28,
      "ratingDistribution": {
        "1": 0,
        "2": 0,
        "3": 1,
        "4": 3,
        "5": 24
      }
    },
    "reviews": [
      {
        "id": "rev-2",
        "rating": 5,
        "comment": "Detailed prescription and great follow-up advice.",
        "serviceType": "VIDEO_CONSULTATION",
        "createdAt": "2026-10-19T11:15:00.000Z",
        "reviewerName": "Suresh M."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 28,
      "totalPages": 3
    }
  }
}
```

---

## 4. TypeScript Interfaces for Hospital Frontend Developers

```typescript
export type ReviewTargetType = 'HOSPITAL' | 'DOCTOR';
export type ReviewServiceType =
  | 'OP_CONSULTATION'
  | 'VIDEO_CONSULTATION'
  | 'LAB_TEST'
  | 'HOME_SAMPLE_COLLECTION'
  | 'HOME_NURSING';

export interface DoctorRatingSummary {
  doctorId: string;
  doctorName: string;
  avatar: string | null;
  specialization: string | null;
  averageRating: number | null;
  totalReviews: number;
}

export interface HospitalReviewItem {
  id: string;
  bookingId: string;
  targetType: ReviewTargetType;
  serviceType: ReviewServiceType;
  rating: number;
  comment: string | null;
  createdAt: string;
  patientName: string;
  doctor?: {
    id: string;
    name: string;
    avatar: string | null;
    specialization: string | null;
  } | null;
}

export interface HospitalReviewsDashboardResponse {
  success: boolean;
  data: {
    summary: {
      hospital: {
        averageRating: number | null;
        totalReviews: number;
      };
      doctors: DoctorRatingSummary[];
    };
    reviews: HospitalReviewItem[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  };
}
```

---

## 5. Security & Ownership Rules Enforced by Backend

1. **Hospital Isolation:** Hospital administrators and staff can only read reviews for their assigned `hospitalId`. Any attempt to supply an unauthorized `hospitalId` is rejected with `403 Forbidden` or restricted to the token's hospital.
2. **Patient Privacy:** Patient full names and sensitive contact numbers are masked (e.g., `Rajesh K.`) in review listings to protect patient confidentiality.
3. **No Unmoderated Content Leaks:** Reviews hidden by Super Admin moderation are automatically excluded from hospital averages and listings.
