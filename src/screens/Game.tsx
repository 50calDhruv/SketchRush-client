import type { RoomView } from "@shared/protocol";

import { Board } from "../components/Board";
import { Chat } from "../components/Chat";
import { GameStatus } from "../components/GameStatus";
import { PlayerList } from "../components/PlayerList";
import { TopBar } from "../components/TopBar";

export function Game({ room, selfId }: { room: RoomView; selfId: string }) {
  return (
    <div className="screen">
      <TopBar room={room}>
        <GameStatus room={room} selfId={selfId} />
      </TopBar>
      <main className="game">
        <h1 className="sr-only">SketchRush game, room {room.code}</h1>
        <section className="game__board" aria-label="Drawing board">
          <Board room={room} selfId={selfId} />
        </section>
        <PlayerList room={room} selfId={selfId} className="game__players" />
        <Chat room={room} selfId={selfId} className="game__chat" />
      </main>
    </div>
  );
}
