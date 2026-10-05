import type { RoomView, TurnEndReason } from "@shared/protocol";

import { useSecondsLeft } from "../hooks/useSecondsLeft";
import { rankPlayers } from "../lib/ranking";
import { actions, useGame } from "../state/gameStore";
import { Avatar } from "./Avatar";

function SecondsLeft({ prefix }: { prefix: string }) {
  const seconds = useSecondsLeft(useGame((s) => s.phaseDeadline));
  return (
    <p className="overlay__meta">
      {prefix} {seconds}s
    </p>
  );
}

function ChooseWord({ choices }: { choices: string[] }) {
  return (
    <>
      <h2 className="overlay__title">Pick a word to draw</h2>
      <div className="choices">
        {choices.map((word, index) => (
          <button
            key={word}
            type="button"
            className="btn btn--secondary choice"
            // Moving focus here lets keyboard players pick right away.
            autoFocus={index === 0}
            onClick={() => actions.chooseWord(index)}
          >
            {word}
          </button>
        ))}
      </div>
      <SecondsLeft prefix="A word is picked for you in" />
    </>
  );
}

const REASON_TEXT: Record<TurnEndReason, (drawer: string) => string> = {
  allGuessed: () => "Everyone got it!",
  timeout: () => "Time's up!",
  drawerLeft: (drawer) => `${drawer} left the game`,
};

function TurnSummary({ room }: { room: RoomView }) {
  const result = room.turnResult;
  if (!result) return null;
  const drawer = room.players.find((p) => p.id === result.drawerId)?.name ?? "The drawer";
  const gains = room.players
    .map((player) => ({ player, gain: result.gains[player.id] ?? 0 }))
    .sort((a, b) => b.gain - a.gain);

  return (
    <>
      <p className="overlay__eyebrow">{REASON_TEXT[result.reason](drawer)}</p>
      <h2 className="overlay__title">
        The word was <span className="overlay__word">{result.word}</span>
      </h2>
      <ul className="gains">
        {gains.map(({ player, gain }) => (
          <li key={player.id} className="gains__row">
            <span className="gains__name">{player.name}</span>
            <span className={gain > 0 ? "gains__value gains__value--positive" : "gains__value"}>
              +{gain}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

function Podium({ room, selfId }: { room: RoomView; selfId: string }) {
  const ranked = rankPlayers(room.players);
  const winners = ranked.filter((entry) => entry.rank === 1);
  const headline =
    winners.length > 1
      ? "It's a tie!"
      : winners[0]?.player.id === selfId
        ? "You win!"
        : `${winners[0]?.player.name ?? "Nobody"} wins!`;

  return (
    <>
      <p className="overlay__eyebrow">Game over</p>
      <h2 className="overlay__title">{headline}</h2>
      <ol className="podium">
        {ranked.slice(0, 5).map(({ player, rank }) => (
          <li key={player.id} className={`podium__row podium__row--${Math.min(rank, 4)}`}>
            <span className="podium__rank">{rank}</span>
            <Avatar id={player.id} name={player.name} size={28} />
            <span className="podium__name">{player.name}</span>
            <span className="podium__score">{player.score}</span>
          </li>
        ))}
      </ol>
      <SecondsLeft prefix="Back to the lobby in" />
    </>
  );
}

function Content({ room, selfId }: { room: RoomView; selfId: string }) {
  const drawer = room.players.find((p) => p.id === room.drawerId);
  switch (room.phase) {
    case "choosing":
      if (room.wordChoices) return <ChooseWord choices={room.wordChoices} />;
      return (
        <div className="overlay__waiting">
          {drawer && <Avatar id={drawer.id} name={drawer.name} size={40} />}
          <h2 className="overlay__title">{drawer?.name ?? "Someone"} is picking a word…</h2>
        </div>
      );
    case "turnEnd":
      return <TurnSummary room={room} />;
    case "gameOver":
      return <Podium room={room} selfId={selfId} />;
    default:
      return null;
  }
}

/** Phase cards over the canvas. The live region announces each new phase to screen readers. */
export function BoardOverlay({ room, selfId }: { room: RoomView; selfId: string }) {
  const visible = room.phase === "choosing" || room.phase === "turnEnd" || room.phase === "gameOver";
  return (
    <div className={visible ? "overlay overlay--visible" : "overlay"} aria-live="polite">
      {visible && (
        // Keyed by phase + round so every new card plays its entrance.
        <div key={`${room.phase}-${room.round}-${room.drawerId}`} className="overlay__card">
          <Content room={room} selfId={selfId} />
        </div>
      )}
    </div>
  );
}
