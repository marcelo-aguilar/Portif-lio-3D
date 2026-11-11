import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { profile } from '../content/profile'
import { env } from '../lib/env'
import { buildIntro } from '../lib/intro'
import { stage } from '../lib/stage'
import { wordmark } from '../lib/wordmark'
import { Star } from './Icons'
import './intro.css'

interface IntroProps {
  /** A cena 3D terminou de carregar (ou não será usada). */
  sceneReady: boolean
}

/** Tempo máximo de espera pela cena: o conteúdo nunca fica refém do 3D. */
const MAX_WAIT_MS = 6000
const SEEN_KEY = 'intro-vista'

/**
 * Abertura: contador de carga, persiana que se abre (uma lâmina por letra do
 * sobrenome) e disparo da coreografia do herói.
 */
export function Intro({ sceneReady }: IntroProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const countRef = useRef<HTMLSpanElement>(null)
  const [fontsReady, setFontsReady] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [done, setDone] = useState(false)
  const played = useRef(false)

  useEffect(() => {
    let alive = true
    const fonts = [
      document.fonts.load('400 1em Anton'),
      document.fonts.load('italic 400 1em "Bodoni Moda Variable"'),
      document.fonts.load('400 1em "Instrument Sans Variable"'),
    ]
    Promise.allSettled(fonts).then(() => alive && setFontsReady(true))
    const timer = window.setTimeout(() => alive && setTimedOut(true), MAX_WAIT_MS)
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [])

  // Contador: avança suavemente até o patamar correspondente ao que já carregou.
  useEffect(() => {
    if (done || env.reducedMotion) return
    const target = sceneReady && fontsReady ? 100 : fontsReady ? 62 : 28
    const counter = { value: Number(countRef.current?.textContent ?? 0) }
    const tween = gsap.to(counter, {
      value: target,
      duration: target === 100 ? 0.5 : 2.4,
      ease: target === 100 ? 'power2.out' : 'power1.out',
      onUpdate: () => {
        if (countRef.current) countRef.current.textContent = String(Math.round(counter.value)).padStart(3, '0')
      },
    })
    return () => {
      tween.kill()
    }
  }, [sceneReady, fontsReady, done])

  useEffect(() => {
    const ready = (sceneReady && fontsReady) || timedOut
    if (!ready || played.current) return
    played.current = true

    const root = rootRef.current
    const finish = () => {
      stage.intro.glow = stage.intro.letters = stage.intro.portrait = stage.intro.lamp = 1
      stage.dirty = true
      setDone(true)
      ScrollTrigger.refresh()
      try {
        window.sessionStorage.setItem(SEEN_KEY, '1')
      } catch {
        /* armazenamento indisponível: sem problema */
      }
    }

    if (env.reducedMotion || !root) {
      const timeline = buildIntro()
      timeline.progress(1)
      finish()
      return
    }

    let seen = false
    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === '1'
    } catch {
      /* idem */
    }

    const timeline = buildIntro()
    const opening = gsap.timeline({ onComplete: finish })

    opening
      .to(root.querySelector('.intro__center'), { autoAlpha: 0, y: -16, duration: 0.5, ease: 'power2.in' }, 0.25)
      .to(
        root.querySelectorAll('.intro__slat'),
        { scaleY: 0, duration: 1.15, ease: 'expo.inOut', stagger: { each: 0.07, from: 'start' } },
        0.45,
      )
      // A cena acende: primeiro o clarão de fundo, depois as letras se erguem,
      // o retrato emerge e por fim a lâmpada do visitante é ligada.
      .to(stage.intro, { glow: 1, duration: 2.6, ease: 'power2.out' }, 0.5)
      .to(stage.intro, { letters: 1, duration: 2.2, ease: 'none' }, 0.75)
      .to(stage.intro, { portrait: 1, duration: 2.2, ease: 'power2.out' }, 1.0)
      .to(stage.intro, { lamp: 1, duration: 1.8, ease: 'power2.inOut' }, 1.5)
      .add(timeline.play(), 1.25)

    // Em visitas repetidas na mesma sessão a abertura passa mais depressa.
    if (seen) opening.timeScale(2.2)

    // Qualquer intenção de avançar acelera a abertura em vez de bloqueá-la.
    const hurry = () => opening.timeScale(4)
    const options = { passive: true, once: true } as const
    window.addEventListener('wheel', hurry, options)
    window.addEventListener('touchmove', hurry, options)
    window.addEventListener('keydown', hurry, options)
    window.addEventListener('pointerdown', hurry, options)

    return () => {
      window.removeEventListener('wheel', hurry)
      window.removeEventListener('touchmove', hurry)
      window.removeEventListener('keydown', hurry)
      window.removeEventListener('pointerdown', hurry)
    }
  }, [sceneReady, fontsReady, timedOut])

  if (done) return null

  return (
    <div ref={rootRef} className="intro" role="status" aria-label="Carregando o portfólio">
      <div className="intro__slats" aria-hidden="true">
        {wordmark.letters.map((_, index) => (
          <div key={index} className="intro__slat" />
        ))}
      </div>
      <div className="intro__center" aria-hidden="true">
        <Star className="intro__star" />
        <p className="intro__count display">
          <span ref={countRef}>000</span>
        </p>
        <p className="intro__name">
          {profile.name}
          <span>Portfólio 2026</span>
        </p>
      </div>
    </div>
  )
}
