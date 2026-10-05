import type { RoomView } from "@shared/protocol";
import { useEffect, useState, type ReactNode } from "react";

import { inviteUrl } from "../lib/invite";
import { actions } from "../state/gameStore";
import { Icon } from "./Icon";
import { Logo } from "./Logo";

const COPIED_FEEDBACK_MS = 2_000;

function CopyInvite({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl(code));
      setCopied(true);
    } catch {
      // Clipboard unavailable (insecure context or denied): the code is visible to read out.
    }
  };

  return (
    <button type="button" className="room-code" onClick={copy}>
      <span className="room-code__label">Room</span>
      <span className="room-code__value">{code}</span>
      <Icon name={copied ? "check" : "copy"} size={16} />
      <span className="sr-only" aria-live="polite">
        {copied ? "Invite link copied" : "Copy invite link"}
      </span>
    </button>
  );
}

export function TopBar({ room, children }: { room: RoomView; children?: ReactNode }) {
  const leave = () => {
    const midGame = room.phase !== "lobby" && room.phase !== "gameOver";
    if (midGame && !window.confirm("Leave the game? Your score will be lost.")) return;
    actions.leaveRoom();
  };

  return (
    <header className="topbar">
      <Logo />
      <div className="topbar__center">{children}</div>
      <div className="topbar__actions">
        <CopyInvite code={room.code} />
        <button type="button" className="btn btn--ghost btn--icon" onClick={leave}>
          <Icon name="leave" />
          <span className="sr-only">Leave room</span>
        </button>
      </div>
    </header>
  );
}
