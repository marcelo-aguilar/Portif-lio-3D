import { useEffect, useLayoutEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { SplitText } from 'gsap/SplitText'
import portraitUrl from '../assets/portrait/retrato.webp'
import { profile } from '../content/profile'
import { onIntro } from '../lib/intro'
import { scrollToTarget } from '../lib/scroll'
import { readWordDepth, stage } from '../lib/stage'
import { onFrame, ORDER } from '../lib/ticker'
import { wordmark } from '../lib/wordmark'
import { ArrowDown } from '../ui/Icons'
import './hero.css'

const wordStyle = {
  '--word-em': wordmark.width,
  '--word-cap': wordmark.capHeight,
  '--word-aspect': wordmark.aspect,
  '--word-tracking': `${wordmark.tracking}em`,
  aspectRatio: String(wordmark.aspect),
} as CSSProperties

function jump(event: React.MouseEvent<HTMLAnchorElement>, hash: string) {
  event.preventDefault()
  scrollToTarget(hash)
}

/**
 * Herói: uma cena fixa ("sticky") enquanto a seção seguinte sobe por cima.
 *
 * O retrato e o sobrenome são desenhados pela cena 3D dentro dos vãos
 * reservados aqui (`hero__portrait` e `hero__word`). Sem WebGL, os mesmos
 * elementos exibem a imagem e o texto em CSS, com a mesma composição.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const wordRef = useRef<HTMLDivElement>(null)
  const portraitRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const firstRef = useRef<HTMLSpanElement>(null)

  // Registra os vãos que a cena 3D deve ocupar.
  useLayoutEffect(() => {
    const { hero } = stage
    hero.section = sectionRef.current
    hero.wordEl = wordRef.current
    hero.portraitEl = portraitRef.current
    readWordDepth()
    window.addEventListener('resize', readWordDepth)
    return () => {
      window.removeEventListener('resize', readWordDepth)
      hero.section = hero.wordEl = hero.portraitEl = null
    }
  }, [])

  // O texto se dissolve conforme a próxima seção cobre o herói.
  useEffect(() => {
    let last = -1
    return onFrame(() => {
      const progress = stage.hero.progress
      if (progress === last || !contentRef.current) return
      last = progress
      contentRef.current.style.setProperty('--p', progress.toFixed(4))
      // A seção seguinte usa o mesmo valor para dosar a sombra da sua borda.
      document.documentElement.style.setProperty('--hero-p', progress.toFixed(4))
    }, ORDER.layout + 1)
  }, [])

  // Contribuição para a sequência de entrada: nome letra a letra, depois o texto de apoio.
  useLayoutEffect(
    () =>
      onIntro((timeline) => {
        const content = contentRef.current
        if (!content || !firstRef.current) return

        const name = SplitText.create(firstRef.current, { type: 'chars', aria: 'none' })
        const copy = SplitText.create(content.querySelectorAll('[data-lines]'), {
          type: 'lines',
          mask: 'lines',
          aria: 'none',
        })

        timeline
          .from(name.chars, { yPercent: 118, duration: 1.5, ease: 'expo.out', stagger: 0.055 }, 0)
          .from(copy.lines, { yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: 0.07 }, 0.55)
          .from(
            content.querySelectorAll('[data-fade]'),
            { autoAlpha: 0, y: 14, duration: 1.1, ease: 'power3.out', stagger: 0.09 },
            0.95,
          )
          .from('[data-intro="nav"]', { autoAlpha: 0, y: -14, duration: 1.1, ease: 'power3.out' }, 1.0)
          // Devolve o texto ao DOM original: quebras de linha voltam a ser fluidas.
          .add(() => {
            copy.revert()
            name.revert()
          })
      }),
    [],
  )

  return (
    <section
      ref={sectionRef}
      id="topo"
      className="hero"
      aria-label="Apresentação"
      style={{ '--word-aspect': wordmark.aspect } as CSSProperties}
    >
      <div className="hero__sticky">
        <div className="hero__backdrop" aria-hidden="true" />

        <div ref={wordRef} className="hero__word" style={wordStyle} aria-hidden="true">
          <span className="hero__word-text display">{wordmark.word}</span>
        </div>

        <div ref={portraitRef} className="hero__portrait" aria-hidden="true">
          <img src={portraitUrl} alt="" width={941} height={1672} decoding="async" fetchPriority="high" />
        </div>

        <div ref={contentRef} className="hero__content">
          <h1 className="hero__name serif" aria-label={profile.name}>
            <span ref={firstRef} aria-hidden="true">
              {profile.firstName}
            </span>
          </h1>

          <div className="hero__base">
            <div className="hero__intro">
              <p className="hero__role" data-lines>
                {profile.role} no {profile.school}, turma de {profile.classOf}.
              </p>
              <p className="hero__positioning" data-lines>
                {profile.positioning}
              </p>
            </div>

            <div className="hero__aside">
              <p className="hero__status" data-fade>
                <span className="hero__status-dot" aria-hidden="true" />
                {profile.status}, {profile.location}
              </p>
              <div className="hero__actions" data-fade>
                <a className="btn btn--solid" href="#projetos" onClick={(event) => jump(event, '#projetos')}>
                  Ver projetos
                </a>
                <a className="btn" href="#contato" onClick={(event) => jump(event, '#contato')}>
                  Entrar em contato
                </a>
              </div>
            </div>
          </div>

          <a className="hero__scroll" href="#sobre" data-fade onClick={(event) => jump(event, '#sobre')}>
            <span>Role para explorar</span>
            <ArrowDown />
          </a>
        </div>
      </div>
    </section>
  )
}
