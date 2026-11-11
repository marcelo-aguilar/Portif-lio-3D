import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import pitchUrl from '../assets/about/pitch.webp'
import { about } from '../content/profile'
import { countUp, drawRules, riseTitle, scrubWords, unmaskImage } from '../lib/reveal'
import './about.css'

export function About() {
  const rootRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const context = gsap.context(() => {
      riseTitle(root.querySelector('.section-head__title > span'))
      scrubWords(root.querySelector('.about__statement'))
      unmaskImage(root.querySelector('.about__frame'))
      drawRules(root.querySelectorAll('.about__facts .rule'), root.querySelector('.about__facts'))
      drawRules(root.querySelectorAll('.about__numbers .rule'), root.querySelector('.about__numbers'))
      root.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => countUp(el, Number(el.dataset.count)))
    }, root)
    return () => context.revert()
  }, [])

  return (
    <section ref={rootRef} id="sobre" className="section section--solid about">
      <div className="wrap">
        <header className="section-head">
          <h2 className="section-head__title display">
            <span>Sobre</span>
          </h2>
        </header>

        <p className="about__statement serif">{about.statement}</p>

        <div className="about__body grid">
          <figure className="about__figure">
            <div className="about__frame">
              <img
                src={pitchUrl}
                alt="Marcelo, de camisa branca, fala ao microfone para uma plateia sentada."
                width={920}
                height={1660}
                loading="lazy"
                decoding="async"
              />
            </div>
            <figcaption className="muted">{about.photoCaption}</figcaption>
          </figure>

          <div className="about__text">
            {about.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            <dl className="about__facts">
              {about.facts.map(({ term, detail }) => (
                <div key={term} className="about__fact">
                  <span className="rule" aria-hidden="true" />
                  <dt>{term}</dt>
                  <dd>{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <ul className="about__numbers">
          {about.numbers.map(({ value, suffix, label }) => (
            <li key={label} className="about__number">
              <span className="rule" aria-hidden="true" />
              <p className="about__figure-value display">
                <span data-count={value}>{value}</span>
                {suffix}
              </p>
              <p className="muted">{label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
