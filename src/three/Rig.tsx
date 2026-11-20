import { useFrame, useThree } from '@react-three/fiber'
import type { PerspectiveCamera } from 'three'
import { env } from '../lib/env'
import { pointer } from '../lib/pointer'
import { stage } from '../lib/stage'
import { view } from './view'

/**
 * Câmera de projeção fora do eixo ("off-axis").
 *
 * Em vez de girar a câmera, o olho se desloca e o tronco de visão é
 * recalculado para que a janela (plano z = 0) continue coincidindo com a
 * tela. É o que dá a sensação de olhar através de uma vitrine: o retrato
 * fica registrado com o layout e as outras camadas deslizam em profundidade.
 */
export function Rig() {
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const size = useThree((state) => state.size)

  useFrame(() => {
    const width = size.width
    const canvasHeight = size.height
    const visibleHeight = stage.viewport.h

    const distance = Math.hypot(width, visibleHeight) * 0.72
    const amount = env.reducedMotion ? 0 : 1
    const eyeX = pointer.eyeX * width * 0.06 * amount
    const eyeY = pointer.eyeY * visibleHeight * 0.055 * amount

    view.distance = distance
    view.eyeX = eyeX
    view.eyeY = eyeY

    camera.position.set(eyeX, eyeY, distance)
    camera.quaternion.identity()
    camera.updateMatrixWorld()

    // A origem é o centro da área visível; em celulares o canvas pode ser mais
    // alto que ela (barra de endereço recolhível), daí o limite inferior próprio.
    const near = distance * 0.04
    const far = distance * 7
    const k = near / distance
    const top = visibleHeight / 2
    const bottom = visibleHeight / 2 - canvasHeight

    camera.projectionMatrix.makePerspective(
      (-width / 2 - eyeX) * k,
      (width / 2 - eyeX) * k,
      (top - eyeY) * k,
      (bottom - eyeY) * k,
      near,
      far,
    )
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
  }, -10)

  return null
}
