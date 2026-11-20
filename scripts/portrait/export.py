"""
Exporta os assets de imagem do portfólio a partir do recorte gerado por matte.py.

  retrato.webp        cor + alfa (textura do relevo 3D e alternativa sem WebGL)
  retrato-geo.webp    R,G = normal (x,y) · B = profundidade — relevo e re-iluminação
  pitch.webp          recorte da foto do pitch (seção Sobre)
  <projeto>.webp      capturas das aplicações (seção Projetos)

Uso: python export.py <pasta com alpha.npy/clean.npy> <raiz do projeto>
"""
import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

work, root = sys.argv[1], sys.argv[2]
alpha = np.load(f"{work}/alpha.npy")
clean = np.load(f"{work}/clean.npy")
H, W = alpha.shape
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

def sstep(a, b, v):
    t = np.clip((v - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)

def blob(cx, cy, sx, sy):
    return np.exp(-(((xx - cx) / sx) ** 2 + ((yy - cy) / sy) ** 2) / 2)

# ---------- retrato (cor + alfa) ----------
# Descontaminação: nos pixels de borda (alfa parcial) a cor vem do interior da
# silhueta, propagada para fora — elimina o filete claro do cenário original.
interior = (alpha > 0.985).astype(np.float32)
spread = np.stack([ndi.gaussian_filter(clean[..., c] * interior, 3.0) for c in range(3)], -1)
spread /= np.maximum(ndi.gaussian_filter(interior, 3.0)[..., None], 1e-3)
edge_mix = np.clip((0.985 - alpha) / 0.25, 0, 1)[..., None] * (ndi.gaussian_filter(interior, 3.0)[..., None] > 0.02)
clean = clean * (1 - edge_mix) + spread * edge_mix
# borda do corpo meio pixel para dentro
alpha = np.clip((alpha - 0.12) / 0.88, 0, 1)
rgba = np.dstack([clean, alpha])
Image.fromarray((np.clip(rgba, 0, 1) * 255).astype(np.uint8), "RGBA").save(
    f"{root}/src/assets/portrait/retrato.webp", quality=88, alpha_quality=92, method=6, exact=False)

# ---------- relevo ----------
# Profundidade "esculpida": volume inflado a partir do contorno + massas do rosto.
# A foto foi feita de cima: testa e cabelo estão mais perto da câmera que o tronco.
solid = np.pad(alpha > 0.5, 64, mode="edge")
sd = ndi.distance_transform_edt(solid)[64:-64, 64:-64]
dome = 1 - np.exp(-sd / 70.0)
lum = clean @ np.array([0.299, 0.587, 0.114], np.float32)

depth = (
    0.42 * dome
    + 0.30 * blob(205, 735, 215, 255)      # massa do rosto
    + 0.17 * blob(150, 778, 40, 62)        # nariz
    + 0.07 * blob(170, 880, 60, 34)        # boca
    + 0.08 * blob(215, 590, 175, 80)       # testa
    + 0.30 * blob(275, 285, 265, 225)      # volume do cabelo
    + 0.10 * blob(560, 880, 210, 150)      # gola do capuz
    - 0.24 * sstep(1000, 1672, yy)         # tronco recua
)
depth = ndi.gaussian_filter(depth, 5)
micro = np.clip(ndi.gaussian_filter(lum, 2.0) - ndi.gaussian_filter(lum, 16.0), -0.2, 0.2)
depth = depth + 0.10 * micro
depth = np.clip(depth, 0, None)
depth *= ndi.gaussian_filter(np.clip(alpha * 1.2, 0, 1), 3)   # o contorno encosta no plano
depth /= depth.max()

# Normais: relevo real (amplitude ≈ 20% da largura) + microdetalhe da luminância,
# que faz cada cacho e cada dobra do tecido reagirem à luz.
AMPLITUDE = 0.20 * W
gy, gx = np.gradient(ndi.gaussian_filter(depth, 1.5) * AMPLITUDE)
fy, fx = np.gradient(ndi.gaussian_filter(lum, 1.3) * 26.0)
nx, ny = -(gx + fx), (gy + fy)
nz = np.ones_like(nx)
length = np.sqrt(nx * nx + ny * ny + nz * nz)
geo = np.dstack([nx / length * 0.5 + 0.5, ny / length * 0.5 + 0.5, depth])
# Fora da silhueta o mapa fica neutro: nada a iluminar e o arquivo encolhe bastante.
inside = ndi.binary_dilation(alpha > 0.01, iterations=6)[..., None]
geo = np.where(inside, geo, np.array([0.5, 0.5, 0.0], np.float32))
geo_img = Image.fromarray((np.clip(geo, 0, 1) * 255).astype(np.uint8), "RGB").resize((512, round(512 * H / W)), Image.LANCZOS)
geo_img.save(f"{root}/src/assets/portrait/retrato-geo.webp", lossless=True, method=6)

# ---------- foto do pitch ----------
pitch = Image.open(f"{root}/imagens/eu-apresentando-pitch.png").convert("RGB")
pitch = pitch.crop((340, 170, 800, 1000))                    # enquadra só o Marcelo
pitch = pitch.resize((pitch.width * 2, pitch.height * 2), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2.2, 55, 2))
pitch.save(f"{root}/src/assets/about/pitch.webp", quality=84, method=6)

# ---------- capturas dos projetos (16:10) ----------
def shot(name, src, box, out=(1280, 800)):
    im = Image.open(f"{root}/scripts/capturas/{src}").convert("RGB").crop(box)
    im = im.resize(out, Image.LANCZOS)
    im.save(f"{root}/src/assets/projects/{name}.webp", quality=86, method=6)
    return im.size

print("stamina    ", shot("stamina", "screenshot-1794356438106-0.jpg", (68, 0, 1388, 825)))
print("predidiesel", shot("predidiesel", "screenshot-1794356465032-1.jpg", (150, 0, 1449, 812)))
print("timerush   ", shot("timerush", "screenshot-1794356480774-4.jpg", (334, 157, 1129, 654)))

# ---------- prévia para conferência ----------
g = np.clip((lum - 0.03) * 1.2, 0, 1)
key = np.array([0.72, 0.5, 0.52]); key /= np.linalg.norm(key)
n3 = np.dstack([nx / length, ny / length, nz / length])
relit = np.clip(n3 @ key, 0, 1)
sim = np.dstack([g * 0.75 + relit * g * 0.9, g * 0.75 + relit * g * 0.08, g * 0.75 + relit * g * 0.12])
bgc = np.array([0.03, 0.015, 0.02])
sim = sim * alpha[..., None] + bgc * (1 - alpha[..., None])
sheet = np.concatenate([np.dstack([depth] * 3), geo, sim], axis=1)
im = Image.fromarray((np.clip(sheet, 0, 1) * 255).astype(np.uint8)); im.thumbnail((1700, 1100)); im.save(f"{work}/prev_geo.jpg", quality=88)
