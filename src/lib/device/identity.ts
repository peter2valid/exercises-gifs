const USER_ID_KEY  = 'gymapp:device_user_id';
const SESSION_KEY  = 'gymapp:active_session_id';

// Returns a stable, device-local user ID. Generated once on first launch.
export function getDeviceUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export function saveSessionId(id: string): void {
  localStorage.setItem(SESSION_KEY, id);
}

export function getSavedSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function clearSessionId(): void {
  localStorage.removeItem(SESSION_KEY);
}
