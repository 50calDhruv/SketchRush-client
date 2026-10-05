import type { PlayerView } from "@shared/protocol";

/** Highest score first; equal scores share a rank. Stable by join order. */
export const rankPlayers = (players: PlayerView[]) =>
  [...players]
    .sort((a, b) => b.score - a.score)
    .map((player) => ({ player, rank: 1 + players.filter((p) => p.score > player.score).length }));
