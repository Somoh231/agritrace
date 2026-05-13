/**
 * Generates solid-color PNGs for PWA manifest (Chrome installability).
 * Run: node scripts/generate-pwa-icons.mjs
 */
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "public", "icons");

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "binary");
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const rawLen = height * (1 + width * 4);
  const raw = Buffer.alloc(rawLen);
  let o = 0;
  for (let y = 0; y < height; y++) {
    raw[o++] = 0; // filter None
    for (let x = 0; x < width; x++) {
      raw[o++] = rgba[0];
      raw[o++] = rgba[1];
      raw[o++] = rgba[2];
      raw[o++] = rgba[3];
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

fs.mkdirSync(outDir, { recursive: true });
// Brand-ish: deep slate + emerald accent safe area for maskable (solid ok for pilot)
const brand = [15, 23, 42, 255]; // #0f172a
fs.writeFileSync(path.join(outDir, "pwa-192.png"), encodePng(192, 192, brand));
fs.writeFileSync(path.join(outDir, "pwa-512.png"), encodePng(512, 512, brand));
fs.writeFileSync(path.join(outDir, "pwa-512-maskable.png"), encodePng(512, 512, brand));
console.log("Wrote public/icons/pwa-192.png, pwa-512.png, pwa-512-maskable.png");
