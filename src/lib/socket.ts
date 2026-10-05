import type { ClientToServerEvents, ServerToClientEvents } from "@shared/protocol";
import { io, type Socket } from "socket.io-client";

import { getSessionId } from "./session";

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const serverUrl = import.meta.env.VITE_SERVER_URL;
const options = {
  auth: { sessionId: getSessionId() },
  // Prefer WebSocket, fall back to long-polling on networks that block it.
  transports: ["websocket", "polling"],
  autoConnect: false,
};

/** The single connection to the game server. Connected by the game store at startup. */
export const socket: GameSocket = serverUrl ? io(serverUrl, options) : io(options);
