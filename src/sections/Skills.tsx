import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { languages, skillGroups } from '../content/skills'
import { env } from '../lib/env'
import { clamp } from '../lib/math'
import { riseTitle } from '../lib/reveal'
import { stage } from '../lib/stage'
import './skills.css'

/** Intervalo do destaque automático entre os grupos, em ms. */
const CYCLE_MS = 3200

/**
 * Habilidades: à esquerda, um sistema orbital em 3D (cada órbita é um grupo);
 * à direita, os mesmos grupos como listas tipográficas — a versão sempre legível.
 * Passar o cursor (ou tocar) em um grupo acende a órbita correspondente.
 */
export function Skills() {
  const rootRef = useRef<HTMLElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(-1)
  const [inView, setInView] = useState(false)
  const [held, setHeld] = useState(false)

  useLayoutEffect(() => {
    stage.orbit.el = slotRef.current
    return () => {
      stage.orbit.el = null
    }
  }, [])

  // Fora da tela não há grupo em destaque.
  const current = inView ? active : -1

  useEffect(() => {
    stage.orbit.active = current
  }, [current])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const context = gsap.context(() => {
      riseTitle(root.querySelector('.section-head__title > span'))
      ScrollTrigger.create({
        trigger: root,
        start: 'top 60%',
        end: 'bottom 40%',
        onToggle: (self) => setInView(self.isActive),
      })
    }, root)
    return () => context.revert()
  }, [])

  // Sem interação, o destaque percorre os grupos sozinho.
  useEffect(() => {
    if (!inView || held || env.reducedMotion) return
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % skillGroups.length)
    }, CYCLE_MS)
    return () => window.clearInterval(timer)
  }, [inView, held])

  // Arrastar o sistema: gira com inércia (a cena integra a velocidade).
  useEffect(() => {
    const slot = slotRef.current
    if (!slot) return
    const { orbit } = stage
    let lastX = 0
    let lastY = 0
    let lastTime = 0

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      orbit.dragging = true
      lastX = event.clientX
      lastY = event.clientY
      lastTime = event.timeStamp
      slot.setPointerCapture(event.pointerId)
      slot.dataset.dragging = 'true'
    }
    const onMove = (event: PointerEvent) => {
      if (!orbit.dragging) return
      const dx = event.clientX - lastX
      const dy = event.clientY - lastY
      const dt = Math.max((event.timeStamp - lastTime) / 1000, 1 / 240)
      lastX = event.clientX
      lastY = event.clientY
      lastTime = event.timeStamp
      const turn = dx * 0.0065
      orbit.spin += turn
      orbit.spinVelocity = clamp(turn / dt, -7, 7)
      orbit.tilt = clamp(orbit.tilt + dy * 0.003, -0.45, 0.45)
      stage.dirty = true
    }
    const onUp = (event: PointerEvent) => {
      orbit.dragging = false
      slot.dataset.dragging = 'false'
      if (slot.hasPointerCapture(event.pointerId)) slot.releasePointerCapture(event.pointerId)
    }

    slot.addEventListener('pointerdown', onDown)
    slot.addEventListener('pointermove', onMove)
    slot.addEventListener('pointerup', onUp)
    slot.addEventListener('pointercancel', onUp)
    return () => {
      slot.removeEventListener('pointerdown', onDown)
      slot.removeEventListener('pointermove', onMove)
      slot.removeEventListener('pointerup', onUp)
      slot.removeEventListener('pointercancel', onUp)
      orbit.dragging = false
    }
  }, [])

  return (
    <section ref={rootRef} id="habilidades" className="section skills">
      <div className="wrap">
        <header className="section-head">
          <h2 className="section-head__title display">
            <span>Habilidades</span>
          </h2>
          <p className="section-head__note">
            O que usei no currículo e nos projetos, em quatro órbitas. Arraste o sistema para girar.
          </p>
        </header>

        <div className="skills__body">
          <div ref={slotRef} className="skills__stage" aria-hidden="true" />

          <ul className="skills__groups" onPointerLeave={() => setHeld(false)}>
            {skillGroups.map((group, index) => (
              <li
                key={group.id}
                className="skill-group"
                data-active={current === index}
                data-dim={current !== -1 && current !== index}
                onPointerEnter={() => {
                  setHeld(true)
                  setActive(index)
                }}
                onClick={() => {
                  setHeld(true)
                  setActive(index)
                }}
              >
                <div className="skill-group__head">
                  <h3 className="skill-group__name display">{group.name}</h3>
                  <p className="skill-group__note">{group.note}</p>
                </div>
                <ul className="skill-group__items">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>

        <dl className="skills__languages">
          <dt>Idiomas</dt>
          {languages.map(({ name, level }) => (
            <dd key={name}>
              {name} <span className="muted">{level.toLowerCase()}</span>
            </dd>
          ))}
        </dl>
      </div>
    </section>
  )
}
