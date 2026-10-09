# Official Meta WhatsApp Business Cloud API Integration Guide

## 1. Overview & Architecture

The MediQuee platform integrates exclusively with the **official Meta WhatsApp Business Cloud API** (Graph API). Unofficial gateways, scraping tools, or third-party SMS bridges are strictly excluded.

### Architecture Highlights:
- **Direct Cloud Integration:** Messages are dispatched directly from the backend to `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages` using Bearer token authentication.
- **Security & Privacy:** 
  - OTPs are cryptographically generated and stored exclusively as SHA-256 hashes with a 5-minute expiry and 60-second resend cooldowns.
  - Access tokens, OTP secrets, and sensitive medical diagnoses are **never** logged or transmitted to the frontend.
  - Pre-approved Meta templates are strictly used outside the 24-hour customer service window.
- **Audit Logging & Delivery Receipts:** Every dispatch attempt is logged to the PostgreSQL table `whatsapp_message_logs` with delivery status updates (`SENT`, `DELIVERED`, `READ`, `FAILED`) processed via incoming Meta Webhooks.

---

## 2. Environment Variables Setup

Configure the following environment variables in `d:\work\backend\.env`:

```env
# Meta WhatsApp Business Cloud API (Official Provider)
WHATSAPP_ACCESS_TOKEN="EAA..."             # Permanent System User Access Token from Meta Business Manager
WHATSAPP_PHONE_NUMBER_ID="106..."          # WhatsApp Phone Number ID (From WhatsApp API Setup tab)
WHATSAPP_BUSINESS_ACCOUNT_ID="102..."      # WhatsApp Business Account (WABA) ID
WHATSAPP_API_VERSION="v21.0"               # Cloud API Graph version (e.g. v21.0)
WHATSAPP_WEBHOOK_VERIFY_TOKEN="mediquee_wa_verify_token_secure" # Custom random secret for Webhook handshake
```

> **Important:** If `WHATSAPP_ACCESS_TOKEN` or `WHATSAPP_PHONE_NUMBER_ID` are missing, the system reports `WHATSAPP_NOT_CONFIGURED` (HTTP 503) and logs a safe configuration warning. Delivery is never simulated.

---

## 3. Meta Developer App & Webhook Configuration

### Step 1: Create or Select Meta Developer App
1. Go to [developers.facebook.com](https://developers.facebook.com/) and create a Business App.
2. Add the **WhatsApp** product to your App.
3. In **WhatsApp > API Setup**, note down the **Phone Number ID** and **WhatsApp Business Account ID**.

### Step 2: System User & Permanent Token
1. In [Meta Business Settings](https://business.facebook.com/settings):
2. Navigate to **Users > System Users** and create a system user with Admin access.
3. Assign the WhatsApp Account asset with `whatsapp_business_messaging` and `whatsapp_business_management` permissions.
4. Generate a permanent System User Token and assign it to `WHATSAPP_ACCESS_TOKEN` in `.env`.

### Step 3: Configure Webhook
1. In the Meta App dashboard, navigate to **WhatsApp > Configuration > Webhook**.
2. Click **Edit**:
   - **Callback URL:** `https://your-domain.com/api/v1/whatsapp/webhook` (or your public Dev Tunnel URL during development).
   - **Verify Token:** The string matching `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (default: `mediquee_wa_verify_token_secure`).
3. Click **Verify and Save**.
4. In **Webhook fields**, click **Manage** and subscribe to **`messages`**.

---

## 4. Message Templates Setup (Meta Business Manager)

Outside the 24-hour customer care window, Meta requires pre-approved templates. Submit the following templates in [WhatsApp Manager > Message Templates](https://business.facebook.com/wa/manage/message-templates/):

### Template 1: Authentication OTP
- **Name:** `otp_auth`
- **Category:** `AUTHENTICATION`
- **Language:** `English (en)`
- **Body:**
  ```text
  {{1}} is your MediQuee verification code. Valid for 5 minutes. Do not share this code with anyone.
  ```
- **Button:** One-tap autofill or Copy Code (`{{1}}`).

---

### Template 2: OP Appointment Confirmation
- **Name:** `op_appointment_confirmed`
- **Category:** `UTILITY`
- **Language:** `English (en)`
- **Body:**
  ```text
  Hello {{1}}, your OP appointment {{2}} at {{3}} with {{4}} is confirmed for {{5}} at {{6}}. Status: {{7}}. Please arrive 15 minutes early. Thank you for choosing MediQuee!
  ```
- **Variables Sample:**
  - `{{1}}`: Suresh Kumar
  - `{{2}}`: OP-781B3D55
  - `{{3}}`: MediQuee General Hospital
  - `{{4}}`: Dr. Sreenu Gorkal
  - `{{5}}`: 12 Oct 2026
  - `{{6}}`: 10:30 AM
  - `{{7}}`: Confirmed

---

### Template 3: OP Appointment Cancellation
- **Name:** `op_appointment_cancelled`
- **Category:** `UTILITY`
- **Language:** `English (en)`
- **Body:**
  ```text
  Hello {{1}}, your appointment {{2}} at {{3}} with {{4}} scheduled for {{5}} at {{6}} has been cancelled. Reason: {{7}}. For questions, please visit our app or contact support.
  ```

---

### Template 4: OP Appointment Rescheduled
- **Name:** `op_appointment_rescheduled`
- **Category:** `UTILITY`
- **Language:** `English (en)`
- **Body:**
  ```text
  Hello {{1}}, your appointment {{2}} at {{3}} with {{4}} has been rescheduled to {{5}} at {{6}}. Please arrive on time. Thank you, MediQuee Healthcare.
  ```

---

### Template 5: OP Appointment Reminder
- **Name:** `op_appointment_reminder`
- **Category:** `UTILITY`
- **Language:** `English (en)`
- **Body:**
  ```text
  Hello {{1}}, reminder that your appointment {{2}} at {{3}} with {{4}} is scheduled on {{5}} at {{6}} ({{7}}). Please visit the hospital on time.
  ```

---

### Template 6: Hospital Staff New Booking Alert
- **Name:** `staff_new_booking_alert`
- **Category:** `UTILITY`
- **Language:** `English (en)`
- **Body:**
  ```text
  Hello {{1}}, a new OP booking {{3}} for patient {{2}} has been confirmed for {{4}} on {{5}} at {{6}}. Please check your hospital portal for details.
  ```

---

## 5. Healthcare Privacy Safeguards

In strict adherence to medical privacy and data protection principles:
- **No Clinical Data:** WhatsApp notifications **never** contain medical diagnoses, disease categories, prescription item details, or diagnostic laboratory test results.
- **Consent Enforcement:** Notifications are sent only if the user has opted in (`whatsappConsent === true`).
- **Data Minimization:** Only administrative parameters (Patient Name, Doctor Name, Hospital Name, Date, Time, and Ref Code) are transmitted.

---

## 6. Endpoints Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/whatsapp/status` | `GET` | Reports Meta Cloud API configuration status. |
| `/api/v1/whatsapp/send-otp` | `POST` | Requests and dispatches 6-digit WhatsApp OTP (5-min expiry, 60s cooldown). |
| `/api/v1/whatsapp/verify-otp` | `POST` | Validates WhatsApp OTP against stored SHA-256 hash. |
| `/api/v1/whatsapp/webhook` | `GET` | Handshake challenge verification endpoint for Meta. |
| `/api/v1/whatsapp/webhook` | `POST` | Processes message delivery receipts from Meta (`sent`, `delivered`, `read`, `failed`). |
| `/api/v1/appointments/:id/cancel` | `PATCH` | Cancels appointment and triggers WhatsApp cancellation notice. |
| `/api/v1/appointments/:id/reschedule`| `PATCH` | Reschedules appointment and triggers WhatsApp reschedule notice. |
