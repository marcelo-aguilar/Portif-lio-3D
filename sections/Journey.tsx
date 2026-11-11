import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { journey } from '../content/journey'
import { env } from '../lib/env'
import { riseTitle } from '../lib/reveal'
import { stage } from '../lib/stage'
import { Star } from '../ui/Icons'
import './journey.css'

/**
 * Trajetória: uma linha do tempo cuja espinha se desenha com a rolagem;
 * cada marco acende quando a linha chega até ele.
 */
export function Journey() {
  const rootRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    // Esta seção cobre o encerramento; a borda inferior dela comanda a revelação.
    stage.finale.coverEl = root

    const context = gsap.context(() => {
      riseTitle(root.querySelector('.section-head__title > span'))

      const items = root.querySelectorAll<HTMLElement>('.journey__item')
      if (env.reducedMotion) {
        items.forEach((item) => (item.dataset.on = 'true'))
        return
      }

      gsap.fromTo(
        root.querySelector('.journey__spine-fill'),
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: root.querySelector('.journey__timeline'), start: 'top 62%', end: 'bottom 62%', scrub: 0.4 },
        },
      )
      items.forEach((item) => {
        ScrollTrigger.create({
          trigger: item,
          start: 'top 62%',
          onEnter: () => (item.dataset.on = 'true'),
          onLeaveBack: () => (item.dataset.on = 'false'),
        })
      })
    }, root)

    return () => {
      context.revert()
      stage.finale.coverEl = null
    }
  }, [])

  return (
    <section ref={rootRef} id="trajetoria" className="section section--solid journey">
      <div className="wrap">
        <header className="section-head">
          <h2 className="section-head__title display">
            <span>Trajetória</span>
          </h2>
          <p className="section-head__note">Da olimpíada de matemática aos projetos com parceiros reais.</p>
        </header>

        <div className="journey__timeline">
          <div className="journey__spine" aria-hidden="true">
            <span className="journey__spine-fill" />
          </div>

          <ol className="journey__list">
          {journey.map((entry) => (
            <li key={entry.when + entry.title} className="journey__item" data-on="false">
              <p className="journey__when display">{entry.when}</p>
              <span className="journey__dot" aria-hidden="true" />
              <div className="journey__what">
                <h3 className="journey__title">
                  {entry.merit && <Star className="journey__merit" />}
                  {entry.title}
                </h3>
                {entry.place && <p className="journey__place">{entry.place}</p>}
                <p className="journey__detail">{entry.detail}</p>
                {entry.steps && (
                  <ol className="journey__steps">
                    {entry.steps.map((step) => (
                      <li key={step.text}>
                        <span className="journey__step-when">{step.when}</span>
                        <span>{step.text}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </li>
          ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
