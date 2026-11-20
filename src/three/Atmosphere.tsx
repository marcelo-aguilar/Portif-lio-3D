import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial, Vector2, Vector3 } from 'three'
import type { Mesh, Points } from 'three'
import { env } from '../lib/env'
import { damp, seeded, smoothstep } from '../lib/math'
import { stage } from '../lib/stage'
import { lamp } from './lampState'
import { COLORS } from './palette'
import { depthScale, underScreenPoint, view } from './view'

/* ------------------------------------------------------------------ */
/* Clarão de fundo                                                     */
/* ------------------------------------------------------------------ */

const glowVertex = /* glsl */ `
  varying vec2 vPlane;
  void main() {
    vPlane = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const glowFragment = /* glsl */ `
  uniform vec2 uCenter;
  uniform vec2 uLamp;
  uniform float uRadius;
  uniform float uStrength;
  uniform vec3 uDeep;
  uniform vec3 uHot;

  varying vec2 vPlane;

  // Ruído de pontilhado: evita faixas visíveis em degradês muito escuros.
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 uv = vPlane; // já em unidades de "meia altura de tela"
    float wide = exp(-pow(length((uv - uCenter) * vec2(0.72, 1.0)) / uRadius, 2.0));
    float core = exp(-pow(length(uv - uCenter) / (uRadius * 0.42), 2.0));
    float near = exp(-pow(length(uv - uLamp) / 0.5, 2.0));

    vec3 color = uDeep * wide * 0.7 + uHot * (core * 0.13 + near * 0.05);
    color *= uStrength;
    color += (hash(gl_FragCoord.xy) - 0.5) / 255.0;

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`

/**
 * Clarão carmim no fundo da cena. Viaja de um palco a outro conforme a
 * rolagem: atrás do sobrenome no herói, atrás das telas nos projetos, no
 * centro das órbitas e, por fim, de volta atrás do sobrenome.
 */
export function Glow() {
  const mesh = useRef<Mesh>(null)
  const size = useThree((state) => state.size)
  const current = useRef({ x: 0, y: 0, strength: 0, radius: 0.9 })

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: glowVertex,
        fragmentShader: glowFragment,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uCenter: { value: new Vector2() },
          uLamp: { value: new Vector2() },
          uRadius: { value: 0.9 },
          uStrength: { value: 0 },
          uDeep: { value: new Color(COLORS.vinho) },
          uHot: { value: new Color(COLORS.carmim) },
        },
      }),
    [],
  )

  useFrame((_, dt) => {
    const object = mesh.current
    if (!object) return
    const half = stage.viewport.h / 2
    const { hero, deck, orbit, finale, intro } = stage

    // Alvo do clarão: o palco que estiver na tela.
    let x = 0
    let y = 0
    let strength = 0
    let radius = 0.9
    if (hero.visible) {
      x = hero.word.x * 0.55
      y = hero.word.y
      strength = intro.glow * (1 - smoothstep(0.15, 0.9, hero.progress))
      radius = 0.78
    } else if (finale.visible) {
      x = finale.word.x
      y = finale.word.y
      strength = smoothstep(0.1, 0.9, finale.reveal) * 0.95
      radius = 0.8
    } else if (orbit.visible) {
      x = orbit.slot.x
      y = orbit.slot.y
      strength = 0.55
      radius = 0.75
    } else if (deck.visible) {
      x = deck.slot.x
      y = deck.slot.y
      strength = 0.5
      radius = 0.85
    }

    const state = current.current
    const speed = env.reducedMotion ? 60 : 2.4
    state.x = damp(state.x, x / half, speed, dt)
    state.y = damp(state.y, y / half, speed, dt)
    state.strength = damp(state.strength, strength, speed, dt)
    state.radius = damp(state.radius, radius, speed, dt)

    // Plano bem ao fundo, grande o bastante para cobrir a janela com folga.
    const z = -view.distance * 1.1
    const k = depthScale(z)
    object.position.set(0, 0, z)
    object.scale.set(half * k, half * k, 1)

    const uniforms = material.uniforms
    ;(uniforms.uCenter.value as Vector2).set(state.x, state.y)
    ;(uniforms.uLamp.value as Vector2).set(lamp.screenX / half, lamp.screenY / half)
    uniforms.uRadius.value = state.radius
    uniforms.uStrength.value = state.strength
  })

  // Em unidades de meia altura: cobre a largura da tela e a margem do paralaxe.
  const aspect = size.width / Math.max(size.height, 1)
  return (
    <mesh ref={mesh} material={material} renderOrder={-10} frustumCulled={false}>
      <planeGeometry args={[(aspect + 0.6) * 2.6, 5.2]} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/* Poeira                                                              */
/* ------------------------------------------------------------------ */

const dustVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uDistance;
  uniform vec3 uBox;
  uniform float uOffsetZ;
  uniform vec3 uLamp;
  uniform float uLampRadius;

  attribute vec4 aSeed;

  varying float vLight;

  void main() {
    // A geometria é uma caixa unitária; uBox (meia-caixa, em px) dá a escala real.
    vec3 p = position * uBox;

    // Deriva lenta para cima, com balanço lateral; a caixa se repete verticalmente.
    p.y = mod(p.y + uTime * (5.0 + aSeed.x * 11.0) + uBox.y, uBox.y * 2.0) - uBox.y;
    p.x += sin(uTime * (0.12 + aSeed.y * 0.2) + aSeed.z * 6.2832) * 22.0;
    p.z += cos(uTime * (0.1 + aSeed.x * 0.15) + aSeed.w * 6.2832) * 18.0 + uOffsetZ;

    // Só a poeira dentro do facho da lâmpada aparece: é ela que dá volume à luz.
    float lit = exp(-pow(length(p - uLamp) / uLampRadius, 2.0));
    vLight = lit * (0.35 + 0.65 * aSeed.w);

    vec4 mv = viewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.6 + aSeed.y * 3.4) * uPixelRatio * (uDistance / -mv.z);
  }
`

const dustFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  varying float vLight;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float disc = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(uColor * disc * vLight * uStrength, 1.0);
    #include <colorspace_fragment>
  }
`

/** Poeira em suspensão: visível apenas onde a lâmpada alcança. */
export function Dust() {
  const points = useRef<Points>(null)
  const gl = useThree((state) => state.gl)
  const count = env.tier === 'high' ? 420 : 150

  const geometry = useMemo(() => {
    const random = seeded(7)
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) {
      // Caixa unitária; a escala real (px) vem dos uniformes a cada quadro.
      positions[i * 3] = random() * 2 - 1
      positions[i * 3 + 1] = random() * 2 - 1
      positions[i * 3 + 2] = random() * 2 - 1
      for (let j = 0; j < 4; j++) seeds[i * 4 + j] = random()
    }
    const buffer = new BufferGeometry()
    buffer.setAttribute('position', new BufferAttribute(positions, 3))
    buffer.setAttribute('aSeed', new BufferAttribute(seeds, 4))
    return buffer
  }, [count])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: dustVertex,
        fragmentShader: dustFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uDistance: { value: 1000 },
          uBox: { value: new Vector3(1, 1, 1) },
          uOffsetZ: { value: 0 },
          uLamp: { value: new Vector3() },
          uLampRadius: { value: 300 },
          uColor: { value: new Color(COLORS.areia) },
          uStrength: { value: 0 },
        },
      }),
    [],
  )

  useFrame((state) => {
    if (!points.current) return
    const { w, h } = stage.viewport
    const depth = view.distance * 0.5
    const uniforms = material.uniforms

    uniforms.uTime.value = env.reducedMotion ? 0 : state.clock.elapsedTime
    uniforms.uPixelRatio.value = gl.getPixelRatio()
    uniforms.uDistance.value = view.distance
    uniforms.uStrength.value = lamp.strength * 0.9
    uniforms.uOffsetZ.value = -depth * 0.25
    uniforms.uLampRadius.value = Math.min(w, h) * 0.34
    ;(uniforms.uBox.value as Vector3).set(w * 0.62, h * 0.62, depth)
    underScreenPoint(uniforms.uLamp.value as Vector3, lamp.screenX, lamp.screenY, view.distance * 0.08)
  })

  return <points ref={points} geometry={geometry} material={material} renderOrder={5} frustumCulled={false} />
}
