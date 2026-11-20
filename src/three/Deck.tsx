import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { Color, ShaderMaterial, SRGBColorSpace, TextureLoader, Vector2, Vector3 } from 'three'
import type { Mesh, Texture } from 'three'
import { projects } from '../content/projects'
import { env } from '../lib/env'
import { damp } from '../lib/math'
import { stage } from '../lib/stage'
import { lamp } from './lampState'
import { COLORS } from './palette'
import { underScreenPoint } from './view'

const ASPECT = 16 / 10

const vertexShader = /* glsl */ `
  uniform float uBend;

  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    // Curvatura cilíndrica suave: a tela é um objeto, não um adesivo.
    vec3 p = position;
    float angle = p.x * uBend;
    p.z -= p.x * p.x * uBend * 0.5;
    vec3 normal = normalize(vec3(sin(angle), 0.0, cos(angle)));

    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2 uSize;
  uniform float uActive;
  uniform float uOpacity;
  uniform float uHover;
  uniform vec3 uLamp;
  uniform float uLampRadius;
  uniform float uLampStrength;
  uniform vec3 uTint;
  uniform vec3 uFrame;

  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vNormal;

  float roundedBox(vec2 p, vec2 halfSize, float radius) {
    vec2 q = abs(p) - halfSize + radius;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  }

  void main() {
    // Cantos arredondados e moldura, calculados em pixels.
    vec2 p = (vUv - 0.5) * uSize;
    float radius = uSize.y * 0.028;
    float box = roundedBox(p, uSize * 0.5, radius);
    float aa = fwidth(box);
    float inside = 1.0 - smoothstep(-aa, 0.0, box);
    float border = 1.0 - smoothstep(0.0, aa * 1.5, abs(box + 1.4) - 0.7);

    vec3 texel = texture2D(uMap, vUv).rgb;
    float luma = dot(texel, vec3(0.2126, 0.7152, 0.0722));

    // As telas na fila ficam dessaturadas e tingidas; a ativa mostra as cores reais do projeto.
    vec3 resting = mix(vec3(luma), uTint * (0.25 + luma * 1.6), 0.45) * 0.42;
    vec3 color = mix(resting, texel, uActive);

    // Reflexo da lâmpada: um brilho especular que percorre o vidro curvo.
    vec3 toLamp = uLamp - vWorld;
    float distanceToLamp = length(toLamp);
    vec3 lightDirection = toLamp / distanceToLamp;
    vec3 viewDirection = normalize(cameraPosition - vWorld);
    float specular = pow(max(dot(vNormal, normalize(lightDirection + viewDirection)), 0.0), 220.0);
    float falloff = 1.0 / (1.0 + pow(distanceToLamp / uLampRadius, 2.0));
    // Discreto de propósito: o reflexo não pode atrapalhar a leitura da tela.
    color += uFrame * specular * 0.1 * uLampStrength * (0.4 + uActive * 0.6);
    color *= 0.92 + falloff * 0.1 * uLampStrength + uHover * 0.05;

    color = mix(color, uFrame, border * (0.2 + uActive * 0.3 + uHover * 0.35));

    gl_FragColor = vec4(color, inside * uOpacity);
    #include <colorspace_fragment>
  }
`

interface Pose {
  x: number
  y: number
  z: number
  rotY: number
  rotX: number
  opacity: number
  active: number
}

/**
 * Pose de cada tela conforme sua distância da ativa:
 *   0  → em primeiro plano; 1, 2 → fila ao fundo;  negativos → já passaram pelo espectador.
 * x/y em frações da largura/altura da tela ativa; z em frações da largura.
 */
function poseFor(offset: number): Pose {
  if (offset === 0) return { x: 0, y: 0, z: 0.05, rotY: -0.2, rotX: 0.03, opacity: 1, active: 1 }
  if (offset > 0) {
    return {
      x: 0.2 * offset,
      y: 0.3 * offset,
      z: -0.55 * offset,
      rotY: -0.36 - 0.05 * offset,
      rotX: 0.05,
      opacity: Math.max(0.72 - 0.26 * (offset - 1), 0),
      active: 0,
    }
  }
  return { x: -0.5, y: -0.06, z: 0.8, rotY: 0.8, rotX: -0.04, opacity: 0, active: 0 }
}

/**
 * Baralho de projetos: três telas em profundidade. A rolagem promove a
 * próxima tela ao primeiro plano enquanto a anterior passa pelo espectador;
 * a ativa se inclina na direção do cursor e reflete a lâmpada.
 */
export function Deck() {
  const urls = useMemo(() => projects.map((project) => project.image), [])
  const textures = useLoader(TextureLoader, urls) as Texture[]
  const gl = useThree((state) => state.gl)
  const meshes = useRef<(Mesh | null)[]>([])
  const poses = useMemo<Pose[]>(() => projects.map((_, index) => ({ ...poseFor(index) })), [])
  const hover = useRef(0)
  const lampWorld = useMemo(() => new Vector3(), [])

  useLayoutEffect(() => {
    const anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    for (const texture of textures) {
      texture.colorSpace = SRGBColorSpace
      texture.anisotropy = anisotropy
      texture.needsUpdate = true
    }
  }, [textures, gl])

  const materials = useMemo(
    () =>
      textures.map(
        (texture) =>
          new ShaderMaterial({
            vertexShader,
            fragmentShader,
            transparent: true,
            depthWrite: false,
            uniforms: {
              uMap: { value: texture },
              uSize: { value: new Vector2(1, 1) },
              uBend: { value: 0.0006 },
              uActive: { value: 0 },
              uOpacity: { value: 0 },
              uHover: { value: 0 },
              uLamp: { value: new Vector3() },
              uLampRadius: { value: 400 },
              uLampStrength: { value: 0 },
              uTint: { value: new Color(COLORS.carmim) },
              uFrame: { value: new Color(COLORS.osso) },
            },
          }),
      ),
    [textures],
  )

  useFrame((state, dt) => {
    const { deck } = stage
    const slot = deck.slot
    const show = deck.visible && slot.w > 0

    // Tamanho da tela ativa: cabe no palco com folga para a fila ao fundo.
    const width = Math.min(slot.w * 0.74, slot.h * 0.6 * ASPECT)
    const height = width / ASPECT
    const centerX = slot.x - slot.w * 0.06
    const centerY = slot.y - slot.h * 0.04
    const speed = env.reducedMotion ? 60 : 4.2
    const time = state.clock.elapsedTime

    hover.current = damp(hover.current, deck.hover, 7, dt)

    for (let i = 0; i < materials.length; i++) {
      const mesh = meshes.current[i]
      if (!mesh) continue

      const target = poseFor(i - deck.active)
      const pose = poses[i]
      pose.x = damp(pose.x, target.x, speed, dt)
      pose.y = damp(pose.y, target.y, speed, dt)
      pose.z = damp(pose.z, target.z, speed, dt)
      pose.rotY = damp(pose.rotY, target.rotY, speed, dt)
      pose.rotX = damp(pose.rotX, target.rotX, speed, dt)
      // A tela que sai some depressa, antes de cruzar a coluna de texto.
      pose.opacity = damp(pose.opacity, target.opacity, target.opacity < pose.opacity ? speed * 2.6 : speed * 1.3, dt)
      pose.active = damp(pose.active, target.active, speed, dt)

      mesh.visible = show && pose.opacity > 0.01
      if (!mesh.visible) continue

      // A tela ativa flutua e se inclina na direção do cursor.
      const focus = pose.active
      const float = env.reducedMotion ? 0 : Math.sin(time * 0.7 + i) * height * 0.012 * focus
      const tiltY = ((lamp.screenX - centerX) / width) * 0.2 * focus
      const tiltX = (-(lamp.screenY - centerY) / height) * 0.14 * focus
      const lift = hover.current * focus

      mesh.position.set(
        centerX + pose.x * width,
        centerY + pose.y * height + float,
        (pose.z + lift * 0.07) * width,
      )
      mesh.rotation.set(pose.rotX + tiltX, pose.rotY + tiltY, 0)
      mesh.scale.set(width, height, width)
      mesh.renderOrder = 10 + Math.round(pose.z * 10)

      const uniforms = materials[i].uniforms
      ;(uniforms.uSize.value as Vector2).set(width, height)
      uniforms.uBend.value = 0.55 // em unidades locais (a malha tem largura 1)
      uniforms.uActive.value = pose.active
      uniforms.uOpacity.value = pose.opacity
      uniforms.uHover.value = lift
      uniforms.uLampRadius.value = width * 0.7
      uniforms.uLampStrength.value = lamp.strength
      underScreenPoint(lampWorld, lamp.screenX, lamp.screenY, width * 0.55)
      ;(uniforms.uLamp.value as Vector3).copy(lampWorld)
    }
  })

  return (
    <>
      {materials.map((material, index) => (
        <mesh
          key={index}
          material={material}
          visible={false}
          frustumCulled={false}
          ref={(node) => {
            meshes.current[index] = node
          }}
        >
          <planeGeometry args={[1, 1, 32, 1]} />
        </mesh>
      ))}
    </>
  )
}
