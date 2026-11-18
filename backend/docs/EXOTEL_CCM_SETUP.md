# MediQuee – Exotel CCM Programmable Connect Integration Guide

This document describes the architecture, call flow, configuration, API contracts, and troubleshooting procedures for the **Exotel Customer Care Management (CCM) Programmable Connect** integration within the MediQuee healthcare platform.

---

## 1. Architecture & Call Flow Overview

Exotel CCM Programmable Connect dynamically connects patients and healthcare providers using an intelligent webhook-driven applet flow.

```
+---------------------------------------------------------------------------------------------------+
|                                      MEDIQUEE CALL WORKFLOW                                        |
+---------------------------------------------------------------------------------------------------+

 1. Patient clicks "Call Hospital" inside MediQuee Web Application
 2. MediQuee Backend:
    * Authenticates patient JWT & verifies booking ownership
    * Resolves trusted patient & hospital numbers from database
    * Generates cryptographically random correlationToken (ccm_<32-hex>)
    * Persists CallLog with status: INITIATED & AES-256-GCM encrypted numbers
    * Calls Exotel Connect API (https://api.exotel.com/v1/Accounts/mediquee1/Calls/connect.json)
      Passing From: PatientPhone, CallerId: 08047290980, Url: AppletVoiceUrl, CustomField: correlationToken
 3. Exotel dials Leg 1 (Patient Phone):
    * Incoming caller ID displayed: 08047290980 (MediQuee Virtual Number)
 4. Patient answers call -> Exotel triggers CCM Flow Applet
 5. CCM Applet executes HTTP GET to MediQuee Primary URL:
    * GET https://api.mediquee.in/api/v1/exotel/connect?CallSid=...&CustomField=...&token=...
 6. MediQuee Backend verifies token & correlates call session in <100ms:
    * Responds HTTP 200 OK Content-Type: application/json
    * Payload: {"destination": [{"contact_uri": "+91XXXXXXXXXX"}], ...}
 7. Exotel dials Leg 2 (Hospital Contact Phone):
    * Incoming caller ID displayed: 08047290980 (MediQuee Virtual Number)
 8. Hospital answers -> Both legs are bridged in conversation
 9. Exotel posts lifecycle webhooks to MediQuee Events URL:
    * POST https://api.mediquee.in/api/v1/exotel/events?token=...
    * MediQuee synchronizes CallLog (RINGING -> IN_PROGRESS -> COMPLETED)
```

---

## 2. Exotel Account & Infrastructure Configuration

| Parameter | Confirmed Production / Staging Value | Verification Status |
| :--- | :--- | :--- |
| **Account SID** | `mediquee1` | **CONFIRMED** |
| **API Host** | `api.exotel.com` (Singapore / Global cluster) | **CONFIRMED** (HTTP 200 on Voice Calls API) |
| **Base URL** | `https://api.exotel.com/v1/Accounts` | **CONFIRMED** |
| **ExoPhone Virtual Number** | `08047290980` (`080-472-90980`, Bengaluru) | **CONFIRMED** (Verified in account history) |
| **Call Type** | `trans` (Transactional) | **CONFIRMED** |
| **Call Recording** | Strictly `false` (Opt-in by policy) | **CONFIRMED** |
| **CCM Applet URL** | `http://my.exotel.com/mediquee1/exoml/start_voice/{app_id}` | **REQUIRES EXOTEL APP CREATION** |
| **App ID (`EXOTEL_APP_ID`)** | Assigned when Applet is saved in Exotel App Bazaar | **REQUIRES EXOTEL DASHBOARD ACTION** |

> [!IMPORTANT]
> **Graceful Dual-Mode Support:**
> If `EXOTEL_APP_ID` is not yet configured in `.env`, the backend automatically falls back to Direct Connect Two Numbers mode (`From` + `To` + `CallerId`). Once the Applet is created in Exotel and `EXOTEL_APP_ID` is set, the backend seamlessly routes calls through the CCM Programmable Connect flow.

---

## 3. Required Environment Variables

Configure these in `backend/.env`:

```env
# Exotel Authentication & Region
EXOTEL_ACCOUNT_SID="mediquee1"
EXOTEL_API_KEY="<YOUR_EXOTEL_API_KEY>"
EXOTEL_API_TOKEN="<YOUR_EXOTEL_API_TOKEN>"
EXOTEL_SUBDOMAIN="api.exotel.com"
EXOTEL_BASE_URL="https://api.exotel.com/v1/Accounts"

# Exotel Outbound Caller ID (Allocated ExoPhone Virtual Number)
EXOTEL_CALLER_ID="08047290980"

# Exotel CCM Applet ID (Assigned from Exotel App Bazaar > My Apps)
EXOTEL_APP_ID=""

# Webhook Security
EXOTEL_WEBHOOK_SECRET="mediquee_exotel_webhook_secret_key"
EXOTEL_ENABLE_RECORDING="false"
EXOTEL_STATUS_CALLBACK_URL="https://api.mediquee.in/api/v1/exotel/events"

# Data Encryption at Rest (32-byte key for AES-256-GCM)
PHONE_ENCRYPTION_KEY="<STRONG_RANDOM_SECRET_KEY_MIN_16_CHARS>"
```

---

## 4. API Endpoint Specifications

### A. Call Initiation Endpoint
* **Path:** `POST /api/v1/exotel/calls/initiate` (also aliased at `/api/v1/calls/initiate`)
* **Headers:** `Authorization: Bearer <PATIENT_JWT_TOKEN>`
* **Request Body:**
  ```json
  {
    "bookingId": "fed94038-05c8-40da-873d-5e9e18c8b019",
    "bookingType": "OP"
  }
  ```
* **Supported Booking Types:** `OP`, `VIDEO`, `NURSING`, `LAB_WALK_IN`, `HOME_SAMPLE`.
* **Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "callSid": "40cb1abd2afd81e4e253c25240a61abi",
    "callLogId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "queued",
    "virtualNumber": "080-472-90980",
    "direction": "PATIENT_TO_HOSPITAL",
    "maskedFrom": "+91 83*** ***59",
    "maskedTo": "+91 89*** ***46",
    "message": "Call initiated. You will receive an incoming call from our secure line (080-472-90980). Please answer to connect."
  }
  ```

---

### B. CCM Primary URL Endpoint
* **Path:** `GET /api/v1/exotel/connect`
* **Query Parameters Sent by Exotel:** `CallSid`, `Direction`, `From`, `To`, `CustomField`, `token`
* **Headers:** `Accept: application/json`
* **Response Format:** Strictly `Content-Type: application/json` with HTTP 200:
  ```json
  {
    "destination": [
      {
        "contact_uri": "+918912345646"
      }
    ],
    "state_management": true,
    "outgoing_phone_number": "08047290980",
    "recording": {
      "record": false,
      "channels": "single"
    },
    "max_ringing_duration": 30,
    "max_conversation_duration": 900
  }
  ```
* **SLA & Performance:** Target response time is `<100ms`, well within Exotel's 5-second timeout.

---

### C. CCM Fallback URL Endpoint
* **Path:** `GET /api/v1/exotel/fallback`
* **Query Parameters:** `CallSid`, `Reason`, `CustomField`, `token`
* **Behavior:** Invoked by Exotel if the Primary URL fails or times out. Logs the failover event in `CallLog.metadata` and returns the verified destination.

---

### D. Call Events Webhook Endpoint
* **Path:** `POST /api/v1/exotel/events`
* **Headers / Query:** `?token=mediquee_exotel_webhook_secret_key`
* **Payload:**
  ```json
  {
    "CallSid": "40cb1abd2afd81e4e253c25240a61abi",
    "Status": "completed",
    "EventType": "terminal",
    "ConversationDuration": 142,
    "Duration": 155,
    "RecordingUrl": null
  }
  ```
* **Idempotency Guarantee:** Preserves terminal states against out-of-order or duplicate webhook events.

---

## 5. Exotel Dashboard Setup Instructions

Follow these steps in the [Exotel Dashboard](https://my.exotel.com):

### Step 1: Create a Flow Applet in App Bazaar
1. Log in to the Exotel Dashboard with account `mediquee1`.
2. Navigate to **App Bazaar** > **My Apps** > **Create New App**.
3. Name the app: `MediQuee Programmable Connect`.
4. Drag and drop the **Connect Applet** into the call flow.

### Step 2: Configure the Connect Applet
1. Under **Connect whom?**, select **A dynamically created group from a URL (CCM)**.
2. Configure the **Primary URL**:
   ```
   https://mediquee.in/api/v1/exotel/connect?token=mediquee_exotel_webhook_secret_key
   ```
   *(Or dedicated API domain: `https://api.mediquee.in/api/v1/exotel/connect?token=mediquee_exotel_webhook_secret_key`)*
3. Configure the **Fallback URL**:
   ```
   https://mediquee.in/api/v1/exotel/fallback?token=mediquee_exotel_webhook_secret_key
   ```
   *(Or dedicated API domain: `https://api.mediquee.in/api/v1/exotel/fallback?token=mediquee_exotel_webhook_secret_key`)*
4. Set **HTTP Method** to `GET`.
5. Under **Call Event URL**, enter:
   ```
   https://mediquee.in/api/v1/exotel/events?token=mediquee_exotel_webhook_secret_key
   ```
   *(Or dedicated API domain: `https://api.mediquee.in/api/v1/exotel/events?token=mediquee_exotel_webhook_secret_key`)*
6. Save and publish the app.

### Step 3: Copy the App ID to `.env`
1. Note the assigned numeric **App ID** (e.g. `123456`) displayed next to the app name.
2. In `backend/.env`, set:
   ```env
   EXOTEL_APP_ID="123456"
   ```
3. Restart the backend process to activate CCM mode.

---

## 6. Security & Data Protection Controls

1. **Zero Credential Exposure:** All Exotel API credentials (`API Key`, `API Token`, Account SID) remain strictly on the backend server.
2. **Phone Encryption at Rest:** Telephone numbers stored in `call_logs` are encrypted with AES-256-GCM authenticated encryption (`enc:v1:<iv>:<tag>:<ciphertext>`).
3. **Timing-Safe Authentication:** Webhook tokens are verified using `crypto.timingSafeEqual` to prevent side-channel timing attacks.
4. **Anti-Toll Fraud Rate Limiting:** Outbound call attempts are limited to 5 requests per 10 minutes per IP. Booking-level rate limiting prevents initiating multiple calls within 3 minutes for the same appointment.
5. **Role-Enforced Call Direction:** Call direction is derived server-side from JWT claims; clients cannot manipulate caller or destination legs.
6. **Caller ID Masking:** Handsets display the virtual number `08047290980`, preventing personal phone numbers from being exchanged.

---

## 7. Troubleshooting & FAQ

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **HTTP 401 Unauthorized** | Attempted connection to `api.in.exotel.com` | Ensure `EXOTEL_SUBDOMAIN="api.exotel.com"` (Singapore cluster). |
| **HTTP 403 Forbidden** | Webhook token mismatch or missing query token | Verify `?token=` parameter matches `EXOTEL_WEBHOOK_SECRET`. |
| **Fallback URL Triggered** | Primary URL exceeded 5-second response limit | Ensure backend server latency is <500ms; verify database connection pooling. |
| **Caller ID shows mobile number** | Telecom carrier CLI override | Test with the controlled two-phone procedure; contact Exotel support for CLI mapping confirmation. |
