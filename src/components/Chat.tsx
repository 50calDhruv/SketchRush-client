import { LIMITS, type RoomView } from "@shared/protocol";
import { useLayoutEffect, useRef, useState, type FormEvent } from "react";

import { cx } from "../lib/cx";
import { actions, useGame } from "../state/gameStore";
import { Icon } from "./Icon";

/** Within this many px of the bottom counts as "reading the latest" — keep following new messages. */
const STICK_THRESHOLD_PX = 48;

const placeholderFor = (room: RoomView, selfId: string): string => {
  if (room.phase !== "drawing") return "Say something…";
  const knowsWord =
    room.drawerId === selfId || room.players.some((p) => p.id === selfId && p.hasGuessed);
  return knowsWord ? "Chat with players who guessed…" : "Type your guess…";
};

export function Chat({ room, selfId, className }: { room: RoomView; selfId: string; className?: string }) {
  const messages = useGame((s) => s.messages);
  const [draft, setDraft] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useLayoutEffect(() => {
    const log = logRef.current;
    if (log && stickToBottom.current) log.scrollTop = log.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const log = logRef.current;
    if (log) stickToBottom.current = log.scrollHeight - log.scrollTop - log.clientHeight < STICK_THRESHOLD_PX;
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    actions.sendChat(text);
    setDraft("");
    stickToBottom.current = true;
  };

  return (
    <section className={cx("card chat", className)} aria-labelledby="chat-heading">
      <h2 id="chat-heading" className="card__title">
        {room.phase === "drawing" ? "Guesses" : "Chat"}
      </h2>
      <div ref={logRef} className="chat__log" role="log" aria-live="polite" onScroll={onScroll}>
        {messages.length === 0 && <p className="chat__empty">No messages yet. Say hi!</p>}
        <ol className="chat__messages">
          {messages.map((message) =>
            message.kind === "system" ? (
              <li key={message.id} className={cx("msg msg--system", `msg--${message.tone}`)}>
                {message.text}
              </li>
            ) : (
              <li
                key={message.id}
                className={cx("msg", message.scope === "guessers" && "msg--guessers")}
              >
                <span className="msg__name">
                  {message.name}
                  {message.playerId === selfId && <span className="sr-only"> (you)</span>}
                </span>{" "}
                <span className="msg__text">{message.text}</span>
              </li>
            ),
          )}
        </ol>
      </div>
      <form className="chat__form" onSubmit={submit}>
        <label htmlFor="chat-input" className="sr-only">
          {room.phase === "drawing" ? "Your guess" : "Message"}
        </label>
        <input
          id="chat-input"
          className="input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholderFor(room, selfId)}
          maxLength={LIMITS.chatMaxLength}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
        />
        <button type="submit" className="btn btn--primary btn--icon" disabled={!draft.trim()}>
          <Icon name="send" size={18} />
          <span className="sr-only">Send</span>
        </button>
      </form>
    </section>
  );
}
