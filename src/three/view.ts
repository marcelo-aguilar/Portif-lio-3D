/**
 * A "janela": estado da câmera compartilhado entre os objetos da cena.
 *
 * A tela é tratada como uma janela física no plano z = 0, com 1 unidade de
 * mundo = 1 px de CSS e origem no centro da área visível. O olho fica a
 * `distance` px da janela e se desloca com o ponteiro. Tudo que está em z = 0
 * permanece cravado na tela; o que está atrás ou à frente ganha paralaxe real.
 */
import type { Vector3 } from 'three'

export const view = {
  /** Distância do olho à janela, em px. */
  distance: 1000,
  eyeX: 0,
  eyeY: 0,
}

/** Fator de perspectiva na profundidade z (1 em z = 0, maior para trás). */
export const depthScale = (z: number) => (view.distance - z) / view.distance

/**
 * Posição de mundo que aparece no ponto de tela (x, y) quando o olho está
 * centrado. Use com `depthScale(z)` na escala para o objeto preencher o vão
 * do layout mesmo estando em outra profundidade.
 */
export function placeAtDepth(target: Vector3, x: number, y: number, z: number) {
  const k = depthScale(z)
  return target.set(x * k, y * k, z)
}

/** Posição de mundo, na profundidade z, sob o ponto de tela (x, y) para o olho atual. */
export function underScreenPoint(target: Vector3, x: number, y: number, z: number) {
  const k = depthScale(z)
  return target.set(view.eyeX + (x - view.eyeX) * k, view.eyeY + (y - view.eyeY) * k, z)
}
