import { LIMITS, type Stroke, type StrokeSegment } from "@shared/protocol";

import { socket } from "../lib/socket";

/**
 * The shared drawing, kept outside React so no stroke is missed while the canvas mounts
 * (a late joiner's `canvas:sync` can arrive in the same tick as the room state).
 *
 * The drawer renders locally and batches points to the server; everyone else applies the
 * server's relay. Undo and clear round-trip through the server so every canvas stays identical.
 */

export type CanvasChange =
  | { type: "append"; stroke: Stroke; fromPoint: number }
  | { type: "redraw" };

type Listener = (change: CanvasChange) => void;

const FLUSH_INTERVAL_MS = 40;

const strokes: Stroke[] = [];
const strokesById = new Map<string, Stroke>();
const listeners = new Set<Listener>();

const pending = new Map<string, StrokeSegment>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const notify = (change: CanvasChange) => {
  for (const listener of listeners) listener(change);
};

const append = (segment: StrokeSegment) => {
  let stroke = strokesById.get(segment.id);
  if (!stroke) {
    stroke = { id: segment.id, color: segment.color, size: segment.size, points: [] };
    strokes.push(stroke);
    strokesById.set(stroke.id, stroke);
  }
  const fromPoint = stroke.points.length / 2;
  stroke.points.push(...segment.points);
  notify({ type: "append", stroke, fromPoint });
};

const replaceAll = (next: Stroke[]) => {
  strokes.length = 0;
  strokesById.clear();
  for (const stroke of next) {
    const copy = { ...stroke, points: [...stroke.points] };
    strokes.push(copy);
    strokesById.set(copy.id, copy);
  }
  notify({ type: "redraw" });
};

const flush = () => {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
  for (const segment of pending.values()) {
    for (let i = 0; i < segment.points.length; i += LIMITS.pointsPerMessage) {
      socket.emit("draw:points", {
        ...segment,
        points: segment.points.slice(i, i + LIMITS.pointsPerMessage),
      });
    }
  }
  pending.clear();
};

socket.on("draw:points", append);
socket.on("canvas:sync", ({ strokes: next }) => replaceAll(next));
socket.on("draw:clear", () => {
  pending.clear();
  replaceAll([]);
});
socket.on("draw:undo", ({ strokeId }) => {
  const index = strokes.findIndex((stroke) => stroke.id === strokeId);
  if (index === -1) return;
  strokes.splice(index, 1);
  strokesById.delete(strokeId);
  notify({ type: "redraw" });
});

export const canvasStore = {
  getStrokes: (): readonly Stroke[] => strokes,

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Drawer input: render immediately, send to the server in small batches. */
  drawLocal(style: Omit<Stroke, "points">, points: number[]): void {
    if (points.length === 0) return;
    append({ ...style, points });

    const queued = pending.get(style.id);
    if (queued) queued.points.push(...points);
    else pending.set(style.id, { ...style, points: [...points] });

    flushTimer ??= setTimeout(flush, FLUSH_INTERVAL_MS);
  },

  /** Send buffered points now (end of a stroke). */
  flush,

  undo(): void {
    flush();
    socket.emit("draw:undo");
  },

  clear(): void {
    flush();
    socket.emit("draw:clear");
  },

  reset(): void {
    pending.clear();
    replaceAll([]);
  },
};
