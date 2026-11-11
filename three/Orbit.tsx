import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Euler,
  InstancedBufferAttribute,
  LinearFilter,
  LineBasicMaterial,
  Matrix4,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
} from 'three'
import type { Group, InstancedMesh, LineLoop, Mesh } from 'three'
import { skillGroups } from '../content/skills'
import { env } from '../lib/env'
import { damp, smoothstep } from '../lib/math'
import { stage } from '../lib/stage'
import { getStarGeometry } from './geometry'
import { COLORS } from './palette'

/* ------------------------------------------------------------------ */
/* Disposição das órbitas                                              */
/* ------------------------------------------------------------------ */

/**
 * Do centro para fora, em ordem crescente de itens: a órbita maior comporta
 * o grupo maior. Cada órbita tem inclinação, raio e sentido próprios.
 */
const RING_LAYOUT = [
  { radius: 0.4, tilt: [1.02, 0.0, 0.5], speed: 0.16 },
  { radius: 0.6, tilt: [1.18, 0.0, -0.46], speed: -0.11 },
  { radius: 0.8, tilt: [0.92, 0.0, 0.22], speed: 0.085 },
  { radius: 1.0, tilt: [1.08, 0.0, -0.26], speed: -0.06 },
] as const

/** Índice do grupo (ordem do conteúdo) → órbita, da menor lista para a maior. */
const groupsBySize = skillGroups
  .map((group, index) => ({ index, count: group.items.length }))
  .sort((a, b) => a.count - b.count)

interface Label {
  text: string
  group: number
  ring: number
  angle: number
}

const labels: Label[] = groupsBySize.flatMap(({ index }, ring) =>
  skillGroups[index].items.map((text, i, items) => ({
    text: text.toUpperCase(),
    group: index,
    ring,
    angle: (i / items.length) * Math.PI * 2 + ring * 0.7,
  })),
)

/* ------------------------------------------------------------------ */
/* Atlas de rótulos (canvas 2D → textura)                              */
/* ------------------------------------------------------------------ */

const CELL_W = 512
const CELL_H = 80
const COLUMNS = 4
const FONT_PX = 52

interface Atlas {
  texture: CanvasTexture
  /** Por rótulo: [u, v, largura (px da célula)]. */
  cells: { u: number; v: number; width: number }[]
  rows: number
}

function buildAtlas(): Atlas {
  const rows = Math.ceil(labels.length / COLUMNS)
  const canvas = document.createElement('canvas')
  canvas.width = CELL_W * COLUMNS
  canvas.height = CELL_H * rows
  const context = canvas.getContext('2d')!
  context.font = `400 ${FONT_PX}px Anton, "Arial Narrow", sans-serif`
  context.textBaseline = 'middle'
  context.fillStyle = '#fff'
  if ('letterSpacing' in context) (context as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '2px'

  const cells = labels.map((label, i) => {
    const column = i % COLUMNS
    const row = Math.floor(i / COLUMNS)
    const width = Math.min(Math.ceil(context.measureText(label.text).width) + 8, CELL_W)
    context.fillText(label.text, column * CELL_W + 4, row * CELL_H + CELL_H / 2 + 3, CELL_W - 8)
    return { u: column / COLUMNS, v: 1 - (row + 1) / rows, width }
  })

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.generateMipmaps = false
  return { texture, cells, rows }
}

const labelVertex = /* glsl */ `
  attribute vec4 aCell;   // u, v, largura da célula (0..1), nível de destaque
  attribute float aFade;

  varying vec2 vUv;
  varying float vGlow;
  varying float vFade;

  uniform vec2 uCellSize; // tamanho de uma célula no atlas (u, v)

  void main() {
    // O quadrilátero unitário é recortado para a largura real do texto.
    vUv = vec2(aCell.x + uv.x * aCell.z * uCellSize.x, aCell.y + uv.y * uCellSize.y);
    vGlow = aCell.w;
    vFade = aFade;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
  }
`

const labelFragment = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform vec3 uRest;
  uniform vec3 uLit;
  uniform float uOpacity;

  varying vec2 vUv;
  varying float vGlow;
  varying float vFade;

  void main() {
    float ink = texture2D(uAtlas, vUv).a;
    vec3 color = mix(uRest, uLit, vGlow);
    float alpha = ink * vFade * uOpacity * mix(0.55, 1.0, vGlow);
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`

/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

const helper = new Object3D()
const ringMatrix = new Matrix4()
const point = new Vector3()
const ringColor = new Color(COLORS.brasa)
/**
 * Habilidades como um sistema orbital: a centelha no centro, uma órbita por
 * grupo e os nomes percorrendo cada anel. O grupo em destaque acende em
 * carmim; arrastar gira o conjunto com inércia.
 */
export function Orbit() {
  const system = useRef<Group>(null)
  const star = useRef<Mesh>(null)
  const rings = useRef<(LineLoop | null)[]>([])
  const instances = useRef<InstancedMesh>(null)
  const [atlas, setAtlas] = useState<Atlas | null>(null)

  const glow = useMemo(() => skillGroups.map(() => 0), [])
  const phase = useRef(0)
  const appear = useRef(0)

  // O atlas só pode ser desenhado depois que a fonte Anton estiver disponível.
  useEffect(() => {
    let alive = true
    let built: Atlas | null = null
    document.fonts.load(`400 ${FONT_PX}px Anton`).then(() => {
      if (!alive) return
      built = buildAtlas()
      setAtlas(built)
      stage.dirty = true
    })
    return () => {
      alive = false
      built?.texture.dispose()
    }
  }, [])

  const ringGeometry = useMemo(() => {
    const segments = 160
    const positions = new Float32Array(segments * 3)
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      positions[i * 3] = Math.cos(angle)
      positions[i * 3 + 1] = Math.sin(angle)
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    return geometry
  }, [])

  const ringMaterials = useMemo(
    () => RING_LAYOUT.map(() => new LineBasicMaterial({ color: COLORS.osso, transparent: true, opacity: 0.16 })),
    [],
  )
  const ringEulers = useMemo(() => RING_LAYOUT.map((ring) => new Euler(ring.tilt[0], ring.tilt[1], ring.tilt[2])), [])

  const starGeometry = useMemo(() => getStarGeometry(), [])
  const starMaterial = useMemo(
    () => new MeshStandardMaterial({ color: new Color(COLORS.osso), roughness: 0.3, metalness: 0.3 }),
    [],
  )

  const labelGeometry = useMemo(() => {
    const geometry = new PlaneGeometry(1, 1)
    geometry.setAttribute('aCell', new InstancedBufferAttribute(new Float32Array(labels.length * 4), 4))
    geometry.setAttribute('aFade', new InstancedBufferAttribute(new Float32Array(labels.length), 1))
    return geometry
  }, [])

  const labelMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: labelVertex,
        fragmentShader: labelFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uAtlas: { value: null },
          uCellSize: { value: [1 / COLUMNS, 1] },
          uRest: { value: new Color(COLORS.areia) },
          uLit: { value: new Color(COLORS.osso) },
          uOpacity: { value: 0 },
        },
      }),
    [],
  )

  useEffect(() => {
    if (!atlas) return
    labelMaterial.uniforms.uAtlas.value = atlas.texture
    labelMaterial.uniforms.uCellSize.value = [1 / COLUMNS, 1 / atlas.rows]
    const cells = labelGeometry.getAttribute('aCell') as InstancedBufferAttribute
    atlas.cells.forEach((cell, i) => cells.setXYZW(i, cell.u, cell.v, cell.width / CELL_W, 0))
    cells.needsUpdate = true
  }, [atlas, labelGeometry, labelMaterial])

  useFrame((state, dt) => {
    const root = system.current
    if (!root) return
    const { orbit } = stage
    const slot = orbit.slot
    root.visible = orbit.visible && slot.w > 0
    if (instances.current) instances.current.visible = root.visible && atlas !== null
    if (!root.visible) {
      appear.current = 0 // a entrada recomeça quando a seção voltar para a tela
      return
    }

    const radius = Math.min(slot.w, slot.h) * 0.44
    const moving = env.reducedMotion ? 0 : 1

    // Surge quando a seção entra: evita que o sistema "deslize" com a rolagem.
    appear.current = damp(appear.current, 1, 2.2, dt)
    const shown = smoothstep(0, 1, appear.current)

    // Arraste com inércia + rotação lenta de repouso.
    if (!orbit.dragging) {
      orbit.spin += orbit.spinVelocity * dt
      orbit.spinVelocity = damp(orbit.spinVelocity, 0, 2.2, dt)
      orbit.tilt = damp(orbit.tilt, 0, 1.4, dt)
    }
    phase.current += dt * moving

    root.position.set(slot.x, slot.y, 0)
    root.rotation.set(-0.3 + orbit.tilt, orbit.spin + phase.current * 0.05, 0)
    root.scale.setScalar(radius * (0.86 + 0.14 * shown))
    root.updateMatrixWorld()

    // Destaque de cada grupo.
    for (let g = 0; g < glow.length; g++) {
      const target = orbit.active === g ? 1 : 0
      glow[g] = damp(glow[g], target, env.reducedMotion ? 60 : 6, dt)
    }
    const anyActive = orbit.active !== -1

    // Anéis.
    for (let r = 0; r < RING_LAYOUT.length; r++) {
      const ring = rings.current[r]
      if (!ring) continue
      const group = groupsBySize[r].index
      const material = ringMaterials[r]
      material.color.set(COLORS.osso).lerp(ringColor, glow[group])
      material.opacity = (0.15 + glow[group] * 0.75) * shown
    }

    // Centelha central.
    if (star.current) {
      star.current.rotation.y = phase.current * 0.6
      star.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4) * 0.15 * moving
      star.current.scale.setScalar(0.3 * shown)
    }

    // Rótulos: posição calculada em cada anel; sempre de frente para a janela.
    const mesh = instances.current
    if (!mesh || !atlas) return
    const cells = labelGeometry.getAttribute('aCell') as InstancedBufferAttribute
    const fades = labelGeometry.getAttribute('aFade') as InstancedBufferAttribute
    const textHeight = Math.max(radius * 0.066, 12)

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i]
      const layout = RING_LAYOUT[label.ring]
      const angle = label.angle + phase.current * layout.speed

      ringMatrix.makeRotationFromEuler(ringEulers[label.ring])
      point.set(Math.cos(angle) * layout.radius, Math.sin(angle) * layout.radius, 0)
      point.applyMatrix4(ringMatrix).applyMatrix4(root.matrixWorld)

      const lit = glow[label.group]
      // Profundidade relativa: o lado de trás recua em tamanho e em presença.
      const depth = (point.z / radius + 1) / 2
      const cellWidth = atlas.cells[i].width / CELL_W
      const height = textHeight * (0.82 + depth * 0.3) * (1 + lit * 0.12)

      helper.position.copy(point)
      helper.scale.set(height * (CELL_W / CELL_H) * cellWidth, height, 1)
      helper.updateMatrix()
      mesh.setMatrixAt(i, helper.matrix)

      cells.setW(i, lit)
      fades.setX(i, (0.3 + depth * 0.7) * (anyActive ? 0.2 + lit * 0.8 : 0.85))
    }
    mesh.instanceMatrix.needsUpdate = true
    cells.needsUpdate = true
    fades.needsUpdate = true
    labelMaterial.uniforms.uOpacity.value = shown
  })

  return (
    <>
      <group ref={system} visible={false}>
        <mesh ref={star} geometry={starGeometry} material={starMaterial} />
        {RING_LAYOUT.map((ring, index) => (
          <lineLoop
            key={index}
            geometry={ringGeometry}
            material={ringMaterials[index]}
            rotation={ringEulers[index]}
            scale={ring.radius}
            ref={(node) => {
              rings.current[index] = node as LineLoop | null
            }}
          />
        ))}
      </group>

      {/* Os rótulos ficam fora do grupo: são posicionados em coordenadas de mundo. */}
      <instancedMesh
        ref={instances}
        args={[labelGeometry, labelMaterial, labels.length]}
        frustumCulled={false}
        renderOrder={20}
        visible={false}
      />
    </>
  )
}
