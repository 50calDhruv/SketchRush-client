import type { ReactNode } from "react";

import { Logo } from "./components/Logo";
import { Game } from "./screens/Game";
import { Home } from "./screens/Home";
import { Lobby } from "./screens/Lobby";
import { useGame } from "./state/gameStore";

function CenteredMessage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <main className="centered">
      <Logo size="lg" />
      <h1 className="centered__title">{title}</h1>
      {children}
    </main>
  );
}

export default function App() {
  const connection = useGame((s) => s.connection);
  const sessionReady = useGame((s) => s.sessionReady);
  const room = useGame((s) => s.room);
  const selfId = useGame((s) => s.selfId);

  if (connection === "replaced") {
    return (
      <CenteredMessage title="SketchRush is open in another tab">
        <p className="centered__text">You can only play from one tab at a time.</p>
        <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
          Play here instead
        </button>
      </CenteredMessage>
    );
  }

  if (!sessionReady) {
    return (
      <CenteredMessage title={connection === "offline" ? "Can’t reach the game server" : "Connecting…"}>
        <p className="centered__text" role="status">
          <span className="spinner" aria-hidden="true" />
          {connection === "offline" ? "Retrying automatically." : "Getting things ready."}
        </p>
      </CenteredMessage>
    );
  }

  return (
    <>
      {connection === "offline" && (
        <div className="banner" role="status">
          <span className="spinner" aria-hidden="true" /> Connection lost. Reconnecting…
        </div>
      )}
      {room && selfId ? (
        room.phase === "lobby" ? (
          <Lobby room={room} selfId={selfId} />
        ) : (
          <Game room={room} selfId={selfId} />
        )
      ) : (
        <Home />
      )}
    </>
  );
}
