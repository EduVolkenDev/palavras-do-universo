import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const readImage = async (name, mime = 'image/webp') => `data:${mime};base64,${(await fs.readFile(name)).toString('base64')}`;
const images = {
  letter: await readImage(path.join(here, 'assets/carta-do-ceu-original.png'), 'image/png'),
  atmosphere: await readImage(path.join(root, 'public/assets/astrology/sky-atmosphere.webp')),
  globe: await readImage(path.join(root, 'public/assets/astrology/transits/daily-sky/current-sky-globe.webp')),
  compass: await readImage(path.join(root, 'public/assets/astrology/transits/daily-sky/current-sky-compass.webp')),
  logo: await readImage(path.join(root, 'public/assets/new-palavrasuniverso-logo-512.webp')),
};

const copy = {
  pt: {
    brand: 'PALAVRAS DO UNIVERSO',
    one: { kicker: 'UM CONVITE PARA COMEÇAR', title: 'Um universo para explorar. Comece por uma carta.', body: 'Abra sua Carta do Dia grátis. Depois, encontre astrologia, tiradas e rituais no seu ritmo.', end: 'EXPLORE AGORA · PALAVRASDOUNIVERSO.COM' },
    two: { kicker: 'ASTROLOGIA COM CONTEXTO', title: 'Um aspecto não é uma sentença.', body: 'É um ângulo entre planetas. Na astrologia, pode ajudar a perceber temas do momento — sem decidir por você.', end: 'EXPLORE A ASTROLOGIA · PALAVRASDOUNIVERSO.COM' },
    three: { kicker: 'SEU CAMINHO NO PDU', title: 'Escolha por onde começar.', steps: [ ['01', 'Abrir', 'Sua Carta do Dia gratuita.'], ['02', 'Explorar', 'Astrologia, tarot e rituais.'], ['03', 'Reencontrar', 'Suas leituras no Meu Universo.'] ], end: 'ENTRE AGORA · PALAVRASDOUNIVERSO.COM' },
  },
  en: {
    brand: 'PALAVRAS DO UNIVERSO',
    one: { kicker: 'AN INVITATION TO BEGIN', title: 'A universe to explore. Start with one card.', body: 'Draw your free Card of the Day. Then explore astrology, readings and rituals at your own pace.', end: 'EXPLORE NOW · PALAVRASDOUNIVERSO.COM' },
    two: { kicker: 'ASTROLOGY WITH CONTEXT', title: 'An aspect is not a verdict.', body: 'It is an angle between planets. In astrology, it can help us notice the themes of a moment — without choosing for us.', end: 'EXPLORE ASTROLOGY · PALAVRASDOUNIVERSO.COM' },
    three: { kicker: 'YOUR PATH THROUGH PDU', title: 'Choose where to begin.', steps: [ ['01', 'Open', 'Your free Card of the Day.'], ['02', 'Explore', 'Astrology, tarot and rituals.'], ['03', 'Return', 'Find your readings in My Universe.'] ], end: 'VISIT NOW · PALAVRASDOUNIVERSO.COM' },
  },
};

function html(post, locale, vertical) {
  const t = copy[locale];
  const data = t[post];
  const steps = post === 'three' ? `<div class="steps">${data.steps.map(([n, title, text]) => `<div class="step"><span class="number">${n}</span><div><strong>${title}</strong><span>${text}</span></div></div>`).join('')}</div>` : '';
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><style>
    * { box-sizing:border-box } html,body { margin:0; width:1080px; height:${vertical ? 1920 : 1350}px; overflow:hidden }
    body { -webkit-font-smoothing:antialiased; font-family: 'Avenir Next', Avenir, Arial, sans-serif }
    .poster { position:relative; width:1080px; height:${vertical ? 1920 : 1350}px; overflow:hidden; isolation:isolate }
    .poster::after { content:''; position:absolute; inset:34px; border:1px solid rgba(237,204,142,.5); border-radius:28px; pointer-events:none; z-index:9 }
    .brand { position:absolute; z-index:5; left:78px; top:${vertical ? 154 : 70}px; display:flex; align-items:center; gap:18px; color:#f2dba9; font-size:21px; letter-spacing:.26em; font-weight:700 }
    .brand img { width:72px; height:72px; object-fit:contain }
    .kicker { position:absolute; z-index:5; left:82px; top:${vertical ? 333 : 220}px; font-size:19px; font-weight:800; letter-spacing:.25em; color:#f4ce85 }
    h1 { position:absolute; z-index:5; left:78px; margin:0; width:890px; font:500 ${vertical ? 108 : 91}px/1.06 Georgia,serif; letter-spacing:-.047em; text-wrap:balance }
    .body { position:absolute; z-index:5; left:83px; width:800px; font-size:${vertical ? 36 : 34}px; line-height:1.38; font-weight:500; text-wrap:pretty }
    .footer { position:absolute; z-index:5; left:82px; right:82px; bottom:${vertical ? 174 : 78}px; padding-top:24px; border-top:1px solid rgba(239,203,139,.58); font-size:19px; letter-spacing:.21em; font-weight:800 }
    .one { background:#0b0b1a; color:#fff8e9 }
    .one .scene { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:58% 48% }
    .one .shade { position:absolute; inset:0; background:linear-gradient(180deg,rgba(7,7,18,.68),rgba(10,9,25,.72) 25%,rgba(10,9,25,.32) 63%,rgba(11,8,22,.12) 80%,rgba(9,8,20,.76)) }
    .one h1 { top:${vertical ? 445 : 310}px; max-width:830px; text-shadow:0 3px 30px #070916 }
    .one .body { top:${vertical ? 875 : 685}px; max-width:770px; text-shadow:0 3px 18px #080916 }
    .one .footer { color:#f3d48e }
    .two { background:radial-gradient(circle at 68% 30%,#fffdf5 0%,#f0e4d1 60%,#e0d0bb 100%); color:#291e23 }
    .two .brand { color:#5a3e38 }
    .two .brand img { filter:drop-shadow(0 3px 12px #9d7e49aa) }
    .two .kicker { color:#876137; top:${vertical ? 1030 : 800}px }
    .two .orb { position:absolute; z-index:1; width:${vertical ? 920 : 800}px; height:${vertical ? 920 : 800}px; object-fit:contain; top:${vertical ? 175 : 60}px; right:${vertical ? -110 : -80}px; filter:drop-shadow(0 25px 34px #a07b5199) }
    .two h1 { top:${vertical ? 1135 : 875}px; width:900px; font-size:${vertical ? 92 : 75}px }
    .two .body { top:${vertical ? 1370 : 1070}px; width:890px; font-size:${vertical ? 34 : 29}px; line-height:1.33 }
    .two .footer { color:#6f4d2a; border-color:#b4946e }
    .three { background:#101023; color:#fff8e9 }
    .three .sky { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:.38; filter:brightness(.68) }
    .three .veil { position:absolute; inset:0; background:linear-gradient(90deg,#111022ee 0%,#171229d9 57%,#11112577),linear-gradient(0deg,#12102599,transparent 50%) }
    .three .orb { position:absolute; right:${vertical ? -250 : -160}px; top:${vertical ? 920 : 620}px; width:${vertical ? 720 : 680}px; opacity:.77; filter:drop-shadow(0 10px 40px #caab7055) }
    .three h1 { top:${vertical ? 430 : 305}px; font-size:${vertical ? 100 : 88}px; width:875px }
    .three .steps { position:absolute; z-index:5; left:80px; top:${vertical ? 830 : 650}px; width:${vertical ? 790 : 700}px }
    .three .step { display:flex; align-items:flex-start; gap:28px; border-top:1px solid #d6b97777; padding:${vertical ? 32 : 24}px 0; min-height:${vertical ? 165 : 135}px; text-shadow:0 2px 10px #0b0c17 }
    .three .step:last-child { border-bottom:1px solid #d6b97777 }
    .three .number { width:80px; color:#e9c67d; font-size:${vertical ? 29 : 24}px; letter-spacing:.08em }
    .three .step div { display:flex; flex-direction:column; gap:6px }
    .three .step strong { font:500 ${vertical ? 42 : 38}px/1.12 Georgia,serif }
    .three .step div span { font-size:${vertical ? 24 : 22}px; color:#e1d6cd }
    .three .footer { color:#f3d48e }
  </style></head><body><main class="poster ${post}">
    ${post === 'one' ? `<img class="scene" src="${images.letter}"><div class="shade"></div>` : ''}
    ${post === 'two' ? `<img class="orb" src="${images.globe}">` : ''}
    ${post === 'three' ? `<img class="sky" src="${images.atmosphere}"><div class="veil"></div><img class="orb" src="${images.compass}">` : ''}
    <div class="brand"><img src="${images.logo}"><span>${t.brand}</span></div>
    <div class="kicker">${data.kicker}</div><h1>${data.title}</h1>
    ${data.body ? `<div class="body">${data.body}</div>` : ''}${steps}
    <div class="footer">${data.end}</div>
  </main></body></html>`;
}

const browser = await chromium.launch({ headless: true });
const filenames = { one: '01-convite', two: '02-aspectos', three: '03-como-funciona' };
try {
  for (const post of ['one', 'two', 'three']) {
    for (const locale of ['pt', 'en']) {
      for (const [format, vertical] of [['feed', false], ['vertical', true]]) {
        const page = await browser.newPage({ viewport: { width: 1080, height: vertical ? 1920 : 1350 }, deviceScaleFactor: 1 });
        await page.setContent(html(post, locale, vertical), { waitUntil: 'load' });
        await page.evaluate(() => Promise.all(Array.from(document.images, (img) => img.decode())));
        const out = path.join(here, 'EXPORTAR', format, `${filenames[post]}-${locale}.png`);
        await page.screenshot({ path: out });
        console.log(out);
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}
