/**
 * Geometrias procedurais da cena: as letras extrudadas do sobrenome e a
 * centelha de quatro pontas. São construídas uma única vez e compartilhadas.
 */
import { ExtrudeGeometry, Shape } from 'three'
import type { BufferGeometry } from 'three'
import { Font } from 'three/addons/loaders/FontLoader.js'
import type { FontData } from 'three/addons/loaders/FontLoader.js'
import typeface from '../assets/typeface/anton-display.typeface.json'
import { env } from '../lib/env'
import { wordmark } from '../lib/wordmark'

/** Profundidade da extrusão, em alturas de maiúscula. */
export const LETTER_DEPTH = 0.2

export interface LetterGeometry {
  geometry: BufferGeometry
  /** Centro horizontal da letra dentro da palavra (origem no centro da palavra). */
  x: number
  width: number
}

let letters: LetterGeometry[] | null = null

/**
 * Letras normalizadas: 1 unidade = altura das maiúsculas, linha de base em
 * y = 0, face frontal em z = 0 e corpo extrudado para trás. Cada letra tem a
 * origem no centro da própria base — o eixo em torno do qual ela se ergue.
 */
export function getLetterGeometries(): LetterGeometry[] {
  if (letters) return letters

  const font = new Font(typeface as unknown as FontData)
  const em = 1 / wordmark.capHeight
  const detailed = env.tier === 'high'
  const bevel = 0.012

  letters = wordmark.letters.map(({ char, x, width }) => {
    const geometry = new ExtrudeGeometry(font.generateShapes(char, em), {
      depth: LETTER_DEPTH,
      curveSegments: detailed ? 10 : 5,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel * 0.7,
      bevelOffset: -bevel * 0.7,
      bevelSegments: detailed ? 3 : 1,
    })
    geometry.translate(-(width * em) / 2, 0, -(LETTER_DEPTH + bevel))
    geometry.computeVertexNormals()
    return {
      geometry,
      x: (x + width / 2 - wordmark.width / 2) * em,
      width: width * em,
    }
  })

  return letters
}

let star: BufferGeometry | null = null

/** A centelha ✦ em volume: mesmo contorno do ícone SVG, extrudado. Cabe em um quadrado 1 × 1. */
export function getStarGeometry(): BufferGeometry {
  if (star) return star

  // Curvas do ícone (viewBox 24 × 24) remapeadas para [-0.5, 0.5], com Y para cima.
  const p = (x: number, y: number): [number, number] => [(x - 12) / 24, (12 - y) / 24]
  const shape = new Shape()
  shape.moveTo(...p(12, 0))
  shape.bezierCurveTo(...p(12.6, 7), ...p(17, 11.4), ...p(24, 12))
  shape.bezierCurveTo(...p(17, 12.6), ...p(12.6, 17), ...p(12, 24))
  shape.bezierCurveTo(...p(11.4, 17), ...p(7, 12.6), ...p(0, 12))
  shape.bezierCurveTo(...p(7, 11.4), ...p(11.4, 7), ...p(12, 0))

  star = new ExtrudeGeometry(shape, {
    depth: 0.07,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.012,
    bevelSegments: 2,
  })
  star.translate(0, 0, -0.035)
  star.computeVertexNormals()
  return star
}
