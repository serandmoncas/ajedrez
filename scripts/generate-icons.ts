// Generates the PWA icons (public/icons/icon-192.png, icon-512.png) with node:zlib only:
// a green background with a centered 4x4 board inside the maskable safe zone.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { deflateSync } from "node:zlib";

type RGB = [number, number, number];
const BACKGROUND: RGB = [0x2e, 0x5d, 0x34];
const LIGHT: RGB = [0xf0, 0xd9, 0xb5];
const DARK: RGB = [0xb5, 0x88, 0x63];

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function pixel(size: number, x: number, y: number): RGB {
  const board = Math.round(size * 0.56);
  const start = Math.round((size - board) / 2);
  const bx = x - start;
  const by = y - start;
  if (bx < 0 || by < 0 || bx >= board || by >= board) return BACKGROUND;
  const cell = board / 4;
  return (Math.floor(bx / cell) + Math.floor(by / cell)) % 2 === 0 ? LIGHT : DARK;
}

function png(size: number): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // truecolor RGB
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    const row = y * (size * 3 + 1);
    raw[row] = 0; // filter: none
    for (let x = 0; x < size; x++) raw.set(pixel(size, x, y), row + 1 + x * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = path.resolve("public/icons");
mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) {
  writeFileSync(path.join(outDir, `icon-${size}.png`), png(size));
  console.log(`public/icons/icon-${size}.png`);
}
