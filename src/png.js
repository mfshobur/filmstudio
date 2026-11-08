'use strict';
// Tiny dependency-free PNG writer, used by tests and the QA tool to make placeholder images.
const zlib = require('zlib');
const crcT = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
function makePng(w, h, px) { // px(x,y) -> [r,g,b,a]
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w; x++) { const p = px(x, y), o = y * (w * 4 + 1) + 1 + x * 4; raw[o] = p[0]; raw[o + 1] = p[1]; raw[o + 2] = p[2]; raw[o + 3] = p[3] == null ? 255 : p[3]; } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
// A recognisable test picture: gradient with a circle and a diagonal, so cropping and rotation are visible.
const testPicture = (w = 320, h = 200) => makePng(w, h, (x, y) => { const d = Math.hypot(x - w / 2, y - h / 2); if (d < h * .3) return [255, 190, 60, 255]; if (Math.abs((x / w) - (y / h)) < .02) return [255, 255, 255, 255]; return [Math.round(40 + 180 * x / w), Math.round(60 + 120 * y / h), 190, 255]; });
module.exports = { makePng, testPicture };
