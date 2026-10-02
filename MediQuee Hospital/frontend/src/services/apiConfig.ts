/**
 * Shared API configuration for MediQuee Hospital Dashboard.
 * When running with Vite (dev, preview, or port forwarding like Dev Tunnels / ngrok),
 * defaulting to '' for API_URL and '/api/v1' for API_BASE_URL enables seamless
 * reverse-proxying through Vite to backend:5000.
 * This eliminates Mixed Content (HTTPS -> HTTP) and CORS/DNS issues on mobile devices.
 */
export const API_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '') : '';
export const API_BASE_URL = `${API_URL}/api/v1`;
