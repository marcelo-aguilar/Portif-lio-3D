import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { contact, profile } from '../content/profile'
import { scrollToTarget } from '../lib/scroll'
import { stage } from '../lib/stage'
import { onFrame, ORDER } from '../lib/ticker'
import { wordmark } from '../lib/wordmark'
import { ArrowUpRight } from '../ui/Icons'
import './contact.css'

const YEAR = new Date().getFullYear()

const wordStyle = {
  '--word-em': wordmark.width,
  '--word-cap': wordmark.capHeight,
  '--word-aspect': wordmark.aspect,
  '--word-tracking': `${wordmark.tracking}em`,
  aspectRatio: String(wordmark.aspect),
} as CSSProperties

/**
 * Encerramento: fica preso ao fundo da janela e é revelado quando a
 * Trajetória termina de passar. O sobrenome volta, agora inteiro, erguido
 * pela cena 3D — a mesma imagem que abriu o site.
 */
export function Contact() {
  const rootRef = useRef<HTMLElement>(null)
  const wordRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  useLayoutEffect(() => {
    stage.finale.wordEl = wordRef.current
    return () => {
      stage.finale.wordEl = null
    }
  }, [])

  // O conteúdo acompanha a revelação com um leve deslocamento.
  useEffect(() => {
    let last = -1
    return onFrame(() => {
      const reveal = stage.finale.reveal
      if (reveal === last || !rootRef.current) return
      last = reveal
      rootRef.current.style.setProperty('--reveal', reveal.toFixed(4))
    }, ORDER.layout + 1)
  }, [])

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2400)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
    } catch {
      // Sem acesso à área de transferência: abre o cliente de e-mail.
      window.location.href = `mailto:${profile.email}`
    }
  }

  return (
    <footer ref={rootRef} id="contato" className="contact" data-scroll-end>
      <div className="contact__inner wrap">
        <div className="contact__top">
          <h2 className="contact__heading serif">{contact.heading}</h2>
          <p className="contact__lead">{contact.lead}</p>
        </div>

        <div className="contact__ways">
          <a className="contact__email" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
          <div className="contact__actions">
            <button type="button" className="btn" onClick={copyEmail}>
              <span aria-live="polite">{copied ? 'E-mail copiado' : 'Copiar e-mail'}</span>
            </button>
            <a className="btn" href={profile.links.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
              <ArrowUpRight />
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
            <a className="btn" href={profile.links.github} target="_blank" rel="noreferrer">
              GitHub
              <ArrowUpRight />
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          </div>
        </div>

        <div ref={wordRef} className="contact__word" style={wordStyle} aria-hidden="true">
          <span className="contact__word-text display">{wordmark.word}</span>
        </div>

        <div className="contact__foot">
          <p>
            © {YEAR} {profile.name}
          </p>
          <p className="contact__made">Feito com React, Three.js e GSAP</p>
          <button type="button" className="link" onClick={() => scrollToTarget(0)}>
            Voltar ao topo
          </button>
        </div>
      </div>
    </footer>
  )
}
