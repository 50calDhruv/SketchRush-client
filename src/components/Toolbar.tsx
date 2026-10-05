import { BRUSH_SIZES } from "@shared/protocol";

import { cx } from "../lib/cx";
import { PALETTE } from "../lib/palette";
import { Icon } from "./Icon";

export type Tool = "brush" | "eraser";

type Props = {
  color: string;
  size: number;
  tool: Tool;
  disabled: boolean;
  onColor: (color: string) => void;
  onSize: (size: number) => void;
  onTool: (tool: Tool) => void;
  onUndo: () => void;
  onClear: () => void;
};

export function Toolbar({ color, size, tool, disabled, onColor, onSize, onTool, onUndo, onClear }: Props) {
  return (
    <div className="toolbar" role="toolbar" aria-label="Drawing tools">
      <div className="toolbar__group toolbar__palette" role="group" aria-label="Color">
        {PALETTE.map((swatch) => {
          const selected = tool === "brush" && color === swatch.value;
          return (
            <button
              key={swatch.value}
              type="button"
              className={cx("swatch", selected && "swatch--selected")}
              style={{ backgroundColor: swatch.value }}
              aria-label={swatch.name}
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => {
                onColor(swatch.value);
                onTool("brush");
              }}
            />
          );
        })}
      </div>

      <div className="toolbar__group" role="group" aria-label="Brush size">
        {BRUSH_SIZES.map((brush, index) => (
          <button
            key={brush}
            type="button"
            className={cx("tool", size === brush && "tool--selected")}
            aria-label={`Size ${index + 1}`}
            aria-pressed={size === brush}
            disabled={disabled}
            onClick={() => onSize(brush)}
          >
            <span className="size-dot" style={{ width: 4 + index * 5, height: 4 + index * 5 }} />
          </button>
        ))}
      </div>

      <div className="toolbar__group" role="group" aria-label="Tools">
        <button
          type="button"
          className={cx("tool", tool === "eraser" && "tool--selected")}
          aria-pressed={tool === "eraser"}
          disabled={disabled}
          onClick={() => onTool(tool === "eraser" ? "brush" : "eraser")}
        >
          <Icon name="eraser" />
          <span className="sr-only">Eraser</span>
        </button>
        <button type="button" className="tool" disabled={disabled} onClick={onUndo} title="Undo (Ctrl+Z)">
          <Icon name="undo" />
          <span className="sr-only">Undo</span>
        </button>
        <button type="button" className="tool" disabled={disabled} onClick={onClear} title="Clear canvas">
          <Icon name="trash" />
          <span className="sr-only">Clear canvas</span>
        </button>
      </div>
    </div>
  );
}
