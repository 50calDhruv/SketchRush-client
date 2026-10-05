// Mid-tone colors that all keep white initials above 4.5:1 contrast.
const COLORS = ["#c2410c", "#15803d", "#1d4ed8", "#7e22ce", "#be185d", "#0f766e", "#a16207", "#4338ca"];

const colorFor = (id: string): string => {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length] ?? "#4338ca";
};

export function Avatar({ id, name, size = 32 }: { id: string; name: string; size?: number }) {
  return (
    <span
      className="avatar"
      style={{ backgroundColor: colorFor(id), width: size, height: size, fontSize: size * 0.44 }}
      aria-hidden="true"
    >
      {[...name.trim()][0]?.toUpperCase() ?? "?"}
    </span>
  );
}
