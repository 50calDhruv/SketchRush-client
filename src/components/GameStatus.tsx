import type { RoomView } from "@shared/protocol";

import { useSecondsLeft } from "../hooks/useSecondsLeft";
import { cx } from "../lib/cx";
import { useGame } from "../state/gameStore";
import { Icon } from "./Icon";

const URGENT_SECONDS = 10;

function Timer({ room }: { room: RoomView }) {
  const seconds = useSecondsLeft(useGame((s) => s.phaseDeadline));
  const urgent = room.phase === "drawing" && seconds <= URGENT_SECONDS;
  return (
    <span className={cx("timer", urgent && "timer--urgent")} role="timer" aria-label={`${seconds} seconds left`}>
      <Icon name="timer" size={16} />
      <span className="timer__value">{seconds}</span>
    </span>
  );
}

/** Letter counts per word, e.g. "4 3" for "hot dog", so guessers can see the shape. */
const wordLengths = (chars: readonly (string | null)[]) =>
  chars
    .map((c) => (c === " " ? " " : "x"))
    .join("")
    .split(" ")
    .map((part) => part.length)
    .join(" ");

function Word({ room, selfId }: { room: RoomView; selfId: string }) {
  if (room.phase === "choosing") {
    return <span className="word word--muted">{room.drawerId === selfId ? "Pick a word" : "Get ready…"}</span>;
  }
  if (room.phase === "turnEnd" && room.turnResult) {
    return <span className="word word--revealed">{room.turnResult.word}</span>;
  }
  if (room.phase !== "drawing" || !room.hint) return null;

  if (room.word) {
    return (
      <span className="word word--known">
        <span className="word__label">{room.drawerId === selfId ? "Draw" : "You got it"}</span>
        {room.word}
      </span>
    );
  }

  const hint = room.hint;
  const spoken = hint.map((c) => (c === " " ? "space" : (c ?? "blank"))).join(", ");
  return (
    <span className="word">
      <span className="hint" aria-hidden="true">
        {hint.map((char, i) =>
          char === " " ? (
            <span key={i} className="hint__space" />
          ) : (
            <span key={i} className={cx("hint__char", char && "hint__char--revealed")}>
              {char ?? ""}
            </span>
          ),
        )}
      </span>
      <span className="hint__count" aria-hidden="true">
        {wordLengths(hint)}
      </span>
      <span className="sr-only">
        Hint, {hint.filter((c) => c !== " ").length} letters: {spoken}
      </span>
    </span>
  );
}

export function GameStatus({ room, selfId }: { room: RoomView; selfId: string }) {
  return (
    <div className="status">
      <span className="status__round">
        {room.phase === "gameOver" ? "Final" : `Round ${room.round}/${room.settings.rounds}`}
      </span>
      <Word room={room} selfId={selfId} />
      <Timer room={room} />
    </div>
  );
}
