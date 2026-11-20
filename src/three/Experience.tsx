import { Suspense, useEffect, useRef } from 'react'
import { advance, Canvas, useFrame, useThree } from '@react-three/fiber'
import { Color } from 'three'
import { env } from '../lib/env'
import { smoothstep } from '../lib/math'
import { pointer } from '../lib/pointer'
import { stage, stageIsVisible } from '../lib/stage'
import { onFrame, ORDER } from '../lib/ticker'
import { Dust, Glow } from './Atmosphere'
import { Deck } from './Deck'
import { FINALE_DEPTH, HERO_DEPTH_BACK, HERO_DEPTH_FRONT } from './depths'
import { Lamp } from './Lamp'
import { Letters } from './Letters'
import type { LettersState } from './Letters'
import { Orbit } from './Orbit'
import { COLORS } from './palette'
import { Portrait } from './Portrait'
import { Rig } from './Rig'
import { Sparks } from './Sparks'
import './experience.css'

interface ExperienceProps {
  /** Texturas carregadas e shaders compilados: a abertura pode começar. */
  onReady: () => void
  /** O contexto WebGL foi perdido: o site volta ao modo estático. */
  onLost: () => void
}

/** Degraus de resolução: a cena desce um degrau se os quadros ficarem lentos. */
const DPR_STEPS = env.tier === 'high' ? [1.75, 1.35, 1] : [1.5, 1.15, 0.9]
const initialDpr = Math.min(window.devicePixelRatio || 1, DPR_STEPS[0])

/** Quadros extras renderizados depois da última mudança (modo de movimento reduzido). */
const SETTLE_FRAMES = 30

const readHero = (state: LettersState) => {
  const { hero, intro } = stage
  state.slot = hero.word
  state.visible = hero.visible && intro.letters > 0.001
  state.depth = hero.wordInFront ? HERO_DEPTH_FRONT : HERO_DEPTH_BACK
  state.rise = intro.letters
  state.fall = smoothstep(0.02, 0.9, hero.progress)
}

const readFinale = (state: LettersState) => {
  const { finale } = stage
  state.slot = finale.word
  state.visible = finale.visible
  state.depth = FINALE_DEPTH
  state.rise = smoothstep(0.25, 1, finale.reveal)
  state.fall = 0
}

/** Compila os shaders antes da abertura e avisa quando a cena pode aparecer. */
function Ready({ onReady }: { onReady: () => void }) {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)

  useEffect(() => {
    gl.compile(scene, camera)
    stage.dirty = true
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(onReady)
    })
    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
    }
  }, [gl, scene, camera, onReady])

  return null
}

/** Resolução adaptativa: mede o tempo médio de quadro e reduz o DPR se preciso. */
function Quality() {
  const setDpr = useThree((state) => state.setDpr)
  const sample = useRef({ frames: 0, total: 0, level: DPR_STEPS.findIndex((step) => step <= initialDpr) })

  useFrame((_, dt) => {
    if (stage.intro.lamp < 1) return // a abertura (com compilação de shaders) não conta
    const data = sample.current
    data.frames += 1
    data.total += dt
    if (data.frames < 90) return

    const average = data.total / data.frames
    data.frames = 0
    data.total = 0
    if (average > 1 / 42 && data.level < DPR_STEPS.length - 1) {
      data.level += 1
      setDpr(Math.min(window.devicePixelRatio || 1, DPR_STEPS[data.level]))
    }
  })

  return null
}

export default function Experience({ onReady, onLost }: ExperienceProps) {
  const container = useRef<HTMLDivElement>(null)

  // Laço de renderização sob demanda: a cena só é desenhada quando algum
  // palco está na tela e a aba está visível.
  useEffect(() => {
    let clock = 0
    let settle = SETTLE_FRAMES
    let lastX = 0
    let lastY = 0
    let shown = true

    return onFrame((_, dt) => {
      if (document.hidden) return

      // Sem palco na tela, o canvas sai de cena: o último quadro desenhado
      // não pode ficar congelado atrás das seções.
      const visible = stageIsVisible()
      if (visible !== shown && container.current) {
        shown = visible
        container.current.style.visibility = visible ? 'visible' : 'hidden'
        if (visible) settle = SETTLE_FRAMES
      }
      if (!visible) return

      if (env.reducedMotion) {
        // Sem animação contínua: desenha apenas quando algo muda.
        const moved = Math.abs(pointer.lampX - lastX) + Math.abs(pointer.lampY - lastY) > 0.25
        if (stage.dirty || moved) settle = SETTLE_FRAMES
        if (settle <= 0) return
        settle -= 1
        lastX = pointer.lampX
        lastY = pointer.lampY
      }

      stage.dirty = false
      // Relógio próprio: pausas (aba oculta, seção fora da tela) não viram saltos.
      clock += dt
      advance(clock)
    }, ORDER.render)
  }, [])

  return (
    <div ref={container} className="experience" aria-hidden="true">
      <Canvas
        frameloop="never"
        flat
        dpr={initialDpr}
        gl={{
          antialias: env.tier === 'high',
          alpha: false,
          stencil: false,
          powerPreference: 'high-performance',
        }}
        camera={{ manual: true, near: 10, far: 9000, position: [0, 0, 1000] }}
        style={{ pointerEvents: 'none' }}
        onCreated={({ gl, scene }) => {
          scene.background = new Color(COLORS.breu)
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault()
            onLost()
          })
        }}
      >
        <Rig />
        <Lamp />
        <Glow />
        <Suspense fallback={null}>
          <Letters read={readHero} />
          <Portrait />
          <Sparks />
          <Dust />
          <Deck />
          <Orbit />
          <Letters read={readFinale} />
          <Ready onReady={onReady} />
        </Suspense>
        <Quality />
      </Canvas>
    </div>
  )
}
