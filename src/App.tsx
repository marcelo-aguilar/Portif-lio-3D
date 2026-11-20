import { Component, lazy, Suspense, useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Project } from './content/projects'
import { env } from './lib/env'
import { initPointer } from './lib/pointer'
import { initScroll } from './lib/scroll'
import { measureStage } from './lib/stage'
import { onFrame, ORDER } from './lib/ticker'
import { About } from './sections/About'
import { Contact } from './sections/Contact'
import { Hero } from './sections/Hero'
import { Journey } from './sections/Journey'
import { ProjectDialog } from './sections/ProjectDialog'
import { Projects } from './sections/Projects'
import { Skills } from './sections/Skills'
import { Intro } from './ui/Intro'
import { LampGlow } from './ui/LampGlow'
import { Nav } from './ui/Nav'

// A cena 3D (three.js + shaders + texturas) fica num chunk separado:
// o conteúdo e a navegação não esperam por ela.
const Experience = lazy(() => import('./three/Experience'))

/** Se a cena 3D falhar por qualquer motivo, o site segue no modo estático. */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('Cena 3D indisponível, usando o modo estático.', error)
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function App() {
  const [sceneOn, setSceneOn] = useState<boolean>(env.webgl)
  const [sceneReady, setSceneReady] = useState(false)
  const [openProject, setOpenProject] = useState<Project | null>(null)

  useEffect(() => {
    const stopScroll = initScroll()
    const stopPointer = initPointer()
    const stopMeasure = onFrame(measureStage, ORDER.layout)
    return () => {
      stopScroll()
      stopPointer()
      stopMeasure()
    }
  }, [])

  // Classes globais: o CSS decide o que mostrar com e sem a cena 3D.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('has-gl', sceneOn)
    root.classList.toggle('js-motion', !env.reducedMotion)
  }, [sceneOn])

  const handleSceneError = useCallback(() => setSceneOn(false), [])
  const handleSceneReady = useCallback(() => setSceneReady(true), [])
  const closeProject = useCallback(() => setOpenProject(null), [])

  return (
    <>
      <a className="skip-link" href="#sobre">
        Pular para o conteúdo
      </a>

      {sceneOn && (
        <SceneBoundary onError={handleSceneError}>
          <Suspense fallback={null}>
            <Experience onReady={handleSceneReady} onLost={handleSceneError} />
          </Suspense>
        </SceneBoundary>
      )}

      <Intro sceneReady={sceneReady || !sceneOn} />
      <Nav />

      <main>
        <Hero />
        <About />
        <Projects sceneOn={sceneOn} onOpen={setOpenProject} />
        <Skills />
        <div className="outro">
          <Journey />
          <Contact />
        </div>
      </main>

      <ProjectDialog project={openProject} onClose={closeProject} />
      <LampGlow />
      <div className="grain" aria-hidden="true" />
    </>
  )
}
