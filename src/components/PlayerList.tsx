import type { PlayerView, RoomView } from "@shared/protocol";

import { cx } from "../lib/cx";
import { rankPlayers } from "../lib/ranking";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

function Status({ room, player }: { room: RoomView; player: PlayerView }) {
  if (!player.connected) return <span className="player__status player__status--away">Reconnecting…</span>;
  if (room.drawerId === player.id && room.phase !== "gameOver") {
    return (
      <span className="player__status player__status--drawing">
        <Icon name="brush" size={14} /> Drawing
      </span>
    );
  }
  if (player.hasGuessed) {
    return (
      <span className="player__status player__status--guessed">
        <Icon name="check" size={14} /> Guessed
      </span>
    );
  }
  return null;
}

export function PlayerList({ room, selfId, className }: { room: RoomView; selfId: string; className?: string }) {
  return (
    <section className={cx("card players", className)} aria-labelledby="players-heading">
      <h2 id="players-heading" className="card__title">
        Players
      </h2>
      <ol className="players__list">
        {rankPlayers(room.players).map(({ player, rank }) => (
          <li
            key={player.id}
            className={cx(
              "player",
              player.id === selfId && "player--self",
              room.drawerId === player.id && room.phase === "drawing" && "player--drawing",
              player.hasGuessed && "player--guessed",
              !player.connected && "player--away",
            )}
          >
            <span className="player__rank">#{rank}</span>
            <Avatar id={player.id} name={player.name} />
            <span className="player__info">
              <span className="player__name">
                {player.name}
                {player.id === selfId && <span className="player__you"> (you)</span>}
              </span>
              <Status room={room} player={player} />
            </span>
            {/* Re-keyed on change so the number pops when points land. */}
            <span key={player.score} className="player__score">
              {player.score}
              <span className="sr-only"> points</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
