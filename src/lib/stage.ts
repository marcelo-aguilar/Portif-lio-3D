/**
 * Ponte entre o DOM e a cena 3D.
 *
 * O layout é definido em CSS: cada seção reserva "vãos" (elementos vazios)
 * onde os objetos 3D devem aparecer. A cada quadro medimos esses vãos e a
 * cena se encaixa neles. Assim a responsividade é resolvida uma vez só, no
 * CSS, e o código WebGL nunca toca o DOM.
 *
 * É um objeto mutável simples de propósito: muda a cada quadro e não deve
 * provocar renderizações do React.
 */
import { clamp } from './math'

/** Retângulo em pixels, com origem no centro da janela e Y para cima. */
export interface Slot {
  x: number
  y: number
  w: number
  h: number
  /** Há área visível na janela. */
  on: boolean
}

const emptySlot = (): Slot => ({ x: 0, y: 0, w: 0, h: 0, on: false })

export const stage = {
  viewport: { w: window.innerWidth, h: window.innerHeight },

  /** Valores da sequência de entrada (0..1), animados pelo GSAP. */
  intro: { glow: 0, letters: 0, portrait: 0, lamp: 0 },

  hero: {
    section: null as HTMLElement | null,
    wordEl: null as HTMLElement | null,
    portraitEl: null as HTMLElement | null,
    word: emptySlot(),
    portrait: emptySlot(),
    /** 0 = topo da página, 1 = herói totalmente coberto pela seção seguinte. */
    progress: 0,
    /** No celular a palavra passa à frente do retrato. */
    wordInFront: false,
    visible: true,
  },

  deck: {
    el: null as HTMLElement | null,
    slot: emptySlot(),
    active: 0,
    hover: 0,
    enabled: false,
    visible: false,
  },

  orbit: {
    el: null as HTMLElement | null,
    slot: emptySlot(),
    /** Grupo em destaque (-1 = nenhum). */
    active: -1,
    /** Rotação acumulada pelo arraste (rad) e sua velocidade. */
    spin: 0,
    spinVelocity: 0,
    tilt: 0,
    dragging: false,
    visible: false,
  },

  finale: {
    /** Seção que cobre o encerramento antes da revelação. */
    coverEl: null as HTMLElement | null,
    wordEl: null as HTMLElement | null,
    word: emptySlot(),
    /** 0 = coberto, 1 = totalmente revelado. */
    reveal: 0,
    visible: false,
  },

  /** Pede ao menos um quadro de renderização (usado no modo de movimento reduzido). */
  dirty: true,
}

function measure(el: HTMLElement | null, slot: Slot, vw: number, vh: number) {
  if (!el) {
    slot.on = false
    return
  }
  const rect = el.getBoundingClientRect()
  slot.w = rect.width
  slot.h = rect.height
  slot.x = rect.left + rect.width / 2 - vw / 2
  slot.y = vh / 2 - (rect.top + rect.height / 2)
  slot.on = rect.width > 0 && rect.bottom > 0 && rect.top < vh && rect.right > 0 && rect.left < vw
}

let lastSignature = ''

/** Lê o layout atual. Chamado uma vez por quadro, antes de renderizar. */
export function measureStage() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  stage.viewport.w = vw
  stage.viewport.h = vh

  const { hero, deck, orbit, finale } = stage

  if (hero.section) {
    const rect = hero.section.getBoundingClientRect()
    const runway = Math.max(rect.height - vh, 1)
    hero.progress = clamp(-rect.top / runway)
    hero.visible = hero.progress < 0.999
    if (hero.visible) {
      measure(hero.wordEl, hero.word, vw, vh)
      measure(hero.portraitEl, hero.portrait, vw, vh)
    }
  } else {
    hero.visible = false
  }

  measure(deck.el, deck.slot, vw, vh)
  deck.visible = deck.enabled && deck.slot.on

  measure(orbit.el, orbit.slot, vw, vh)
  orbit.visible = orbit.slot.on

  if (finale.coverEl) {
    const rect = finale.coverEl.getBoundingClientRect()
    finale.reveal = clamp((vh - rect.bottom) / vh)
    finale.visible = finale.reveal > 0.002
    if (finale.visible) measure(finale.wordEl, finale.word, vw, vh)
  } else {
    finale.visible = false
  }

  // Qualquer mudança de layout ou rolagem marca a cena como "suja".
  const signature = `${vw}|${vh}|${hero.progress.toFixed(4)}|${deck.slot.y.toFixed(1)}|${orbit.slot.y.toFixed(1)}|${finale.reveal.toFixed(4)}|${deck.active}|${orbit.active}`
  if (signature !== lastSignature) {
    lastSignature = signature
    stage.dirty = true
  }
}

/** Alguma parte da cena 3D está na tela? */
export function stageIsVisible() {
  return stage.hero.visible || stage.deck.visible || stage.orbit.visible || stage.finale.visible
}

/** Lê a variável CSS que define se a palavra fica à frente do retrato. */
export function readWordDepth() {
  const el = stage.hero.wordEl
  if (!el) return
  stage.hero.wordInFront = getComputedStyle(el).getPropertyValue('--word-in-front').trim() === '1'
}
