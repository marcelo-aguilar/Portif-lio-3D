import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, MeshStandardMaterial } from 'three'
import type { Mesh } from 'three'
import { env } from '../lib/env'
import { damp } from '../lib/math'
import { stage } from '../lib/stage'
import { getStarGeometry } from './geometry'
import { lamp } from './lampState'
import { COLORS } from './palette'
import { depthScale, view } from './view'

interface Spark {
  /** Posição na tela, em frações da meia-largura e da meia-altura. */
  x: number
  y: number
  /** Profundidade, em frações da distância do olho (positivo = à frente da janela). */
  z: number
  /** Tamanho, em frações da menor dimensão da tela. */
  size: number
  phase: number
}

/** Poucas, como nas referências: o glifo é um acento, não uma chuva de estrelas. */
const SPARKS: Spark[] = [
  { x: 0.58, y: 0.62, z: 0.22, size: 0.034, phase: 0.2 },
  { x: -0.12, y: -0.42, z: 0.3, size: 0.022, phase: 1.7 },
  { x: 0.84, y: -0.18, z: -0.12, size: 0.018, phase: 3.1 },
  { x: 0.22, y: 0.05, z: 0.36, size: 0.014, phase: 4.4 },
  { x: -0.62, y: 0.78, z: 0.16, size: 0.02, phase: 5.2 },
]

/** Na cena simplificada (celulares), três bastam. */
const ACTIVE = env.tier === 'high' ? SPARKS : SPARKS.slice(0, 3)

/**
 * Centelhas ✦ flutuando em profundidades diferentes. Giram devagar como
 * moedas; quando a lâmpada passa perto, ganham impulso e se afastam.
 */
export function Sparks() {
  const meshes = useRef<(Mesh | null)[]>([])
  const geometry = useMemo(() => getStarGeometry(), [])
  const material = useMemo(
    () => new MeshStandardMaterial({ color: new Color(COLORS.osso), roughness: 0.28, metalness: 0.35 }),
    [],
  )
  const sparks = ACTIVE
  const motion = useMemo(() => ACTIVE.map(() => ({ spin: 0, speed: 0, push: 0 })), [])

  useFrame((state, dt) => {
    const { w, h } = stage.viewport
    const { hero, intro } = stage
    const shown = hero.visible ? intro.letters * (1 - hero.progress) : 0
    const time = state.clock.elapsedTime
    const unit = Math.min(w, h)

    for (let i = 0; i < sparks.length; i++) {
      const mesh = meshes.current[i]
      if (!mesh) continue
      mesh.visible = shown > 0.01
      if (!mesh.visible) continue

      const spark = sparks[i]
      const item = motion[i]
      const z = spark.z * view.distance
      const k = depthScale(z)
      const screenX = spark.x * (w / 2)
      const screenY = spark.y * (h / 2)

      // Proximidade da lâmpada, medida na tela.
      const dx = screenX - lamp.screenX
      const dy = screenY - lamp.screenY
      const distance = Math.hypot(dx, dy)
      const near = env.reducedMotion ? 0 : Math.exp(-Math.pow(distance / (unit * 0.2), 2))

      item.speed = damp(item.speed, 0.35 + near * 7, near > 0.2 ? 6 : 1.1, dt)
      item.spin += item.speed * dt * (env.reducedMotion ? 0 : 1)
      item.push = damp(item.push, near, 5, dt)

      const away = item.push * unit * 0.05
      const bob = env.reducedMotion ? 0 : Math.sin(time * 0.5 + spark.phase) * unit * 0.008
      mesh.position.set(
        (screenX + (dx / (distance + 1)) * away) * k,
        (screenY + (dy / (distance + 1)) * away + bob) * k,
        z,
      )
      mesh.rotation.set(Math.sin(time * 0.3 + spark.phase) * 0.25, spark.phase + item.spin, 0)
      mesh.scale.setScalar(spark.size * unit * k * (0.4 + 0.6 * shown) * (1 + item.push * 0.25))
    }
  })

  return (
    <>
      {sparks.map((_, index) => (
        <mesh
          key={index}
          geometry={geometry}
          material={material}
          visible={false}
          renderOrder={4}
          ref={(node) => {
            meshes.current[index] = node
          }}
        />
      ))}
    </>
  )
}
