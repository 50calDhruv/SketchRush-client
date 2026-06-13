import { useEffect, useState } from "react";

import { socket } from "./services/socket";

import type {
  Room,
  PublicRoom,
} from "./types/game";

import { EVENTS } from "./constants/events";

function App() {
  const [username, setUsername] =
    useState("");

  const [roomCode, setRoomCode] =
    useState("");

  const [roomName, setRoomName] =
    useState("");

  const [isPublic, setIsPublic] =
    useState(true);

  const [room, setRoom] =
    useState<Room | null>(null);

  const [publicRooms, setPublicRooms] =
    useState<PublicRoom[]>([]);

  const [error, setError] =
    useState("");

  useEffect(() => {
    socket.connect();

    socket.emit(
      EVENTS.GET_PUBLIC_ROOMS
    );

    socket.on(
      EVENTS.ROOM_STATE,
      (roomData: Room) => {
        setRoom(roomData);
      }
    );

    socket.on(
      EVENTS.PUBLIC_ROOMS,
      (
        rooms: PublicRoom[]
      ) => {
        setPublicRooms(rooms);
      }
    );

    socket.on(
      EVENTS.ERROR,
      (message: string) => {
        setError(message);
      }
    );

    socket.on(
      EVENTS.ROOM_CREATED,
      ({
        roomId,
      }: {
        roomId: string;
      }) => {
        alert(
          `Room Created!\nCode: ${roomId}`
        );
      }
    );

    return () => {
      socket.removeAllListeners();
    };
  }, []);

  const createRoom = () => {
    setError("");

    socket.emit(
      EVENTS.CREATE_ROOM,
      {
        username,
        roomName,
        isPublic,
      }
    );
  };

  const joinRoom = (
    roomId: string
  ) => {
    setError("");

    socket.emit(
      EVENTS.JOIN_ROOM,
      {
        roomId,
        username,
      }
    );
  };

  if (room) {
    return (
      <div
        style={{
          padding: "2rem",
        }}
      >
        <h1>
          {room.name}
        </h1>

        <p>
          Room Code:
          <strong>
            {" "}
            {room.id}
          </strong>
        </p>

        <p>
          Players:
          {" "}
          {room.players.length}
          /
          {room.maxPlayers}
        </p>

        <h2>
          Connected Players
        </h2>

        <ul>
          {room.players.map(
            player => (
              <li
                key={
                  player.socketId
                }
              >
                {
                  player.username
                }
              </li>
            )
          )}
        </ul>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "600px",
      }}
    >
      <h1>
        SketchRush
      </h1>

      <input
        placeholder="Username"
        value={username}
        onChange={e =>
          setUsername(
            e.target.value
          )
        }
      />

      <hr />

      <h2>
        Create Room
      </h2>

      <input
        placeholder="Room Name"
        value={roomName}
        onChange={e =>
          setRoomName(
            e.target.value
          )
        }
      />

      <br />
      <br />

      <label>
        <input
          type="checkbox"
          checked={
            isPublic
          }
          onChange={e =>
            setIsPublic(
              e.target.checked
            )
          }
        />
        Public Room
      </label>

      <br />
      <br />

      <button
        onClick={
          createRoom
        }
      >
        Create Room
      </button>

      <hr />

      <h2>
        Join By Code
      </h2>

      <input
        placeholder="Room Code"
        value={roomCode}
        onChange={e =>
          setRoomCode(
            e.target.value
          )
        }
      />

      <button
        onClick={() =>
          joinRoom(
            roomCode
          )
        }
      >
        Join
      </button>

      <hr />

      <h2>
        Public Rooms
      </h2>

      {publicRooms.length ===
      0 ? (
        <p>
          No public rooms
        </p>
      ) : (
        publicRooms.map(
          room => (
            <div
              key={room.id}
            >
              <strong>
                {room.name}
              </strong>

              {" "}
              (
              {
                room.playerCount
              }
              /
              {
                room.maxPlayers
              }
              )

              <button
                onClick={() =>
                  joinRoom(
                    room.id
                  )
                }
              >
                Join
              </button>
            </div>
          )
        )
      )}

      {error && (
        <>
          <hr />
          <p>
            {error}
          </p>
        </>
      )}
    </div>
  );
}

export default App;