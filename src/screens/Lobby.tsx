import { LIMITS, SETTINGS_BOUNDS, type RoomSettings, type RoomView } from "@shared/protocol";
import { useState } from "react";

import { Avatar } from "../components/Avatar";
import { Chat } from "../components/Chat";
import { Icon } from "../components/Icon";
import { TopBar } from "../components/TopBar";
import { cx } from "../lib/cx";
import { actions } from "../state/gameStore";

const range = (min: number, max: number, step = 1) =>
  Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => min + i * step);

function NumberSetting({
  id,
  label,
  value,
  options,
  format,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  options: number[];
  format: (n: number) => string;
  disabled: boolean;
  onChange: (n: number) => void;
}) {
  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      <select
        id={id}
        className="input select"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {format(option)}
          </option>
        ))}
      </select>
    </div>
  );
}

function Settings({ room, isHost }: { room: RoomView; isHost: boolean }) {
  const { settings } = room;
  const update = (patch: Partial<RoomSettings>) => actions.updateSettings(patch);
  const { rounds, drawTime, maxPlayers } = SETTINGS_BOUNDS;

  return (
    <div className="settings">
      <NumberSetting
        id="setting-rounds"
        label="Rounds"
        value={settings.rounds}
        options={range(rounds.min, rounds.max)}
        format={(n) => `${n} ${n === 1 ? "round" : "rounds"}`}
        disabled={!isHost}
        onChange={(n) => update({ rounds: n })}
      />
      <NumberSetting
        id="setting-draw-time"
        label="Draw time"
        value={settings.drawTime}
        options={range(drawTime.min, drawTime.max, drawTime.step)}
        format={(n) => `${n} seconds`}
        disabled={!isHost}
        onChange={(n) => update({ drawTime: n })}
      />
      <NumberSetting
        id="setting-max-players"
        label="Max players"
        value={settings.maxPlayers}
        options={range(Math.max(maxPlayers.min, room.players.length), maxPlayers.max)}
        format={(n) => `${n} players`}
        disabled={!isHost}
        onChange={(n) => update({ maxPlayers: n })}
      />
      <label className={cx("switch", !isHost && "switch--disabled")}>
        <input
          type="checkbox"
          role="switch"
          className="switch__input"
          checked={settings.isPublic}
          disabled={!isHost}
          onChange={(event) => update({ isPublic: event.target.checked })}
        />
        <span className="switch__track" aria-hidden="true" />
        <span className="switch__text">
          <span className="field__label">Public room</span>
          <span className="switch__hint">Anyone can find and join it from the home page.</span>
        </span>
      </label>
      {!isHost && <p className="settings__note">Only the host can change settings.</p>}
    </div>
  );
}

export function Lobby({ room, selfId }: { room: RoomView; selfId: string }) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHost = room.hostId === selfId;
  const host = room.players.find((p) => p.id === room.hostId);
  const readyCount = room.players.filter((p) => p.connected).length;
  const needed = Math.max(0, LIMITS.minPlayers - readyCount);

  const start = async () => {
    setStarting(true);
    setError(null);
    const result = await actions.startGame();
    setStarting(false);
    if (!result.ok) setError(result.error);
  };

  return (
    <div className="screen">
      <TopBar room={room} />
      <main className="lobby">
        <h1 className="sr-only">Lobby, room {room.code}</h1>

        <section className="card lobby__players" aria-labelledby="lobby-players-heading">
          <h2 id="lobby-players-heading" className="card__title">
            Players
            <span className="card__count">
              {room.players.length}/{room.settings.maxPlayers}
            </span>
          </h2>
          <ul className="roster">
            {room.players.map((player) => (
              <li key={player.id} className={cx("roster__item", !player.connected && "roster__item--away")}>
                <Avatar id={player.id} name={player.name} size={40} />
                <span className="roster__name">
                  {player.name}
                  {player.id === selfId && <span className="player__you"> (you)</span>}
                </span>
                {player.id === room.hostId && (
                  <span className="badge">
                    <Icon name="crown" size={12} /> Host
                  </span>
                )}
              </li>
            ))}
          </ul>
          {needed > 0 && (
            <p className="lobby__invite-hint">
              <Icon name="users" size={16} /> Share the room code or invite link (top right) to bring a friend.
            </p>
          )}
        </section>

        <section className="card lobby__settings" aria-labelledby="settings-heading">
          <h2 id="settings-heading" className="card__title">
            Settings
          </h2>
          <Settings room={room} isHost={isHost} />
          <div className="lobby__start">
            {isHost ? (
              <>
                <button
                  type="button"
                  className="btn btn--primary btn--block"
                  disabled={needed > 0 || starting}
                  onClick={start}
                >
                  {starting ? "Starting…" : "Start game"}
                </button>
                <p className="lobby__start-hint" aria-live="polite">
                  {error ??
                    (needed > 0
                      ? `Waiting for ${needed} more ${needed === 1 ? "player" : "players"} to join…`
                      : `${readyCount} players ready.`)}
                </p>
              </>
            ) : (
              <p className="lobby__start-hint">Waiting for {host?.name ?? "the host"} to start the game…</p>
            )}
          </div>
        </section>

        <Chat room={room} selfId={selfId} className="lobby__chat" />
      </main>
    </div>
  );
}
