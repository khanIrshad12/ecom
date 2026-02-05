/**
 * Shared color helpers: swatch (CSS value) and display name for filters/product UI.
 */

const NAME_TO_HEX: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#dc2626",
  blue: "#2563eb",
  green: "#16a34a",
  yellow: "#eab308",
  orange: "#ea580c",
  pink: "#db2777",
  purple: "#9333ea",
  brown: "#78350f",
  grey: "#6b7280",
  gray: "#6b7280",
  navy: "#1e3a8a",
  beige: "#d4b896",
  maroon: "#800020",
  cream: "#fffdd0",
  olive: "#808000",
  mustard: "#e1ad01",
  peach: "#ffcba4",
  lavender: "#e6e6fa",
  mint: "#98ff98",
  teal: "#0d9488",
  charcoal: "#36454f",
};

/** Reverse map: normalized hex -> display name */
const HEX_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(NAME_TO_HEX).map(([name, hex]) => [normalizeHex(hex), name])
);

function normalizeHex(hex: string): string {
  const m = hex.trim().match(/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/);
  if (!m) return hex;
  const s = m[1];
  if (s.length === 6) return `#${s.toLowerCase()}`;
  return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`.toLowerCase();
}

/** Resolve stored color (hex or name) to a CSS value for swatch background. */
export function getColorSwatchValue(color: string): string {
  const trimmed = color.trim();
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(trimmed)) return normalizeHex(trimmed);
  return NAME_TO_HEX[trimmed.toLowerCase()] ?? "#d1d5db";
}

/** Palette entries for admin suggestions: name + hex (deduplicated, grey skipped in favor of gray). */
export const PALETTE_COLORS: { name: string; hex: string }[] = Object.entries(NAME_TO_HEX)
  .filter(([name]) => name !== "grey")
  .map(([name, hex]) => ({ name, hex }));

/** Return human-readable label: hex -> name when known, else capitalized name or hex. */
export function getColorDisplayName(color: string): string {
  const trimmed = color.trim();
  if (!trimmed) return "Color";
  const hexNorm = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(trimmed) ? normalizeHex(trimmed) : null;
  if (hexNorm && HEX_TO_NAME[hexNorm]) return HEX_TO_NAME[hexNorm];
  if (NAME_TO_HEX[trimmed.toLowerCase()]) return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  return trimmed;
}
