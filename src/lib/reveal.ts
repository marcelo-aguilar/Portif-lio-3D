/**
 * Sistema de animação do DOM (GSAP + ScrollTrigger + SplitText).
 * Cada função devolve nada: deve ser chamada dentro de um `gsap.context`,
 * que cuida da limpeza quando o componente desmonta.
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { env } from './env'

gsap.registerPlugin(ScrollTrigger, SplitText)

export const EASE = 'expo.out'

/** Título de seção: sobe por trás de uma máscara. */
export function riseTitle(target: Element | null, trigger?: Element | null) {
  if (!target || env.reducedMotion) return
  gsap.fromTo(
    target,
    { yPercent: 105 },
    {
      yPercent: 0,
      duration: 1.3,
      ease: EASE,
      scrollTrigger: { trigger: trigger ?? target, start: 'top 85%', once: true },
    },
  )
}

/** Texto revelado linha a linha, cada linha por trás da própria máscara. */
export function revealLines(target: Element | null, options: { delay?: number; start?: string } = {}) {
  if (!target || env.reducedMotion) return
  SplitText.create(target, {
    type: 'lines',
    mask: 'lines',
    autoSplit: true,
    onSplit(self) {
      return gsap.from(self.lines, {
        yPercent: 110,
        duration: 1.1,
        ease: EASE,
        stagger: 0.08,
        delay: options.delay ?? 0,
        scrollTrigger: { trigger: target, start: options.start ?? 'top 88%', once: true },
      })
    },
  })
}

/**
 * "Leitura guiada": as palavras acendem conforme a rolagem avança.
 * O texto continua legível (opacidade mínima) mesmo antes de acender.
 */
export function scrubWords(target: Element | null) {
  if (!target || env.reducedMotion) return
  SplitText.create(target, {
    type: 'words',
    autoSplit: true,
    onSplit(self) {
      return gsap.fromTo(
        self.words,
        { opacity: 0.2 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.1,
          scrollTrigger: { trigger: target, start: 'top 82%', end: 'bottom 48%', scrub: 0.6 },
        },
      )
    },
  })
}

/** Imagem revelada por uma máscara que abre de baixo para cima, com leve zoom interno. */
export function unmaskImage(frame: Element | null) {
  if (!frame || env.reducedMotion) return
  const image = frame.querySelector('img')
  gsap.fromTo(
    frame,
    { clipPath: 'inset(100% 0% 0% 0%)' },
    {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 1.5,
      ease: 'expo.inOut',
      scrollTrigger: { trigger: frame, start: 'top 82%', once: true },
    },
  )
  if (image) {
    gsap.fromTo(
      image,
      { yPercent: -9, scale: 1.2 },
      {
        yPercent: 9,
        scale: 1.2,
        ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    )
  }
}

/** Fio horizontal que se desenha da esquerda para a direita. */
export function drawRules(targets: Element[] | NodeListOf<Element>, trigger: Element | null) {
  if (!trigger || env.reducedMotion) return
  gsap.fromTo(
    targets,
    { scaleX: 0 },
    {
      scaleX: 1,
      transformOrigin: 'left center',
      duration: 1.4,
      ease: 'expo.inOut',
      stagger: 0.09,
      scrollTrigger: { trigger, start: 'top 85%', once: true },
    },
  )
}

/** Contagem numérica disparada quando o elemento entra na tela. */
export function countUp(target: HTMLElement | null, value: number) {
  if (!target) return
  if (env.reducedMotion) {
    target.textContent = String(value)
    return
  }
  const counter = { n: 0 }
  gsap.to(counter, {
    n: value,
    duration: 1.8,
    ease: 'power3.out',
    onUpdate: () => {
      target.textContent = String(Math.round(counter.n))
    },
    scrollTrigger: { trigger: target, start: 'top 90%', once: true },
  })
}
