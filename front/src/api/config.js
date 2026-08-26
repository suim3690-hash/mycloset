// Resolves to whatever host the page was loaded from, so API calls work both
// from this PC (http://localhost:5173) and from other devices on the same
// network (http://<this-PC's-LAN-IP>:5173, e.g. from a phone).
export const BASE_URL = `http://${window.location.hostname}:8081`;
