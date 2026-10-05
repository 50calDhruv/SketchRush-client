import { LIMITS, type JoinResult } from "@shared/protocol";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { Icon } from "../components/Icon";
import { Logo } from "../components/Logo";
import { getInviteCode, setInviteCode } from "../lib/invite";
import { loadName, saveName } from "../lib/session";
import { actions, useGame } from "../state/gameStore";

type Pending = "create" | "join" | null;

function PublicRooms({ onJoin, busy }: { onJoin: (code: string) => void; busy: boolean }) {
  const rooms = useGame((s) => s.publicRooms);

  return (
    <section className="card home__rooms" aria-labelledby="rooms-heading">
      <h2 id="rooms-heading" className="card__title">
        <Icon name="globe" size={18} /> Public rooms
      </h2>
      {rooms.length === 0 ? (
        <p className="empty">No public rooms right now. Create one and switch on “Public room” in its settings.</p>
      ) : (
        <ul className="room-list">
          {rooms.map((room) => (
            <li key={room.code} className="room-list__item">
              <span className="room-list__info">
                <span className="room-list__name">{room.hostName}’s room</span>
                <span className="room-list__meta">
                  {room.playerCount}/{room.maxPlayers} players · {room.inGame ? "Playing" : "In lobby"}
                </span>
              </span>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={busy}
                onClick={() => onJoin(room.code)}
              >
                Join<span className="sr-only"> {room.hostName}’s room</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Home() {
  const connection = useGame((s) => s.connection);
  const notice = useGame((s) => s.notice);
  const [name, setName] = useState(loadName);
  const [inviteCode, setInvite] = useState(getInviteCode);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Live public room list while this screen is open (re-subscribe after reconnects).
  useEffect(() => {
    if (connection !== "online") return;
    actions.subscribeLobby();
    return () => actions.unsubscribeLobby();
  }, [connection]);

  const run = async (kind: Exclude<Pending, null>, action: (name: string) => Promise<JoinResult>) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Pick a name first, so others know who’s drawing.");
      nameRef.current?.focus();
      return;
    }
    saveName(trimmed);
    setError(null);
    setPending(kind);
    const result = await action(trimmed);
    setPending(null);
    if (!result.ok) setError(result.error);
    return result;
  };

  const create = () => run("create", actions.createRoom);

  const join = async (roomCode: string) => {
    const result = await run("join", (n) => actions.joinRoom(roomCode, n));
    // A dead invite link shouldn't keep offering itself.
    if (result && !result.ok && roomCode === inviteCode) {
      setInvite(null);
      setInviteCode(null);
    }
  };

  const onPrimary = (event: FormEvent) => {
    event.preventDefault();
    if (inviteCode) void join(inviteCode);
    else void create();
  };

  const onJoinCode = (event: FormEvent) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (normalized.length !== LIMITS.roomCodeLength) {
      setError(`Room codes are ${LIMITS.roomCodeLength} characters, like K7QX2M.`);
      return;
    }
    void join(normalized);
  };

  const busy = pending !== null;

  return (
    <main className="home">
      <header className="home__brand">
        <Logo size="lg" />
        <h1 className="home__title">
          <span className="sr-only">SketchRush: </span>Draw fast. Guess faster.
        </h1>
        <p className="home__tagline">Take turns sketching a secret word while everyone races to guess it.</p>
      </header>

      <section className="card home__play" aria-label="Play">
        {notice && (
          <p className="notice" role="status">
            {notice}
            <button type="button" className="notice__dismiss" onClick={actions.dismissNotice}>
              Dismiss
            </button>
          </p>
        )}

        <form onSubmit={onPrimary} className="stack">
          <div className="field">
            <label htmlFor="name" className="field__label">
              Your name
            </label>
            <input
              id="name"
              ref={nameRef}
              className="input input--lg"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={LIMITS.nameMaxLength}
              autoComplete="nickname"
              placeholder="e.g. Picasso"
              aria-describedby={error ? "home-error" : undefined}
            />
          </div>
          <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy}>
            {inviteCode
              ? pending === "join"
                ? "Joining…"
                : `Join room ${inviteCode}`
              : pending === "create"
                ? "Creating…"
                : "Create a room"}
          </button>
        </form>

        {inviteCode ? (
          <button type="button" className="btn btn--ghost btn--block" disabled={busy} onClick={() => void create()}>
            Create a new room instead
          </button>
        ) : (
          <>
            <div className="divider">
              <span>or join with a code</span>
            </div>
            <form onSubmit={onJoinCode} className="join-row">
              <label htmlFor="room-code" className="sr-only">
                Room code
              </label>
              <input
                id="room-code"
                className="input input--code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                maxLength={LIMITS.roomCodeLength}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="K7QX2M"
              />
              <button type="submit" className="btn btn--secondary" disabled={busy}>
                {pending === "join" ? "Joining…" : "Join"}
              </button>
            </form>
          </>
        )}

        {error && (
          <p id="home-error" className="form-error" role="alert">
            {error}
          </p>
        )}
      </section>

      <PublicRooms onJoin={(roomCode) => void join(roomCode)} busy={busy} />
    </main>
  );
}
