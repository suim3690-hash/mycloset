// Dev server (vite) has no reverse proxy, so hit the backend directly.
// Production build is served by nginx, which proxies /api/ and /uploads/
// to the backend over HTTPS - use a relative (same-origin) URL there to
// avoid mixed-content blocking.
export const BASE_URL = import.meta.env.DEV
  ? `http://${window.location.hostname}:8081`
  : '';