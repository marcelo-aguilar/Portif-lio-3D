import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { PointLight } from 'three'
import { pointer } from '../lib/pointer'
import { stage } from '../lib/stage'
import { FINALE_DEPTH, HERO_DEPTH_BACK, HERO_DEPTH_FRONT } from './depths'
import { lamp } from './lampState'
import { COLORS } from './palette'
import { underScreenPoint, view } from './view'

/**
 * A luz do cursor.
 *
 * Um ponto de luz real que acompanha o ponteiro e ilumina as letras, as
 * centelhas e a estrela central. A intensidade é recalculada pela altura da
 * lâmpada sobre a cena, para que o efeito seja o mesmo em qualquer tamanho
 * de tela (a cena é medida em pixels).
 */
export function Lamp() {
  const light = useRef<PointLight>(null)

  useFrame(() => {
    lamp.screenX = pointer.lampX
    lamp.screenY = pointer.lampY
    lamp.strength = stage.intro.lamp * (0.72 + 0.28 * pointer.presence)

    const point = light.current
    if (!point) return

    // Fica à frente do plano das letras do palco que estiver na tela.
    const { hero, finale, orbit } = stage
    let surface = 0
    let reach = view.distance * 0.3
    if (hero.visible) {
      surface = hero.word.h * (hero.wordInFront ? HERO_DEPTH_FRONT : HERO_DEPTH_BACK)
      reach = hero.word.h * 0.9
    } else if (finale.visible) {
      surface = finale.word.h * FINALE_DEPTH
      reach = finale.word.h * 0.85
    } else if (orbit.visible) {
      reach = orbit.slot.w * 0.3
    }
    reach = Math.max(reach, 60)

    underScreenPoint(point.position, lamp.screenX, lamp.screenY, surface + reach)
    // Irradiância constante logo abaixo da lâmpada: I = E · d².
    point.intensity = 2.5 * reach * reach * lamp.strength
  })

  return (
    <>
      <ambientLight intensity={1.25} />
      <directionalLight position={[-0.5, 0.8, 1]} intensity={0.6} color={COLORS.osso} />
      <pointLight ref={light} color="#ffe6d6" decay={2} distance={0} intensity={0} />
    </>
  )
}
