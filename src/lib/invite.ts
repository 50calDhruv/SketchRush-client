const PARAM = "room";

/** The room code in the address bar (`?room=ABC123`), if any. */
export const getInviteCode = (): string | null => {
  const code = new URLSearchParams(window.location.search).get(PARAM);
  return code && /^[A-Za-z0-9]{6}$/.test(code) ? code.toUpperCase() : null;
};

/** Keeps the address bar shareable: it always points at the room you're in. */
export const setInviteCode = (code: string | null): void => {
  const url = new URL(window.location.href);
  if (code) url.searchParams.set(PARAM, code);
  else url.searchParams.delete(PARAM);
  if (url.href !== window.location.href) window.history.replaceState(null, "", url);
};

export const inviteUrl = (code: string): string => {
  const url = new URL(window.location.pathname, window.location.origin);
  url.searchParams.set(PARAM, code);
  return url.href;
};
