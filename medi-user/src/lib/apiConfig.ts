/**
 * Shared API configuration.
 * When running with Vite (dev, preview, or port forwarding like Dev Tunnels / ngrok),
 * defaulting to '/api/v1' enables seamless reverse-proxying through Vite to backend:5000.
 * This eliminates Mixed Content (HTTPS -> HTTP) and CORS/DNS issues on mobile devices.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
