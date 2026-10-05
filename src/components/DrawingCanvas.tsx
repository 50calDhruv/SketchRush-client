import { CANVAS, type Stroke } from "@shared/protocol";
import { useEffect, useRef } from "react";

import { shortId } from "../lib/session";
import { canvasStore } from "../state/canvasStore";

/** Backing store is 2x the logical size so lines stay crisp on high-density screens. */
const RESOLUTION = 2;
const BACKGROUND = "#ffffff";

const round4 = (value: number) => Math.round(Math.min(1, Math.max(0, value)) * 10_000) / 10_000;

/** Draws `stroke` from point `fromPoint` onward; overlapping one point keeps the line continuous. */
const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke, fromPoint: number) => {
  const { width, height } = ctx.canvas;
  const { points } = stroke;
  const count = points.length / 2;
  if (count === 0) return;

  const x = (i: number) => (points[i * 2] ?? 0) * width;
  const y = (i: number) => (points[i * 2 + 1] ?? 0) * height;
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.size * (width / CANVAS.width);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (count === 1) {
    ctx.beginPath();
    ctx.arc(x(0), y(0), ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const start = Math.max(0, fromPoint - 1);
  ctx.beginPath();
  ctx.moveTo(x(start), y(start));
  for (let i = start + 1; i < count; i++) ctx.lineTo(x(i), y(i));
  ctx.stroke();
};

type Props = {
  canDraw: boolean;
  color: string;
  size: number;
  label: string;
};

export function DrawingCanvas({ canDraw, color, size, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Read at stroke start without re-binding pointer listeners on every tool change.
  const toolRef = useRef({ color, size });
  useEffect(() => {
    toolRef.current = { color, size };
  }, [color, size]);

  // Rendering: full paint on mount/undo/clear, incremental segments otherwise.
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const redraw = () => {
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      for (const stroke of canvasStore.getStrokes()) drawStroke(ctx, stroke, 0);
    };
    redraw();
    return canvasStore.subscribe((change) =>
      change.type === "append" ? drawStroke(ctx, change.stroke, change.fromPoint) : redraw(),
    );
  }, []);

  // Input: 1:1 pointer tracking with capture, using coalesced events for smooth fast strokes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canDraw) return;

    let active: { pointerId: number; style: Omit<Stroke, "points"> } | null = null;

    const toPoints = (events: PointerEvent[]) => {
      const rect = canvas.getBoundingClientRect();
      return events.flatMap((e) => [
        round4((e.clientX - rect.left) / rect.width),
        round4((e.clientY - rect.top) / rect.height),
      ]);
    };

    const onDown = (event: PointerEvent) => {
      if (active || event.button !== 0) return;
      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      active = { pointerId: event.pointerId, style: { id: shortId(), ...toolRef.current } };
      canvasStore.drawLocal(active.style, toPoints([event]));
    };

    const onMove = (event: PointerEvent) => {
      if (!active || event.pointerId !== active.pointerId) return;
      const coalesced = event.getCoalescedEvents?.() ?? [];
      canvasStore.drawLocal(active.style, toPoints(coalesced.length > 0 ? coalesced : [event]));
    };

    const onEnd = (event: PointerEvent) => {
      if (!active || event.pointerId !== active.pointerId) return;
      active = null;
      canvasStore.flush();
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onEnd);
    canvas.addEventListener("pointercancel", onEnd);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onEnd);
      canvas.removeEventListener("pointercancel", onEnd);
      if (active) canvasStore.flush();
    };
  }, [canDraw]);

  return (
    <canvas
      ref={canvasRef}
      className={canDraw ? "canvas canvas--drawable" : "canvas"}
      width={CANVAS.width * RESOLUTION}
      height={CANVAS.height * RESOLUTION}
      role="img"
      aria-label={label}
    />
  );
}
