export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Interpolação exponencial independente da taxa de quadros. */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt))

/** Remapeia `value` de [inMin, inMax] para [0, 1], com limite. */
export const progress = (value: number, inMin: number, inMax: number) =>
  clamp((value - inMin) / (inMax - inMin))

export const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = progress(value, edge0, edge1)
  return t * t * (3 - 2 * t)
}

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))

/** Gerador pseudoaleatório determinístico (mulberry32) — cenas idênticas a cada carga. */
export function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
