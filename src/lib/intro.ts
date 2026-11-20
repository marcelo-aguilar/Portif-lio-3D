/**
 * Sequência de entrada.
 *
 * Cada parte da página registra aqui a sua contribuição; o componente <Intro>
 * monta uma única linha do tempo quando tudo está pronto. Assim a coreografia
 * fica num só lugar no tempo, mas o código de cada trecho mora no componente
 * a que pertence.
 */
import gsap from 'gsap'

type Contribution = (timeline: gsap.core.Timeline) => void

const contributions = new Set<Contribution>()

export function onIntro(contribution: Contribution): () => void {
  contributions.add(contribution)
  return () => {
    contributions.delete(contribution)
  }
}

export function buildIntro(): gsap.core.Timeline {
  const timeline = gsap.timeline({ paused: true })
  for (const contribute of contributions) contribute(timeline)
  return timeline
}
