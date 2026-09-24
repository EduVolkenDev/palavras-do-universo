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
    "Promoção": ["gold", "plum", "rose"],
    "Explicação": ["paper", "sage", "indigo"],
    "Demonstração": ["indigo", "paper", "sage"],
    "Alcance": ["rose", "indigo", "plum"],
    "Confiança": ["paper", "plum", "sage"],
    "Conversão": ["gold", "plum", "indigo"],
  };
  const options = themesByPillar[post.pillar] ?? ["plum"];
  return options[index % options.length];
}

function layoutForPost(post, index = 0) {
  const layoutsByPillar = {
    "Promoção": ["poster", "split", "center"],
    "Explicação": ["editorial", "split", "panel", "center"],
    "Demonstração": ["panel", "split", "editorial"],
    "Alcance": ["center", "split", "poster"],
    "Confiança": ["editorial", "center", "panel"],
    "Conversão": ["poster", "split", "center"],
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
  "03": ["map", "natal", "map", "aspects", "natal"],
  "04": ["zodiac", "natal", "placement", "map", "zodiac"],
  "05": ["placement", "sun", "zodiac", "houses", "aspects"],
  "06": ["natal"],
  "07": ["houses", "houses", "natal", "placement", "houses"],
  "08": ["map", "natal", "sun", "houses", "transits"],
  "09": ["aspects", "venus", "mars", "aspects", "aspects"],
  "10": ["map"],
  "11": ["natal", "aspects", "placement", "houses", "natal"],
  "12": ["natal", "map", "aspects", "map", "natal"],
  "13": ["natal", "sun", "moon", "map", "natal"],
  "14": ["aspects", "moonTaurus", "houses", "aspects", "natal"],
  "15": ["map"],
  "16": ["zodiac", "sun", "map", "aspects", "natal"],
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
  const gravity = layout === "center" || ["zodiac", "natal", "houses", "aspects", "placement", "transits"].includes(key)
    ? "south"
    : layout === "split"
      ? "southeast"
      : positionIndex === 0 ? "southeast" : "southwest";
  const detailedArt = ["zodiac", "natal", "houses", "aspects", "placement", "transits"].includes(key);
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
    id: "01",
    slug: "mapa-completo-3990",
    kind: "static",
    pillar: "Promoção",
    title: "Mapa Astral Completo",
    eyebrow: "CONHEÇA O SEU CÉU POR INTEIRO",
    titleLines: ["Mapa Astral", "Completo"],
    price: "R$39,90",
    priceNote: "pagamento único · sem assinatura",
    bodyLines: ["Planetas, casas, aspectos e influências", "explicados em linguagem clara."],
    cta: "Comece pela camada gratuita",
    caption: "Seu signo solar é uma parte da história — não a história inteira. O Mapa Astral Completo organiza planetas, casas, aspectos e influências em uma linguagem que você consegue acompanhar.\n\nR$39,90, pagamento único e sem assinatura. Antes de decidir, você pode conhecer gratuitamente a primeira camada com Sol, Lua e Ascendente.\n\nAcesse palavrasdouniverso.com/astrologia.",
  },
  {
    id: "02",
    slug: "sol-lua-ascendente",
    kind: "carousel",
    pillar: "Explicação",
    title: "Sol, Lua e Ascendente",
    eyebrow: "OS TRÊS PILARES",
    titleLines: ["Você é mais", "do que o seu", "signo solar."],
    bodyLines: ["Sol, Lua e Ascendente respondem", "a perguntas diferentes."],
    cta: "Deslize para entender",
    caption: "Sol, Lua e Ascendente não são três versões da mesma coisa.\n\nO Sol fala de identidade e direção. A Lua, de cuidado e pertencimento. O Ascendente, da sua presença e da forma como você encontra o mundo.\n\nEles formam uma primeira camada — não um resumo completo. Conheça a sua gratuitamente em palavrasdouniverso.com/astrologia.",
    slides: [
      { eyebrow: "OS TRÊS PILARES", title: ["Você é mais", "do que o seu", "signo solar."], body: ["Sol, Lua e Ascendente respondem", "a perguntas diferentes."] },
      { eyebrow: "SOL · IDENTIDADE E DIREÇÃO", title: ["Quem você está", "se tornando?"], body: ["O Sol fala de vitalidade, intenção", "e do centro que orienta escolhas."] },
      { eyebrow: "LUA · CUIDADO E PERTENCIMENTO", title: ["Do que você", "precisa para", "se sentir em casa?"], body: ["A Lua ajuda a perceber necessidades", "emocionais, ritmos e formas de cuidado."] },
      { eyebrow: "ASCENDENTE · PRESENÇA E ENTRADA", title: ["Como você", "encontra o", "mundo?"], body: ["O Ascendente abre a sequência das casas", "e mostra um modo de chegar à experiência."] },
      { eyebrow: "UM COMEÇO, NÃO UM RESUMO", title: ["Três pontos.", "Uma conversa", "muito maior."], body: ["Planetas, casas e aspectos aprofundam", "a linguagem do seu mapa."], cta: "Conheça sua primeira camada" },
    ],
  },
  {
    id: "03",
    slug: "como-funciona",
    kind: "carousel",
    pillar: "Demonstração",
    title: "Como funciona",
    eyebrow: "DO NASCIMENTO AO MAPA",
    titleLines: ["Como abrir", "o seu mapa", "no PDU."],
    bodyLines: ["Um processo claro, em camadas", "e sem conhecimento prévio."],
    cta: "Veja o passo a passo",
    caption: "Você não precisa entender astrologia antes de começar.\n\nInforme data, hora e local de nascimento. O PDU calcula o seu céu natal e abre a primeira camada com Sol, Lua e Ascendente. Depois, você pode navegar por visão geral, planetas, casas e aspectos.\n\nComece gratuitamente em palavrasdouniverso.com/astrologia.",
    slides: [
      { eyebrow: "COMO FUNCIONA", title: ["Do nascimento", "ao seu mapa", "em cinco passos."], body: ["Sem jargão e sem promessas", "sobre o futuro."] },
      { eyebrow: "PASSO 01", title: ["Informe data,", "hora e local", "de nascimento."], body: ["Esses dados permitem calcular", "o céu daquele momento e lugar."] },
      { eyebrow: "PASSO 02", title: ["Abra a primeira", "camada gratuita."], body: ["Conheça Sol, Lua e Ascendente", "dentro do seu próprio mapa."] },
      { eyebrow: "PASSO 03", title: ["Explore por", "camadas."], body: ["Visão geral, planetas, casas", "e aspectos em navegação simples."] },
      { eyebrow: "PASSO 04", title: ["Escolha como", "aprofundar."], body: ["Mapa completo por R$39,90 ou", "Círculo por R$49,90/mês."], cta: "Comece gratuitamente" },
    ],
  },
  {
    id: "04",
    slug: "mais-que-seu-signo",
    kind: "video",
    pillar: "Alcance",
    title: "Mais que o seu signo",
    eyebrow: "VÍDEO CURTO",
    titleLines: ["Você é mais", "do que o seu", "signo."],
    bodyLines: ["O mapa começa onde", "o signo solar termina."],
    cta: "Comece gratuitamente",
    caption: "Você é muito mais do que o seu signo solar.\n\nSol, Lua e Ascendente são apenas a primeira camada. O mapa completo conecta planetas, casas e aspectos à sua experiência.\n\nConheça a primeira camada gratuitamente no link do perfil.\n\n#mapaastral #astrologia #mapanatal #autoconhecimento #palavrasdouniverso",
    frames: [
      { eyebrow: "VOCÊ É MAIS DO QUE UM SIGNO", title: ["O seu mapa", "não termina", "no Sol."], body: ["Ele começa ali."] },
      { eyebrow: "PRIMEIRA CAMADA", title: ["Sol. Lua.", "Ascendente."], body: ["Identidade, cuidado", "e presença."] },
      { eyebrow: "O MAPA GANHA PROFUNDIDADE", title: ["Planetas.", "Casas.", "Aspectos."], body: ["Símbolos em conversa,", "não rótulos isolados."] },
      { eyebrow: "MAPA COMPLETO", title: ["R$39,90"], body: ["Pagamento único.", "Sem assinatura."] },
      { eyebrow: "A PRIMEIRA CAMADA É GRATUITA", title: ["Comece pelo", "seu céu."], body: ["palavrasdouniverso.com", "/astrologia"], cta: "Abrir minha astrologia" },
    ],
  },
  {
    id: "05",
    slug: "planeta-signo-casa",
    kind: "carousel",
    pillar: "Explicação",
    title: "Planeta, signo e casa",
    eyebrow: "TRÊS PARTES DA MESMA FRASE",
    titleLines: ["Planeta, signo,", "casa."],
    bodyLines: ["Três peças da mesma frase."],
    cta: "Aprenda a ler",
    caption: "Uma posição astrológica não é apenas um signo.\n\nO planeta mostra o que está falando. O signo mostra como essa parte se expressa. A casa mostra onde esse tema encontra a vida concreta. Os aspectos revelam como diferentes partes do mapa conversam.\n\nNenhuma dessas peças funciona sozinha. Conheça o seu mapa em palavrasdouniverso.com/astrologia.",
    slides: [
      { eyebrow: "COMO LER UM POSICIONAMENTO", title: ["Planeta, signo,", "casa."], body: ["Três partes da mesma frase."] },
      { eyebrow: "O PLANETA", title: ["O que está", "falando?"], body: ["O planeta representa uma função", "ou parte da experiência."] },
      { eyebrow: "O SIGNO", title: ["Como essa parte", "se expressa?"], body: ["O signo dá linguagem, ritmo", "e qualidade ao planeta."] },
      { eyebrow: "A CASA", title: ["Onde esse tema", "encontra a vida?"], body: ["A casa aponta uma área concreta", "da experiência vivida."] },
      { eyebrow: "NENHUMA PARTE FUNCIONA SOZINHA", title: ["O mapa é uma", "conversa."], body: ["Aspectos mostram como essas partes", "fluem, criam atrito ou pedem integração."], cta: "Abra o seu mapa" },
    ],
  },
  {
    id: "06",
    slug: "primeira-camada-gratuita",
    kind: "static",
    pillar: "Promoção",
    title: "Primeira camada gratuita",
    eyebrow: "COMECE SEM PAGAR",
    titleLines: ["Conheça Sol,", "Lua e", "Ascendente."],
    bodyLines: ["A primeira camada do seu mapa", "está aberta gratuitamente."],
    cta: "Começar agora",
    caption: "Você pode conhecer a primeira camada do seu mapa sem pagar.\n\nSol, Lua e Ascendente respondem a perguntas diferentes sobre identidade, necessidades emocionais e presença. O PDU explica cada ponto em linguagem clara.\n\nComece gratuitamente em palavrasdouniverso.com/astrologia.",
  },
  {
    id: "07",
    slug: "o-que-sao-casas",
    kind: "carousel",
    pillar: "Explicação",
    title: "O que são as casas",
    eyebrow: "AS DOZE CASAS",
    titleLines: ["Onde o céu", "se torna", "pessoal."],
    bodyLines: ["Casas são áreas da vida,", "não previsões de acontecimentos."],
    cta: "Entenda em cinco telas",
    caption: "As casas astrológicas mostram onde a história de um planeta ganha contexto na vida.\n\nElas não são rótulos de personalidade nem garantias de acontecimentos. A sequência das casas parte do Ascendente e organiza diferentes áreas da experiência.\n\nNo mapa completo, você vê como essa estrutura se forma no seu próprio céu. palavrasdouniverso.com/astrologia.",
    slides: [
      { eyebrow: "AS DOZE CASAS", title: ["Onde o céu", "se torna", "pessoal."], body: ["Casas são áreas da vida,", "não previsões."] },
      { eyebrow: "UMA ÁREA DE EXPERIÊNCIA", title: ["A casa mostra", "onde um tema", "ganha contexto."], body: ["Ela não define quem você é", "e não funciona isoladamente."] },
      { eyebrow: "O ASCENDENTE ABRE A SEQUÊNCIA", title: ["Cada mapa", "organiza as casas", "de um jeito próprio."], body: ["Por isso data, hora e local", "de nascimento importam."] },
      { eyebrow: "UM PLANETA EM UMA CASA", title: ["O que encontra", "um onde."], body: ["A função do planeta encontra", "uma área concreta da vida."] },
      { eyebrow: "NÃO É EVENTO GARANTIDO", title: ["É uma lente", "simbólica."], body: ["Um modo de perceber onde um tema", "pode pedir atenção."], cta: "Veja suas casas" },
    ],
  },
  {
    id: "08",
    slug: "por-dentro-do-mapa",
    kind: "video",
    pillar: "Demonstração",
    title: "Por dentro do mapa",
    eyebrow: "DEMONSTRAÇÃO",
    titleLines: ["O que você", "encontra dentro", "do mapa?"],
    bodyLines: ["Uma experiência organizada", "por camadas."],
    cta: "Veja por dentro",
    caption: "Por dentro do mapa, você encontra uma visão geral e áreas separadas para planetas, casas e aspectos.\n\nA primeira camada apresenta Sol, Lua e Ascendente. O mapa completo aprofunda posicionamentos e as relações entre os símbolos.\n\nComece gratuitamente no link do perfil.\n\n#mapaastral #astrologia #demonstracao #palavrasdouniverso",
    frames: [
      { eyebrow: "POR DENTRO DO MAPA", title: ["Uma experiência", "organizada por", "camadas."], body: ["Você não precisa entender", "astrologia antes de entrar."] },
      { eyebrow: "VISÃO GERAL", title: ["Sol, Lua e", "Ascendente."], body: ["A primeira leitura do", "seu céu de nascimento."] },
      { eyebrow: "PLANETAS", title: ["Cada símbolo", "ganha contexto."], body: ["Posição, signo, casa", "e relações com o mapa."] },
      { eyebrow: "CASAS E ASPECTOS", title: ["Onde os temas", "vivem e como", "conversam."], body: ["Uma leitura em camadas,", "não uma sentença."] },
      { eyebrow: "COMECE GRATUITAMENTE", title: ["Abra a sua", "primeira camada."], body: ["palavrasdouniverso.com", "/astrologia"], cta: "Entrar na astrologia" },
    ],
  },
  {
    id: "09",
    slug: "o-que-sao-aspectos",
    kind: "carousel",
    pillar: "Explicação",
    title: "O que são aspectos",
    eyebrow: "CONVERSAS NO CÉU",
    titleLines: ["Aspectos mostram", "como os símbolos", "se relacionam."],
    bodyLines: ["Eles não tornam um planeta", "bom ou ruim."],
    cta: "Entenda a relação",
    caption: "Aspectos são relações geométricas entre os planetas do mapa.\n\nEles não tornam um símbolo bom ou ruim. Mostram se duas partes da experiência tendem a fluir, criar atrito ou pedir integração. No mapa completo, você vê quais planetas conversam no seu próprio céu.\n\nConheça a primeira camada gratuitamente em palavrasdouniverso.com/astrologia.",
    slides: [
      { eyebrow: "CONVERSAS NO CÉU", title: ["Aspectos mostram", "como os símbolos", "se relacionam."], body: ["Eles conectam diferentes", "partes do mapa."] },
      { eyebrow: "NÃO EXISTE PLANETA BOM OU RUIM", title: ["Uma relação", "pode fluir…"], body: ["Alguns aspectos indicam recursos", "que se integram com mais facilidade."] },
      { eyebrow: "TENSÃO TAMBÉM É INFORMAÇÃO", title: ["…ou criar", "atrito."], body: ["Outros mostram contrastes", "que pedem consciência e trabalho."] },
      { eyebrow: "INTEGRAÇÃO", title: ["Duas partes", "podem pedir", "uma terceira via."], body: ["O aspecto abre uma pergunta.", "Não fecha uma conclusão."] },
      { eyebrow: "NO SEU MAPA", title: ["Quais planetas", "estão em", "conversa?"], body: ["O mapa completo apresenta", "as relações ativas do seu céu."], cta: "Conheça o seu mapa" },
    ],
  },
  {
    id: "10",
    slug: "circulo-4990",
    kind: "static",
    pillar: "Promoção",
    title: "Círculo do Universo",
    eyebrow: "PARA QUEM QUER CONTINUIDADE",
    titleLines: ["Círculo do", "Universo"],
    price: "R$49,90/mês",
    priceNote: "mapa completo incluído",
    bodyLines: ["Leituras premium e histórico para", "reconhecer padrões ao longo do tempo."],
    cta: "Conhecer o Círculo",
    caption: "O Círculo do Universo é para quem quer continuidade.\n\nPor R$49,90/mês, o mapa completo fica incluído enquanto a assinatura estiver ativa, junto com leituras premium e histórico para reconhecer padrões ao longo do tempo.\n\nConheça em palavrasdouniverso.com/astrologia.",
  },
  {
    id: "11",
    slug: "astrologia-sem-destino",
    kind: "carousel",
    pillar: "Confiança",
    title: "Astrologia sem determinismo",
    eyebrow: "NÃO É DESTINO FIXO",
    titleLines: ["O mapa não", "decide por", "você."],
    bodyLines: ["Ele oferece contexto para", "perceber padrões e escolhas."],
    cta: "Veja nossa abordagem",
    caption: "No Palavras do Universo, astrologia não é destino fixo.\n\nO mapa não garante acontecimentos, não substitui cuidado profissional e não retira sua liberdade de escolha. Ele funciona como uma linguagem simbólica para perceber padrões, necessidades, talentos e o tempo das decisões.\n\nO céu oferece contexto. A escolha continua sendo sua.",
    slides: [
      { eyebrow: "ASTROLOGIA SEM DETERMINISMO", title: ["O mapa não", "decide por", "você."], body: ["Ele oferece contexto."] },
      { eyebrow: "NÃO É PREVISÃO FECHADA", title: ["Nenhum símbolo", "garante um", "acontecimento."], body: ["Astrologia não transforma", "possibilidade em sentença."] },
      { eyebrow: "É UMA LINGUAGEM SIMBÓLICA", title: ["Padrões.", "Necessidades.", "Talentos."], body: ["Símbolos ganham sentido quando", "encontram a experiência vivida."] },
      { eyebrow: "CONTEXTO PARA ESCOLHAS", title: ["Mais perguntas.", "Menos rótulos."], body: ["O mapa pode ampliar percepção", "sem retirar responsabilidade."] },
      { eyebrow: "A ESCOLHA CONTINUA SENDO SUA", title: ["Seu céu pode", "acompanhar.", "Nunca mandar."], body: ["Comece pela primeira", "camada gratuita."], cta: "Conheça a proposta" },
    ],
  },
  {
    id: "12",
    slug: "mapa-ou-circulo",
    kind: "video",
    pillar: "Conversão",
    title: "Mapa ou Círculo",
    eyebrow: "QUAL ESCOLHER?",
    titleLines: ["Mapa ou", "Círculo?"],
    bodyLines: ["A escolha depende do tipo", "de experiência que você quer."],
    cta: "Compare as opções",
    caption: "Mapa ou Círculo?\n\nEscolha o Mapa Astral Completo por R$39,90 se você quer conhecer o seu céu em uma compra única. Escolha o Círculo por R$49,90/mês se quer o mapa dentro de uma experiência contínua, com leituras premium e histórico.\n\nComece gratuitamente no link do perfil.",
    frames: [
      { eyebrow: "QUAL ESCOLHER?", title: ["Mapa ou", "Círculo?"], body: ["Duas formas de continuar", "depois da camada gratuita."] },
      { eyebrow: "MAPA ASTRAL COMPLETO", title: ["R$39,90"], body: ["Pagamento único.", "Sem assinatura."] },
      { eyebrow: "CÍRCULO DO UNIVERSO", title: ["R$49,90/mês"], body: ["Mapa completo incluído,", "leituras e histórico."] },
      { eyebrow: "ESCOLHA O MAPA", title: ["Se você quer", "conhecer o seu", "céu uma vez."], body: ["Uma leitura completa", "em pagamento único."] },
      { eyebrow: "ESCOLHA O CÍRCULO", title: ["Se você quer", "acompanhar", "seus ciclos."], body: ["Comece gratuitamente", "no link do perfil."], cta: "Abrir minha astrologia" },
    ],
  },
  {
    id: "13",
    slug: "gratuito-vs-completo",
    kind: "carousel",
    pillar: "Demonstração",
    title: "Gratuito vs. completo",
    eyebrow: "O QUE ABRE EM CADA CAMADA",
    titleLines: ["O que é gratuito", "e o que vem no", "mapa completo?"],
    bodyLines: ["Comece entendendo antes", "de escolher."],
    cta: "Compare as camadas",
    caption: "Você não precisa comprar antes de entender a proposta.\n\nA primeira camada gratuita apresenta Sol, Lua e Ascendente e abre a linguagem básica do mapa. O Mapa Astral Completo aprofunda os posicionamentos pessoais, casas, aspectos e influências por R$39,90, em pagamento único.\n\nComece gratuitamente em palavrasdouniverso.com/astrologia.",
    slides: [
      { eyebrow: "GRATUITO VS. COMPLETO", title: ["O que abre", "em cada", "camada?"], body: ["Comece entendendo", "antes de escolher."] },
      { eyebrow: "PRIMEIRA CAMADA GRATUITA", title: ["Sol, Lua e", "Ascendente."], body: ["Uma introdução ao seu céu", "e à linguagem do mapa."] },
      { eyebrow: "LINGUAGEM BÁSICA ABERTA", title: ["Significados que", "você consegue", "acompanhar."], body: ["Sem exigir conhecimento", "prévio de astrologia."] },
      { eyebrow: "MAPA COMPLETO · R$39,90", title: ["Posicionamentos", "pessoais em", "profundidade."], body: ["Planetas, casas, aspectos", "e influências do seu mapa."] },
      { eyebrow: "PAGAMENTO ÚNICO", title: ["Aprofunde quando", "fizer sentido."], body: ["Sem assinatura para quem", "quer apenas o mapa."], cta: "Comece gratuitamente" },
    ],
  },
  {
    id: "14",
    slug: "mapa-e-conversa",
    kind: "carousel",
    pillar: "Explicação",
    title: "O mapa é uma conversa",
    eyebrow: "NÃO EXISTE POSICIONAMENTO ISOLADO",
    titleLines: ["O mapa é uma", "conversa."],
    bodyLines: ["Um símbolo muda quando encontra", "casa, aspectos e história."],
    cta: "Veja por que",
    caption: "Não existe posicionamento isolado.\n\nDuas pessoas com Lua em Touro não vivem exatamente a mesma frase. Casa, aspectos, outros planetas, contexto de vida e história pessoal mudam a forma como o símbolo ganha sentido.\n\nO mapa é uma conversa — não uma coleção de rótulos. Conheça o seu em palavrasdouniverso.com/astrologia.",
    slides: [
      { eyebrow: "NÃO EXISTE POSICIONAMENTO ISOLADO", title: ["O mapa é uma", "conversa."], body: ["Cada símbolo encontra", "outros símbolos."] },
      { eyebrow: "O MESMO SIGNO NÃO É A MESMA FRASE", title: ["Lua em Touro", "não significa", "uma pessoa igual."], body: ["O signo é apenas uma", "das camadas da leitura."] },
      { eyebrow: "A CASA MUDA O CONTEXTO", title: ["Onde esse tema", "encontra a vida?"], body: ["A área da experiência modifica", "a forma de viver o símbolo."] },
      { eyebrow: "ASPECTOS CRIAM RELAÇÕES", title: ["Quais planetas", "estão em", "conversa?"], body: ["Aspectos mostram relações de", "fluxo, tensão e integração."] },
      { eyebrow: "A SUA HISTÓRIA IMPORTA", title: ["Símbolo + mapa", "+ vida vivida."], body: ["É assim que a linguagem", "começa a se tornar pessoal."], cta: "Abra o seu mapa" },
    ],
  },
  {
    id: "15",
    slug: "dois-caminhos",
    kind: "static",
    pillar: "Promoção",
    title: "Dois caminhos",
    eyebrow: "ESCOLHA COMO CONTINUAR",
    titleLines: ["Um mapa para", "se reconhecer.", "Um círculo para", "continuar."],
    bodyLines: ["Mapa completo · R$39,90", "Círculo · R$49,90/mês"],
    cta: "Comece gratuitamente",
    caption: "Duas formas de continuar depois da primeira camada gratuita.\n\nMapa Astral Completo por R$39,90, pagamento único, para conhecer o seu céu sem assinatura. Círculo do Universo por R$49,90/mês para ter o mapa dentro de uma experiência contínua.\n\nComece em palavrasdouniverso.com/astrologia.",
  },
  {
    id: "16",
    slug: "comece-pelo-seu-ceu",
    kind: "video",
    pillar: "Conversão",
    title: "Comece pelo seu céu",
    eyebrow: "CONVITE FINAL",
    titleLines: ["Comece pelo", "seu céu."],
    bodyLines: ["A primeira camada", "é gratuita."],
    cta: "Abrir minha astrologia",
    caption: "O céu não decide por você. Ele ajuda você a se ler.\n\nComece pela primeira camada gratuita. Conheça Sol, Lua e Ascendente e decida depois se quer continuar com o Mapa Astral Completo ou com o Círculo do Universo.\n\nAcesse palavrasdouniverso.com/astrologia.\n\n#mapaastral #astrologia #mapanatal #palavrasdouniverso",
    frames: [
      { eyebrow: "NÃO É DESTINO FIXO", title: ["O céu não", "decide por", "você."], body: ["Ele ajuda você", "a se ler."] },
      { eyebrow: "PRIMEIRA CAMADA GRATUITA", title: ["Sol. Lua.", "Ascendente."], body: ["Comece entendendo", "a sua linguagem."] },
      { eyebrow: "MAPA COMPLETO", title: ["R$39,90"], body: ["Pagamento único."] },
      { eyebrow: "CÍRCULO DO UNIVERSO", title: ["R$49,90/mês"], body: ["Mapa completo +", "experiência contínua."] },
      { eyebrow: "COMECE AGORA", title: ["Abra o seu", "céu."], body: ["palavrasdouniverso.com", "/astrologia"], cta: "Entrar na astrologia" },
    ],
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

const days = ["Segunda", "Quarta", "Sexta", "Domingo"];
const publishFolderName = (post) => `POST_${post.id}_${post.slug.replaceAll("-", "_").toUpperCase()}`;
const calendarRows = libraryPosts.map((post, index) => {
  const week = Math.floor(index / 4) + 1;
  const day = days[index % 4];
  const asset = `SEMANA_${week}/${publishFolderName(post)}`;
  const format = post.kind === "static" ? "Post" : post.kind === "carousel" ? "Carrossel" : "Reels / TikTok";
  return `| ${week} | ${day} | ${post.id} | ${post.pillar} | ${post.title} | ${format} | \`${asset}\` |`;
});
const calendar = `# Calendário de conteúdo — 4 semanas\n\nPublique quatro vezes por semana. Cada pasta de post já contém a arte, a legenda e o Status correspondentes.\n\n| Semana | Dia | Post | Pilar | Tema | Formato | Pasta |\n| ---: | --- | ---: | --- | --- | --- | --- |\n${calendarRows.join("\n")}\n\n## Rotina simples\n\n1. Entre na pasta da semana e abra o post do dia.\n2. Publique a arte ou o vídeo e copie \`LEGENDA.md\`.\n3. Publique também \`STATUS.jpg\` no WhatsApp Status e no Instagram Stories.\n4. No Instagram Stories, adicione o sticker de link para https://palavrasdouniverso.com/astrologia.\n5. Nos vídeos, adicione uma música instrumental diretamente no Instagram ou TikTok; os MP4s estão sem música e sem marca-d'água.\n`;
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
writeFileSync(join(publishRoot, "CALENDARIO_4_SEMANAS.md"), calendar);

const publicStartHere = `# Comece aqui\n\nEsta é a única pasta que você precisa usar para publicar. Cada post está completo dentro de sua própria pasta: arte, legenda e Status.\n\n## Publique hoje\n\n1. Abra \`SEMANA_1/POST_01_MAPA_COMPLETO_3990\`.\n2. Publique \`ARTE_FEED.jpg\` no Instagram.\n3. Copie o texto de \`LEGENDA.md\`.\n4. Publique \`STATUS.jpg\` no WhatsApp Status e no Instagram Stories.\n\n## Para Reels e TikTok\n\nAbra \`SEMANA_1/POST_04_MAIS_QUE_SEU_SIGNO\` e publique \`VIDEO.mp4\` nos dois canais. O vídeo está sem música e sem marca-d'água para você escolher um áudio dentro do Instagram ou TikTok.\n\n## Amanhã\n\nAbra \`SEMANA_1/POST_02_SOL_LUA_ASCENDENTE\` e publique, na ordem, as cinco imagens da pasta \`CARROSSEL\`.\n\nDepois, siga \`CALENDARIO_4_SEMANAS.md\`.\n`;
writeFileSync(join(publishRoot, "00_COMECE_AQUI.md"), publicStartHere);

for (const [index, post] of libraryPosts.entries()) {
  const week = Math.floor(index / 4) + 1;
  const postRoot = join(publishRoot, `SEMANA_${week}`, publishFolderName(post));
  mkdirSync(postRoot, { recursive: true });

  const statusSource = join(outputRoot, `library/status/status-${post.id}-${post.slug}.jpg`);
  copyFileSync(statusSource, join(postRoot, "STATUS.jpg"));

  if (post.kind === "static") {
    copyFileSync(
      join(outputRoot, `library/feed/post-${post.id}-${post.slug}.jpg`),
      join(postRoot, "ARTE_FEED.jpg"),
    );
  }

  if (post.kind === "carousel") {
    const carouselRoot = join(postRoot, "CARROSSEL");
    mkdirSync(carouselRoot, { recursive: true });
    post.slides.forEach((_, slideIndex) => {
      const slideNumber = String(slideIndex + 1).padStart(2, "0");
      copyFileSync(
        join(outputRoot, `library/feed/post-${post.id}-${post.slug}/slide-${slideNumber}.jpg`),
        join(carouselRoot, `${slideNumber}.jpg`),
      );
    });
  }

  if (post.kind === "video") {
    copyFileSync(
      join(outputRoot, `library/video/post-${post.id}-${post.slug}/post-${post.id}-${post.slug}.mp4`),
      join(postRoot, "VIDEO.mp4"),
    );
    copyFileSync(
      join(outputRoot, `library/video/post-${post.id}-${post.slug}/cover.jpg`),
      join(postRoot, "CAPA.jpg"),
    );
  }

  const trackedLink = `https://palavrasdouniverso.com/astrologia?utm_source=social&utm_medium=organic_social&utm_campaign=conteudo_astrologia_4_semanas&utm_content=post_${post.id}`;
  const publishingNote = post.kind === "carousel"
    ? "Publique as imagens de CARROSSEL na ordem numérica."
    : post.kind === "video"
      ? "Publique VIDEO.mp4 no Instagram Reels e no TikTok. Use CAPA.jpg como capa."
      : "Publique ARTE_FEED.jpg no Instagram.";
  writeFileSync(
    join(postRoot, "LEGENDA.md"),
    `# Post ${post.id} — ${post.title}\n\n${publishingNote}\n\n## Legenda\n\n${post.caption}\n\n## Link rastreável\n\n${trackedLink}\n`,
  );
}

rmSync(sourceRoot, { recursive: true, force: true });
rmSync(outputRoot, { recursive: true, force: true });

console.log(`Generated ${pieces.length} campaign assets and organized them in ${publishRoot}`);
