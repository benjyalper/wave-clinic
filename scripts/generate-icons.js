#!/usr/bin/env node
/**
 * Generates Wave PWA icons as PNG files using only Node.js built-ins (no dependencies).
 * Outputs: public/icon-192.png, public/icon-512.png, public/apple-touch-icon.png
 */
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

// CRC32 lookup table
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

function uint32BE(n) {
  const b = Buffer.alloc(4); b.writeUInt32BE(n >>> 0, 0); return b
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.concat([typeBytes, data])
  return Buffer.concat([uint32BE(data.length), typeBytes, data, uint32BE(crc32(crcBuf))])
}

// Wave "W" pixel map  (7 wide × 5 tall pixel units)
const W_MAP = [
  [1,0,0,0,0,0,1],
  [1,0,0,0,0,0,1],
  [1,0,0,1,0,0,1],
  [1,0,1,0,1,0,1],
  [1,1,0,0,0,1,1],
]

function generateIcon(size) {
  // RGBA pixel buffer
  const px = new Uint8Array(size * size * 4) // transparent default

  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.46

  // Fill teal circle with smooth edge
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      const i = (y * size + x) * 4
      if (dist <= radius - 1) {
        // Solid teal #2bafa0
        px[i] = 43; px[i+1] = 175; px[i+2] = 160; px[i+3] = 255
      } else if (dist <= radius) {
        // Anti-alias edge
        const alpha = Math.round((radius - dist) * 255)
        px[i] = 43; px[i+1] = 175; px[i+2] = 160; px[i+3] = alpha
      }
    }
  }

  // Draw "W" letter in white
  const scale = Math.max(1, Math.round(size * 0.078))
  const letterW = W_MAP[0].length * scale
  const letterH = W_MAP.length * scale
  const startX = Math.round(cx - letterW / 2)
  const startY = Math.round(cy - letterH / 2)

  for (let row = 0; row < W_MAP.length; row++) {
    for (let col = 0; col < W_MAP[0].length; col++) {
      if (!W_MAP[row][col]) continue
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const px_x = startX + col * scale + sx
          const px_y = startY + row * scale + sy
          if (px_x < 0 || px_x >= size || px_y < 0 || px_y >= size) continue
          const i = (px_y * size + px_x) * 4
          px[i] = 255; px[i+1] = 255; px[i+2] = 255; px[i+3] = 255
        }
      }
    }
  }

  return px
}

function writePNG(filePath, size) {
  const pixels = generateIcon(size)

  // Build raw scanline data: filter byte (0=None) + RGBA per row
  const raw = Buffer.alloc(size * (1 + size * 4))
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 4)] = 0 // filter: None
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4
      const dst = y * (1 + size * 4) + 1 + x * 4
      raw[dst]   = pixels[src]
      raw[dst+1] = pixels[src+1]
      raw[dst+2] = pixels[src+2]
      raw[dst+3] = pixels[src+3]
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 })

  const IHDR_DATA = Buffer.concat([
    uint32BE(size), uint32BE(size),
    Buffer.from([8, 6, 0, 0, 0]) // 8-bit RGBA, no interlace
  ])

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk('IHDR', IHDR_DATA),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ])

  fs.writeFileSync(filePath, png)
  console.log(`✓ ${path.basename(filePath)} (${size}×${size})`)
}

const publicDir = path.join(__dirname, '..', 'public')
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })

writePNG(path.join(publicDir, 'icon-192.png'), 192)
writePNG(path.join(publicDir, 'icon-512.png'), 512)
writePNG(path.join(publicDir, 'apple-touch-icon.png'), 180)

console.log('Icons generated successfully!')
