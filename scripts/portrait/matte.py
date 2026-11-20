"""Reconstrói o alfa do retrato a partir das máscaras existentes (sem modelos pesados)."""
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi

old, out_dir = sys.argv[1], sys.argv[2]
from pathlib import Path
src = Path(__file__).resolve().parents[2] / "imagens" / "foto-perfil-blusapreta.png"
rgb = np.array(Image.open(src).convert("RGB")).astype(np.float32) / 255
ai = np.array(Image.open(f"{old}/proc/selfie_isnet.png").getchannel("A")).astype(np.float32) / 255
ah = np.array(Image.open(f"{old}/proc/selfie_human.png").getchannel("A")).astype(np.float32) / 255
H, W = ai.shape
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

def sstep(a, b, v):
    t = np.clip((v - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)

# ---- cor: o que claramente NÃO é cabelo ----
mx = rgb.max(-1); mn = rgb.min(-1)
val = mx
sat = (mx - mn) / np.maximum(mx, 1e-4)
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
green = sstep(0.008, 0.05, g - np.maximum(r, b))                      # agulhas da árvore
lights = sstep(0.32, 0.55, val) * sstep(0.22, 0.42, sat) + sstep(0.5, 0.75, val)  # luzes, piso, parede
redbow = sstep(0.2, 0.42, r - np.maximum(g, b)) * sstep(0.28, 0.45, val)          # laços vermelhos
scenery = np.clip(green + lights + redbow, 0, 1)

# ---- 1) suporte sólido ----
support = ndi.gaussian_filter(ai, 3.0) > 0.26
support &= ndi.gaussian_filter(ah, 2.0) > 0.35
support |= ai > 0.85                       # capuz/pescoço que o human_seg perde
support[40:1000, 0:2] = True               # o rosto sai do quadro pela esquerda
support[0:2, 0:250] = True                 # o cabelo sai do quadro por cima
support = ndi.binary_fill_holes(support)
support = ndi.binary_closing(support, iterations=4)
support = ndi.binary_fill_holes(support)

# restos de cenário colados ao contorno: ponta da árvore (topo) e enfeites (abaixo do queixo)
hard_scenery = ndi.binary_dilation(ndi.binary_opening(scenery > 0.5, iterations=1), iterations=3)
zone_top = (yy < 150) & (xx > 185) & (xx < 440)
support &= ~(zone_top & hard_scenery)
opened = ndi.binary_opening(support, structure=np.ones((3, 3), bool), iterations=7)
support = np.where(zone_top | (yy > 930), opened, support)

# Borda esquerda do moletom (abaixo do queixo): detectada linha a linha pela cor
# (tecido escuro e pouco saturado, ao contrário dos enfeites vermelhos e verdes)
# e depois suavizada, para um contorno contínuo e sem degraus.
CHIN_Y, BODY_X = 985, 330
INSIDE_X, MIN_X, MAX_X = 270, 168, 250        # x dentro do moletom e faixa plausível da borda
fabric = (val < 0.24) & (sat < 0.55) & (green < 0.3) & (redbow < 0.3)
fabric = ndi.binary_opening(fabric, iterations=1)
run = 24
edge_x = np.full(H, np.nan, np.float32)
for y in range(CHIN_Y, H):
    row = fabric[y, :INSIDE_X].astype(np.float32)
    # Caminha de dentro do moletom para fora: a borda é onde o tecido deixa de dominar.
    cumulative = np.concatenate([[0.0], np.cumsum(row)])
    for x in range(INSIDE_X - 1, run, -1):
        if (cumulative[x] - cumulative[x - run]) / run < 0.5:
            edge_x[y] = x - run / 2
            break
    else:
        edge_x[y] = MIN_X
rows = np.arange(CHIN_Y, H)
raw = np.clip(edge_x[rows], MIN_X, MAX_X)
filled = ndi.median_filter(raw, size=61, mode="nearest")
filled = ndi.gaussian_filter1d(filled, 12, mode="nearest")
if True:
    boundary = np.zeros(H, np.float32); boundary[rows] = filled
    blend = np.clip((yy - CHIN_Y) / 30.0, 0, 1)                     # entra suavemente sob o queixo
    body = (yy >= CHIN_Y) & (xx >= boundary[:, None] - 1) & (xx < BODY_X)
    region = (yy >= CHIN_Y) & (xx < BODY_X)
    support = np.where(region & (blend > 0.5), body | (support & (xx >= BODY_X)), support)
    print("moletom: borda x em", int(filled.min()), "a", int(filled.max()))

support[40:900, 0:2] = True
support[0:2, 0:185] = True
lab, n = ndi.label(support)
sizes = ndi.sum(support, lab, range(1, n + 1))
support = lab == (1 + int(np.argmax(sizes)))
support = ndi.binary_fill_holes(support)

# distância assinada até a borda (positiva por dentro); bordas do quadro contam como "dentro"
pad = np.pad(support, 64, mode="edge")
sd = (ndi.distance_transform_edt(pad) - ndi.distance_transform_edt(~pad))[64:-64, 64:-64]

# ---- 2) alfa ----
hairness = ndi.gaussian_filter(1 - scenery, 0.8)
hair_zone = sstep(700, 600, yy + (xx - 300) * 0.28)        # 1 no cabelo, 0 no corpo
hair_zone = ndi.gaussian_filter(hair_zone, 12)

a_body = np.clip(0.5 + sd / 2.6, 0, 1)                     # corpo: borda nítida

BAND_IN, BAND_OUT = 16.0, 20.0                              # cabelo: a borda segue os fios
profile = sstep(-BAND_OUT, BAND_IN, sd)
edge = profile * (0.06 + 0.94 * hairness) ** 1.2
core = sstep(BAND_IN * 0.5, BAND_IN * 1.4, sd)
a_hair = np.maximum(core, edge)

alpha = a_body * (1 - hair_zone) + a_hair * hair_zone
alpha = ndi.gaussian_filter(alpha, 0.7)
alpha[alpha < 0.025] = 0
alpha[sd > 30] = 1.0                                        # interior sempre opaco

# ---- 3) cor: nada de verde/luz vazando entre os cachos ----
near_edge = sstep(34, 20, sd) * hair_zone
contaminated = np.clip(scenery * 3.0, 0, 1) * near_edge
keep = 1 - np.clip(scenery * 2, 0, 1)
dark = np.stack([ndi.gaussian_filter(rgb[..., c] * keep, 10) for c in range(3)], -1)
dark = np.clip(dark / np.maximum(ndi.gaussian_filter(keep, 10)[..., None], 1e-3), 0, 0.16)
clean = rgb * (1 - contaminated[..., None]) + dark * contaminated[..., None]

np.save(f"{out_dir}/alpha.npy", alpha.astype(np.float32))
np.save(f"{out_dir}/clean.npy", clean.astype(np.float32))
print("alpha interior min (rosto):", float(alpha[720:850, 40:560].min()), "| sd min ali:", float(sd[720:850, 40:560].min()))

def comp(bg):
    return clean * alpha[..., None] + np.array(bg, np.float32) * (1 - alpha[..., None])
RED = [0.62, 0.05, 0.1]
panel = np.concatenate([comp(RED), comp([0.5, 0.5, 0.5]), np.dstack([alpha] * 3)], axis=1)[:1050]
im = Image.fromarray((np.clip(panel, 0, 1) * 255).astype(np.uint8)); im.thumbnail((1900, 1200)); im.save(f"{out_dir}/prev_matte.jpg", quality=90)
def crop(bg, box, scale):
    c = comp(bg)[box[1]:box[3], box[0]:box[2]]
    im = Image.fromarray((np.clip(c, 0, 1) * 255).astype(np.uint8))
    return im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
a = crop(RED, (150, 0, 700, 420), 1.6); b = crop(RED, (0, 880, 520, 1672), 0.85)
sheet = Image.new("RGB", (a.width + b.width, max(a.height, b.height)), (20, 20, 20)); sheet.paste(a, (0, 0)); sheet.paste(b, (a.width, 0)); sheet.save(f"{out_dir}/prev_zoom.jpg", quality=90)
