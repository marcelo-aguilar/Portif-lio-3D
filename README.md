# Portfólio — Marcelo Aguilar

Portfólio imersivo em 3D de Marcelo Aguilar, estudante de Engenharia de Software no Inteli.
O conteúdo vem do currículo e do perfil do LinkedIn; nenhum projeto, experiência ou prêmio foi inventado.

## Como rodar no Ubuntu

Requisitos: **Node.js 20 ou mais recente** (testado com Node 24.20 e npm 11.19).

```bash
# 1. Se ainda não tiver o Node.js (via nvm, sem sudo):
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install --lts

# 2. Na pasta do projeto:
cd ~/"Área de trabalho/Portifólio"
npm install

# 3. Servidor de desenvolvimento (recarrega sozinho ao salvar):
npm run dev
# abra http://localhost:5173
```

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento em `http://localhost:5173` |
| `npm run build` | Verifica os tipos (TypeScript) e gera a versão de produção em `dist/` |
| `npm run preview` | Serve a pasta `dist/` em `http://localhost:4173`, para conferir o build |
| `npm run typecheck` | Só a verificação de tipos |
| `npm run lint` | Lint com oxlint |
| `npm run typeface` | Regenera as letras 3D do sobrenome (só se mudar a fonte ou o texto) |

### Parâmetros para testar os modos alternativos

| URL | Efeito |
| --- | --- |
| `/?gl=0` | Simula um navegador sem WebGL (composição equivalente em CSS) |
| `/?motion=0` | Simula `prefers-reduced-motion` (rolagem nativa, sem animações contínuas) |
| `/?tier=low` | Força a cena simplificada usada em celulares |

## Publicação

O build usa caminhos relativos (`base: './'`), então a pasta `dist/` funciona na raiz de um domínio
ou em qualquer subpasta. Opções:

- **Vercel**: `npx vercel` na pasta do projeto (o Vite é detectado automaticamente).
- **Netlify**: comando de build `npm run build`, pasta de publicação `dist`.
- **GitHub Pages**: publique o conteúdo de `dist/` (por exemplo, com a action `actions/deploy-pages`).

## Estrutura

```
src/
  content/     Textos e dados (perfil, projetos, habilidades, trajetória) — edite aqui
  sections/    Seções da página (Hero, About, Projects, ProjectDialog, Skills, Journey, Contact)
  ui/          Interface compartilhada (navegação, abertura, ícones, halo da lâmpada)
  three/       Cena 3D (câmera, letras, retrato em relevo, baralho, órbitas, atmosfera)
  lib/         Sistemas: laço único de animação, rolagem, ponteiro, ponte DOM ↔ 3D, revelações
  styles/      Design tokens e estilos base
  assets/      Imagens otimizadas (WebP) e a fonte das letras 3D
scripts/
  build-typeface.mjs   Gera as letras 3D a partir da fonte Anton
  portrait/            Recorte do retrato (Python) e máscaras de origem
  capturas/            Capturas de tela originais das aplicações
imagens/, referencias/, *.pdf   Materiais originais (não são publicados)
```

### Como o 3D se encaixa no layout

O layout é todo definido em CSS. Cada seção reserva "vãos" vazios (o retrato, o sobrenome, o palco
dos projetos, as órbitas) e, a cada quadro, a cena 3D mede esses vãos e se encaixa neles
(`src/lib/stage.ts`). A câmera usa projeção fora do eixo (`src/three/Rig.tsx`): a tela funciona como
uma janela, de modo que o que está no plano da tela fica alinhado ao layout e o resto ganha paralaxe
real quando o cursor se move. Assim a responsividade é resolvida uma vez, no CSS.

### Editar o conteúdo

- Textos e links: `src/content/*.ts`.
- Currículo para download: coloque o PDF em `public/` e preencha `resumeUrl` em
  `src/content/profile.ts`. Ficou vazio de propósito, porque o PDF atual tem o telefone pessoal.
- Novo projeto: adicione um item em `src/content/projects.ts` e a imagem (1280 × 800, WebP) em
  `src/assets/projects/`. O baralho 3D, a lista e o estudo de caso se ajustam sozinhos.

### Regenerar o retrato

O recorte foi feito com um pipeline leve (numpy/scipy) a partir de duas máscaras já prontas, porque
os modelos de recorte mais pesados passam de 4 GB de RAM e travavam o computador.

```bash
python3 -m venv ~/.venvs/retrato && ~/.venvs/retrato/bin/pip install numpy scipy pillow
mkdir -p /tmp/retrato/proc && cp scripts/portrait/selfie_*.png /tmp/retrato/proc/
~/.venvs/retrato/bin/python scripts/portrait/matte.py /tmp/retrato /tmp/retrato/proc
~/.venvs/retrato/bin/python scripts/portrait/export.py /tmp/retrato/proc .
```

## Bibliotecas

| Biblioteca | Uso |
| --- | --- |
| React 19 + TypeScript + Vite | Base da aplicação e build |
| three.js, @react-three/fiber, @react-three/drei | Cena 3D e integração com React |
| GSAP (ScrollTrigger, SplitText) | Abertura, revelações de texto e animações ligadas à rolagem |
| Lenis | Rolagem suave (desligada com movimento reduzido) |
| Fontsource: Anton, Bodoni Moda, Instrument Sans | Fontes servidas localmente |
| opentype.js (dev) | Conversão da fonte Anton em letras 3D |
| oxlint (dev) | Lint |

## Decisões visuais

- **Paleta**: preto quente, um único vermelho em três profundidades (vinho, carmim, brasa) e o bege
  das serifadas, vindos das três referências. Sem azul nem neon.
- **Tipografia**: Anton para o sobrenome e os títulos (a "palavra monumental" das referências),
  Bodoni Moda em itálico para o primeiro nome e as frases, Instrument Sans para leitura.
- **Conceito**: o visitante segura uma lâmpada. O cursor é uma luz real que reilumina o retrato em
  relevo, as letras extrudadas e a poeira em suspensão. A mesma luz continua sobre o texto como um
  halo discreto.
- **Narrativa**: o sobrenome se ergue na abertura, tomba quando a seção "Sobre" sobe como cortina e
  volta inteiro no encerramento.

## Decisões técnicas

- Um único `requestAnimationFrame` (o do GSAP) move rolagem, ponteiro e renderização, nessa ordem.
- A cena é carregada sob demanda num chunk separado: o conteúdo aparece sem esperar o 3D.
- Renderização sob demanda: o canvas não desenha (e fica oculto) quando nenhum palco 3D está na tela
  ou a aba está em segundo plano.
- DPR limitado (1,75 no desktop, 1,5 no celular) e reduzido automaticamente se os quadros ficarem lentos.
- Celulares recebem malhas mais leves, menos partículas e nenhum antisserrilhamento.
- Sem WebGL, sem movimento ou com falha da cena, o site cai para a mesma composição em CSS.
- Acessibilidade: link para pular ao conteúdo, foco visível, menu e estudo de caso operáveis pelo
  teclado (Esc fecha), textos reais no DOM e `prefers-reduced-motion` respeitado.

## O que foi verificado

- `npm run build` (com verificação de tipos) e `npm run lint` sem erros nem avisos.
- Navegação completa no Chrome em 1765 × 1032, além de 390 × 780 (celular) e 820 × 780 (tablet)
  simulados com iframes; modos `?gl=0` e `?motion=0`; abertura e fechamento do estudo de caso.
- Build de produção servido localmente: nenhum recurso quebrado. O console mostra apenas um aviso de
  depreciação (`THREE.Clock`) emitido internamente pelo React Three Fiber.

## Pendências

- **Experiência profissional, formação e prêmios no LinkedIn** estão vazios no perfil; foram usados o
  "Sobre", as publicações dos projetos e o currículo. Quando houver um estágio, ele entra em
  `src/content/journey.ts`.
- **Retrato**: a selfie original corta o rosto à esquerda; a borda foi tratada como sombra. Uma foto
  com mais margem lateral melhoraria o herói.
- **Imagem de compartilhamento** (`og:image`) ainda não foi criada.
- Não houve teste em celular físico (toque e desempenho real); os tamanhos de celular foram simulados.
- O chunk da cena 3D tem cerca de 950 kB (255 kB com gzip); ele é carregado depois do conteúdo.
- O projeto não tem testes automatizados nem repositório git.
