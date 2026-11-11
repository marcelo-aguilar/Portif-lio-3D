/**
 * Capacidades do dispositivo, avaliadas uma única vez na carga.
 *
 * Parâmetros de URL úteis para testar os caminhos alternativos:
 *   ?gl=0      força o modo sem WebGL
 *   ?motion=0  força o modo de movimento reduzido
 *   ?tier=low  força a cena simplificada (a mesma dos celulares)
 */

const params = new URLSearchParams(window.location.search)
const media = (query: string) => window.matchMedia(query).matches

function detectWebGL(): boolean {
  if (params.get('gl') === '0') return false
  try {
    const canvas = document.createElement('canvas')
    // `failIfMajorPerformanceCaveat` evita cair em renderização por software,
    // que tornaria a cena inutilizável — nesses casos vale mais o modo estático.
    const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true })
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

function detectTier(coarse: boolean): 'high' | 'low' {
  const forced = params.get('tier')
  if (forced === 'low' || forced === 'high') return forced
  const nav = navigator as Navigator & { deviceMemory?: number }
  const fewCores = (nav.hardwareConcurrency ?? 8) <= 4
  const littleMemory = (nav.deviceMemory ?? 8) <= 4
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 600
  return coarse || fewCores || littleMemory || smallScreen ? 'low' : 'high'
}

const coarse = media('(pointer: coarse)')
const reducedMotion = params.get('motion') === '0' || media('(prefers-reduced-motion: reduce)')

export const env = {
  reducedMotion,
  /** Entrada principal por toque. */
  coarse,
  /** Há um ponteiro preciso com hover (mouse ou trackpad). */
  hover: media('(hover: hover) and (pointer: fine)'),
  webgl: detectWebGL(),
  tier: detectTier(coarse),
} as const

export type Env = typeof env
