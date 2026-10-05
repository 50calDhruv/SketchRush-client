import { BRUSH_SIZES, type RoomView } from "@shared/protocol";
import { useEffect, useState } from "react";

import { ERASER_COLOR, PALETTE } from "../lib/palette";
import { canvasStore } from "../state/canvasStore";
import { BoardOverlay } from "./BoardOverlay";
import { DrawingCanvas } from "./DrawingCanvas";
import { Toolbar, type Tool } from "./Toolbar";

export function Board({ room, selfId }: { room: RoomView; selfId: string }) {
  const [color, setColor] = useState<string>(PALETTE[0].value);
  const [size, setSize] = useState<number>(BRUSH_SIZES[1]);
  const [tool, setTool] = useState<Tool>("brush");

  const isDrawer = room.drawerId === selfId;
  const canDraw = isDrawer && room.phase === "drawing";
  const drawerName = room.players.find((p) => p.id === room.drawerId)?.name;

  // Ctrl/Cmd+Z undoes the last stroke while drawing.
  useEffect(() => {
    if (!canDraw) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea")) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        canvasStore.undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canDraw]);

  return (
    <div className="board">
      <div className="board__frame">
        <DrawingCanvas
          canDraw={canDraw}
          color={tool === "eraser" ? ERASER_COLOR : color}
          size={size}
          label={canDraw ? "Your canvas. Draw the word." : `${drawerName ?? "The drawer"}'s drawing`}
        />
        <BoardOverlay room={room} selfId={selfId} />
      </div>
      {isDrawer && (room.phase === "drawing" || room.phase === "choosing") && (
        <Toolbar
          color={color}
          size={size}
          tool={tool}
          disabled={!canDraw}
          onColor={setColor}
          onSize={setSize}
          onTool={setTool}
          onUndo={canvasStore.undo}
          onClear={canvasStore.clear}
        />
      )}
    </div>
  );
}
