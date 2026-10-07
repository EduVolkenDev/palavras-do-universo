import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../../..");
const outputRoot = join(here, "assets");
const publishRoot = join(here, "PUBLICAR");
const sourceRoot = join(here, ".generated-svg");

const colors = {
  night: "#171225",
  deep: "#0d0918",
  cream: "#fff7e8",
  muted: "#d8ccc0",
  gold: "#f4d58d",
  goldDeep: "#bc8f46",
  paper: "#f7f0e5",
  ink: "#241b18",
  inkSoft: "#6f615a",
};

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll(" ", "&#160;");

function text(lines, {
  x,
  y,
  size,
  lineHeight,
  fill = colors.cream,
  family = "Georgia, Times New Roman, serif",
  weight = 400,
  tracking = 0,
  anchor = "start",
  italic = false,
}) {
  return lines
    .map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" fill="${fill}" font-family="${family}" font-size="${size}" font-weight="${weight}" letter-spacing="${tracking}" text-anchor="${anchor}"${italic ? ' font-style="italic"' : ""}>${escapeXml(line)}</text>`)
    .join("");
}

function eyebrow(label, x, y, fill = colors.gold) {
  return text([label.toUpperCase()], {
    x,
    y,
    size: 22,
    lineHeight: 28,
    fill,
    family: "Avenir, Helvetica, Arial, sans-serif",
    weight: 600,
    tracking: 4.6,
  });
}

function brand(w, sequence = "") {
  return `
    <g>
      <circle cx="88" cy="74" r="20" fill="none" stroke="${colors.gold}" stroke-width="1.5"/>
      <circle cx="88" cy="74" r="5" fill="${colors.gold}"/>
      <path d="M68 74h40M88 54v40" stroke="${colors.gold}" stroke-width="1" opacity=".75"/>
      ${text(["PALAVRAS DO UNIVERSO"], { x: 126, y: 82, size: 22, lineHeight: 22, fill: colors.cream, family: "Avenir, Helvetica, Arial, sans-serif", weight: 600, tracking: 3.1 })}
      ${sequence ? text([sequence], { x: w - 72, y: 82, size: 20, lineHeight: 20, fill: colors.muted, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500, tracking: 2, anchor: "end" }) : ""}
    </g>`;
}

function footer(w, h, label = "palavrasdouniverso.com/astrologia") {
  return `
    <line x1="72" x2="${w - 72}" y1="${h - 90}" y2="${h - 90}" stroke="${colors.gold}" stroke-opacity=".34"/>
    ${text([label], { x: 72, y: h - 48, size: 20, lineHeight: 20, fill: colors.muted, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500, tracking: 1.2 })}`;
}

function base({ w, h, tone = "night", visual = "hero", sequence = "" }, content) {
  const paper = tone === "paper";
  const background = paper
    ? `<rect width="${w}" height="${h}" fill="${colors.paper}"/><circle cx="${w * .88}" cy="${h * .18}" r="330" fill="#e6d5bb" opacity=".5"/>`
    : `<rect width="${w}" height="${h}" fill="${colors.night}"/><rect width="${w}" height="${h}" fill="url(#nightWash)"/><circle cx="${w * .92}" cy="${h * .12}" r="440" fill="url(#nebula)" opacity=".5"/>`;
  const visualLayer = visual === "hero"
    ? `<g transform="translate(${w * .75} ${h * .69})" fill="none" stroke="${colors.gold}" opacity=".2">
         <circle r="250" stroke-width="1.5"/><circle r="188"/><circle r="118"/><circle r="54"/>
         <path d="M-290 0H290M0-290V290M-205-205L205 205M205-205L-205 205" stroke-width="1"/>
         <circle cx="0" cy="0" r="18" fill="${colors.gold}" opacity=".75"/>
         <circle cx="188" cy="0" r="13" fill="${colors.gold}"/><circle cx="-84" cy="-226" r="8" fill="${colors.gold}"/>
       </g>`
    : visual === "orbit"
      ? `<g transform="translate(${w * .76} ${h * .69})" fill="none" stroke="${colors.gold}" opacity=".19">
           <ellipse rx="310" ry="118" transform="rotate(-18)"/><ellipse rx="300" ry="145" transform="rotate(34)"/>
           <ellipse rx="235" ry="235"/><circle r="132"/><circle r="42" fill="${colors.gold}" opacity=".55"/>
           <circle cx="245" cy="-42" r="15" fill="${colors.gold}"/><circle cx="-122" cy="205" r="10" fill="${colors.gold}"/>
         </g>`
      : "";
  const fg = paper ? colors.ink : colors.cream;
  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="nightWash" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#0d0918" stop-opacity=".87"/>
        <stop offset=".52" stop-color="#171225" stop-opacity=".58"/>
        <stop offset="1" stop-color="#0d0918" stop-opacity=".9"/>
      </linearGradient>
      <linearGradient id="goldButton" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ffe5aa"/>
        <stop offset="1" stop-color="#e6bd69"/>
      </linearGradient>
      <radialGradient id="nebula">
        <stop offset="0" stop-color="#6b4d78" stop-opacity=".42"/>
        <stop offset=".55" stop-color="#342340" stop-opacity=".18"/>
        <stop offset="1" stop-color="#171225" stop-opacity="0"/>
      </radialGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#05030a" flood-opacity=".35"/>
      </filter>
    </defs>
    ${background}
    ${visualLayer}
    <rect x="28" y="28" width="${w - 56}" height="${h - 56}" rx="26" fill="none" stroke="${paper ? colors.goldDeep : colors.gold}" stroke-opacity=".28"/>
    ${brand(w, sequence)}
    <g data-tone="${tone}" data-foreground="${fg}">${content}</g>
  </svg>`;
}

function optionCard({ x, y, w, h, title, price, meta, emphasized = false }) {
  return `
    <g filter="url(#shadow)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="28" fill="${emphasized ? "url(#goldButton)" : colors.deep}" fill-opacity="${emphasized ? 1 : .86}" stroke="${colors.gold}" stroke-opacity="${emphasized ? .2 : .42}"/>
      ${text([title.toUpperCase()], { x: x + 30, y: y + 47, size: 19, lineHeight: 22, fill: emphasized ? colors.inkSoft : colors.gold, family: "Avenir, Helvetica, Arial, sans-serif", weight: 700, tracking: 2.4 })}
      ${text([price], { x: x + 30, y: y + 99, size: 43, lineHeight: 43, fill: emphasized ? colors.ink : colors.cream, family: "Georgia, Times New Roman, serif", weight: 600 })}
      ${text([meta], { x: x + 30, y: y + 135, size: 20, lineHeight: 24, fill: emphasized ? colors.inkSoft : colors.muted, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500 })}
    </g>`;
}

function cta(x, y, w, label) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="76" rx="38" fill="url(#goldButton)"/>
    ${text([label], { x: x + w / 2, y: y + 49, size: 23, lineHeight: 23, fill: colors.ink, family: "Avenir, Helvetica, Arial, sans-serif", weight: 700, tracking: .4, anchor: "middle" })}`;
}

const portrait = { w: 1080, h: 1350 };
const story = { w: 1080, h: 1920 };

const pieces = [
  {
    path: "feed/pdu-astrologia-feed-estatico.png",
    ...portrait,
    svg: base({ ...portrait, visual: "hero" }, `
      ${eyebrow("ASTROLOGIA PARA A VIDA REAL", 74, 196)}
      ${text(["Um mapa para", "se reconhecer.", "Um círculo para", "continuar."], { x: 72, y: 292, size: 82, lineHeight: 91, weight: 600 })}
      ${optionCard({ x: 72, y: 760, w: 454, h: 170, title: "Mapa Astral Completo", price: "R$39,90", meta: "pagamento único", emphasized: true })}
      ${optionCard({ x: 554, y: 760, w: 454, h: 170, title: "Círculo do Universo", price: "R$49,90/mês", meta: "experiência contínua" })}
      ${text(["O céu não decide por você.", "Ele ajuda você a se ler."], { x: 72, y: 1010, size: 33, lineHeight: 44, fill: colors.muted, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500 })}
      ${cta(72, 1120, 500, "Comece pela camada gratuita")}
      ${footer(portrait.w, portrait.h)}
    `),
  },
  {
    path: "feed/carousel-01-capa.png",
    ...portrait,
    svg: base({ ...portrait, visual: "orbit", sequence: "01 / 07" }, `
      ${eyebrow("UM NOVO JEITO DE LER O SEU CÉU", 72, 205)}
      ${text(["O céu não", "decide por você."], { x: 72, y: 330, size: 100, lineHeight: 110, weight: 600 })}
      ${text(["Ele ajuda você", "a se ler."], { x: 72, y: 622, size: 68, lineHeight: 78, fill: colors.gold, weight: 400, italic: true })}
      ${footer(portrait.w, portrait.h, "Deslize para conhecer o seu mapa  →")}
    `),
  },
  {
    path: "feed/carousel-02-alem-do-signo.png",
    ...portrait,
    svg: base({ ...portrait, visual: "hero", sequence: "02 / 07" }, `
      ${eyebrow("MAIS DO QUE O SIGNO SOLAR", 72, 205)}
      ${text(["O mapa começa", "onde o signo solar", "termina."], { x: 72, y: 318, size: 79, lineHeight: 90, weight: 600 })}
      ${text(["Sol, Lua e Ascendente são a primeira camada.", "Planetas, casas e aspectos mostram como essa", "linguagem se conecta."], { x: 72, y: 690, size: 30, lineHeight: 47, fill: colors.muted, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500 })}
      ${footer(portrait.w, portrait.h)}
    `),
  },
  {
    path: "feed/carousel-03-linguagem-clara.png",
    ...portrait,
    svg: base({ ...portrait, visual: "orbit", sequence: "03 / 07" }, `
      ${eyebrow("FEITO PARA COMEÇAR", 72, 205)}
      ${text(["Você não precisa", "entender astrologia", "antes de entrar."], { x: 72, y: 318, size: 78, lineHeight: 89, weight: 600 })}
      <rect x="72" y="690" width="720" height="184" rx="28" fill="${colors.deep}" fill-opacity=".82" stroke="${colors.gold}" stroke-opacity=".3"/>
      ${text(["Símbolos organizados em linguagem clara,", "com contexto e sem sentenças sobre o futuro."], { x: 106, y: 758, size: 29, lineHeight: 48, fill: colors.muted, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500 })}
      ${footer(portrait.w, portrait.h)}
    `),
  },
  {
    path: "feed/carousel-04-mapa-avulso.png",
    ...portrait,
    svg: base({ ...portrait, visual: "hero", sequence: "04 / 07" }, `
      ${eyebrow("CAMINHO 01 · COMPRA ÚNICA", 72, 205)}
      ${text(["Mapa Astral", "Completo"], { x: 72, y: 330, size: 95, lineHeight: 106, weight: 600 })}
      ${text(["R$39,90"], { x: 72, y: 600, size: 84, lineHeight: 84, fill: colors.gold, weight: 600 })}
      ${text(["Pagamento único."], { x: 72, y: 650, size: 25, lineHeight: 32, fill: colors.muted, family: "Avenir, Helvetica, Arial, sans-serif", weight: 600, tracking: 1 })}
      ${text(["Para conhecer o seu mapa completo", "sem iniciar uma assinatura."], { x: 72, y: 770, size: 33, lineHeight: 49, fill: colors.cream, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500 })}
      ${footer(portrait.w, portrait.h)}
    `),
  },
  {
    path: "feed/carousel-05-circulo.png",
    ...portrait,
    svg: base({ ...portrait, visual: "orbit", sequence: "05 / 07" }, `
      ${eyebrow("CAMINHO 02 · CONTINUIDADE", 72, 205)}
      ${text(["Círculo do", "Universo"], { x: 72, y: 330, size: 96, lineHeight: 106, weight: 600 })}
      ${text(["R$49,90/mês"], { x: 72, y: 600, size: 76, lineHeight: 76, fill: colors.gold, weight: 600 })}
      ${text(["Mapa completo + experiência contínua."], { x: 72, y: 666, size: 25, lineHeight: 32, fill: colors.muted, family: "Avenir, Helvetica, Arial, sans-serif", weight: 600, tracking: .5 })}
      ${text(["Leituras premium e histórico para", "reconhecer padrões ao longo do tempo."], { x: 72, y: 778, size: 32, lineHeight: 49, fill: colors.cream, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500 })}
      ${footer(portrait.w, portrait.h)}
    `),
  },
  {
    path: "feed/carousel-06-escolha.png",
    ...portrait,
    svg: base({ ...portrait, visual: "none", sequence: "06 / 07" }, `
      ${eyebrow("QUAL CAMINHO FAZ SENTIDO AGORA?", 72, 205)}
      ${text(["Uma escolha simples."], { x: 72, y: 320, size: 86, lineHeight: 92, weight: 600 })}
      ${optionCard({ x: 72, y: 485, w: 936, h: 235, title: "Mapa", price: "Uma leitura completa", meta: "R$39,90 · pagamento único", emphasized: true })}
      ${optionCard({ x: 72, y: 755, w: 936, h: 235, title: "Círculo", price: "Continuidade e memória", meta: "R$49,90/mês · mapa incluído" })}
      ${footer(portrait.w, portrait.h)}
    `),
  },
  {
    path: "feed/carousel-07-cta.png",
    ...portrait,
    svg: base({ ...portrait, visual: "hero", sequence: "07 / 07" }, `
      ${eyebrow("A SUA PRIMEIRA CAMADA É GRATUITA", 72, 205)}
      ${text(["Um mapa para", "se reconhecer.", "Um círculo para", "continuar."], { x: 72, y: 315, size: 83, lineHeight: 92, weight: 600 })}
      ${text(["Não é destino fixo.", "É contexto para escolher."], { x: 72, y: 770, size: 33, lineHeight: 49, fill: colors.muted, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500 })}
      ${cta(72, 935, 500, "Abrir minha astrologia")}
      ${footer(portrait.w, portrait.h)}
    `),
  },
  {
    path: "stories/story-01-enquete.png",
    ...story,
    svg: base({ ...story, visual: "orbit", sequence: "01 / 07" }, `
      ${eyebrow("COMECE PELO QUE VOCÊ JÁ CONHECE", 72, 250)}
      ${text(["Você conhece", "o seu Sol,", "a sua Lua e", "o seu Ascendente?"], { x: 72, y: 400, size: 94, lineHeight: 108, weight: 600 })}
      <rect x="72" y="1030" width="936" height="220" rx="34" fill="${colors.deep}" fill-opacity=".78" stroke="${colors.gold}" stroke-opacity=".42" stroke-dasharray="10 10"/>
      ${text(["ADICIONE A ENQUETE AQUI"], { x: 540, y: 1134, size: 24, lineHeight: 24, fill: colors.gold, family: "Avenir, Helvetica, Arial, sans-serif", weight: 700, tracking: 2, anchor: "middle" })}
      ${text(["Sim     ·     Ainda não"], { x: 540, y: 1190, size: 29, lineHeight: 29, fill: colors.cream, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500, anchor: "middle" })}
      ${footer(story.w, story.h)}
    `),
  },
  {
    path: "stories/story-02-primeira-camada.png",
    ...story,
    svg: base({ ...story, visual: "hero", sequence: "02 / 07" }, `
      ${eyebrow("SEU MAPA NÃO CABE EM UM SIGNO", 72, 250)}
      ${text(["Esses três", "pontos são", "o começo —", "não o resumo."], { x: 72, y: 410, size: 98, lineHeight: 111, weight: 600 })}
      ${text(["Planetas, casas e aspectos dão", "profundidade à conversa."], { x: 72, y: 1010, size: 38, lineHeight: 56, fill: colors.muted, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500 })}
      ${footer(story.w, story.h)}
    `),
  },
  {
    path: "stories/story-03-tese.png",
    ...story,
    svg: base({ ...story, visual: "orbit", sequence: "03 / 07" }, `
      ${eyebrow("ASTROLOGIA SEM DETERMINISMO", 72, 250)}
      ${text(["O céu não", "decide por", "você."], { x: 72, y: 430, size: 116, lineHeight: 128, weight: 600 })}
      ${text(["Ele ajuda você", "a se ler."], { x: 72, y: 930, size: 76, lineHeight: 88, fill: colors.gold, weight: 400, italic: true })}
      ${text(["Contexto, não sentença."], { x: 72, y: 1270, size: 35, lineHeight: 44, fill: colors.muted, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500 })}
      ${footer(story.w, story.h)}
    `),
  },
  {
    path: "stories/story-04-mapa.png",
    ...story,
    svg: base({ ...story, visual: "hero", sequence: "04 / 07" }, `
      ${eyebrow("QUER CONHECER O SEU MAPA UMA VEZ?", 72, 250)}
      ${text(["Mapa Astral", "Completo"], { x: 72, y: 435, size: 108, lineHeight: 120, weight: 600 })}
      ${text(["R$39,90"], { x: 72, y: 790, size: 102, lineHeight: 102, fill: colors.gold, weight: 600 })}
      ${text(["pagamento único"], { x: 72, y: 850, size: 29, lineHeight: 34, fill: colors.muted, family: "Avenir, Helvetica, Arial, sans-serif", weight: 600, tracking: 1.5 })}
      ${text(["Sem assinatura."], { x: 72, y: 1055, size: 42, lineHeight: 48, fill: colors.cream, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500 })}
      ${footer(story.w, story.h)}
    `),
  },
  {
    path: "stories/story-05-circulo.png",
    ...story,
    svg: base({ ...story, visual: "orbit", sequence: "05 / 07" }, `
      ${eyebrow("QUER ACOMPANHAR SEUS CICLOS?", 72, 250)}
      ${text(["Círculo do", "Universo"], { x: 72, y: 435, size: 110, lineHeight: 121, weight: 600 })}
      ${text(["R$49,90/mês"], { x: 72, y: 790, size: 91, lineHeight: 91, fill: colors.gold, weight: 600 })}
      ${text(["Mapa completo + experiência contínua"], { x: 72, y: 876, size: 29, lineHeight: 34, fill: colors.muted, family: "Avenir, Helvetica, Arial, sans-serif", weight: 600 })}
      ${text(["Leituras premium e histórico", "para reconhecer padrões."], { x: 72, y: 1055, size: 37, lineHeight: 55, fill: colors.cream, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500 })}
      ${footer(story.w, story.h)}
    `),
  },
  {
    path: "stories/story-06-escolha.png",
    ...story,
    svg: base({ ...story, visual: "none", sequence: "06 / 07" }, `
      ${eyebrow("QUAL CAMINHO COMBINA COM O SEU AGORA?", 72, 250)}
      ${text(["Mapa para", "se reconhecer.", "Círculo para", "continuar."], { x: 72, y: 420, size: 94, lineHeight: 108, weight: 600 })}
      <rect x="72" y="1080" width="936" height="230" rx="34" fill="${colors.deep}" fill-opacity=".78" stroke="${colors.gold}" stroke-opacity=".42" stroke-dasharray="10 10"/>
      ${text(["ADICIONE A ENQUETE AQUI"], { x: 540, y: 1188, size: 24, lineHeight: 24, fill: colors.gold, family: "Avenir, Helvetica, Arial, sans-serif", weight: 700, tracking: 2, anchor: "middle" })}
      ${text(["Meu mapa     ·     Continuidade"], { x: 540, y: 1250, size: 28, lineHeight: 28, fill: colors.cream, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500, anchor: "middle" })}
      ${footer(story.w, story.h)}
    `),
  },
  {
    path: "stories/story-07-cta.png",
    ...story,
    svg: base({ ...story, visual: "hero", sequence: "07 / 07" }, `
      ${eyebrow("A SUA PRIMEIRA CAMADA É GRATUITA", 72, 250)}
      ${text(["Comece pelo", "seu céu."], { x: 72, y: 445, size: 122, lineHeight: 134, weight: 600 })}
      ${text(["Você entende a primeira camada", "antes de escolher como continuar."], { x: 72, y: 860, size: 37, lineHeight: 56, fill: colors.muted, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500 })}
      ${cta(72, 1080, 560, "Abrir minha astrologia")}
      <rect x="72" y="1230" width="936" height="190" rx="34" fill="${colors.deep}" fill-opacity=".78" stroke="${colors.gold}" stroke-opacity=".42" stroke-dasharray="10 10"/>
      ${text(["ADICIONE O STICKER DE LINK AQUI"], { x: 540, y: 1342, size: 24, lineHeight: 24, fill: colors.gold, family: "Avenir, Helvetica, Arial, sans-serif", weight: 700, tracking: 2, anchor: "middle" })}
      ${footer(story.w, story.h)}
    `),
  },
  {
    path: "reels/pdu-astrologia-reels-cover.png",
    ...story,
    svg: base({ ...story, visual: "orbit" }, `
      ${eyebrow("ASTROLOGIA · PALAVRAS DO UNIVERSO", 72, 300)}
      ${text(["O céu não", "decide por", "você."], { x: 72, y: 520, size: 116, lineHeight: 130, weight: 600 })}
      ${text(["Ele ajuda você a se ler."], { x: 72, y: 1015, size: 54, lineHeight: 62, fill: colors.gold, weight: 400, italic: true })}
      ${text(["Mapa completo · R$39,90", "Círculo · R$49,90/mês"], { x: 72, y: 1260, size: 34, lineHeight: 56, fill: colors.cream, family: "Avenir, Helvetica, Arial, sans-serif", weight: 600 })}
      ${footer(story.w, story.h)}
    `),
  },
  {
    path: "status/status-01-tese.png",
    ...story,
    svg: base({ ...story, visual: "orbit", sequence: "01 / 05" }, `
      ${eyebrow("ASTROLOGIA · PALAVRAS DO UNIVERSO", 72, 250)}
      ${text(["O céu não", "decide por", "você."], { x: 72, y: 445, size: 116, lineHeight: 128, weight: 600 })}
      ${text(["Ele ajuda você", "a se ler."], { x: 72, y: 950, size: 76, lineHeight: 88, fill: colors.gold, weight: 400, italic: true })}
      ${text(["Contexto, não sentença."], { x: 72, y: 1270, size: 35, lineHeight: 44, fill: colors.muted, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500 })}
      ${footer(story.w, story.h)}
    `),
  },
  {
    path: "status/status-02-mapa.png",
    ...story,
    svg: base({ ...story, visual: "hero", sequence: "02 / 05" }, `
      ${eyebrow("UMA LEITURA COMPLETA", 72, 250)}
      ${text(["Mapa Astral", "Completo"], { x: 72, y: 445, size: 108, lineHeight: 120, weight: 600 })}
      ${text(["R$39,90"], { x: 72, y: 820, size: 104, lineHeight: 104, fill: colors.gold, weight: 600 })}
      ${text(["pagamento único · sem assinatura"], { x: 72, y: 890, size: 29, lineHeight: 34, fill: colors.muted, family: "Avenir, Helvetica, Arial, sans-serif", weight: 600 })}
      ${text(["Para conhecer planetas, casas,", "aspectos e influências do seu mapa."], { x: 72, y: 1090, size: 37, lineHeight: 56, fill: colors.cream, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500 })}
      ${footer(story.w, story.h)}
    `),
  },
  {
    path: "status/status-03-circulo.png",
    ...story,
    svg: base({ ...story, visual: "orbit", sequence: "03 / 05" }, `
      ${eyebrow("PARA ACOMPANHAR SEUS CICLOS", 72, 250)}
      ${text(["Círculo do", "Universo"], { x: 72, y: 445, size: 110, lineHeight: 121, weight: 600 })}
      ${text(["R$49,90/mês"], { x: 72, y: 820, size: 91, lineHeight: 91, fill: colors.gold, weight: 600 })}
      ${text(["mapa completo incluído"], { x: 72, y: 890, size: 29, lineHeight: 34, fill: colors.muted, family: "Avenir, Helvetica, Arial, sans-serif", weight: 600 })}
      ${text(["Leituras premium e histórico para", "reconhecer padrões ao longo do tempo."], { x: 72, y: 1090, size: 36, lineHeight: 55, fill: colors.cream, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500 })}
      ${footer(story.w, story.h)}
    `),
  },
  {
    path: "status/status-04-escolha.png",
    ...story,
    svg: base({ ...story, visual: "none", sequence: "04 / 05" }, `
      ${eyebrow("DUAS FORMAS DE CONTINUAR", 72, 250)}
      ${text(["Qual caminho faz", "sentido agora?"], { x: 72, y: 420, size: 95, lineHeight: 108, weight: 600 })}
      ${optionCard({ x: 72, y: 760, w: 936, h: 235, title: "Mapa", price: "Conhecer o seu mapa", meta: "R$39,90 · pagamento único", emphasized: true })}
      ${optionCard({ x: 72, y: 1030, w: 936, h: 235, title: "Círculo", price: "Acompanhar seus ciclos", meta: "R$49,90/mês · mapa incluído" })}
      ${footer(story.w, story.h)}
    `),
  },
  {
    path: "status/status-05-cta.png",
    ...story,
    svg: base({ ...story, visual: "hero", sequence: "05 / 05" }, `
      ${eyebrow("A PRIMEIRA CAMADA É GRATUITA", 72, 250)}
      ${text(["Comece pelo", "seu céu."], { x: 72, y: 445, size: 122, lineHeight: 134, weight: 600 })}
      ${text(["Conheça Sol, Lua e Ascendente", "antes de escolher como continuar."], { x: 72, y: 860, size: 37, lineHeight: 56, fill: colors.muted, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500 })}
      ${cta(72, 1080, 560, "Abrir minha astrologia")}
      ${text(["palavrasdouniverso.com", "/astrologia"], { x: 72, y: 1315, size: 42, lineHeight: 54, fill: colors.gold, family: "Avenir, Helvetica, Arial, sans-serif", weight: 700 })}
      ${footer(story.w, story.h)}
    `),
  },
  {
    path: "video/pdu-astrologia-tiktok-cover.png",
    ...story,
    svg: base({ ...story, visual: "orbit" }, `
      ${eyebrow("MAPA ASTRAL · PALAVRAS DO UNIVERSO", 72, 300)}
      ${text(["Você é mais", "do que o seu", "signo."], { x: 72, y: 520, size: 108, lineHeight: 124, weight: 600 })}
      ${text(["Comece gratuitamente."], { x: 72, y: 1050, size: 54, lineHeight: 62, fill: colors.gold, weight: 400, italic: true })}
      ${text(["Mapa completo · R$39,90", "Círculo · R$49,90/mês"], { x: 72, y: 1280, size: 34, lineHeight: 56, fill: colors.cream, family: "Avenir, Helvetica, Arial, sans-serif", weight: 600 })}
      ${footer(story.w, story.h)}
    `),
  },
];

const campaignPieceCount = pieces.length;

const libraryThemes = {
  plum: { background: "#171225", backgroundAlt: "#35213f", foreground: "#fff7e8", muted: "#d8ccc0", accent: "#f4d58d", card: "#0d0918" },
  paper: { background: "#f7f0e5", backgroundAlt: "#e8dccb", foreground: "#241b18", muted: "#6f615a", accent: "#8a6b3f", card: "#fffaf2" },
  sage: { background: "#27453d", backgroundAlt: "#607464", foreground: "#fffaf2", muted: "#d7dfd6", accent: "#f4d58d", card: "#1b332d" },
  rose: { background: "#6b3844", backgroundAlt: "#b46b68", foreground: "#fff8ee", muted: "#efd8d4", accent: "#ffd898", card: "#4c2731" },
  indigo: { background: "#252650", backgroundAlt: "#574572", foreground: "#fff7e8", muted: "#d7d0e7", accent: "#f0cf82", card: "#191a3a" },
  gold: { background: "#e0bd70", backgroundAlt: "#fff0c2", foreground: "#241b18", muted: "#6f5134", accent: "#6e3f35", card: "#fff7e8" },
};

function libraryBrand(w, palette, sequence = "") {
  return `
    <circle cx="88" cy="74" r="20" fill="none" stroke="${palette.accent}" stroke-width="1.5"/>
    <circle cx="88" cy="74" r="5" fill="${palette.accent}"/>
    <path d="M68 74h40M88 54v40" stroke="${palette.accent}" stroke-width="1" opacity=".7"/>
    ${text(["PALAVRAS DO UNIVERSO"], { x: 126, y: 82, size: 22, lineHeight: 22, fill: palette.foreground, family: "Avenir, Helvetica, Arial, sans-serif", weight: 600, tracking: 3.1 })}
    ${sequence ? text([sequence], { x: w - 72, y: 82, size: 20, lineHeight: 20, fill: palette.muted, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500, tracking: 2, anchor: "end" }) : ""}`;
}

function libraryDecor(w, h, palette, layout) {
  if (layout === "editorial") {
    return `<g opacity=".24" stroke="${palette.accent}" fill="none">
      <circle cx="${w * .86}" cy="${h * .74}" r="220"/><circle cx="${w * .86}" cy="${h * .74}" r="145"/><circle cx="${w * .86}" cy="${h * .74}" r="68"/>
      <path d="M${w * .58} ${h * .74}H${w * 1.1}M${w * .86} ${h * .51}V${h * .98}"/>
    </g>`;
  }
  if (layout === "split") {
    return `<path d="M${w * .58} 0H${w}V${h}H${w * .72}C${w * .55} ${h * .72},${w * .82} ${h * .36},${w * .58} 0Z" fill="${palette.accent}" opacity=".12"/>
      <g transform="translate(${w * .79} ${h * .69}) rotate(-14)" fill="none" stroke="${palette.accent}" opacity=".35"><ellipse rx="280" ry="110"/><ellipse rx="220" ry="220"/><circle r="46" fill="${palette.accent}" opacity=".45"/><circle cx="230" cy="-58" r="14" fill="${palette.accent}"/></g>`;
  }
  if (layout === "center") {
    return `<circle cx="${w / 2}" cy="${h * .56}" r="${w * .38}" fill="${palette.backgroundAlt}" opacity=".34"/>
      <g transform="translate(${w / 2} ${h * .56})" fill="none" stroke="${palette.accent}" opacity=".34"><circle r="265"/><circle r="188"/><circle r="92"/><path d="M-300 0H300M0-300V300"/></g>`;
  }
  if (layout === "panel") {
    return `<rect x="54" y="170" width="${w - 108}" height="${h - 310}" rx="44" fill="${palette.card}" opacity=".9" stroke="${palette.accent}" stroke-opacity=".28"/>
      <circle cx="${w * .82}" cy="${h * .77}" r="170" fill="${palette.accent}" opacity=".08"/>`;
  }
  return `<circle cx="${w * .78}" cy="${h * .68}" r="310" fill="${palette.backgroundAlt}" opacity=".35"/>
    <g transform="translate(${w * .78} ${h * .68})" fill="none" stroke="${palette.accent}" opacity=".38"><ellipse rx="300" ry="118" transform="rotate(24)"/><ellipse rx="275" ry="155" transform="rotate(-20)"/><circle r="70" fill="${palette.accent}" opacity=".38"/></g>`;
}

function libraryCta(x, y, width, label, palette) {
  const buttonFill = palette.background === "#e0bd70" ? palette.foreground : palette.accent;
  const buttonText = palette.background === "#e0bd70" ? palette.backgroundAlt : colors.ink;
  return `<rect x="${x}" y="${y}" width="${width}" height="76" rx="38" fill="${buttonFill}"/>
    ${text([label], { x: x + width / 2, y: y + 49, size: 23, lineHeight: 23, fill: buttonText, family: "Avenir, Helvetica, Arial, sans-serif", weight: 700, anchor: "middle" })}`;
}

function libraryBase({ w, h, theme, layout }) {
  const palette = libraryThemes[theme];
  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="libraryBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${palette.background}"/><stop offset="1" stop-color="${palette.backgroundAlt}"/></linearGradient>
      <radialGradient id="libraryGlow"><stop offset="0" stop-color="${palette.accent}" stop-opacity=".24"/><stop offset="1" stop-color="${palette.accent}" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#libraryBg)"/>
    <circle cx="${w * .1}" cy="${h * .05}" r="${w * .42}" fill="url(#libraryGlow)"/>
    ${libraryDecor(w, h, palette, layout)}
    <rect x="28" y="28" width="${w - 56}" height="${h - 56}" rx="26" fill="none" stroke="${palette.accent}" stroke-opacity=".3"/>
  </svg>`;
}

function libraryCard({ format, sequence, eyebrowText, titleLines, bodyLines = [], price, priceNote, ctaText, theme = "plum", layout = "editorial" }) {
  const size = format === "feed" ? portrait : story;
  const vertical = format !== "feed";
  const palette = libraryThemes[theme];
  const centered = layout === "center";
  const panel = layout === "panel";
  const contentX = centered ? size.w / 2 : panel ? 104 : 72;
  const anchor = centered ? "middle" : "start";
  const titleY = vertical ? (centered ? 520 : panel ? 410 : 430) : (centered ? 380 : panel ? 300 : 300);
  const titleSize = vertical ? (centered ? 88 : 96) : (centered ? 70 : 76);
  const titleLineHeight = vertical ? 108 : 86;
  const bodyY = titleY + titleLines.length * titleLineHeight + (vertical ? 84 : 58);
  const bodySize = vertical ? 35 : 29;
  const bodyLineHeight = vertical ? 52 : 43;
  const priceY = bodyY;
  const bodyStart = price ? priceY + (vertical ? 190 : 145) : bodyY;
  const buttonY = vertical ? 1460 : 1090;
  const eyebrowX = centered ? size.w / 2 : contentX;
  const buttonX = centered ? (size.w - (vertical ? 560 : 500)) / 2 : contentX;
  const footerColor = palette.muted;
  const overlayContent = `
    ${text([eyebrowText.toUpperCase()], { x: eyebrowX, y: vertical ? 250 : 195, size: 22, lineHeight: 28, fill: palette.accent, family: "Avenir, Helvetica, Arial, sans-serif", weight: 700, tracking: 4.2, anchor })}
    ${text(titleLines, { x: contentX, y: titleY, size: titleSize, lineHeight: titleLineHeight, fill: palette.foreground, weight: 600, anchor })}
    ${price ? text([price], { x: contentX, y: priceY, size: vertical ? 94 : 76, lineHeight: 96, fill: palette.accent, weight: 600, anchor }) : ""}
    ${priceNote ? text([priceNote], { x: contentX, y: priceY + (vertical ? 62 : 54), size: vertical ? 27 : 22, lineHeight: 30, fill: palette.muted, family: "Avenir, Helvetica, Arial, sans-serif", weight: 600, tracking: .5, anchor }) : ""}
    ${bodyLines.length ? text(bodyLines, { x: contentX, y: bodyStart, size: bodySize, lineHeight: bodyLineHeight, fill: palette.muted, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500, anchor }) : ""}
    ${ctaText ? libraryCta(buttonX, buttonY, vertical ? 560 : 500, ctaText, palette) : ""}
    <line x1="72" x2="${size.w - 72}" y1="${size.h - 90}" y2="${size.h - 90}" stroke="${palette.accent}" stroke-opacity=".32"/>
    ${text(["palavrasdouniverso.com/astrologia"], { x: 72, y: size.h - 48, size: 20, lineHeight: 20, fill: footerColor, family: "Avenir, Helvetica, Arial, sans-serif", weight: 500, tracking: 1.2 })}
  `;
  const scrimHeight = vertical ? 900 : 690;
  const scrim = centered
    ? `<rect x="34" y="120" width="${size.w - 68}" height="${scrimHeight}" rx="38" fill="url(#centerScrim)"/>`
    : `<rect x="0" y="110" width="${size.w}" height="${scrimHeight}" fill="url(#readingScrim)" mask="url(#verticalFade)"/>`;
  return {
    svg: libraryBase({ ...size, theme, layout }),
    overlaySvg: `<?xml version="1.0" encoding="UTF-8"?>
      <svg xmlns="http://www.w3.org/2000/svg" width="${size.w}" height="${size.h}" viewBox="0 0 ${size.w} ${size.h}">
        <defs>
          <linearGradient id="readingScrim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="${palette.background}" stop-opacity=".96"/>
            <stop offset=".58" stop-color="${palette.background}" stop-opacity=".82"/>
            <stop offset="1" stop-color="${palette.background}" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="centerScrim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="${palette.background}" stop-opacity=".94"/>
            <stop offset=".72" stop-color="${palette.background}" stop-opacity=".76"/>
            <stop offset="1" stop-color="${palette.background}" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="verticalFadeGradient" gradientUnits="userSpaceOnUse" x1="0" y1="110" x2="0" y2="${110 + scrimHeight}">
            <stop offset="0" stop-color="white"/>
            <stop offset=".72" stop-color="white"/>
            <stop offset="1" stop-color="black"/>
          </linearGradient>
          <mask id="verticalFade" maskUnits="userSpaceOnUse" x="0" y="110" width="${size.w}" height="${scrimHeight}"><rect x="0" y="110" width="${size.w}" height="${scrimHeight}" fill="url(#verticalFadeGradient)"/></mask>
        </defs>
        ${scrim}
        ${libraryBrand(size.w, palette, sequence)}
        ${overlayContent}
      </svg>`,
  };
}

function themeForPost(post, index = 0) {
  const themesByPillar = {
    "Oferta": ["gold", "plum", "rose"],
    "Educação": ["paper", "sage", "indigo"],
    "Experiência": ["indigo", "rose", "sage"],
    "Curiosidade": ["rose", "indigo", "plum"],
    "Interação": ["sage", "paper", "rose"],
    "Confiança": ["paper", "plum", "sage"],
  };
  const options = themesByPillar[post.pillar] ?? ["plum"];
  return options[index % options.length];
}

function layoutForPost(post, index = 0) {
  const layoutsByPillar = {
    "Oferta": ["poster", "split", "center"],
    "Educação": ["editorial", "split", "panel", "center"],
    "Experiência": ["center", "panel", "split"],
    "Curiosidade": ["center", "split", "poster"],
    "Interação": ["panel", "center", "editorial"],
    "Confiança": ["editorial", "center", "panel"],
  };
  const options = layoutsByPillar[post.pillar] ?? ["editorial"];
  return options[index % options.length];
}

const artCatalog = {
  sun: "public/assets/astrology/planets/sun.webp",
  moon: "public/assets/astrology/planets/moon.webp",
  venus: "public/assets/astrology/planets/venus.webp",
  mars: "public/assets/astrology/planets/mars.webp",
  map: "public/assets/astrology/sections/generated/map-hero.webp",
  natal: "public/assets/astrology/sections/generated/natal-wheel.webp",
  houses: "public/assets/astrology/sections/generated/houses-wheel.webp",
  aspects: "public/assets/astrology/sections/generated/aspects-network.webp",
  placement: "public/assets/astrology/sections/generated/planet-sign-house.webp",
  transits: "public/assets/astrology/sections/generated/transits-orbit.webp",
  zodiac: "public/assets/zodiac.webp",
  daily: "public/assets/pdu-home-daily-reading-book-cards.webp",
  portal: "public/assets/portal.webp",
  lume: "public/assets/lume-oracle.webp",
  reading: "public/assets/pdu-home-reading-book.webp",
  aries: "public/assets/astrology/zodiac-signs/pdu-aries.webp",
  taurus: "public/assets/astrology/zodiac-signs/pdu-tauro.webp",
  gemini: "public/assets/astrology/zodiac-signs/pdu-gemini.webp",
  cancer: "public/assets/astrology/zodiac-signs/pdu-cancer.webp",
  leo: "public/assets/astrology/zodiac-signs/pdu-leo.webp",
  virgo: "public/assets/astrology/zodiac-signs/pdu-virgo.webp",
  libra: "public/assets/astrology/zodiac-signs/pdu-libra.webp",
  scorpio: "public/assets/astrology/zodiac-signs/pdu-scorpio.webp",
  sagittarius: "public/assets/astrology/zodiac-signs/pdu-sagittarius.webp",
  capricorn: "public/assets/astrology/zodiac-signs/pdu-capricorn.webp",
  aquarius: "public/assets/astrology/zodiac-signs/pdu-aquarius.webp",
  pisces: "public/assets/astrology/zodiac-signs/pdu-pisces.webp",
};

const artSequences = {
  "01": ["map"],
  "02": ["natal", "sun", "moon", "map", "placement"],
  "03": ["zodiac", "sun", "moon", "houses", "natal"],
  "04": ["moon", "moon", "reading", "lume", "moon"],
  "05": ["placement", "sun", "zodiac", "houses", "aspects"],
  "06": ["sun"],
  "07": ["houses", "houses", "natal", "placement", "houses"],
  "08": ["portal", "daily", "reading", "map", "lume"],
  "09": ["aspects", "venus", "mars", "aspects", "aspects"],
  "10": ["natal"],
  "11": ["natal", "aspects", "placement", "houses", "natal"],
  "12": ["daily", "moon", "sun", "reading", "lume"],
  "13": ["portal", "daily", "reading", "map", "lume"],
  "14": ["aspects", "moonTaurus", "houses", "aspects", "natal"],
  "15": ["map"],
  "16": ["zodiac", "daily", "reading", "lume", "portal"],
};

function artForPost(post, index, format) {
  const key = artSequences[post.id]?.[index % artSequences[post.id].length];
  if (!key) return null;
  const vertical = format !== "feed";
  const signKeys = new Set(["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"]);
  const planetKeys = new Set(["sun", "moon", "venus", "mars"]);
  if (key === "moonTaurus") {
    return [
      {
        path: artCatalog.taurus,
        width: vertical ? 940 : 790,
        gravity: "south",
        x: 0,
        y: vertical ? 70 : 25,
        opacity: 1,
      },
      {
        path: artCatalog.moon,
        width: vertical ? 330 : 270,
        gravity: "southwest",
        x: vertical ? 105 : 80,
        y: vertical ? 170 : 130,
        opacity: 1,
      },
    ];
  }
  const signArt = signKeys.has(key);
  const planetArt = planetKeys.has(key);
  const layout = layoutForPost(post, index);
  const positionIndex = (Number(post.id) + index) % 2;
  const gravity = layout === "center" || ["zodiac", "natal", "houses", "aspects", "placement", "transits", "daily", "portal", "lume", "reading"].includes(key)
    ? "south"
    : layout === "split"
      ? "southeast"
      : positionIndex === 0 ? "southeast" : "southwest";
  const detailedArt = ["zodiac", "natal", "houses", "aspects", "placement", "transits", "daily", "portal", "lume", "reading"].includes(key);
  const width = key === "map"
    ? (vertical ? 1120 : 930)
    : key === "zodiac"
      ? (vertical ? 1080 : 900)
      : vertical
        ? (signArt ? 960 : planetArt ? 820 : detailedArt ? 920 : 860)
        : (signArt ? 810 : planetArt ? 680 : detailedArt ? 760 : 720);
  const y = key === "map"
    ? (vertical ? 35 : 5)
    : key === "zodiac"
      ? (vertical ? 45 : 10)
      : (vertical ? 55 : 18);
  return {
    path: artCatalog[key],
    width,
    gravity,
    x: gravity === "south" ? 0 : 22,
    y,
    opacity: 1,
  };
}

const libraryPosts = [
  {
    id: "01", slug: "mapa-completo-3990", kind: "static", pillar: "Oferta", offer: true, product: "mapa_astral",
    title: "Mapa Astral Completo", eyebrow: "CONHEÇA O SEU CÉU POR INTEIRO", titleLines: ["Mapa Astral", "Completo"],
    price: "R$39,90", priceNote: "pagamento único · sem assinatura",
    bodyLines: ["Planetas, casas, aspectos e influências", "explicados em linguagem clara."], cta: "Comece pela camada gratuita",
    caption: "Seu signo solar é uma parte da história — não a história inteira. O Mapa Astral Completo organiza planetas, casas e aspectos em uma linguagem que você consegue acompanhar.\n\nR$39,90, pagamento único e sem assinatura. Antes de decidir, você pode conhecer gratuitamente a primeira camada com Sol, Lua e Ascendente.\n\nAcesse palavrasdouniverso.com/astrologia.",
    en: {
      title: "Complete Birth Chart", eyebrow: "DISCOVER YOUR WHOLE SKY", titleLines: ["Complete", "Birth Chart"],
      price: "£17.00", priceNote: "one-time payment · no subscription",
      bodyLines: ["Planets, houses, and aspects", "explained in clear language."], cta: "Start with the free layer",
      caption: "Your Sun sign is one part of the story — not the whole story. The Complete Birth Chart organises planets, houses, and aspects in language you can follow.\n\n£17.00 as a one-time payment, with no subscription. Before deciding, you can explore the first layer with Sun, Moon, and Rising for free.\n\nVisit palavrasdouniverso.com/astrologia.",
    },
  },
  {
    id: "02", slug: "sol-lua-ascendente", kind: "carousel", pillar: "Educação",
    title: "Sol, Lua e Ascendente", eyebrow: "TRÊS PERGUNTAS DIFERENTES", titleLines: ["Você é mais", "do que o seu", "signo solar."],
    bodyLines: ["Sol, Lua e Ascendente iluminam", "partes diferentes da experiência."], cta: "Deslize para perceber",
    caption: "Sol, Lua e Ascendente não são três versões da mesma coisa.\n\nO Sol fala de identidade e direção. A Lua, de cuidado e pertencimento. O Ascendente, da sua presença e da forma como você encontra o mundo.\n\nQual desses três pontos você conhece melhor em si? Salve para voltar quando quiser observar com mais calma.",
    slides: [
      { eyebrow: "TRÊS PERGUNTAS DIFERENTES", title: ["Você é mais", "do que o seu", "signo solar."], body: ["Sol, Lua e Ascendente iluminam", "partes diferentes da experiência."] },
      { eyebrow: "SOL · IDENTIDADE E DIREÇÃO", title: ["O que mantém", "você vivo", "por dentro?"], body: ["O Sol fala de vitalidade, intenção", "e do centro que orienta escolhas."] },
      { eyebrow: "LUA · CUIDADO E PERTENCIMENTO", title: ["Do que você", "precisa para", "se sentir em casa?"], body: ["A Lua ajuda a perceber necessidades", "emocionais, ritmos e formas de cuidado."] },
      { eyebrow: "ASCENDENTE · PRESENÇA E ENTRADA", title: ["Como você", "chega ao", "mundo?"], body: ["O Ascendente fala da entrada", "e do primeiro contato com a experiência."] },
      { eyebrow: "UMA PAUSA PARA SE OBSERVAR", title: ["Qual pergunta", "tocou você", "hoje?"], body: ["Não procure uma resposta perfeita.", "Perceba o que já está vivo."], cta: "Salve para voltar" },
    ],
    en: {
      title: "Sun, Moon, and Rising", eyebrow: "THREE DIFFERENT QUESTIONS", titleLines: ["You are more", "than your", "Sun sign."],
      bodyLines: ["Sun, Moon, and Rising illuminate", "different parts of experience."], cta: "Swipe and notice",
      caption: "Sun, Moon, and Rising are not three versions of the same thing.\n\nThe Sun speaks to identity and direction. The Moon, to care and belonging. The Rising sign, to your presence and the way you meet the world.\n\nWhich of these three points do you recognise most clearly in yourself? Save this for a quieter moment.",
      slides: [
        { eyebrow: "THREE DIFFERENT QUESTIONS", title: ["You are more", "than your", "Sun sign."], body: ["Sun, Moon, and Rising illuminate", "different parts of experience."] },
        { eyebrow: "SUN · IDENTITY AND DIRECTION", title: ["What keeps you", "alive on", "the inside?"], body: ["The Sun speaks to vitality, intention,", "and the centre that guides your choices."] },
        { eyebrow: "MOON · CARE AND BELONGING", title: ["What do you need", "to feel at home?"], body: ["The Moon helps reveal emotional needs,", "rhythms, and ways of caring."] },
        { eyebrow: "RISING · PRESENCE AND ENTRY", title: ["How do you", "enter the", "world?"], body: ["The Rising sign speaks to beginnings", "and your first contact with experience."] },
        { eyebrow: "A MOMENT TO NOTICE", title: ["Which question", "stayed with", "you today?"], body: ["Do not look for a perfect answer.", "Notice what is already alive."], cta: "Save for later" },
      ],
    },
  },
  {
    id: "03", slug: "mesmo-signo-vidas-diferentes", kind: "carousel", pillar: "Curiosidade",
    title: "Mesmo signo, vidas diferentes", eyebrow: "UMA CURIOSIDADE DO MAPA", titleLines: ["Por que duas", "pessoas do mesmo", "signo são diferentes?"],
    bodyLines: ["Porque o signo solar", "nunca conta a história sozinho."], cta: "Deslize para descobrir",
    caption: "Duas pessoas podem nascer sob o mesmo signo solar e ainda assim perceber, escolher e reagir de formas muito diferentes.\n\nA Lua muda as necessidades emocionais. O Ascendente muda a forma de entrar na experiência. Casas e aspectos dão contexto. E nenhuma leitura substitui a história vivida.\n\nMarque alguém do mesmo signo que você — mas completamente diferente.",
    slides: [
      { eyebrow: "UMA CURIOSIDADE DO MAPA", title: ["Mesmo signo.", "Vidas muito", "diferentes."], body: ["O signo solar não conta", "a história sozinho."] },
      { eyebrow: "A LUA MUDA O RITMO", title: ["Necessidades", "emocionais não", "são iguais."], body: ["Cada pessoa encontra segurança", "e pertencimento de um jeito."] },
      { eyebrow: "O ASCENDENTE MUDA A ENTRADA", title: ["O mundo encontra", "cada pessoa", "por uma porta."], body: ["Presença e primeira impressão", "também fazem parte do mapa."] },
      { eyebrow: "CASAS E ASPECTOS DÃO CONTEXTO", title: ["O símbolo muda", "quando encontra", "outras camadas."], body: ["Uma posição nunca existe", "completamente isolada."] },
      { eyebrow: "E EXISTE A VIDA VIVIDA", title: ["Mapa não é", "molde de", "personalidade."], body: ["História, cultura e escolhas", "continuam importando."], cta: "Envie para alguém do mesmo signo" },
    ],
    en: {
      title: "Same sign, different lives", eyebrow: "A CHART CURIOSITY", titleLines: ["Why can two", "people with the", "same sign differ?"],
      bodyLines: ["Because the Sun sign", "never tells the story alone."], cta: "Swipe to discover",
      caption: "Two people can share the same Sun sign and still perceive, choose, and respond in very different ways.\n\nThe Moon changes emotional needs. The Rising sign changes how someone enters experience. Houses and aspects provide context. And no reading replaces a lived story.\n\nTag someone who shares your sign but feels completely different.",
      slides: [
        { eyebrow: "A CHART CURIOSITY", title: ["Same sign.", "Very different", "lives."], body: ["The Sun sign never tells", "the story alone."] },
        { eyebrow: "THE MOON CHANGES THE RHYTHM", title: ["Emotional needs", "are not", "the same."], body: ["Each person finds safety", "and belonging differently."] },
        { eyebrow: "RISING CHANGES THE ENTRY", title: ["The world meets", "each person through", "a different door."], body: ["Presence and first impressions", "are part of the chart too."] },
        { eyebrow: "HOUSES AND ASPECTS ADD CONTEXT", title: ["A symbol changes", "when it meets", "other layers."], body: ["No placement exists", "entirely on its own."] },
        { eyebrow: "AND THERE IS LIVED EXPERIENCE", title: ["A chart is not", "a personality", "template."], body: ["History, culture, and choices", "still matter."], cta: "Share with someone of your sign" },
      ],
    },
  },
  {
    id: "04", slug: "pausa-da-lua", kind: "video", pillar: "Experiência",
    title: "Uma pausa guiada pela Lua", eyebrow: "UM MINUTO PARA VOCÊ", titleLines: ["Do que você", "precisa para", "se sentir em casa?"],
    bodyLines: ["Não responda depressa.", "Perceba primeiro."], cta: "Respire e fique um instante",
    caption: "Uma pausa pequena para uma pergunta que nem sempre cabe na pressa: do que você precisa para se sentir em casa dentro da própria vida?\n\nTalvez seja silêncio. Talvez seja limite. Talvez seja uma conversa que você vem adiando.\n\nNão precisa responder agora. Apenas perceba o que o corpo reconheceu primeiro.\n\n#pausa #autopercepcao #lua #palavrasdouniverso",
    frames: [
      { eyebrow: "UM MINUTO PARA VOCÊ", title: ["Respire sem", "tentar resolver", "nada."], body: ["Só volte para onde você está."] },
      { eyebrow: "A PERGUNTA DA LUA", title: ["Do que você", "precisa para", "se sentir em casa?"], body: ["Dentro do corpo.", "Dentro da própria vida."] },
      { eyebrow: "NÃO PROCURE A RESPOSTA CERTA", title: ["Perceba o que", "veio primeiro."], body: ["Uma imagem. Uma palavra.", "Uma sensação."] },
      { eyebrow: "CUIDADO TAMBÉM É LIMITE", title: ["O que você pode", "não carregar", "hoje?"], body: ["Uma escolha pequena já conta."] },
      { eyebrow: "LEVE A PERGUNTA COM VOCÊ", title: ["O que faz você", "se sentir", "em casa?"], body: ["Volte quando precisar."], cta: "Salve esta pausa" },
    ],
    en: {
      title: "A pause guided by the Moon", eyebrow: "ONE MINUTE FOR YOU", titleLines: ["What do you need", "to feel", "at home?"],
      bodyLines: ["Do not answer too quickly.", "Notice first."], cta: "Breathe and stay a moment",
      caption: "A small pause for a question that does not always fit inside a busy day: what do you need to feel at home within your own life?\n\nPerhaps it is silence. Perhaps it is a boundary. Perhaps it is a conversation you have been postponing.\n\nYou do not need to answer now. Just notice what your body recognised first.\n\n#pause #selfawareness #moon #palavrasdouniverso",
      frames: [
        { eyebrow: "ONE MINUTE FOR YOU", title: ["Breathe without", "trying to fix", "anything."], body: ["Simply return to where you are."] },
        { eyebrow: "THE MOON'S QUESTION", title: ["What do you need", "to feel", "at home?"], body: ["Inside your body.", "Inside your own life."] },
        { eyebrow: "DO NOT SEEK THE RIGHT ANSWER", title: ["Notice what", "came first."], body: ["An image. A word.", "A sensation."] },
        { eyebrow: "CARE CAN ALSO BE A BOUNDARY", title: ["What can you", "choose not to", "carry today?"], body: ["One small choice still matters."] },
        { eyebrow: "TAKE THE QUESTION WITH YOU", title: ["What helps you", "feel at", "home?"], body: ["Return whenever you need."], cta: "Save this pause" },
      ],
    },
  },
  {
    id: "05", slug: "planeta-signo-casa", kind: "carousel", pillar: "Educação",
    title: "Planeta, signo e casa", eyebrow: "TRÊS PARTES DA MESMA FRASE", titleLines: ["Planeta, signo,", "casa."],
    bodyLines: ["O quê. Como. Onde."], cta: "Aprenda a ler",
    caption: "Uma posição astrológica não é apenas um signo.\n\nO planeta mostra o que está falando. O signo mostra como essa parte se expressa. A casa mostra onde esse tema encontra a vida concreta. Os aspectos revelam como diferentes partes do mapa conversam.\n\nExperimente ler assim: planeta é o verbo, signo é o modo e casa é o cenário.",
    slides: [
      { eyebrow: "COMO LER UM POSICIONAMENTO", title: ["Planeta, signo,", "casa."], body: ["O quê. Como. Onde."] },
      { eyebrow: "O PLANETA", title: ["O que está", "falando?"], body: ["O planeta representa uma função", "ou parte da experiência."] },
      { eyebrow: "O SIGNO", title: ["Como essa parte", "se expressa?"], body: ["O signo dá linguagem, ritmo", "e qualidade ao planeta."] },
      { eyebrow: "A CASA", title: ["Onde esse tema", "encontra a vida?"], body: ["A casa aponta uma área concreta", "da experiência vivida."] },
      { eyebrow: "UMA FRASE SIMBÓLICA", title: ["Verbo + modo", "+ cenário."], body: ["Uma forma simples de começar", "a observar o mapa."], cta: "Salve este guia" },
    ],
    en: {
      title: "Planet, sign, and house", eyebrow: "THREE PARTS OF ONE SENTENCE", titleLines: ["Planet, sign,", "house."],
      bodyLines: ["What. How. Where."], cta: "Learn to read",
      caption: "An astrological placement is not only a sign.\n\nThe planet shows what is speaking. The sign shows how that part expresses itself. The house shows where the theme meets everyday life. Aspects reveal how different parts of the chart communicate.\n\nTry reading it this way: the planet is the verb, the sign is the manner, and the house is the setting.",
      slides: [
        { eyebrow: "HOW TO READ A PLACEMENT", title: ["Planet, sign,", "house."], body: ["What. How. Where."] },
        { eyebrow: "THE PLANET", title: ["What is", "speaking?"], body: ["The planet represents a function", "or part of experience."] },
        { eyebrow: "THE SIGN", title: ["How does it", "express itself?"], body: ["The sign gives the planet", "language, rhythm, and quality."] },
        { eyebrow: "THE HOUSE", title: ["Where does this", "meet life?"], body: ["The house points to a concrete", "area of lived experience."] },
        { eyebrow: "A SYMBOLIC SENTENCE", title: ["Verb + manner", "+ setting."], body: ["A simple way to begin", "observing a chart."], cta: "Save this guide" },
      ],
    },
  },
  {
    id: "06", slug: "escolha-um-simbolo", kind: "static", pillar: "Interação",
    title: "Escolha um símbolo", eyebrow: "SEM PENSAR DEMAIS", titleLines: ["Sol.", "Lua.", "Ascendente."],
    bodyLines: ["Qual palavra chamou você primeiro?", "Conte nos comentários."], cta: "Escolha antes de ler a legenda",
    caption: "Sem pesquisar e sem tentar acertar: qual palavra chamou você primeiro — Sol, Lua ou Ascendente?\n\nSol pode falar do que quer ganhar forma. Lua, do que precisa ser cuidado. Ascendente, da maneira como você está chegando a uma nova experiência.\n\nNão é um teste nem uma previsão. É apenas uma porta para perceber onde a sua atenção pousou hoje.",
    en: {
      title: "Choose a symbol", eyebrow: "WITHOUT OVERTHINKING", titleLines: ["Sun.", "Moon.", "Rising."],
      bodyLines: ["Which word called you first?", "Tell us in the comments."], cta: "Choose before reading",
      caption: "Without searching and without trying to get it right: which word called you first — Sun, Moon, or Rising?\n\nSun can speak to what wants to take shape. Moon, to what needs care. Rising, to how you are entering a new experience.\n\nThis is not a test or a prediction. It is simply a doorway into noticing where your attention landed today.",
    },
  },
  {
    id: "07", slug: "o-que-sao-casas", kind: "carousel", pillar: "Educação",
    title: "O que são as casas", eyebrow: "AS DOZE CASAS", titleLines: ["Onde o céu", "encontra", "a vida."],
    bodyLines: ["Casas são áreas da experiência,", "não previsões de acontecimentos."], cta: "Entenda em cinco telas",
    caption: "As casas astrológicas mostram onde a história de um planeta ganha contexto na vida.\n\nElas não são rótulos de personalidade nem garantias de acontecimentos. Relações, trabalho, casa, criatividade e outros territórios aparecem como campos de experiência.\n\nQual área da sua vida parece estar pedindo mais presença agora?",
    slides: [
      { eyebrow: "AS DOZE CASAS", title: ["Onde o céu", "encontra", "a vida."], body: ["Casas são áreas da experiência,", "não previsões."] },
      { eyebrow: "UMA ÁREA DE EXPERIÊNCIA", title: ["A casa mostra", "onde um tema", "ganha contexto."], body: ["Ela não define quem você é", "e não funciona isoladamente."] },
      { eyebrow: "O ASCENDENTE ABRE A SEQUÊNCIA", title: ["Cada mapa", "organiza as casas", "de um jeito próprio."], body: ["Por isso a hora e o local", "de nascimento importam."] },
      { eyebrow: "UM PLANETA EM UMA CASA", title: ["Uma função", "encontra um", "território da vida."], body: ["O símbolo ganha cenário", "e experiência concreta."] },
      { eyebrow: "UMA PERGUNTA, NÃO UMA SENTENÇA", title: ["Onde este tema", "pede presença?"], body: ["A casa abre observação.", "Não fecha o futuro."], cta: "Salve para consultar" },
    ],
    en: {
      title: "What are houses?", eyebrow: "THE TWELVE HOUSES", titleLines: ["Where the sky", "meets", "life."],
      bodyLines: ["Houses are areas of experience,", "not predictions of events."], cta: "Understand in five slides",
      caption: "Astrological houses show where a planet's story gains context in life.\n\nThey are not personality labels or guarantees of events. Relationships, work, home, creativity, and other territories appear as fields of experience.\n\nWhich area of your life seems to be asking for more presence now?",
      slides: [
        { eyebrow: "THE TWELVE HOUSES", title: ["Where the sky", "meets", "life."], body: ["Houses are areas of experience,", "not predictions."] },
        { eyebrow: "AN AREA OF EXPERIENCE", title: ["A house shows", "where a theme", "gains context."], body: ["It does not define who you are", "and never works alone."] },
        { eyebrow: "RISING OPENS THE SEQUENCE", title: ["Every chart", "organises houses", "in its own way."], body: ["That is why birth time", "and place matter."] },
        { eyebrow: "A PLANET IN A HOUSE", title: ["A function meets", "a territory", "of life."], body: ["The symbol gains a setting", "and concrete experience."] },
        { eyebrow: "A QUESTION, NOT A SENTENCE", title: ["Where does this", "ask for presence?"], body: ["A house opens observation.", "It does not close the future."], cta: "Save for reference" },
      ],
    },
  },
  {
    id: "08", slug: "por-dentro-do-pdu", kind: "video", pillar: "Experiência",
    title: "Por dentro do PDU", eyebrow: "NÃO É SÓ UM MAPA", titleLines: ["Um lugar para", "parar, perceber", "e continuar."],
    bodyLines: ["Carta do dia, leituras, astrologia,", "Lume e memória da sua jornada."], cta: "Veja as portas do PDU",
    caption: "O Palavras do Universo não foi criado para entregar uma frase pronta e encerrar a conversa.\n\nVocê pode abrir uma carta do dia, fazer uma leitura, conhecer o seu mapa, conversar com Lume e guardar percepções no Meu Universo. Cada porta tem um ritmo, mas todas devolvem a escolha para você.\n\nQual dessas experiências você gostaria de conhecer primeiro?",
    frames: [
      { eyebrow: "POR DENTRO DO PDU", title: ["Não é só", "um mapa."], body: ["É um espaço para voltar", "a si com mais clareza."] },
      { eyebrow: "CARTA DO DIA", title: ["Um símbolo para", "acompanhar", "o agora."], body: ["Sem prever o seu dia.", "Com uma pergunta para vivê-lo."] },
      { eyebrow: "LEITURAS", title: ["Cartas em", "conversa com", "uma questão real."], body: ["Linguagem simbólica", "sem respostas automáticas."] },
      { eyebrow: "ASTROLOGIA", title: ["Um céu lido", "por camadas."], body: ["Planetas, casas e aspectos", "encontrando a vida vivida."] },
      { eyebrow: "LUME + MEU UNIVERSO", title: ["Uma presença para", "continuar a", "conversa."], body: ["Reflexões e memória", "sem tirar sua autonomia."], cta: "Qual porta você abriria?" },
    ],
    en: {
      title: "Inside PDU", eyebrow: "MORE THAN A CHART", titleLines: ["A place to", "pause, notice,", "and continue."],
      bodyLines: ["Daily card, readings, astrology,", "Lume, and memory of your journey."], cta: "See the doors of PDU",
      caption: "Palavras do Universo was not created to deliver a ready-made sentence and end the conversation.\n\nYou can open a daily card, explore a reading, discover your chart, talk with Lume, and keep insights in Meu Universo. Each doorway has its own rhythm, but every one returns the choice to you.\n\nWhich experience would you like to explore first?",
      frames: [
        { eyebrow: "INSIDE PDU", title: ["More than", "a chart."], body: ["A space to return", "to yourself with clarity."] },
        { eyebrow: "DAILY CARD", title: ["A symbol to", "accompany", "the present."], body: ["Not to predict your day.", "To offer a question for it."] },
        { eyebrow: "READINGS", title: ["Cards in", "conversation with", "a real question."], body: ["Symbolic language", "without automatic answers."] },
        { eyebrow: "ASTROLOGY", title: ["A sky read", "in layers."], body: ["Planets, houses, and aspects", "meeting lived experience."] },
        { eyebrow: "LUME + MEU UNIVERSO", title: ["A presence to", "continue the", "conversation."], body: ["Reflection and memory", "without taking your autonomy."], cta: "Which door would you open?" },
      ],
    },
  },
  {
    id: "09", slug: "o-que-sao-aspectos", kind: "carousel", pillar: "Educação",
    title: "O que são aspectos", eyebrow: "CONVERSAS NO CÉU", titleLines: ["Aspectos mostram", "como os símbolos", "se relacionam."],
    bodyLines: ["Fluxo, tensão e integração", "também fazem parte da leitura."], cta: "Entenda a relação",
    caption: "Aspectos são relações geométricas entre os planetas do mapa.\n\nEles não tornam um símbolo bom ou ruim. Mostram se duas partes da experiência tendem a fluir, criar atrito ou pedir integração.\n\nPense em duas necessidades suas que nem sempre concordam. O que poderia ser uma terceira via entre elas?",
    slides: [
      { eyebrow: "CONVERSAS NO CÉU", title: ["Aspectos mostram", "como os símbolos", "se relacionam."], body: ["Eles conectam diferentes", "partes do mapa."] },
      { eyebrow: "FLUXO", title: ["Algumas partes", "se reconhecem", "com facilidade."], body: ["Recursos podem circular", "de modo mais espontâneo."] },
      { eyebrow: "TENSÃO", title: ["Outras partes", "pedem trabalho", "e consciência."], body: ["Atrito não é castigo.", "Também produz movimento."] },
      { eyebrow: "INTEGRAÇÃO", title: ["Duas necessidades", "podem pedir", "uma terceira via."], body: ["O aspecto abre uma pergunta.", "Não fecha uma conclusão."] },
      { eyebrow: "TRAGA PARA A VIDA", title: ["O que em você", "precisa conversar", "melhor?"], body: ["Observe sem escolher", "um lado depressa demais."], cta: "Guarde esta pergunta" },
    ],
    en: {
      title: "What are aspects?", eyebrow: "CONVERSATIONS IN THE SKY", titleLines: ["Aspects show", "how symbols", "relate."],
      bodyLines: ["Flow, tension, and integration", "also belong in a reading."], cta: "Understand the relationship",
      caption: "Aspects are geometric relationships between planets in a chart.\n\nThey do not make a symbol good or bad. They show whether two parts of experience tend to flow, create friction, or ask for integration.\n\nThink of two needs within you that do not always agree. What could become a third way between them?",
      slides: [
        { eyebrow: "CONVERSATIONS IN THE SKY", title: ["Aspects show", "how symbols", "relate."], body: ["They connect different", "parts of the chart."] },
        { eyebrow: "FLOW", title: ["Some parts", "recognise each", "other easily."], body: ["Resources can circulate", "more spontaneously."] },
        { eyebrow: "TENSION", title: ["Other parts", "ask for work", "and awareness."], body: ["Friction is not punishment.", "It can also create movement."] },
        { eyebrow: "INTEGRATION", title: ["Two needs may", "ask for", "a third way."], body: ["An aspect opens a question.", "It does not close a conclusion."] },
        { eyebrow: "BRING IT INTO LIFE", title: ["What in you", "needs a better", "conversation?"], body: ["Observe before choosing", "one side too quickly."], cta: "Keep this question" },
      ],
    },
  },
  {
    id: "10", slug: "o-que-o-mapa-nao-diz", kind: "static", pillar: "Curiosidade",
    title: "O que o mapa não diz", eyebrow: "UM LIMITE IMPORTANTE", titleLines: ["Seu mapa não", "sabe quem você", "vai escolher ser."],
    bodyLines: ["Ele oferece linguagem e contexto.", "A vida continua sendo sua."], cta: "Mais perguntas, menos rótulos",
    caption: "Um mapa pode mostrar símbolos, relações e temas. Mas ele não conhece toda a sua história, não prevê cada escolha e não decide quem você será.\n\nA leitura ganha sentido quando encontra contexto, consciência e vida vivida.\n\nQual rótulo você gostaria de deixar de carregar?",
    en: {
      title: "What a chart cannot say", eyebrow: "AN IMPORTANT LIMIT", titleLines: ["Your chart does", "not know who you", "will choose to be."],
      bodyLines: ["It offers language and context.", "Your life remains yours."], cta: "More questions, fewer labels",
      caption: "A chart can show symbols, relationships, and themes. But it does not know your whole story, predict every choice, or decide who you will become.\n\nA reading gains meaning when it meets context, awareness, and lived experience.\n\nWhich label would you like to stop carrying?",
    },
  },
  {
    id: "11", slug: "astrologia-sem-destino", kind: "carousel", pillar: "Confiança",
    title: "Astrologia sem determinismo", eyebrow: "NÃO É DESTINO FIXO", titleLines: ["O mapa não", "decide por", "você."],
    bodyLines: ["Ele oferece contexto para", "perceber padrões e escolhas."], cta: "Conheça nossa abordagem",
    caption: "No Palavras do Universo, astrologia não é destino fixo.\n\nO mapa não garante acontecimentos, não substitui cuidado profissional e não retira sua liberdade de escolha. Ele funciona como uma linguagem simbólica para perceber padrões, necessidades e possibilidades.\n\nO céu oferece contexto. A escolha continua sendo sua.",
    slides: [
      { eyebrow: "ASTROLOGIA SEM DETERMINISMO", title: ["O mapa não", "decide por", "você."], body: ["Ele oferece contexto."] },
      { eyebrow: "NÃO É PREVISÃO FECHADA", title: ["Nenhum símbolo", "garante um", "acontecimento."], body: ["Possibilidade não precisa", "virar sentença."] },
      { eyebrow: "É UMA LINGUAGEM SIMBÓLICA", title: ["Padrões.", "Necessidades.", "Possibilidades."], body: ["Símbolos ganham sentido quando", "encontram a experiência vivida."] },
      { eyebrow: "CONTEXTO PARA ESCOLHAS", title: ["Mais perguntas.", "Menos rótulos."], body: ["Percepção pode crescer", "sem retirar responsabilidade."] },
      { eyebrow: "A ESCOLHA CONTINUA SENDO SUA", title: ["Seu céu pode", "acompanhar.", "Nunca mandar."], body: ["Use a linguagem.", "Preserve a sua autonomia."], cta: "Compartilhe esta abordagem" },
    ],
    en: {
      title: "Astrology without determinism", eyebrow: "NOT A FIXED DESTINY", titleLines: ["A chart does", "not decide", "for you."],
      bodyLines: ["It offers context for", "noticing patterns and choices."], cta: "Discover our approach",
      caption: "At Palavras do Universo, astrology is not fixed destiny.\n\nA chart does not guarantee events, replace professional care, or remove your freedom to choose. It works as a symbolic language for noticing patterns, needs, and possibilities.\n\nThe sky offers context. The choice remains yours.",
      slides: [
        { eyebrow: "ASTROLOGY WITHOUT DETERMINISM", title: ["A chart does", "not decide", "for you."], body: ["It offers context."] },
        { eyebrow: "NOT A CLOSED PREDICTION", title: ["No symbol", "guarantees an", "event."], body: ["Possibility does not need", "to become a sentence."] },
        { eyebrow: "A SYMBOLIC LANGUAGE", title: ["Patterns.", "Needs.", "Possibilities."], body: ["Symbols gain meaning when", "they meet lived experience."] },
        { eyebrow: "CONTEXT FOR CHOICES", title: ["More questions.", "Fewer labels."], body: ["Awareness can grow without", "removing responsibility."] },
        { eyebrow: "THE CHOICE REMAINS YOURS", title: ["Your sky may", "accompany you.", "Never command."], body: ["Use the language.", "Keep your autonomy."], cta: "Share this approach" },
      ],
    },
  },
  {
    id: "12", slug: "tres-perguntas-para-hoje", kind: "video", pillar: "Experiência",
    title: "Três perguntas para hoje", eyebrow: "UMA EXPERIÊNCIA DE UM MINUTO", titleLines: ["Três perguntas.", "Nenhuma resposta", "automática."],
    bodyLines: ["Escolha a que encontrou você."], cta: "Leve uma pergunta",
    caption: "Três perguntas para atravessar o dia com um pouco mais de presença:\n\nO que quer ganhar forma?\nO que precisa ser cuidado?\nComo você deseja chegar?\n\nEscolha apenas uma. Anote em algum lugar e volte a ela antes de dormir.\n\n#reflexao #presenca #palavrasdouniverso",
    frames: [
      { eyebrow: "UMA EXPERIÊNCIA DE UM MINUTO", title: ["Não procure", "uma resposta", "automática."], body: ["Escolha a pergunta", "que encontrou você."] },
      { eyebrow: "PERGUNTA DO SOL", title: ["O que quer", "ganhar forma", "através de você?"], body: ["Uma intenção.", "Um gesto concreto."] },
      { eyebrow: "PERGUNTA DA LUA", title: ["O que precisa", "ser cuidado", "hoje?"], body: ["Sem exagerar.", "Sem abandonar."] },
      { eyebrow: "PERGUNTA DO ASCENDENTE", title: ["Como você", "deseja chegar", "ao que vem?"], body: ["Com pressa? Com presença?", "Com qual limite?"] },
      { eyebrow: "ESCOLHA UMA", title: ["Leve a pergunta", "com você."], body: ["Volte a ela antes de dormir."], cta: "Salve para hoje" },
    ],
    en: {
      title: "Three questions for today", eyebrow: "A ONE-MINUTE EXPERIENCE", titleLines: ["Three questions.", "No automatic", "answers."],
      bodyLines: ["Choose the one that found you."], cta: "Take one question with you",
      caption: "Three questions for moving through the day with a little more presence:\n\nWhat wants to take shape?\nWhat needs care?\nHow do you want to arrive?\n\nChoose only one. Write it somewhere and return to it before sleep.\n\n#reflection #presence #palavrasdouniverso",
      frames: [
        { eyebrow: "A ONE-MINUTE EXPERIENCE", title: ["Do not look", "for an automatic", "answer."], body: ["Choose the question", "that found you."] },
        { eyebrow: "THE SUN'S QUESTION", title: ["What wants", "to take shape", "through you?"], body: ["An intention.", "One concrete gesture."] },
        { eyebrow: "THE MOON'S QUESTION", title: ["What needs", "care today?"], body: ["Without exaggerating.", "Without abandoning."] },
        { eyebrow: "THE RISING QUESTION", title: ["How do you", "want to arrive", "at what comes next?"], body: ["With urgency? With presence?", "With what boundary?"] },
        { eyebrow: "CHOOSE ONE", title: ["Take the question", "with you."], body: ["Return to it before sleep."], cta: "Save for today" },
      ],
    },
  },
  {
    id: "13", slug: "experiencia-pdu", kind: "carousel", pillar: "Experiência",
    title: "A experiência PDU", eyebrow: "UMA EXPERIÊNCIA QUE CONTINUA", titleLines: ["Entrar.", "Perceber.", "Guardar."],
    bodyLines: ["O PDU acompanha perguntas", "sem entregar respostas prontas."], cta: "Conheça as camadas",
    caption: "A experiência do Palavras do Universo não termina quando uma carta vira ou quando um mapa aparece.\n\nVocê entra por uma pergunta, encontra símbolos com contexto, guarda o que fez sentido e pode continuar a conversa depois. O objetivo não é fazer você depender de uma resposta. É ajudar você a perceber melhor.\n\nO que faria uma experiência simbólica realmente cuidar do seu tempo?",
    slides: [
      { eyebrow: "A EXPERIÊNCIA PDU", title: ["Entrar.", "Perceber.", "Guardar."], body: ["Uma jornada que respeita", "o seu próprio ritmo."] },
      { eyebrow: "ENTRAR POR UMA PERGUNTA", title: ["A vida vem", "antes do", "símbolo."], body: ["A experiência começa", "no que é real para você."] },
      { eyebrow: "ENCONTRAR CONTEXTO", title: ["Nada de frases", "soltas ou", "genéricas."], body: ["Símbolos em relação", "com a pergunta e o momento."] },
      { eyebrow: "GUARDAR O QUE FEZ SENTIDO", title: ["Sua jornada", "não precisa", "sumir."], body: ["Percepções podem voltar", "quando o tempo mudar."] },
      { eyebrow: "CONTINUAR SEM DEPENDER", title: ["Mais autonomia.", "Menos resposta", "pronta."], body: ["O PDU acompanha.", "A escolha permanece sua."], cta: "Como seria para você?" },
    ],
    en: {
      title: "The PDU experience", eyebrow: "AN EXPERIENCE THAT CONTINUES", titleLines: ["Enter.", "Notice.", "Keep."],
      bodyLines: ["PDU accompanies questions", "without ready-made answers."], cta: "Discover the layers",
      caption: "The Palavras do Universo experience does not end when a card turns or a chart appears.\n\nYou enter through a question, meet symbols with context, keep what felt meaningful, and continue the conversation later. The aim is not to make you depend on an answer. It is to help you notice more clearly.\n\nWhat would make a symbolic experience truly respect your time?",
      slides: [
        { eyebrow: "THE PDU EXPERIENCE", title: ["Enter.", "Notice.", "Keep."], body: ["A journey that respects", "your own rhythm."] },
        { eyebrow: "ENTER THROUGH A QUESTION", title: ["Life comes", "before the", "symbol."], body: ["The experience begins", "with what is real for you."] },
        { eyebrow: "MEET CONTEXT", title: ["No loose", "or generic", "phrases."], body: ["Symbols in relationship", "with the question and moment."] },
        { eyebrow: "KEEP WHAT FELT MEANINGFUL", title: ["Your journey", "does not need", "to disappear."], body: ["Insights can return", "when time changes."] },
        { eyebrow: "CONTINUE WITHOUT DEPENDING", title: ["More autonomy.", "Fewer ready-made", "answers."], body: ["PDU accompanies.", "The choice remains yours."], cta: "What would this mean to you?" },
      ],
    },
  },
  {
    id: "14", slug: "mapa-e-conversa", kind: "carousel", pillar: "Curiosidade",
    title: "O mapa é uma conversa", eyebrow: "NÃO EXISTE POSICIONAMENTO ISOLADO", titleLines: ["Lua em Touro", "não significa", "uma pessoa igual."],
    bodyLines: ["Casa, aspectos e história", "mudam a frase."], cta: "Veja por quê",
    caption: "Duas pessoas com Lua em Touro não vivem exatamente a mesma frase.\n\nA casa mostra onde essa Lua encontra a vida. Os aspectos mostram com quais outras partes ela conversa. O contexto e a história pessoal mudam a forma como o símbolo ganha sentido.\n\nO mapa é uma conversa — não uma coleção de rótulos.",
    slides: [
      { eyebrow: "NÃO EXISTE POSICIONAMENTO ISOLADO", title: ["O mapa é uma", "conversa."], body: ["Cada símbolo encontra", "outros símbolos."] },
      { eyebrow: "O MESMO SIGNO NÃO É A MESMA FRASE", title: ["Lua em Touro", "não significa", "uma pessoa igual."], body: ["O signo é apenas uma", "das camadas da leitura."] },
      { eyebrow: "A CASA MUDA O CONTEXTO", title: ["Onde esse tema", "encontra a vida?"], body: ["A área da experiência modifica", "a forma de viver o símbolo."] },
      { eyebrow: "ASPECTOS CRIAM RELAÇÕES", title: ["Com quem essa", "Lua está", "conversando?"], body: ["Fluxo, tensão e integração", "mudam a frase."] },
      { eyebrow: "A SUA HISTÓRIA IMPORTA", title: ["Símbolo + mapa", "+ vida vivida."], body: ["É assim que a linguagem", "começa a se tornar pessoal."], cta: "Sem rótulos fáceis" },
    ],
    en: {
      title: "A chart is a conversation", eyebrow: "NO PLACEMENT EXISTS ALONE", titleLines: ["Moon in Taurus", "does not mean", "the same person."],
      bodyLines: ["House, aspects, and history", "change the sentence."], cta: "See why",
      caption: "Two people with Moon in Taurus do not live exactly the same sentence.\n\nThe house shows where that Moon meets life. Aspects show which other parts it speaks with. Context and personal history change how the symbol gains meaning.\n\nA chart is a conversation — not a collection of labels.",
      slides: [
        { eyebrow: "NO PLACEMENT EXISTS ALONE", title: ["A chart is a", "conversation."], body: ["Every symbol meets", "other symbols."] },
        { eyebrow: "THE SAME SIGN IS NOT THE SAME SENTENCE", title: ["Moon in Taurus", "does not mean", "the same person."], body: ["The sign is only one", "layer of the reading."] },
        { eyebrow: "THE HOUSE CHANGES CONTEXT", title: ["Where does this", "theme meet life?"], body: ["The area of experience changes", "how the symbol is lived."] },
        { eyebrow: "ASPECTS CREATE RELATIONSHIPS", title: ["Who is this", "Moon speaking", "with?"], body: ["Flow, tension, and integration", "change the sentence."] },
        { eyebrow: "YOUR STORY MATTERS", title: ["Symbol + chart", "+ lived life."], body: ["That is how language", "begins to become personal."], cta: "Beyond easy labels" },
      ],
    },
  },
  {
    id: "15", slug: "como-aprofundar", kind: "static", pillar: "Oferta", offer: true,
    title: "Como aprofundar", eyebrow: "QUANDO FIZER SENTIDO CONTINUAR", titleLines: ["Um mapa para", "conhecer.", "Um círculo para", "acompanhar."],
    bodyLines: ["Mapa completo · R$39,90", "Círculo · R$49,90/mês"], cta: "Primeiro, conheça a experiência",
    caption: "Se a primeira camada abriu uma pergunta que você quer compreender melhor, existem duas formas de continuar.\n\nO Mapa Astral Completo custa R$39,90 em pagamento único. O Círculo do Universo custa R$49,90 por mês e inclui o mapa enquanto a assinatura estiver ativa, além de leituras premium e histórico.\n\nVocê não precisa decidir antes de experimentar a camada gratuita.",
    en: {
      title: "How to go deeper", eyebrow: "WHEN CONTINUING MAKES SENSE", titleLines: ["A chart to", "discover.", "A circle to", "continue."],
      bodyLines: ["Complete chart · £17.00", "Circle · £20.00/month"], cta: "Experience it first",
      caption: "If the first layer opened a question you want to understand more deeply, there are two ways to continue.\n\nThe Complete Birth Chart is £17.00 as a one-time payment. The Circle is £20.00 per month and includes the chart while your subscription is active, plus premium readings and history.\n\nYou do not need to decide before experiencing the free layer.",
    },
  },
  {
    id: "16", slug: "continue-sendo-seu", kind: "video", pillar: "Experiência",
    title: "Continue sendo seu", eyebrow: "UM MANIFESTO PDU", titleLines: ["Nenhum símbolo", "conhece você", "por inteiro."],
    bodyLines: ["A leitura abre espaço.", "Você continua escrevendo."], cta: "Leve essa ideia com você",
    caption: "Nenhuma carta, planeta ou leitura conhece você por inteiro.\n\nUm símbolo pode iluminar uma pergunta. Uma conversa pode organizar algo que estava sem nome. Uma pausa pode devolver presença. Mas a sua vida continua maior do que qualquer interpretação.\n\nO Palavras do Universo existe para acompanhar essa conversa — não para tomar o seu lugar nela.\n\n#palavrasdouniverso #simbolos #autonomia #presenca",
    frames: [
      { eyebrow: "UM MANIFESTO PDU", title: ["Nenhum símbolo", "conhece você", "por inteiro."], body: ["E isso é importante."] },
      { eyebrow: "UMA CARTA PODE ILUMINAR", title: ["Uma pergunta", "que ainda não", "tinha nome."], body: ["Sem encerrar a conversa."] },
      { eyebrow: "UM MAPA PODE DAR CONTEXTO", title: ["Para padrões,", "necessidades", "e escolhas."], body: ["Sem transformar possibilidade", "em sentença."] },
      { eyebrow: "UMA PAUSA PODE DEVOLVER PRESENÇA", title: ["O próximo passo", "não precisa ser", "grandioso."], body: ["Precisa caber na vida real."] },
      { eyebrow: "VOCÊ CONTINUA ESCREVENDO", title: ["A leitura abre", "espaço."], body: ["A vida continua sendo sua."], cta: "Guarde esta lembrança" },
    ],
    en: {
      title: "Keep being your own", eyebrow: "A PDU MANIFESTO", titleLines: ["No symbol", "knows you", "completely."],
      bodyLines: ["A reading opens space.", "You keep writing."], cta: "Take this idea with you",
      caption: "No card, planet, or reading knows you completely.\n\nA symbol can illuminate a question. A conversation can organise something that had no name. A pause can return presence. But your life remains larger than any interpretation.\n\nPalavras do Universo exists to accompany that conversation — not to take your place within it.\n\n#palavrasdouniverso #symbols #autonomy #presence",
      frames: [
        { eyebrow: "A PDU MANIFESTO", title: ["No symbol", "knows you", "completely."], body: ["And that matters."] },
        { eyebrow: "A CARD CAN ILLUMINATE", title: ["A question", "that did not", "have a name."], body: ["Without ending the conversation."] },
        { eyebrow: "A CHART CAN OFFER CONTEXT", title: ["For patterns,", "needs,", "and choices."], body: ["Without turning possibility", "into a sentence."] },
        { eyebrow: "A PAUSE CAN RETURN PRESENCE", title: ["The next step", "does not need", "to be grand."], body: ["It needs to fit real life."] },
        { eyebrow: "YOU KEEP WRITING", title: ["A reading opens", "space."], body: ["Your life remains yours."], cta: "Keep this reminder" },
      ],
    },
  },
];

const videoBuilds = [];

for (const post of libraryPosts) {
  const mainTheme = themeForPost(post);
  const mainLayout = layoutForPost(post);
  const statusPath = `library/status/status-${post.id}-${post.slug}.jpg`;
  pieces.push({
    path: statusPath,
    ...story,
    art: artForPost(post, 0, "status"),
    ...libraryCard({
      format: "status",
      sequence: `${post.id} / 16`,
      eyebrowText: post.eyebrow,
      titleLines: post.titleLines,
      bodyLines: post.bodyLines,
      price: post.price,
      priceNote: post.priceNote,
      ctaText: post.cta,
      theme: mainTheme,
      layout: mainLayout,
    }),
  });

  if (post.kind === "static") {
    pieces.push({
      path: `library/feed/post-${post.id}-${post.slug}.jpg`,
      ...portrait,
      art: artForPost(post, 0, "feed"),
      ...libraryCard({
        format: "feed",
        eyebrowText: post.eyebrow,
        titleLines: post.titleLines,
        bodyLines: post.bodyLines,
        price: post.price,
        priceNote: post.priceNote,
        ctaText: post.cta,
        theme: mainTheme,
        layout: mainLayout,
      }),
    });
    if (post.en) {
      pieces.push({
        path: `library/feed/post-${post.id}-${post.slug}-en.jpg`,
        ...portrait,
        art: artForPost(post, 0, "feed"),
        ...libraryCard({
          format: "feed",
          eyebrowText: post.en.eyebrow,
          titleLines: post.en.titleLines,
          bodyLines: post.en.bodyLines,
          price: post.en.price,
          priceNote: post.en.priceNote,
          ctaText: post.en.cta,
          theme: mainTheme,
          layout: mainLayout,
        }),
      });
    }
  }

  if (post.kind === "carousel") {
    post.slides.forEach((slide, index) => {
      const slideTheme = themeForPost(post, index);
      const slideLayout = layoutForPost(post, index);
      pieces.push({
        path: `library/feed/post-${post.id}-${post.slug}/slide-${String(index + 1).padStart(2, "0")}.jpg`,
        ...portrait,
        art: artForPost(post, index, "feed"),
        ...libraryCard({
          format: "feed",
          sequence: `${String(index + 1).padStart(2, "0")} / ${String(post.slides.length).padStart(2, "0")}`,
          eyebrowText: slide.eyebrow,
          titleLines: slide.title,
          bodyLines: slide.body,
          ctaText: slide.cta,
          theme: slideTheme,
          layout: slideLayout,
        }),
      });
    });
  }

  if (post.kind === "video") {
    const framePaths = [];
    post.frames.forEach((frame, index) => {
      const frameTheme = themeForPost(post, index);
      const frameLayout = layoutForPost(post, index);
      const framePath = `library/video/post-${post.id}-${post.slug}/frame-${String(index + 1).padStart(2, "0")}.jpg`;
      framePaths.push(framePath);
      pieces.push({
        path: framePath,
        ...story,
        art: artForPost(post, index, "video"),
        ...libraryCard({
          format: "video",
          sequence: `${String(index + 1).padStart(2, "0")} / ${String(post.frames.length).padStart(2, "0")}`,
          eyebrowText: frame.eyebrow,
          titleLines: frame.title,
          bodyLines: frame.body,
          ctaText: frame.cta,
          theme: frameTheme,
          layout: frameLayout,
        }),
      });
    });
    const coverPath = `library/video/post-${post.id}-${post.slug}/cover.jpg`;
    pieces.push({
      path: coverPath,
      ...story,
      art: artForPost(post, 0, "video"),
      ...libraryCard({
        format: "video",
        eyebrowText: post.eyebrow,
        titleLines: post.titleLines,
        bodyLines: post.bodyLines,
        ctaText: post.cta,
        theme: mainTheme,
        layout: mainLayout,
      }),
    });
    videoBuilds.push({
      frames: framePaths,
      output: `library/video/post-${post.id}-${post.slug}/post-${post.id}-${post.slug}.mp4`,
    });
    if (post.en?.frames) {
      const englishFramePaths = [];
      post.en.frames.forEach((frame, index) => {
        const framePath = `library/video/post-${post.id}-${post.slug}-en/frame-${String(index + 1).padStart(2, "0")}.jpg`;
        englishFramePaths.push(framePath);
        pieces.push({
          path: framePath,
          ...story,
          art: artForPost(post, index, "video"),
          ...libraryCard({
            format: "video",
            sequence: `${String(index + 1).padStart(2, "0")} / ${String(post.en.frames.length).padStart(2, "0")}`,
            eyebrowText: frame.eyebrow,
            titleLines: frame.title,
            bodyLines: frame.body,
            ctaText: frame.cta,
            theme: themeForPost(post, index),
            layout: layoutForPost(post, index),
          }),
        });
      });
      pieces.push({
        path: `library/video/post-${post.id}-${post.slug}-en/cover.jpg`,
        ...story,
        art: artForPost(post, 0, "video"),
        ...libraryCard({
          format: "video",
          eyebrowText: post.en.eyebrow,
          titleLines: post.en.titleLines,
          bodyLines: post.en.bodyLines,
          ctaText: post.en.cta,
          theme: mainTheme,
          layout: mainLayout,
        }),
      });
      videoBuilds.push({
        frames: englishFramePaths,
        output: `library/video/post-${post.id}-${post.slug}-en/post-${post.id}-${post.slug}-en.mp4`,
      });
    }
  }

  if (post.en) {
    pieces.push({
      path: `library/status/status-${post.id}-${post.slug}-en.jpg`,
      ...story,
      art: artForPost(post, 0, "status"),
      ...libraryCard({
        format: "status",
        sequence: `${post.id} / 16`,
        eyebrowText: post.en.eyebrow,
        titleLines: post.en.titleLines,
        bodyLines: post.en.bodyLines,
        price: post.en.price,
        priceNote: post.en.priceNote,
        ctaText: post.en.cta,
        theme: mainTheme,
        layout: mainLayout,
      }),
    });

    if (post.kind === "carousel") {
      post.en.slides.forEach((slide, index) => {
        pieces.push({
          path: `library/feed/post-${post.id}-${post.slug}-en/slide-${String(index + 1).padStart(2, "0")}.jpg`,
          ...portrait,
          art: artForPost(post, index, "feed"),
          ...libraryCard({
            format: "feed",
            sequence: `${String(index + 1).padStart(2, "0")} / ${String(post.en.slides.length).padStart(2, "0")}`,
            eyebrowText: slide.eyebrow,
            titleLines: slide.title,
            bodyLines: slide.body,
            ctaText: slide.cta,
            theme: themeForPost(post, index),
            layout: layoutForPost(post, index),
          }),
        });
      });
    }
  }
}

rmSync(outputRoot, { recursive: true, force: true });
rmSync(publishRoot, { recursive: true, force: true });
rmSync(sourceRoot, { recursive: true, force: true });
mkdirSync(sourceRoot, { recursive: true });

for (const piece of pieces) {
  const svgPath = join(sourceRoot, piece.path.replace(/\.(png|jpg)$/, ".svg"));
  const imagePath = join(outputRoot, piece.path);
  mkdirSync(dirname(svgPath), { recursive: true });
  mkdirSync(dirname(imagePath), { recursive: true });
  writeFileSync(svgPath, piece.svg);
  const isJpeg = piece.path.endsWith(".jpg");
  const formatArgs = isJpeg
    ? ["-s", "format", "jpeg", "-s", "formatOptions", "90"]
    : ["-s", "format", "png"];
  execFileSync("sips", [...formatArgs, svgPath, "--out", imagePath], { stdio: "ignore" });
  if (piece.art) {
    const artLayers = Array.isArray(piece.art) ? piece.art : [piece.art];
    artLayers.forEach((art, artIndex) => {
      const artPath = join(repo, art.path);
      const compositedPath = `${imagePath}.composited-${artIndex}.${isJpeg ? "jpg" : "png"}`;
      execFileSync("magick", [
        imagePath,
        "(", artPath,
        "-resize", `${art.width}x${art.width}`,
        "-alpha", "on",
        "-channel", "A",
        "-evaluate", "multiply", String(art.opacity),
        "+channel",
        ")",
        "-gravity", art.gravity,
        "-geometry", `+${art.x}+${art.y}`,
        "-compose", "over",
        "-composite",
        "-strip",
        "-quality", "90",
        compositedPath,
      ], { stdio: "ignore" });
      renameSync(compositedPath, imagePath);
    });
  }
  if (piece.overlaySvg) {
    const overlaySvgPath = svgPath.replace(/\.svg$/, ".overlay.svg");
    const overlayImagePath = `${imagePath}.overlay.png`;
    const layeredPath = `${imagePath}.layered.${isJpeg ? "jpg" : "png"}`;
    writeFileSync(overlaySvgPath, piece.overlaySvg);
    execFileSync("sips", ["-s", "format", "png", overlaySvgPath, "--out", overlayImagePath], { stdio: "ignore" });
    execFileSync("magick", [
      imagePath,
      overlayImagePath,
      "-compose", "over",
      "-composite",
      "-strip",
      "-quality", "90",
      layeredPath,
    ], { stdio: "ignore" });
    renameSync(layeredPath, imagePath);
  }
}

const statusFrames = [
  "status/status-01-tese.png",
  "status/status-02-mapa.png",
  "status/status-03-circulo.png",
  "status/status-04-escolha.png",
  "status/status-05-cta.png",
].map((path) => join(outputRoot, path));

function buildVerticalVideo(inputPaths, videoPath) {
  mkdirSync(dirname(videoPath), { recursive: true });
  const videoInputs = inputPaths.flatMap((path) => ["-loop", "1", "-framerate", "30", "-t", "4.5", "-i", path]);
  const scaled = inputPaths.map((_, index) => `[${index}:v]scale=1080:1920,setsar=1[v${index}]`);
  const transitions = [];
  let previous = "v0";
  for (let index = 1; index < inputPaths.length; index += 1) {
    const output = index === inputPaths.length - 1 ? "out" : `x${index}`;
    transitions.push(`[${previous}][v${index}]xfade=transition=fade:duration=0.5:offset=${index * 4}[${output}]`);
    previous = output;
  }
  const duration = inputPaths.length * 4.5 - (inputPaths.length - 1) * 0.5;
  execFileSync("ffmpeg", [
    "-y",
    ...videoInputs,
    "-filter_complex", [...scaled, ...transitions].join(";"),
    "-map", "[out]",
    "-t", String(duration),
    "-r", "30",
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    videoPath,
  ], { stdio: "ignore" });
}

buildVerticalVideo(statusFrames, join(outputRoot, "video/pdu-astrologia-social-vertical.mp4"));
for (const video of videoBuilds) {
  buildVerticalVideo(
    video.frames.map((path) => join(outputRoot, path)),
    join(outputRoot, video.output),
  );
}

function buildContactSheet(imagePaths, targetPath, prefix) {
  const contactSheetParts = join(sourceRoot, `${prefix}-contact-sheet-parts`);
  mkdirSync(contactSheetParts, { recursive: true });
  const thumbnails = imagePaths.map((imagePath, index) => {
    const thumbnail = join(contactSheetParts, `thumb-${String(index).padStart(3, "0")}.png`);
    execFileSync("magick", [imagePath, "-thumbnail", "270x480", "-background", colors.deep, "-gravity", "center", "-extent", "306x516", thumbnail]);
    return thumbnail;
  });
  const rows = [];
  for (let index = 0; index < thumbnails.length; index += 4) {
    const rowItems = thumbnails.slice(index, index + 4);
    while (rowItems.length < 4) rowItems.push("xc:#0d0918");
    const row = join(contactSheetParts, `row-${String(index / 4).padStart(3, "0")}.png`);
    execFileSync("magick", [...rowItems, "+append", row]);
    rows.push(row);
  }
  mkdirSync(dirname(targetPath), { recursive: true });
  execFileSync("magick", [...rows, "-append", "-strip", "-quality", "90", targetPath]);
}

const imagePaths = pieces.map((piece) => join(outputRoot, piece.path));
const campaignContactSheet = join(outputRoot, "contact-sheet.jpg");
const libraryContactSheet = join(outputRoot, "library/contact-sheet.jpg");
buildContactSheet(imagePaths.slice(0, campaignPieceCount), campaignContactSheet, "campaign");
const libraryOverviewPaths = libraryPosts.map((post) => {
  if (post.kind === "static") return join(outputRoot, `library/feed/post-${post.id}-${post.slug}.jpg`);
  if (post.kind === "carousel") return join(outputRoot, `library/feed/post-${post.id}-${post.slug}/slide-01.jpg`);
  return join(outputRoot, `library/video/post-${post.id}-${post.slug}/cover.jpg`);
});
buildContactSheet(libraryOverviewPaths, libraryContactSheet, "library");

const publishFolderName = (post) => `POST_${post.id}_${post.slug.replaceAll("-", "_").toUpperCase()}`;
const campaignStart = new Date("2026-09-24T00:00:00Z");
const weekdays = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const calendarRows = libraryPosts.map((post, index) => {
  const week = Math.floor(index / 4) + 1;
  const publicationDate = new Date(campaignStart);
  publicationDate.setUTCDate(campaignStart.getUTCDate() + index);
  const date = publicationDate.toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" });
  const day = weekdays[publicationDate.getUTCDay()];
  const asset = `SEMANA_${week}/${publishFolderName(post)}`;
  const format = post.kind === "static" ? "Post" : post.kind === "carousel" ? "Carrossel" : "Reels / TikTok";
  return `| ${date} | ${day} | ${post.id} | ${post.pillar} | ${post.title} | ${format} | \`${asset}\` |`;
});
const calendar = `# Calendário diário — 16 dias\n\nA sequência foi construída para primeiro despertar curiosidade, oferecer valor e criar vínculo. Apenas os posts 01 e 15 apresentam preço; os demais entregam educação, interação, confiança ou uma pequena experiência PDU.\n\nPublique um conteúdo por dia, às 08:40 (Europe/London). Cada pasta contém versões PT e EN para Feed ou vídeo, Stories e WhatsApp Status.\n\n| Data | Dia | Post | Pilar | Tema | Formato | Pasta |\n| --- | --- | ---: | --- | --- | --- | --- |\n${calendarRows.join("\n")}\n\n## Rotina por publicação\n\n1. Abra a pasta do post do dia e confirme no registro que ele ainda não foi publicado.\n2. Publique PT e EN no mesmo conteúdo, mantendo cada idioma em sua própria sequência.\n3. Publique no Instagram Feed ou Reels, Instagram Stories, TikTok e WhatsApp Status.\n4. Nos conteúdos editoriais, priorize a pergunta, a conversa e o salvamento; não acrescente preço por conta própria.\n5. Use o link específico do canal somente quando ele fizer sentido para o conteúdo.\n6. Marque a publicação em \`../REGISTRO_PUBLICACOES.md\` somente depois de confirmar visualmente que ela está no ar.\n`;
writeFileSync(join(outputRoot, "library/CONTENT_CALENDAR.md"), calendar);

const captions = libraryPosts.map((post) => {
  const link = `https://palavrasdouniverso.com/astrologia?utm_source=social&utm_medium=organic_social&utm_campaign=conteudo_astrologia_4_semanas&utm_content=post_${post.id}`;
  return `## Post ${post.id} — ${post.title}\n\n**Pilar:** ${post.pillar}  \n**Formato:** ${post.kind}\n\n${post.caption}\n\n**Link rastreável:** ${link}\n\n**Status correspondente:** \`assets/library/status/status-${post.id}-${post.slug}.jpg\`\n`;
}).join("\n---\n\n");
writeFileSync(join(outputRoot, "library/CAPTIONS.md"), `# Legendas prontas — 16 publicações\n\n${captions}`);

const startHere = `# Comece aqui\n\nVocê não precisa publicar tudo de uma vez e não precisa enviar mensagens individuais.\n\n## Hoje\n\n### 1. Instagram feed\n\nPublique \`feed/post-01-mapa-completo-3990.jpg\` e copie a legenda da seção **Post 01 — Mapa Astral Completo** em \`CAPTIONS.md\`.\n\n### 2. WhatsApp Status e Instagram Stories\n\nPublique \`status/status-01-mapa-completo-3990.jpg\`. No Instagram, adicione um sticker para https://palavrasdouniverso.com/astrologia.\n\n### 3. Reels e TikTok\n\nPublique \`video/post-04-mais-que-seu-signo/post-04-mais-que-seu-signo.mp4\` nos dois canais e use a legenda do Post 04. O vídeo está sem música e sem marca-d'água para receber um áudio nativo da plataforma.\n\n## Amanhã\n\nPublique as cinco telas de \`feed/post-02-sol-lua-ascendente/\`, use a legenda do Post 02 e publique também o Status 02.\n\n## Depois\n\nSiga \`CONTENT_CALENDAR.md\`: quatro publicações por semana durante quatro semanas. Cada post possui uma versão de Status com o mesmo número.\n`;
writeFileSync(join(outputRoot, "library/START_HERE.md"), startHere);

mkdirSync(publishRoot, { recursive: true });
copyFileSync(libraryContactSheet, join(publishRoot, "VISAO_GERAL.jpg"));
writeFileSync(join(publishRoot, "CALENDARIO_DIARIO.md"), calendar);

const publicStartHere = `# Comece aqui\n\nEsta pasta não é um catálogo de preços. A sequência editorial entrega curiosidade, aprendizado, perguntas e pequenas experiências antes de apresentar qualquer oferta. Apenas os posts 01 e 15 falam de preço.\n\n## Hoje — 25/09/2026\n\n1. Abra \`SEMANA_1/POST_02_SOL_LUA_ASCENDENTE\`.\n2. No Instagram e no TikTok, publique primeiro as cinco imagens de \`CARROSSEL_PT\` e depois as cinco de \`CARROSSEL_EN\`.\n3. Copie a legenda bilíngue de \`LEGENDA.md\`. Ela termina com uma pergunta, não com uma venda.\n4. Publique \`STATUS_PT.jpg\` e \`STATUS_EN.jpg\` no Instagram Stories e no WhatsApp Status.\n5. Registre cada publicação em \`../REGISTRO_PUBLICACOES.md\` somente depois de confirmar que está no ar.\n\n## Todos os dias\n\nSiga \`CALENDARIO_DIARIO.md\`, sempre às 08:40 (Europe/London). Não transforme posts informativos em anúncios ao publicá-los. A campanha é pública em Feed/Reels, Stories, TikTok e WhatsApp Status; não envie mensagens individuais.\n`;
writeFileSync(join(publishRoot, "00_COMECE_AQUI.md"), publicStartHere);

for (const [index, post] of libraryPosts.entries()) {
  const week = Math.floor(index / 4) + 1;
  const postRoot = join(publishRoot, `SEMANA_${week}`, publishFolderName(post));
  mkdirSync(postRoot, { recursive: true });

  const statusSource = join(outputRoot, `library/status/status-${post.id}-${post.slug}.jpg`);
  copyFileSync(statusSource, join(postRoot, post.en ? "STATUS_PT.jpg" : "STATUS.jpg"));
  if (post.en) {
    copyFileSync(
      join(outputRoot, `library/status/status-${post.id}-${post.slug}-en.jpg`),
      join(postRoot, "STATUS_EN.jpg"),
    );
  }

  if (post.kind === "static") {
    copyFileSync(
      join(outputRoot, `library/feed/post-${post.id}-${post.slug}.jpg`),
      join(postRoot, "ARTE_FEED.jpg"),
    );
    copyFileSync(
      join(outputRoot, `library/feed/post-${post.id}-${post.slug}.jpg`),
      join(postRoot, "ARTE_FEED_PT.jpg"),
    );
    if (post.en) {
      copyFileSync(
        join(outputRoot, `library/feed/post-${post.id}-${post.slug}-en.jpg`),
        join(postRoot, "ARTE_FEED_EN.jpg"),
      );
    }
  }

  if (post.kind === "carousel") {
    const carouselRoot = join(postRoot, post.en ? "CARROSSEL_PT" : "CARROSSEL");
    mkdirSync(carouselRoot, { recursive: true });
    post.slides.forEach((_, slideIndex) => {
      const slideNumber = String(slideIndex + 1).padStart(2, "0");
      copyFileSync(
        join(outputRoot, `library/feed/post-${post.id}-${post.slug}/slide-${slideNumber}.jpg`),
        join(carouselRoot, `${slideNumber}.jpg`),
      );
    });
    if (post.en) {
      const englishCarouselRoot = join(postRoot, "CARROSSEL_EN");
      mkdirSync(englishCarouselRoot, { recursive: true });
      post.en.slides.forEach((_, slideIndex) => {
        const slideNumber = String(slideIndex + 1).padStart(2, "0");
        copyFileSync(
          join(outputRoot, `library/feed/post-${post.id}-${post.slug}-en/slide-${slideNumber}.jpg`),
          join(englishCarouselRoot, `${slideNumber}.jpg`),
        );
      });
    }
  }

  if (post.kind === "video") {
    copyFileSync(
      join(outputRoot, `library/video/post-${post.id}-${post.slug}/post-${post.id}-${post.slug}.mp4`),
      join(postRoot, "VIDEO.mp4"),
    );
    copyFileSync(
      join(outputRoot, `library/video/post-${post.id}-${post.slug}/post-${post.id}-${post.slug}.mp4`),
      join(postRoot, "VIDEO_PT.mp4"),
    );
    copyFileSync(
      join(outputRoot, `library/video/post-${post.id}-${post.slug}/cover.jpg`),
      join(postRoot, "CAPA.jpg"),
    );
    copyFileSync(
      join(outputRoot, `library/video/post-${post.id}-${post.slug}/cover.jpg`),
      join(postRoot, "CAPA_PT.jpg"),
    );
    if (post.en?.frames) {
      copyFileSync(
        join(outputRoot, `library/video/post-${post.id}-${post.slug}-en/post-${post.id}-${post.slug}-en.mp4`),
        join(postRoot, "VIDEO_EN.mp4"),
      );
      copyFileSync(
        join(outputRoot, `library/video/post-${post.id}-${post.slug}-en/cover.jpg`),
        join(postRoot, "CAPA_EN.jpg"),
      );
    }
  }

  const trackedLink = (source, medium, language, currency) => {
    const product = post.product ? `&product=${post.product}` : "";
    return `https://palavrasdouniverso.com/astrologia?currency=${currency}${product}&utm_source=${source}&utm_medium=${medium}&utm_campaign=conteudo_astrologia_diario&utm_content=post_${post.id}&lang=${language}`;
  };
  const publishingNote = post.kind === "carousel"
    ? "Publique primeiro CARROSSEL_PT e depois CARROSSEL_EN, mantendo cada idioma em sua própria sequência."
    : post.kind === "video"
      ? "Publique VIDEO_PT.mp4 e VIDEO_EN.mp4 no Instagram Reels e no TikTok. Use as capas do mesmo idioma."
      : "Publique ARTE_FEED_PT.jpg e ARTE_FEED_EN.jpg no Instagram.";
  const priceSection = post.offer
    ? "\n\n## Preços oficiais deste post de oferta\n\nMapa Astral Completo: **R$39,90 / £17.00**, pagamento único.\n\nCírculo do Universo: **R$49,90/mês / £20.00/month**."
    : "";
  writeFileSync(
    join(postRoot, "LEGENDA.md"),
    `# Post ${post.id} — ${post.title}${post.en ? ` / ${post.en.title}` : ""}\n\n**Pilar editorial:** ${post.pillar}\n\n${publishingNote}\n\n## Legenda PT-BR\n\n${post.caption}\n${post.en ? `\n\n---\n\n## Caption EN-GB\n\n${post.en.caption}` : ""}\n\n## Links por canal\n\nUse o link apenas quando a publicação pedir uma continuação no site. Em posts de conversa ou reflexão, a pergunta pode ser o encerramento.\n\n| Canal | PT-BR · BRL | EN-GB · GBP |\n| --- | --- | --- |\n| Instagram | ${trackedLink("instagram", "organic_social", "pt", "BRL")} | ${trackedLink("instagram", "organic_social", "en", "GBP")} |\n| Instagram Stories | ${trackedLink("instagram", "story", "pt", "BRL")} | ${trackedLink("instagram", "story", "en", "GBP")} |\n| TikTok | ${trackedLink("tiktok", "organic_social", "pt", "BRL")} | ${trackedLink("tiktok", "organic_social", "en", "GBP")} |\n| WhatsApp Status | ${trackedLink("whatsapp", "status", "pt", "BRL")} | ${trackedLink("whatsapp", "status", "en", "GBP")} |${priceSection}\n`,
  );
}

rmSync(sourceRoot, { recursive: true, force: true });
rmSync(outputRoot, { recursive: true, force: true });

console.log(`Generated ${pieces.length} campaign assets and organized them in ${publishRoot}`);
