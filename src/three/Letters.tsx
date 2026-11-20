import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, MeshStandardMaterial } from 'three'
import type { Group } from 'three'
import { env } from '../lib/env'
import { clamp, damp, easeInOutCubic, easeOutExpo } from '../lib/math'
import { pointer } from '../lib/pointer'
import type { Slot } from '../lib/stage'
import { getLetterGeometries } from './geometry'
import { COLORS } from './palette'
import { depthScale } from './view'

/** Estado que o palco informa às letras a cada quadro. */
export interface LettersState {
  slot: Slot
  /** Profundidade da face frontal, em alturas de maiúscula (negativo = atrás da janela). */
  depth: number
  /** 0 = deitadas no chão, 1 = todas de pé. As letras se erguem em sequência. */
  rise: number
  /** 0 = de pé, 1 = tombadas para trás (saída). */
  fall: number
  visible: boolean
}

interface LettersProps {
  /** Lido a cada quadro; o palco decide vão, profundidade e progresso. */
  read: (state: LettersState) => void
}

const STAGGER = 0.11
const HALF_PI = Math.PI / 2

/**
 * Material das letras: carmim fosco, com a base se dissolvendo no escuro
 * (como nas referências). O degradê é injetado no shader padrão para manter
 * a iluminação física da lâmpada.
 */
function createLetterMaterial() {
  const material = new MeshStandardMaterial({
    color: new Color(COLORS.carmim),
    roughness: 0.56,
    metalness: 0.05,
  })
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vRise;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRise = position.y;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vRise;')
      .replace(
        '#include <opaque_fragment>',
        'outgoingLight *= mix(0.14, 1.0, smoothstep(-0.05, 0.75, vRise));\n#include <opaque_fragment>',
      )
  }
  material.customProgramCacheKey = () => 'letters-fade'
  return material
}

/**
 * O sobrenome extrudado. Cada letra é uma malha independente que se ergue,
 * tomba e recua quando a lâmpada chega perto.
 */
export function Letters({ read }: LettersProps) {
  const group = useRef<Group>(null)
  const pivots = useRef<(Group | null)[]>([])
  const letters = useMemo(() => getLetterGeometries(), [])
  const material = useMemo(() => createLetterMaterial(), [])
  const lean = useMemo(() => letters.map(() => 0), [letters])
  const state = useMemo<LettersState>(
    () => ({ slot: { x: 0, y: 0, w: 0, h: 0, on: false }, depth: 0, rise: 0, fall: 0, visible: false }),
    [],
  )

  useFrame((_, dt) => {
    const root = group.current
    if (!root) return
    read(state)
    root.visible = state.visible && state.slot.w > 0
    if (!root.visible) return

    const { slot } = state
    const cap = slot.h
    const z = state.depth * cap
    const k = depthScale(z)

    // Encaixa a palavra no vão do layout, compensando a perspectiva da profundidade.
    root.position.set(slot.x * k, (slot.y - slot.h / 2) * k, z)
    root.scale.setScalar(cap * k)

    const count = letters.length
    const span = 1 + STAGGER * (count - 1)

    for (let i = 0; i < count; i++) {
      const pivot = pivots.current[i]
      if (!pivot) continue

      const rise = easeOutExpo(clamp(state.rise * span - i * STAGGER))
      const fall = easeInOutCubic(clamp(state.fall * span * 1.15 - (count - 1 - i) * STAGGER))

      // Proximidade da lâmpada (em px de tela): a letra recua levemente, como uma tecla.
      const letterX = slot.x + letters[i].x * cap
      const distance = Math.hypot(pointer.lampX - letterX, pointer.lampY - slot.y)
      const near = env.reducedMotion ? 0 : Math.exp(-Math.pow(distance / (cap * 0.75), 2)) * pointer.presence
      lean[i] = damp(lean[i], near, 6, dt)

      pivot.rotation.x = -(1 - rise) * HALF_PI - fall * 1.35 - lean[i] * 0.16
      pivot.position.z = -lean[i] * 0.07 - fall * 0.5
    }
  })

  return (
    <group ref={group} visible={false}>
      {letters.map((letter, index) => (
        <group
          key={index}
          position-x={letter.x}
          ref={(node) => {
            pivots.current[index] = node
          }}
        >
          <mesh geometry={letter.geometry} material={material} />
        </group>
      ))}
    </group>
  )
}
