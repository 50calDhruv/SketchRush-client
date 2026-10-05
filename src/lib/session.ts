const SESSION_KEY = "sketchrush:session";
const NAME_KEY = "sketchrush:name";
const SESSION_PATTERN = /^[\w-]{16,64}$/;

// Storage can throw (private mode, blocked site data); the game must still work without it.
const read = (storage: () => Storage, key: string): string | null => {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
};

const write = (storage: () => Storage, key: string, value: string): void => {
  try {
    storage().setItem(key, value);
  } catch {
    // Not persisted; fine.
  }
};

const randomId = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
};

/**
 * Secret that lets the server give this tab its seat back after a refresh or a network blip.
 * Per tab (sessionStorage), so two tabs are two players.
 */
export const getSessionId = (): string => {
  const existing = read(() => sessionStorage, SESSION_KEY);
  if (existing && SESSION_PATTERN.test(existing)) return existing;
  const id = randomId();
  write(() => sessionStorage, SESSION_KEY, id);
  return id;
};

export const loadName = (): string => read(() => localStorage, NAME_KEY) ?? "";
export const saveName = (name: string): void => write(() => localStorage, NAME_KEY, name);

/** Short random id for strokes; doesn't need to be cryptographically strong. */
export const shortId = (): string => Math.random().toString(36).slice(2, 12);
