/**
 * Root for all API calls.
 *
 * - Web / PWA (served same-origin by Express): leave VITE_API_URL unset → ''
 *   so requests stay relative ("/api/...").
 * - Native APK (Capacitor): the app is served from capacitor://localhost, which
 *   has no backend, so set VITE_API_URL at build time to the hosted backend
 *   (e.g. https://bracu-routine.onrender.com) and calls become absolute.
 */
export const API_ROOT = import.meta.env.VITE_API_URL || '';
