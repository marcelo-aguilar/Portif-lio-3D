/**
 * Laço único da aplicação.
 *
 * Rolagem suave, ponteiro e renderização 3D rodam no mesmo
 * `requestAnimationFrame` (o do GSAP), em ordem determinística. Isso evita
 * que a cena WebGL fique um quadro atrás do DOM.
 */
import gsap from 'gsap'

export type FrameCallback = (time: number, dt: number) => void

interface Subscriber {
  fn: FrameCallback
  order: number
}

/** Ordem de execução dentro de um quadro. */
export const ORDER = {
  scroll: 0,
  input: 10,
  layout: 20,
  render: 30,
} as const

const subscribers: Subscriber[] = []
let started = false

function tick(time: number, deltaMs: number) {
  // Limita o delta: ao voltar de uma aba em segundo plano, nada "salta".
  const dt = Math.min(deltaMs / 1000, 1 / 20)
  for (let i = 0; i < subscribers.length; i++) subscribers[i].fn(time, dt)
}

export function onFrame(fn: FrameCallback, order: number = ORDER.layout): () => void {
  const subscriber: Subscriber = { fn, order }
  subscribers.push(subscriber)
  subscribers.sort((a, b) => a.order - b.order)

  if (!started) {
    started = true
    gsap.ticker.lagSmoothing(0)
    gsap.ticker.add(tick)
  }

  return () => {
    const index = subscribers.indexOf(subscriber)
    if (index !== -1) subscribers.splice(index, 1)
  }
}
