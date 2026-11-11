import { useEffect, useRef } from 'react'
import { env } from '../lib/env'
import { pointer } from '../lib/pointer'
import { stage } from '../lib/stage'
import { onFrame, ORDER } from '../lib/ticker'
import './lamp-glow.css'

/**
 * O halo da lâmpada sobre o DOM.
 * Na cena 3D a luz do cursor é real; aqui o mesmo gesto continua nas seções
 * de texto, como um brilho carmim discreto que acompanha o ponteiro.
 */
export function LampGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !env.hover) return

    return onFrame(() => {
      const x = stage.viewport.w / 2 + pointer.lampX
      const y = stage.viewport.h / 2 - pointer.lampY
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      el.style.opacity = (pointer.presence * stage.intro.lamp).toFixed(3)
    }, ORDER.layout + 1)
  }, [])

  if (!env.hover) return null
  return <div ref={ref} className="lamp-glow" aria-hidden="true" />
}
