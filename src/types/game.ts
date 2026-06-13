export interface Player {
  socketId: string;
  username: string;
}

export interface Room {
  id: string;
  name: string;
  isPublic: boolean;
  ownerId: string;
  maxPlayers: number;
  players: Player[];
}

export interface PublicRoom {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
}