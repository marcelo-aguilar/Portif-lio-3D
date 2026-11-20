/**
 * Composição do sobrenome monumental, compartilhada entre o DOM (que reserva
 * o espaço e serve de alternativa sem WebGL) e a cena 3D (que extruda as letras).
 * Todas as medidas estão em "em" da fonte Anton.
 */
import metrics from '../assets/typeface/metrics.json'

export const WORD = 'AGUILAR'

/** Espaço extra entre letras, em em. */
const TRACKING = 0.012

const advances = metrics.advances as Record<string, number>

export interface WordLetter {
  char: string
  /** Borda esquerda da caixa de avanço, em em. */
  x: number
  /** Largura de avanço, em em. */
  width: number
}

function layout(word: string) {
  const letters: WordLetter[] = []
  let cursor = 0
  for (const char of word) {
    const width = advances[char]
    if (width === undefined) throw new Error(`Glifo sem métricas: "${char}". Rode "npm run typeface".`)
    letters.push({ char, x: cursor, width })
    cursor += width + TRACKING
  }
  return { letters, width: cursor - TRACKING }
}

const composed = layout(WORD)

export const wordmark = {
  word: WORD,
  letters: composed.letters,
  /** Largura total, em em. */
  width: composed.width,
  /** Altura das maiúsculas, em em. */
  capHeight: metrics.capHeight,
  /** Largura ÷ altura das maiúsculas: a proporção do vão reservado no layout. */
  aspect: composed.width / metrics.capHeight,
  tracking: TRACKING,
  ascender: metrics.ascender,
  descender: metrics.descender,
} as const
