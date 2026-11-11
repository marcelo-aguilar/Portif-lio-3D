import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { Color, LinearFilter, NoColorSpace, ShaderMaterial, SRGBColorSpace, TextureLoader, Vector3 } from 'three'
import type { Mesh } from 'three'
import geoUrl from '../assets/portrait/retrato-geo.webp'
import colorUrl from '../assets/portrait/retrato.webp'
import { env } from '../lib/env'
import { easeInOutCubic, smoothstep } from '../lib/math'
import { stage } from '../lib/stage'
import { COLORS } from './palette'
import { lamp } from './lampState'
import { view } from './view'

const vertexShader = /* glsl */ `
  uniform sampler2D uGeo;
  uniform float uRelief;
  uniform float uDistance;

  varying vec2 vUv;
  varying vec3 vWorld;

  void main() {
    vUv = uv;
    // O canal azul guarda a profundidade esculpida: o plano vira um baixo-relevo real.
    float depth = texture2D(uGeo, uv).b;
    float z = depth * uRelief;
    vec4 world = modelMatrix * vec4(position, 1.0);
    // O vértice avança ao longo do raio que sai do olho em repouso. Com o olho
    // centrado, a foto fica exatamente no enquadramento do layout (nada de nariz
    // ampliado ou rosto empurrado para fora da tela); o relevo só aparece como
    // paralaxe quando o visitante move o cursor.
    world.xy *= (uDistance - z) / uDistance;
    world.z += z;
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform sampler2D uGeo;
  uniform vec3 uLampPosition;
  uniform vec3 uLampColor;
  uniform vec3 uRimColor;
  uniform float uLamp;
  uniform float uLampRadius;
  uniform float uReveal;
  uniform float uDim;

  varying vec2 vUv;
  varying vec3 vWorld;

  void main() {
    vec4 texel = texture2D(uMap, vUv);
    vec3 geo = texture2D(uGeo, vUv).rgb;

    // Gradação: preto e branco de baixa chave, com um toque quente nas altas luzes.
    float luma = dot(texel.rgb, vec3(0.2126, 0.7152, 0.0722));
    // A curva preserva textura nas sombras (o moletom preto não vira um buraco).
    luma = min(pow(luma, 0.84) * 1.34, 1.0);
    luma = mix(luma, smoothstep(0.0, 1.0, luma), 0.55);
    vec3 base = luma * vec3(1.0, 0.955, 0.91);

    // Normal vinda do mapa (relevo + microdetalhe de cachos e tecido).
    vec3 normal = normalize(vec3(geo.rg * 2.0 - 1.0, 1.7));

    // A lâmpada do visitante re-ilumina a fotografia.
    vec3 toLamp = uLampPosition - vWorld;
    float distanceToLamp = length(toLamp);
    float diffuse = max(dot(normal, toLamp / distanceToLamp), 0.0);
    float falloff = 1.0 / (1.0 + pow(distanceToLamp / uLampRadius, 2.0));
    vec3 lampLight = uLampColor * diffuse * falloff * uLamp * (0.03 + luma * 1.1);

    // Contraluz carmim das letras: pega nas faces viradas para a direita, perto do contorno.
    // Filete fino: só a borda da silhueta voltada para as letras.
    float edge = (1.0 - smoothstep(0.0, 0.2, geo.b)) * texel.a;
    float rim = edge * smoothstep(0.0, 0.8, normal.x) * (0.3 + luma);
    vec3 color = base * 0.92 + lampLight + uRimColor * rim * 0.42 * uReveal;

    // As bordas cortadas pela foto (base e lateral direita) somem no escuro.
    float bottom = smoothstep(0.13, 0.46, vUv.y);
    float right = 1.0 - smoothstep(0.84, 1.0, vUv.x) * (1.0 - smoothstep(0.42, 0.62, vUv.y));
    // A foto original corta o rosto à esquerda: em vez de uma aresta reta,
    // a face se dissolve no escuro (estreito, para não apagar o olho).
    // Largura variável: estreita só na linha dos olhos (v ≈ 0,617 na foto) e larga
    // na bochecha, na testa e no cabelo. A borda vira uma sombra curva, não um corte reto.
    float eyeBand = 1.0 - smoothstep(0.02, 0.075, abs(vUv.y - 0.617));
    float reach = mix(0.17, 0.075, eyeBand);
    float left = smoothstep(0.0, reach, vUv.x);
    left *= left * (3.0 - 2.0 * left) * 0.35 + 0.65;
    float fade = bottom * right * left;

    color *= fade * uReveal * uDim;
    float alpha = texel.a * smoothstep(0.0, 0.18, fade) * smoothstep(0.0, 0.35, uReveal);

    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`

/**
 * O retrato: uma fotografia que virou baixo-relevo.
 * A malha é deslocada por um mapa de profundidade (paralaxe real ao mover o
 * olho) e o sombreador usa as normais do mesmo mapa para que a luz do cursor
 * modele rosto, cachos e tecido.
 */
export function Portrait() {
  const mesh = useRef<Mesh>(null)
  const [map, geo] = useLoader(TextureLoader, [colorUrl, geoUrl])

  useLayoutEffect(() => {
    map.colorSpace = SRGBColorSpace
    map.anisotropy = 4
    geo.colorSpace = NoColorSpace
    geo.minFilter = LinearFilter
    geo.generateMipmaps = false
    map.needsUpdate = geo.needsUpdate = true
  }, [map, geo])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uMap: { value: map },
          uGeo: { value: geo },
          uRelief: { value: 0 },
          uDistance: { value: 1000 },
          uLampPosition: { value: new Vector3() },
          uLampColor: { value: new Color(COLORS.brasa) },
          uRimColor: { value: new Color(COLORS.carmim) },
          uLamp: { value: 0 },
          uLampRadius: { value: 400 },
          uReveal: { value: 0 },
          uDim: { value: 1 },
        },
      }),
    [map, geo],
  )

  // Densidade da malha: mais vértices onde o relevo é visto de perto.
  const [segmentsX, segmentsY] = env.tier === 'high' ? [128, 228] : [72, 128]

  useFrame(() => {
    const object = mesh.current
    if (!object) return
    const { hero, intro } = stage
    const slot = hero.portrait
    object.visible = hero.visible && slot.w > 0 && intro.portrait > 0.001
    if (!object.visible) return

    object.position.set(slot.x, slot.y, 0)
    object.scale.set(slot.w, slot.h, 1)

    const uniforms = material.uniforms
    const emerge = easeInOutCubic(intro.portrait)
    const leave = smoothstep(0.05, 0.75, hero.progress)

    uniforms.uRelief.value = slot.w * 0.16 * emerge * (1 - leave * 0.6)
    uniforms.uDistance.value = view.distance
    uniforms.uReveal.value = intro.portrait
    uniforms.uDim.value = 1 - leave
    uniforms.uLamp.value = lamp.strength * 1.6
    uniforms.uLampRadius.value = slot.w * 0.5
    // A lâmpada paira um pouco à frente do relevo.
    ;(uniforms.uLampPosition.value as Vector3).set(lamp.screenX, lamp.screenY, slot.w * 0.5)
  })

  return (
    <mesh ref={mesh} material={material} renderOrder={2} visible={false} frustumCulled={false}>
      <planeGeometry args={[1, 1, segmentsX, segmentsY]} />
    </mesh>
  )
}
