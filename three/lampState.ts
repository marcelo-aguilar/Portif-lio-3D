/**
 * A lâmpada do visitante, do ponto de vista da cena: posição de tela
 * suavizada (px a partir do centro, Y para cima) e intensidade atual.
 * Atualizada uma vez por quadro pelo componente <Lamp>.
 */
export const lamp = {
  screenX: 0,
  screenY: 0,
  /** 0..1 — cresce na abertura; nunca chega a zero no piloto automático. */
  strength: 0,
}
