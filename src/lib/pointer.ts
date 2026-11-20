/**
 * Estado compartilhado do ponteiro — "a lâmpada" da experiência.
 *
 * Coordenadas em pixels a partir do centro da janela, com Y para cima
 * (mesmo sistema da cena 3D). Quando não há ponteiro ativo (toque, ou mouse
 * parado), a lâmpada entra em piloto automático e passeia devagar.
 */
import { env } from './env'
import { clamp, damp } from './math'
import { onFrame, ORDER } from './ticker'

export const pointer = {
  /** Posição bruta, px a partir do centro. */
  x: 0,
  y: 0,
  /** Posição suavizada da lâmpada (px). */
  lampX: 0,
  lampY: 0,
  /** Posição suavizada e normalizada (-1..1), usada para o paralaxe da câmera. */
  eyeX: 0,
  eyeY: 0,
  /** 0 = piloto automático, 1 = controlado pelo usuário. */
  presence: 0,
  /** Velocidade suavizada, em larguras de tela por segundo. */
  speed: 0,
  /** Posição em px de tela (origem no canto superior esquerdo), para o DOM. */
  clientX: -1,
  clientY: -1,
}

const IDLE_AFTER = 3.5 // segundos sem movimento até o piloto automático assumir

let lastMove = -Infinity
let now = 0
let started = false

function setFromClient(clientX: number, clientY: number) {
  pointer.clientX = clientX
  pointer.clientY = clientY
  pointer.x = clientX - window.innerWidth / 2
  pointer.y = window.innerHeight / 2 - clientY
  lastMove = now
}

function update(time: number, dt: number) {
  now = time
  const w = window.innerWidth
  const h = window.innerHeight

  const idle = time - lastMove > IDLE_AFTER
  pointer.presence = damp(pointer.presence, idle ? 0 : 1, idle ? 1.2 : 6, dt)

  // Trajetória lenta do piloto automático (curva de Lissajous).
  const motion = env.reducedMotion ? 0 : 1
  const autoX = Math.sin(time * 0.23) * 0.3 * w * motion + w * 0.06
  const autoY = (Math.sin(time * 0.31 + 1.3) * 0.2 + 0.08) * h * motion

  const targetX = autoX + (pointer.x - autoX) * pointer.presence
  const targetY = autoY + (pointer.y - autoY) * pointer.presence

  const previousX = pointer.lampX
  const previousY = pointer.lampY
  pointer.lampX = damp(pointer.lampX, targetX, 7, dt)
  pointer.lampY = damp(pointer.lampY, targetY, 7, dt)

  const velocity = Math.hypot(pointer.lampX - previousX, pointer.lampY - previousY) / Math.max(dt, 1e-4) / w
  pointer.speed = damp(pointer.speed, velocity, 5, dt)

  // O "olho" segue com mais inércia que a luz: dá peso ao paralaxe.
  pointer.eyeX = damp(pointer.eyeX, clamp(targetX / (w / 2), -1, 1), 2.6, dt)
  pointer.eyeY = damp(pointer.eyeY, clamp(targetY / (h / 2), -1, 1), 2.6, dt)
}

export function initPointer(): () => void {
  if (started) return () => {}
  started = true

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return // tratado em touchmove (continua durante a rolagem)
    setFromClient(event.clientX, event.clientY)
  }
  const onTouch = (event: TouchEvent) => {
    const touch = event.touches[0]
    if (touch) setFromClient(touch.clientX, touch.clientY)
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('touchstart', onTouch, { passive: true })
  window.addEventListener('touchmove', onTouch, { passive: true })
  const offFrame = onFrame(update, ORDER.input)

  return () => {
    started = false
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('touchstart', onTouch)
    window.removeEventListener('touchmove', onTouch)
    offFrame()
  }
}
