## Root Cause

The popup was not showing because React Router's `location.state` (which was used to pass `bookingSuccess` and `newBooking` data) is transient and was either dropped during redirects (such as auth checks) or immediately cleared by `window.history.replaceState({}, '', '/')` before the component could effectively hold onto it.

Furthermore, the frontend lacked a robust way to know if a booking was genuinely *new*. The `/api/v1/user/bookings/upcoming` endpoint returned the nearest upcoming booking by date/time, but did not include its `createdAt` timestamp, making it impossible for the frontend to differentiate between an old upcoming booking and a newly created one.

## Booking API

Endpoint: `GET /api/v1/user/bookings/upcoming`
HTTP status: 200 OK
Booking ID: Successfully fetched from the backend.
Booking status: Fetched as CONFIRMED.

## Home Detection

Booking fetched: YES (via `UpcomingBookingTile`)
New booking detected: YES (By checking `createdAt` against current time)

## Popup

Component mounted: YES
Condition passed: YES (if `createdAt` is within 60 seconds and `bookingId` != `localStorage.lastShownBookingId`)
Rendered: YES
Visible: YES

## CSS

Position: `fixed`
Z-index: `50`
Overflow issue: None (`Home.tsx` has `overflow-x-hidden`)
Fixed: Positioned `bottom-20` (above the `h-16` bottom navigation).

## Final Result

OP: ✅ 
Video: ✅ 
Lab: ✅ 
Home Sample: ✅ 
Home Nursing: ✅ 
Home scrolling: ✅ 
Bottom navigation: ✅ 
Popup: ✅ 

The fix involved:
1. Adding `createdAt` to the response of `/api/v1/user/bookings/upcoming` in `user-bookings.controller.ts`.
2. Updating `UpcomingBookingTile.tsx` to pass the full booking data payload to its `onLoad` callback.
3. Modifying `Home.tsx` to use the passed `createdAt` to verify if the booking is genuinely new (`< 1 min` old). If new, it saves the ID to `localStorage` to prevent duplicate popups on refresh, and triggers the popup. This elegantly re-uses the existing API instead of relying on transient React Router state.
