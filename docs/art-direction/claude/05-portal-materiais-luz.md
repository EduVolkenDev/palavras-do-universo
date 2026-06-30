# Portal: Materiais, Iluminação e Comportamento

Responsável: Claude  
Data: 2026-06-27  
Escopo: especificação física e comportamental do portal para implementação pelo Codex em Three.js/R3F.

---

## 1. O que o portal não é

Antes da especificação positiva, o que deve ser evitado:

- **Não é um círculo com glow.** Glow aplicado externamente cria um borrão que parece efeito de Photoshop, não profundidade física.
- **Não é um anel neon.** Neon implica artificialidade e frieza elétrica.
- **Não é um buraco negro decorativo.** O portal é convidativo, não ameaçador.
- **Não é uma textura de galáxia em loop.** Texturas de galáxia como fundo de portal são o clichê mais comum do segmento.
- **Não tem partículas orbitando.** Partículas são densidade sem matéria.

O portal é uma **abertura num material que existe**. Tem espessura, textura, resistência à luz. Não é apenas luz — é algo através do qual a luz passa.

---

## 2. Geometria base

### 2.1 Forma

O portal parte de uma geometria toroidal com modificações:

```
TorusGeometry(
  radius: variável por capítulo,
  tube: 0.08–0.12 (espessura da parede),
  radialSegments: 64,
  tubularSegments: 128
)
```

A forma não precisa ser um toro perfeito. Uma deformação procedural suave na superfície (noise de baixa frequência, amplitude 0.02–0.05) cria irregularidade orgânica.

### 2.2 Interior

O interior do portal (o "buraco" central) não é vazio — tem um plano com shader próprio:

```
PlaneGeometry posicionado no plano do portal
```

Este plano recebe um shader de transmissão com distorção leve — o que está atrás do portal parece levemente diferente do que está ao redor. Isso cria profundidade sem exigir portal raycasting complexo.

### 2.3 Escala por capítulo

A escala é controlada pelo estado do capítulo. Valores em unidades da cena:

| Capítulo | Raio base | Escala visual | Nota |
|---|---|---|---|
| Chegada | 1.0 | 40% | Portal ao longe |
| Reconhecimento | 1.0 | 75% | Aproximando |
| Escolha | 1.0 | 90% | Presente, estável |
| Abertura | 1.0 | 100% | Protagonista total |
| Revelação | 1.0 | 80% | Recuou ao fundo |
| Integração | 1.0 | 60% | Diminuindo, encerrando |

Escala é controlada por `portal.scale.set(x, y, z)` interpolada com GSAP — nunca corte abrupto.

---

## 3. Material do portal (anel/toro)

### 3.1 Tipo de material

`MeshPhysicalMaterial` ou shader customizado derivado dele:

```js
{
  roughness: 0.4,           // superfície não perfeitamente lisa
  metalness: 0.6,           // reflexivo mas não espelhado
  transmission: 0.0,        // o anel em si é opaco
  emissive: <cor por capítulo>,
  emissiveIntensity: <intensidade por capítulo>,
  envMapIntensity: 0.8,     // reflete o ambiente da cena
}
```

### 3.2 Noise procedural na superfície

Um vertex shader aplica noise de baixa frequência para criar irregularidade:

```glsl
// vertex shader
uniform float uTime;
uniform float uNoiseAmplitude;

vec3 displaced = position;
float noise = snoise(position.xz * 2.0 + uTime * 0.3);
displaced += normal * noise * uNoiseAmplitude;
gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
```

Valores:
- `uNoiseAmplitude`: 0.03 em repouso, 0.06 com interação do ponteiro
- Frequência do noise: 2.0 (baixa — ondas largas, não granulado)
- Velocidade: `uTime * 0.3` (lento — parece respirar)

### 3.3 Emissão por capítulo

| Capítulo | Cor emissiva | Intensidade |
|---|---|---|
| Chegada | `#2D2952` (threshold) | 0.3 |
| Reconhecimento | `#4A3552` (threshold + rose) | 0.5 |
| Escolha | `#4A456E` (ether) | 0.7 |
| Abertura | `#E8962A` (amber) | 1.8 |
| Revelação | `#C9A84C` (gold) | 0.8 |
| Integração | `#6B9E7A` (sage) | 0.5 |

A transição entre capítulos é interpolada com GSAP:
```js
gsap.to(portalMaterial, {
  emissiveIntensity: targetIntensity,
  duration: 1.2,
  ease: "power2.inOut"
})
```

---

## 4. Material do interior (plano de transmissão)

### 4.1 Shader do interior

O plano central do portal usa um fragment shader que:
1. Amostra o que está atrás do portal (render target ou environment map)
2. Aplica distorção por noise
3. Adiciona véu de cor baseado no capítulo

```glsl
// fragment shader
uniform sampler2D uSceneTexture;
uniform float uDistortionStrength;
uniform vec3 uTintColor;
uniform float uTintStrength;

vec2 uv = vUv;
vec2 distortion = vec2(
  snoise(vUv * 3.0 + uTime * 0.1),
  snoise(vUv * 3.0 + uTime * 0.1 + 43.0)
) * uDistortionStrength;

vec4 scene = texture2D(uSceneTexture, uv + distortion);
vec3 tinted = mix(scene.rgb, uTintColor, uTintStrength);
gl_FragColor = vec4(tinted, 1.0);
```

Valores por capítulo:
- `uDistortionStrength`: 0.005 (chegada) → 0.02 (abertura) → 0.008 (integração)
- `uTintColor`: segue a paleta emissiva do capítulo
- `uTintStrength`: 0.1–0.3

### 4.2 Fallback

Se WebGL não suportar render targets: o interior exibe um gradient radial que simula a profundidade. Sem textura de galáxia — gradient do void (`#07060D`) para a cor do capítulo.

---

## 5. Iluminação da cena

### 5.1 Luzes do sistema

```js
// Luz ambiente global
const ambientLight = new THREE.AmbientLight(
  <cor por capítulo>,
  <intensidade por capítulo>  // 0.05 a 0.12
)

// Luz do portal (PointLight posicionada no centro do portal)
const portalLight = new THREE.PointLight(
  <cor por capítulo>,
  <intensidade por capítulo>,  // 0.08 a 0.45
  distance: 8,
  decay: 2
)

// Luz narrativa (SpotLight — apenas revelação e integração)
const narrativeLight = new THREE.SpotLight(
  <cor dourada ou sage>,
  <intensidade>,  // 0.7 ou 0.3
  distance: 12,
  angle: Math.PI / 6,  // cone fechado
  penumbra: 0.5,
  decay: 1.5
)
```

### 5.2 Posicionamento da luz do portal

A luz do portal segue o portal — está sempre no centro geométrico do anel. Quando o portal muda de posição ou escala, a luz acompanha:

```js
portalLight.position.copy(portal.position)
```

### 5.3 Luz narrativa — posicionamento

Na Revelação, a luz narrativa posiciona-se acima-esquerda das cartas e aponta para o centro do spread:

```js
narrativeLight.position.set(-3, 4, 2)
narrativeLight.target.position.set(0, 0, 0)  // centro das cartas
```

Na Integração, a luz é mais distribuída — mesma posição mas cone mais aberto (`angle: Math.PI / 4`) e intensidade reduzida.

### 5.4 Environment map

A cena usa um HDRI de baixa resolução para reflexos consistentes. Um HDRI neutro-escuro (estúdio noturno ou espaço abstrato) — não um HDRI de paisagem ou interior decorado.

---

## 6. Comportamento do portal

### 6.1 Oscilação de repouso

Sempre ativa, mesmo quando o usuário não interage:

```js
function updatePortalRest(time) {
  const oscillation = Math.sin(time * 0.3) * 0.02  // 0.3 Hz, amplitude 0.02
  portal.rotation.z = oscillation
  portalMaterial.emissiveIntensity = baseIntensity + Math.sin(time * 0.5) * 0.05
}
```

A oscilação de rotação e a pulsação de intensidade têm frequências ligeiramente diferentes para evitar periodicidade perceptível.

### 6.2 Resposta ao ponteiro (desktop)

```js
function updatePortalPointer(normalizedX, normalizedY) {
  // normalizedX e normalizedY em [-1, 1]
  const targetRotX = normalizedY * 0.08  // 8° máximo
  const targetRotY = normalizedX * 0.10  // 10° máximo
  
  // Interpolação lenta — não segue o ponteiro diretamente
  portal.rotation.x += (targetRotX - portal.rotation.x) * 0.03
  portal.rotation.y += (targetRotY - portal.rotation.y) * 0.03
  
  // Noise amplitude aumenta no lado mais próximo do ponteiro
  const distanceFromCenter = Math.sqrt(normalizedX**2 + normalizedY**2)
  portalShader.uniforms.uNoiseAmplitude.value = 0.03 + distanceFromCenter * 0.03
}
```

### 6.3 Resposta ao scroll (GSAP ScrollTrigger)

```js
ScrollTrigger.create({
  trigger: "#chapter-transition",
  start: "top center",
  end: "bottom center",
  onUpdate: (self) => {
    const progress = self.progress
    
    // Escala interpolada entre capítulo atual e próximo
    const targetScale = lerp(currentChapterScale, nextChapterScale, progress)
    gsap.set(portal.scale, { x: targetScale, y: targetScale, z: targetScale })
    
    // Luz interpolada
    portalLight.intensity = lerp(currentLightIntensity, nextLightIntensity, progress)
  }
})
```

### 6.4 Sequência de revelação das cartas

Ao submeter a pergunta na Abertura:

```
t=0ms     Portal está em escala 100%, abertura máxima
t=0ms     Portal inicia contração (scale: 1.0 → 0.85, duration: 300ms, ease: power2.in)
t=300ms   Portal pausa brevemente (100ms)
t=400ms   Portal expande (scale: 0.85 → 1.1, duration: 400ms, ease: power2.out)
t=500ms   Carta 1 emerge do centro do portal (fade + translateY, 600ms)
t=900ms   Carta 2 emerge
t=1300ms  Carta 3 emerge
t=1600ms  Portal recua para escala da Revelação (1.1 → 0.8, 800ms)
t=1800ms  Luz narrativa assume
```

### 6.5 Resposta à inclinação (mobile, gyroscope)

```js
window.addEventListener('deviceorientation', (event) => {
  const tiltX = event.beta / 90   // [-1, 1]
  const tiltY = event.gamma / 90  // [-1, 1]
  
  // Mesmo comportamento do ponteiro, mas com amplitude reduzida (mobile)
  portal.rotation.x += (tiltX * 0.05 - portal.rotation.x) * 0.02
  portal.rotation.y += (tiltY * 0.05 - portal.rotation.y) * 0.02
})
```

Fallback quando gyroscope não está disponível: oscilação de repouso, sem resposta à interação física.

---

## 7. Performance

### 7.1 Limites

- Portal: máximo 30k polígonos no high, 8k no balanced, geometria simples no reduced
- Plano interior: shader ativo apenas no high e balanced
- Noise no vertex shader: ativo apenas no high; nos outros perfis, oscilação controlada por JS
- Render target para interior: apenas no high; balanced usa textura estática
- DPR do canvas: máximo 1.5 no high, 1.0 no balanced e reduced, 0 (static) no static

### 7.2 Detecção de perfil

```js
const gpu = navigator.gpu  // WebGPU disponível?
const gl = canvas.getContext('webgl2')
const memInfo = gl?.getExtension('WEBGL_debug_renderer_info')
const renderer = memInfo ? gl.getParameter(memInfo.UNMASKED_RENDERER_WEBGL) : ''

// Heurística simples
if (renderer.includes('Intel') && !renderer.includes('Iris')) profile = 'reduced'
else if (window.matchMedia('(max-width: 768px)').matches) profile = 'balanced'
else profile = 'high'

// Overrides
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) profile = 'static'
```

### 7.3 Static fallback

No perfil static, o portal é uma imagem SVG com gradiente radial animado por CSS:

```css
@keyframes portal-breathe {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 0.85; transform: scale(1.02); }
}

.portal-static {
  animation: portal-breathe 3s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .portal-static { animation: none; opacity: 0.8; }
}
```

O SVG é tratado como deliverable visual completo — não como degradação visível.
