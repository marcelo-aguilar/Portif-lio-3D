import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { profile, sections } from '../content/profile'
import { env } from '../lib/env'
import { lockScroll, scrollToTarget } from '../lib/scroll'
import { Star } from './Icons'
import './nav.css'

function goTo(event: React.MouseEvent<HTMLAnchorElement>, hash: string) {
  event.preventDefault()
  scrollToTarget(hash === '#topo' ? 0 : hash)
  window.history.replaceState(null, '', hash === '#topo' ? window.location.pathname : hash)
}

export function Nav() {
  const [active, setActive] = useState<string>('')
  const [open, setOpen] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Seção ativa + barra de progresso de leitura.
  useEffect(() => {
    const context = gsap.context(() => {
      for (const { id } of sections) {
        // O contato fica preso ao fundo da janela: ele "começa" onde a Trajetória termina.
        const range =
          id === 'contato'
            ? { trigger: '#trajetoria', start: 'bottom 55%', end: 'max' }
            : { trigger: `#${id}`, start: 'top 55%', end: 'bottom 55%' }
        ScrollTrigger.create({
          ...range,
          onToggle: (self) => {
            if (self.isActive) setActive(id)
            else setActive((current) => (current === id ? '' : current))
          },
        })
      }
      if (barRef.current) {
        gsap.to(barRef.current, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
        })
      }
    })
    return () => context.revert()
  }, [])

  // Menu em tela cheia (telas estreitas): trava a rolagem, fecha com Esc e devolve o foco.
  useEffect(() => {
    lockScroll(open)
    const menu = menuRef.current
    if (!menu) return
    menu.inert = !open

    if (!open) return

    const links = menu.querySelectorAll('.menu__link > span')
    if (!env.reducedMotion) {
      gsap.fromTo(
        links,
        { yPercent: 110 },
        { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, delay: 0.15 },
      )
    }
    menu.querySelector<HTMLAnchorElement>('a')?.focus({ preventScroll: true })

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Ao voltar para uma tela larga, o menu deixa de existir.
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 861px)')
    const onChange = () => wide.matches && setOpen(false)
    wide.addEventListener('change', onChange)
    return () => wide.removeEventListener('change', onChange)
  }, [])

  return (
    <>
      <header className="nav" data-intro="nav">
        <a className="nav__brand" href="#topo" onClick={(event) => goTo(event, '#topo')}>
          <Star className="nav__star" />
          <span>{profile.name}</span>
        </a>

        <nav className="nav__links" aria-label="Seções">
          {sections.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="nav__link"
              aria-current={active === id ? 'true' : undefined}
              onClick={(event) => goTo(event, `#${id}`)}
            >
              {label}
            </a>
          ))}
        </nav>

        <button
          ref={toggleRef}
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="menu"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="nav__toggle-label">{open ? 'Fechar' : 'Menu'}</span>
          <span className="nav__toggle-icon" aria-hidden="true" />
        </button>

        <div className="nav__progress" aria-hidden="true">
          <div ref={barRef} className="nav__progress-bar" />
        </div>
      </header>

      <div id="menu" ref={menuRef} className="menu" data-open={open}>
        <nav aria-label="Seções">
          <ol className="menu__list">
            {sections.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="menu__link display"
                  aria-current={active === id ? 'true' : undefined}
                  onClick={(event) => {
                    setOpen(false)
                    goTo(event, `#${id}`)
                  }}
                >
                  <span>{label}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <p className="menu__foot">
          <a className="link" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
        </p>
      </div>
    </>
  )
}
