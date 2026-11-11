/**
 * Rolagem: Lenis (suave) + GSAP ScrollTrigger, no laço único da aplicação.
 * Com movimento reduzido, a rolagem nativa é mantida.
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { env } from './env'
import { onFrame, ORDER } from './ticker'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null

export function initScroll(): () => void {
  if (env.reducedMotion) return () => {}

  lenis = new Lenis({
    autoRaf: false,
    lerp: 0.115,
    // Em telas de toque a rolagem nativa (com inércia do sistema) é preservada.
    syncTouch: false,
  })
  lenis.on('scroll', ScrollTrigger.update)
  const offFrame = onFrame((time) => lenis?.raf(time * 1000), ORDER.scroll)

  return () => {
    offFrame()
    lenis?.destroy()
    lenis = null
  }
}

export function getScrollY(): number {
  return lenis ? lenis.scroll : window.scrollY
}

export function scrollToTarget(target: string | number | HTMLElement, options: { immediate?: boolean } = {}) {
  const immediate = options.immediate || env.reducedMotion
  let destination: number | HTMLElement | null =
    typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (destination === null) return

  // Elementos presos ao fundo da janela (o encerramento) não têm posição própria:
  // o destino é o fim da página.
  if (typeof destination !== 'number' && destination.dataset.scrollEnd !== undefined) {
    destination = document.documentElement.scrollHeight - window.innerHeight
  }

  if (lenis) {
    lenis.scrollTo(destination, { immediate, duration: 1.6, easing: (t: number) => 1 - Math.pow(1 - t, 4) })
    return
  }
  const behavior: ScrollBehavior = immediate ? 'auto' : 'smooth'
  if (typeof destination === 'number') window.scrollTo({ top: destination, behavior })
  else destination.scrollIntoView({ behavior, block: 'start' })
}

/** Trava a rolagem da página (usado enquanto um diálogo está aberto). */
export function lockScroll(locked: boolean) {
  document.documentElement.classList.toggle('is-scroll-locked', locked)
  if (!lenis) return
  if (locked) lenis.stop()
  else lenis.start()
}
