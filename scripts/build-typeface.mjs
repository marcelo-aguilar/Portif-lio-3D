/**
 * Gera, a partir da fonte Anton (@fontsource/anton), os dois artefatos que
 * a experiência usa para o sobrenome monumental:
 *
 *  1. src/assets/typeface/anton-display.typeface.json
 *     Subconjunto de glifos no formato "typeface.json" do three.js
 *     (consumido por `Font` / `ExtrudeGeometry` para as letras 3D).
 *
 *  2. src/assets/typeface/metrics.json
 *     Métricas (em unidades de "em") usadas pelo DOM para reservar o espaço
 *     exato da palavra — assim o layout é definido em CSS e a cena 3D apenas
 *     se encaixa nele.
 *
 * Uso:  npm run typeface
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import opentype from 'opentype.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = resolve(root, 'node_modules/@fontsource/anton/files/anton-latin-400-normal.woff')
const OUT_DIR = resolve(root, 'src/assets/typeface')

/** Apenas os glifos realmente extrudados na cena. */
const GLYPHS = 'AGUILAR'

const buffer = readFileSync(SOURCE)
const font = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength))

const RESOLUTION = 1000
const scale = RESOLUTION / font.unitsPerEm
const round = (n) => Math.round(n * scale)

const glyphs = {}
const advances = {}
let capHeight = 0

for (const char of new Set(GLYPHS)) {
  const glyph = font.charToGlyph(char)
  if (!glyph || glyph.index === 0) throw new Error(`Glifo ausente na fonte: "${char}"`)

  // typeface.json: comandos "m x y", "l x y", "q x y cx cy", "b x y c1x c1y c2x c2y"
  let outline = ''
  for (const cmd of glyph.path.commands) {
    switch (cmd.type) {
      case 'M':
        outline += `m ${round(cmd.x)} ${round(cmd.y)} `
        break
      case 'L':
        outline += `l ${round(cmd.x)} ${round(cmd.y)} `
        break
      case 'Q':
        outline += `q ${round(cmd.x)} ${round(cmd.y)} ${round(cmd.x1)} ${round(cmd.y1)} `
        break
      case 'C':
        outline += `b ${round(cmd.x)} ${round(cmd.y)} ${round(cmd.x1)} ${round(cmd.y1)} ${round(cmd.x2)} ${round(cmd.y2)} `
        break
      case 'Z':
        break
      default:
        throw new Error(`Comando de contorno inesperado: ${cmd.type}`)
    }
  }

  const box = glyph.getBoundingBox()
  glyphs[char] = {
    ha: round(glyph.advanceWidth),
    x_min: round(box.x1),
    x_max: round(box.x2),
    o: outline.trim(),
  }
  advances[char] = glyph.advanceWidth / font.unitsPerEm
  if (char !== 'G') capHeight = Math.max(capHeight, box.y2 / font.unitsPerEm)
}

const typeface = {
  glyphs,
  familyName: 'Anton',
  ascender: round(font.ascender),
  descender: round(font.descender),
  underlinePosition: round(font.tables.post.underlinePosition),
  underlineThickness: round(font.tables.post.underlineThickness),
  boundingBox: {
    yMin: round(font.tables.head.yMin),
    xMin: round(font.tables.head.xMin),
    yMax: round(font.tables.head.yMax),
    xMax: round(font.tables.head.xMax),
  },
  resolution: RESOLUTION,
  original_font_information: { format: 0, fontFamily: 'Anton', license: 'SIL Open Font License 1.1' },
}

const metrics = {
  family: 'Anton',
  capHeight: Number(capHeight.toFixed(5)),
  ascender: Number((font.ascender / font.unitsPerEm).toFixed(5)),
  descender: Number((Math.abs(font.descender) / font.unitsPerEm).toFixed(5)),
  advances: Object.fromEntries(Object.entries(advances).map(([k, v]) => [k, Number(v.toFixed(5))])),
}

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(resolve(OUT_DIR, 'anton-display.typeface.json'), JSON.stringify(typeface))
writeFileSync(resolve(OUT_DIR, 'metrics.json'), JSON.stringify(metrics, null, 2) + '\n')

console.log(`typeface: ${Object.keys(glyphs).length} glifos (${Object.keys(glyphs).join('')})`)
console.log('metrics :', JSON.stringify(metrics))
