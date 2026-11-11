import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import type { Project } from '../content/projects'
import { env } from '../lib/env'
import { lockScroll } from '../lib/scroll'
import { ArrowUpRight, Close } from '../ui/Icons'
import './project-dialog.css'

interface ProjectDialogProps {
  project: Project | null
  onClose: () => void
}

/**
 * Estudo de caso em tela cheia.
 * Usa <dialog> nativo: foco preso no painel, Esc para fechar e devolução do
 * foco ao botão de origem vêm de graça.
 */
export function ProjectDialog({ project, onClose }: ProjectDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  // Mantém o conteúdo na tela durante a animação de saída.
  const [shown, setShown] = useState<Project | null>(project)
  if (project && project !== shown) setShown(project)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const panel = dialog.querySelector('.case__panel')

    if (project && !dialog.open) {
      dialog.showModal()
      lockScroll(true)
      dialog.querySelector('.case__scroll')?.scrollTo(0, 0)
      if (!env.reducedMotion && panel) {
        gsap
          .timeline()
          .fromTo(
            panel,
            { clipPath: 'inset(100% 0% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.95, ease: 'expo.inOut' },
          )
          .fromTo(
            dialog.querySelectorAll('[data-in]'),
            { y: 36, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.9, ease: 'expo.out', stagger: 0.06 },
            0.45,
          )
      }
      return
    }

    if (!project && dialog.open) {
      const finish = () => {
        dialog.close()
        lockScroll(false)
      }
      if (env.reducedMotion || !panel) {
        finish()
        return
      }
      gsap.to(panel, {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: 0.6,
        ease: 'expo.inOut',
        onComplete: finish,
      })
    }
  }, [project])

  // Garante o destravamento da rolagem se o componente sair de cena aberto.
  useEffect(() => () => lockScroll(false), [])

  return (
    <dialog
      ref={dialogRef}
      className="case"
      aria-labelledby="case-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
    >
      {shown && (
        <div className="case__panel">
          <header className="case__bar">
            <p>
              Módulo {shown.module}, {shown.period.toLowerCase()}
            </p>
            <button type="button" className="case__close" onClick={onClose}>
              Fechar
              <Close />
            </button>
          </header>

          <div className="case__scroll" data-lenis-prevent>
            <div className="case__head">
              <h2 id="case-title" className="case__title display" data-in>
                {shown.title}
              </h2>
              <p className="case__kind" data-in>
                {shown.kind}, com {shown.partner}
              </p>
            </div>

            <figure className="case__shot" data-in>
              <img src={shown.image} alt={shown.imageAlt} width={1280} height={800} decoding="async" />
            </figure>

            <div className="case__grid">
              <section className="case__block case__block--wide" data-in>
                <h3>O desafio</h3>
                <p>{shown.challenge}</p>
              </section>

              <section className="case__block case__block--wide" data-in>
                <h3>A solução</h3>
                <p>{shown.solution}</p>
              </section>

              <section className="case__block" data-in>
                <h3>O que eu fiz</h3>
                <ul className="case__list">
                  {shown.role.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="case__block" data-in>
                <h3>Destaques</h3>
                <ul className="case__list">
                  {shown.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="case__block" data-in>
                <h3>Tecnologias</h3>
                <ul className="case__stack">
                  {shown.stack.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {shown.team && <p className="case__team muted">Time: {shown.team}</p>}
              </section>
            </div>

            <blockquote className="case__lesson serif" data-in>
              <p>“{shown.lesson}”</p>
              <footer>O que levei deste projeto</footer>
            </blockquote>

            <div className="case__links" data-in>
              {shown.links.map((link, index) => (
                <a
                  key={link.href}
                  className={`btn${index === 0 ? ' btn--solid' : ''}`}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                  <ArrowUpRight />
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </dialog>
  )
}
