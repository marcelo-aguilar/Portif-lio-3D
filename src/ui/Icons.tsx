/** Ícones em SVG: os glifos ✦ e ↗ não existem nas fontes carregadas. */
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

/** A centelha de quatro pontas — o glifo recorrente das referências. */
export const STAR_PATH =
  'M12 0C12.6 7 17 11.4 24 12C17 12.6 12.6 17 12 24C11.4 17 7 12.6 0 12C7 11.4 11.4 7 12 0Z'

export function Star(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d={STAR_PATH} />
    </svg>
  )
}

export function ArrowUpRight(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M4 12 12 4M5.5 4H12v6.5" />
    </svg>
  )
}

export function ArrowDown(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M8 2.5v11M3.5 9 8 13.5 12.5 9" />
    </svg>
  )
}

export function Close(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="m3 3 10 10M13 3 3 13" />
    </svg>
  )
}
