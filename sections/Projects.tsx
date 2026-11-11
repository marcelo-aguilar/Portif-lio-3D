import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { projects } from '../content/projects'
import type { Project } from '../content/projects'
import { pointer } from '../lib/pointer'
import { riseTitle } from '../lib/reveal'
import { scrollToTarget } from '../lib/scroll'
import { stage } from '../lib/stage'
import { onFrame, ORDER } from '../lib/ticker'
import { ArrowUpRight } from '../ui/Icons'
import './projects.css'

interface ProjectsProps {
  sceneOn: boolean
  onOpen: (project: Project) => void
}

/** O baralho 3D pede espaço lateral e um ponteiro preciso. */
const DECK_QUERY = '(min-width: 1000px) and (hover: hover) and (pointer: fine)'

const two = (value: number) => String(value).padStart(2, '0')

/**
 * Projetos em formato de leitura guiada: os textos rolam à esquerda enquanto,
 * à direita, um palco fixo mostra as telas dos projetos como um baralho em
 * profundidade (cena 3D). Em telas estreitas, ou sem WebGL, cada projeto
 * mostra a própria imagem e a seção vira uma lista comum.
 */
export function Projects({ sceneOn, onOpen }: ProjectsProps) {
  const rootRef = useRef<HTMLElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(0)
  const [deck, setDeck] = useState(false)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    const query = window.matchMedia(DECK_QUERY)
    const update = () => setDeck(sceneOn && query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [sceneOn])

  useLayoutEffect(() => {
    stage.deck.el = slotRef.current
    stage.deck.enabled = deck
    stage.dirty = true
    return () => {
      stage.deck.el = null
      stage.deck.enabled = false
    }
  }, [deck])

  useEffect(() => {
    stage.deck.active = active
  }, [active])

  useEffect(() => {
    stage.deck.hover = hovering ? 1 : 0
    if (!hovering) return
    // Rótulo contextual que acompanha o cursor sobre a tela ativa.
    return onFrame(() => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${pointer.clientX}px, ${pointer.clientY}px, 0)`
      }
    }, ORDER.layout + 1)
  }, [hovering])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const context = gsap.context(() => {
      riseTitle(root.querySelector('.section-head__title > span'))
      root.querySelectorAll('.project').forEach((element, index) => {
        ScrollTrigger.create({
          trigger: element,
          start: 'top 58%',
          end: 'bottom 58%',
          onToggle: (self) => self.isActive && setActive(index),
        })
      })
    }, root)
    return () => context.revert()
  }, [])

  const current = projects[active]

  return (
    <section ref={rootRef} id="projetos" className={`section projects${deck ? ' projects--deck' : ''}`}>
      <div className="wrap">
        <header className="section-head">
          <h2 className="section-head__title display">
            <span>Projetos</span>
          </h2>
          <p className="section-head__note">
            Três módulos no Inteli, três parceiros reais. Dez semanas cada, sempre em equipe.
          </p>
        </header>

        <div className="projects__body">
          <ol className="projects__list">
            {projects.map((project, index) => (
              <li
                key={project.id}
                id={`projeto-${project.id}`}
                className="project"
                data-active={index === active}
              >
                <article>
                  <p className="project__meta">
                    <span>Módulo {project.module}</span>
                    <span>{project.period}</span>
                  </p>

                  <figure className="project__shot">
                    <img
                      src={project.image}
                      alt={project.imageAlt}
                      width={1280}
                      height={800}
                      loading="lazy"
                      decoding="async"
                    />
                  </figure>

                  <h3 className="project__title display">{project.title}</h3>
                  <p className="project__kind">
                    {project.kind}, com {project.partner}
                  </p>
                  <p className="project__summary">{project.summary}</p>

                  <blockquote className="project__lesson serif">
                    <p>“{project.lesson}”</p>
                  </blockquote>

                  <div className="project__actions">
                    <button type="button" className="btn btn--solid" onClick={() => onOpen(project)}>
                      Ver estudo completo
                    </button>
                    <a className="btn" href={project.links[0].href} target="_blank" rel="noreferrer">
                      {project.links[0].label}
                      <ArrowUpRight />
                      <span className="sr-only"> (abre em nova aba)</span>
                    </a>
                  </div>
                </article>
              </li>
            ))}
          </ol>

          <div className="projects__stage">
            <div ref={slotRef} className="projects__slot" aria-hidden="true" />

            {/* A tela ativa é clicável; o botão equivalente para teclado está no artigo. */}
            <button
              type="button"
              className="projects__hit"
              tabIndex={-1}
              aria-hidden="true"
              onPointerEnter={() => setHovering(true)}
              onPointerLeave={() => setHovering(false)}
              onClick={() => onOpen(current)}
            />

            <nav className="projects__index" aria-label="Ir para um projeto">
              {projects.map((project, index) => (
                <button
                  key={project.id}
                  type="button"
                  className="projects__tick"
                  aria-current={index === active ? 'true' : undefined}
                  onClick={() => scrollToTarget(`#projeto-${project.id}`)}
                >
                  <span className="display">{two(project.module)}</span>
                  <span className="projects__tick-name">{project.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <span ref={cursorRef} className="projects__cursor" data-on={hovering} aria-hidden="true">
        Ver estudo completo
      </span>
    </section>
  )
}
