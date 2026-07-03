/**
 * Generates PWA manifest icons from the official MOA seal asset.
 * Falls back to solid brand color when sips is unavailable (non-macOS CI).
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "public", "icons");
const sealSrc = path.join(root, "public", "logos", "moa-seal.jpeg");

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
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const rawLen = height * (1 + width * 4);
  const raw = Buffer.alloc(rawLen);
  let o = 0;
  for (let y = 0; y < height; y++) {
    raw[o++] = 0;
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

function writeSolidFallback(size, filename) {
  const brand = [11, 34, 21, 255]; // ministry forest
  fs.writeFileSync(path.join(outDir, filename), encodePng(size, size, brand));
}

function writeFromSeal(size, filename) {
  const out = path.join(outDir, filename);
  execSync(`sips -s format png -z ${size} ${size} "${sealSrc}" --out "${out}"`, { stdio: "pipe" });
}

fs.mkdirSync(outDir, { recursive: true });

const canUseSeal = process.platform === "darwin" && fs.existsSync(sealSrc);

try {
  if (canUseSeal) {
    writeFromSeal(192, "pwa-192.png");
    writeFromSeal(512, "pwa-512.png");
    writeFromSeal(512, "pwa-512-maskable.png");
    console.log("Wrote PWA icons from public/logos/moa-seal.jpeg");
  } else {
    writeSolidFallback(192, "pwa-192.png");
    writeSolidFallback(512, "pwa-512.png");
    writeSolidFallback(512, "pwa-512-maskable.png");
    console.log("Wrote solid-color PWA icons (MOA seal asset or sips unavailable)");
  }
} catch (e) {
  console.warn("[generate-pwa-icons] seal resize failed, using fallback:", e);
  writeSolidFallback(192, "pwa-192.png");
  writeSolidFallback(512, "pwa-512.png");
  writeSolidFallback(512, "pwa-512-maskable.png");
}

console.log("Wrote public/icons/pwa-192.png, pwa-512.png, pwa-512-maskable.png");
