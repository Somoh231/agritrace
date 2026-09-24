/**
 * Generates the AgriVault application icons from the approved corporate mark
 * (three nested chevrons cut by a band, over an emerald base triangle).
 *
 * Outputs:
 *   public/icons/pwa-192.png, pwa-512.png      manifest "any" (rounded navy tile)
 *   public/icons/pwa-512-maskable.png           manifest "maskable" (full bleed, mark in safe zone)
 *   public/icons/apple-touch-icon.png           180×180, full bleed (iOS applies its own mask)
 *   public/icon.svg                             SVG favicon
 *   src/app/favicon.ico                         16/32/48 PNG-in-ICO
 *
 * The Ministry of Agriculture seal is never used here: it is programme context,
 * not AgriVault identity.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const iconsDir = path.join(root, "public", "icons");

const NAVY = "#07152D";
const PAPER = "#F7F7F2";
const EMERALD = "#0FA36B";

/** Mark geometry in a 100×100 box. `small` = optical variant for ≤32px (heavier stroke, no band). */
function markGroup({ small }) {
  const stroke = small ? 10 : 7;
  const body = `
    <path d="M6 92L50 6L94 92" fill="none" stroke="${PAPER}" stroke-width="${stroke}" stroke-linejoin="miter"/>
    <path d="M21 92L50 35.3L79 92" fill="none" stroke="${PAPER}" stroke-width="${stroke}" stroke-linejoin="miter"/>
    <path d="M36 92L50 64.6L64 92Z" fill="${EMERALD}"/>`;
  if (small) return `<g>${body}</g>`;
  return `
    <mask id="band" maskUnits="userSpaceOnUse" x="-20" y="-20" width="140" height="140">
      <rect x="-20" y="-20" width="140" height="140" fill="#fff"/>
      <path d="M53 49H100V58H0V49Z" fill="#000"/>
    </mask>
    <g mask="url(#band)">${body}</g>`;
}

/**
 * @param {object} o
 * @param {number} o.markScale  fraction of the tile occupied by the 100-unit mark box
 * @param {number} o.radius     corner radius as a fraction of the tile (0 = full bleed)
 * @param {boolean} o.small     optical small variant
 */
function iconSvg({ markScale, radius, small }) {
  const size = 100 / markScale;
  const offset = (size - 100) / 2;
  // Optical centring: the mark's visual mass sits low (wide base), so lift it slightly.
  const lift = size * 0.02;
  const r = radius * size;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="${NAVY}"/>
  <g transform="translate(${offset} ${offset - lift})">${markGroup({ small })}</g>
</svg>`;
}

async function png(svg, px) {
  return sharp(Buffer.from(svg), { density: 72 * Math.max(1, px / 64) })
    .resize(px, px)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** ICO container holding PNG-encoded images (supported by all current browsers). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + images.length * 16;
  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

fs.mkdirSync(iconsDir, { recursive: true });

const tile = iconSvg({ markScale: 0.62, radius: 0.22, small: false });
const bleed = iconSvg({ markScale: 0.62, radius: 0, small: false });
// Maskable safe zone is the central 80% circle; keep the mark well inside it.
const maskable = iconSvg({ markScale: 0.5, radius: 0, small: false });
const favSmall = iconSvg({ markScale: 0.72, radius: 0.2, small: true });

fs.writeFileSync(path.join(iconsDir, "pwa-192.png"), await png(tile, 192));
fs.writeFileSync(path.join(iconsDir, "pwa-512.png"), await png(tile, 512));
fs.writeFileSync(path.join(iconsDir, "pwa-512-maskable.png"), await png(maskable, 512));
fs.writeFileSync(path.join(iconsDir, "apple-touch-icon.png"), await png(bleed, 180));
fs.writeFileSync(path.join(root, "public", "icon.svg"), favSmall);
fs.writeFileSync(
  path.join(root, "src", "app", "favicon.ico"),
  ico([
    { size: 16, data: await png(favSmall, 16) },
    { size: 32, data: await png(favSmall, 32) },
    { size: 48, data: await png(iconSvg({ markScale: 0.66, radius: 0.2, small: false }), 48) },
  ]),
);

console.log("Wrote AgriVault icons: public/icons/{pwa-192,pwa-512,pwa-512-maskable,apple-touch-icon}.png, public/icon.svg, src/app/favicon.ico");
