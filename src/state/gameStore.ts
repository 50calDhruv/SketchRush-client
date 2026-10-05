import type {
  AckResult,
  ChatMessage,
  JoinResult,
  PublicRoomSummary,
  RoomSettings,
  RoomView,
} from "@shared/protocol";
import { useSyncExternalStore } from "react";

import { setInviteCode } from "../lib/invite";
import { socket } from "../lib/socket";
import { canvasStore } from "./canvasStore";

export type ConnectionStatus = "connecting" | "online" | "offline" | "replaced";

export type GameState = {
  connection: ConnectionStatus;
  /** True once the server has told us whether this session already holds a seat. */
  sessionReady: boolean;
  selfId: string | null;
  room: RoomView | null;
  /** Local `Date.now()` at which the current phase ends. The server sends a relative duration. */
  phaseDeadline: number | null;
  messages: ChatMessage[];
  publicRooms: PublicRoomSummary[];
  /** One-off message for the home screen, e.g. after losing the seat during an outage. */
  notice: string | null;
};

const MAX_MESSAGES = 200;
const ACK_TIMEOUT_MS = 5_000;
const NO_RESPONSE = "The server didn't respond. Check your connection and try again.";

let state: GameState = {
  connection: "connecting",
  sessionReady: false,
  selfId: null,
  room: null,
  phaseDeadline: null,
  messages: [],
  publicRooms: [],
  notice: null,
};

const listeners = new Set<() => void>();

const setState = (patch: Partial<GameState>) => {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Subscribe to a slice of game state. The selector must return existing references. */
export const useGame = <T>(selector: (state: GameState) => T): T =>
  useSyncExternalStore(subscribe, () => selector(state));

const leaveRoomLocally = (notice: string | null = null) => {
  setState({ room: null, selfId: null, phaseDeadline: null, messages: [], notice });
  canvasStore.reset();
};

// ── Server events ───────────────────────────────────────────────────────────

socket.on("connect", () => setState({ connection: "online" }));

socket.on("disconnect", (reason) => {
  if (state.connection === "replaced") return;
  // The server only disconnects us itself when another tab took over this session.
  setState({ connection: reason === "io server disconnect" ? "replaced" : "offline" });
});

socket.on("connect_error", () => {
  if (state.connection !== "replaced") setState({ connection: "offline" });
});

socket.on("session:init", ({ playerId }) => {
  if (playerId) return setState({ sessionReady: true, selfId: playerId });
  if (state.room) {
    // We were in a room, but the server no longer holds our seat (restart or a long outage).
    leaveRoomLocally("You lost your seat in the room after the connection dropped.");
  }
  setState({ sessionReady: true });
});

socket.on("session:replaced", () => setState({ connection: "replaced" }));

socket.on("room:state", (room) => {
  setState({
    room,
    phaseDeadline: room.phaseRemainingMs === null ? null : Date.now() + room.phaseRemainingMs,
  });
  setInviteCode(room.code);
});

socket.on("chat:message", (message) => {
  setState({ messages: [...state.messages.slice(-(MAX_MESSAGES - 1)), message] });
});

socket.on("lobby:rooms", (publicRooms) => setState({ publicRooms }));

socket.connect();

// ── Actions ─────────────────────────────────────────────────────────────────

type AckFailure = Extract<AckResult, { ok: false }>;

const request = async <T extends AckResult>(send: () => Promise<T>): Promise<T | AckFailure> => {
  try {
    return await send();
  } catch {
    return { ok: false, error: NO_RESPONSE };
  }
};

const enter = (result: JoinResult) => {
  if (result.ok) setState({ selfId: result.playerId, notice: null });
  return result;
};

export const actions = {
  createRoom: async (name: string) =>
    enter(await request(() => socket.timeout(ACK_TIMEOUT_MS).emitWithAck("room:create", { name }))),

  joinRoom: async (code: string, name: string) =>
    enter(
      await request(() => socket.timeout(ACK_TIMEOUT_MS).emitWithAck("room:join", { code, name })),
    ),

  leaveRoom: () => {
    socket.emit("room:leave");
    setInviteCode(null); // before the state change, so Home mounts without the old invite
    leaveRoomLocally();
  },

  updateSettings: (patch: Partial<RoomSettings>) => {
    socket.emit("room:settings", patch);
  },

  startGame: () => request(() => socket.timeout(ACK_TIMEOUT_MS).emitWithAck("game:start")),

  chooseWord: (index: number) => {
    socket.emit("game:choose-word", { index });
  },

  sendChat: (text: string) => {
    socket.emit("chat:send", { text });
  },

  subscribeLobby: () => {
    socket.emit("lobby:subscribe");
  },
  unsubscribeLobby: () => {
    socket.emit("lobby:unsubscribe");
  },

  dismissNotice: () => setState({ notice: null }),
};
