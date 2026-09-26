"use client";

import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { EduReadingBookingPanel } from "@/components/EduReadingBookingPanel";
import { PDU_ASSETS } from "@/lib/pdu-assets";

const COPY = {
  "pt-BR": {
    eyebrow: "Quem está por trás",
    homeTitle: "Oi, eu sou o Edu.",
    homeText: "Leio tarot há cerca de 10 anos e sou o criador do Palavras do Universo. Além das experiências digitais da plataforma, você também pode entrar em contato para uma leitura de tarot comigo.",
    primary: "Quero uma leitura com o Edu",
    secondary: "Conheça minha história",
    back: "Palavras do Universo",
    heroEyebrow: "Leitura com o Edu",
    heroTitle: "Uma leitura de tarot comigo, Edu.",
    heroText: "Há cerca de 10 anos, as cartas fazem parte da minha vida. Aqui, você pode conhecer um pouco da minha história e entrar em contato para conversar sobre uma leitura comigo.",
    contact: "Conversar sobre uma leitura",
    storyEyebrow: "Minha história",
    storyTitle: "Uma história que começou antes deste site.",
    story: [
      "O Palavras do Universo começou a ganhar forma em 2020, quando uma pessoa me ajudou a criar a primeira versão do site em WordPress.",
      "Na época, eu não tinha muito tempo para dedicar ao projeto. Acabamos perdendo o contato e, depois, o site saiu do ar. Mantive o Instagram, mesmo durante os períodos em que não conseguia publicar.",
      "A vontade de retomar esse espaço continuou comigo.",
      "Hoje, estou dando continuidade àquela ideia, reunindo minha experiência com o tarot e meu trabalho com design e desenvolvimento. Estou construindo o Palavras do Universo com as minhas próprias mãos, cuidando das experiências digitais e abrindo espaço para quem deseja uma leitura realizada por mim.",
      "Quero que este seja também um lugar de encontro: onde você possa conhecer quem está por trás do projeto e se sentir à vontade para conversar comigo.",
    ],
    stepsEyebrow: "Como solicitar",
    stepsTitle: "Começamos por uma conversa simples.",
    steps: [
      ["Entre em contato", "Conte que deseja uma leitura comigo. Você não precisa compartilhar detalhes íntimos nesse primeiro contato."],
      ["Conheça as possibilidades", "Conversamos sobre o formato, o valor e a disponibilidade antes de combinar o atendimento."],
      ["Combine sua leitura", "Depois de acertarmos os detalhes, confirmamos como a leitura será realizada."],
    ],
    differenceEyebrow: "Duas experiências, dois ritmos",
    platform: "Na plataforma",
    platformText: "As experiências digitais do Palavras do Universo podem utilizar inteligência artificial, conforme indicado em cada experiência.",
    edu: "Com o Edu",
    eduText: "Nesta modalidade, a leitura é realizada por mim. Entre em contato para conhecer as condições e combinar o atendimento.",
    faqEyebrow: "Perguntas frequentes",
    faqTitle: "Antes de conversar.",
    faq: [
      ["É o Edu quem faz esta leitura?", "Sim. Esta página é dedicada às leituras realizadas por mim, Edu."],
      ["Como faço para solicitar?", "Use o botão de contato para conversar comigo sobre formato, valor e disponibilidade."],
      ["Preciso contar minha situação no primeiro contato?", "Não. Você pode começar apenas dizendo que tem interesse em uma leitura."],
      ["A leitura garante o que vai acontecer?", "A leitura oferece interpretações e possibilidades para reflexão. Não garante acontecimentos nem substitui suas próprias decisões."],
    ],
    closeTitle: "Quer conversar comigo?",
    closeText: "Se você tem interesse em uma leitura ou quer entender melhor como funciona, entre em contato. Vamos conversar sobre o que você está buscando.",
    unavailable: "O canal de contato está sendo atualizado. Volte em breve.",
    portraitAlt: "Edu segurando um leque de cartas de tarot diante de um portal dourado.",
  },
  en: {
    eyebrow: "Who is behind this",
    homeTitle: "Hi, I’m Edu.",
    homeText: "I have read tarot for around 10 years and created Palavras do Universo. Beyond the platform’s digital experiences, you can also reach out for a tarot reading with me.",
    primary: "Request a reading with Edu",
    secondary: "Read my story",
    back: "Palavras do Universo",
    heroEyebrow: "Reading with Edu",
    heroTitle: "A tarot reading with me, Edu.",
    heroText: "For around 10 years, the cards have been part of my life. Here, you can learn a little about my story and reach out to talk about a reading with me.",
    contact: "Talk about a reading",
    storyEyebrow: "My story",
    storyTitle: "A story that started before this website.",
    story: [
      "Palavras do Universo began to take shape in 2020, when someone helped me build its first WordPress version.",
      "At the time, I did not have much time to devote to the project. We lost touch, and the website later went offline. I kept the Instagram account, even through periods when I could not publish.",
      "The wish to return to this space stayed with me.",
      "Today, I am continuing that idea by bringing together my tarot experience and my work in design and development. I am building Palavras do Universo with my own hands, caring for its digital experiences and opening space for people who want a reading directly with me.",
      "I want this to be a place of meeting too: where you can know who is behind the project and feel at ease to talk with me.",
    ],
    stepsEyebrow: "How to request it",
    stepsTitle: "We begin with a simple conversation.",
    steps: [["Reach out", "Tell me you would like a reading. You do not need to share intimate details in this first contact."], ["Learn the possibilities", "We talk about format, price and availability before arranging the session."], ["Arrange your reading", "After agreeing on the details, we confirm how the reading will happen."]],
    differenceEyebrow: "Two experiences, two rhythms",
    platform: "On the platform",
    platformText: "Palavras do Universo’s digital experiences may use artificial intelligence, as indicated in each experience.",
    edu: "With Edu",
    eduText: "In this format, the reading is done by me. Reach out to learn the conditions and arrange it.",
    faqEyebrow: "Frequently asked questions",
    faqTitle: "Before we talk.",
    faq: [["Does Edu do this reading?", "Yes. This page is dedicated to readings done by me, Edu."], ["How do I request one?", "Use the contact button to talk with me about format, price and availability."], ["Do I need to explain my situation in the first contact?", "No. You can begin simply by saying you are interested in a reading."], ["Does a reading guarantee what will happen?", "A reading offers interpretations and possibilities for reflection. It does not guarantee events or replace your own decisions."]],
    closeTitle: "Would you like to talk with me?",
    closeText: "If you are interested in a reading or want to understand how it works, get in touch. We can talk about what you are looking for.",
    unavailable: "The contact channel is being updated. Please return soon.",
    portraitAlt: "Edu holding a fan of tarot cards in front of a golden portal.",
  },
} as const;

export function EduReadingHomeSection() {
  const { locale } = useI18n();
  const copy = COPY[locale];
  return (
    <section className="pdu-mobile-deferred relative overflow-hidden bg-[#efe7d9] px-4 py-20 text-[#241b18] sm:px-6 lg:px-8 lg:py-28" aria-labelledby="edu-home-title">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(191,146,75,0.18),transparent_30%),radial-gradient(circle_at_82%_40%,rgba(80,53,108,0.14),transparent_32%)]" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[27rem] overflow-hidden rounded-[2rem] border border-[#b88a4b]/45 bg-[#281b25] shadow-[0_30px_90px_rgba(53,31,22,0.25)]">
          <Image src={PDU_ASSETS.people.eduReadingPortrait} alt={copy.portraitAlt} fill sizes="(max-width: 1024px) min(90vw, 27rem), 38vw" className="object-cover object-[center_22%]" />
        </div>
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8e674d]">{copy.eyebrow}</p>
          <h2 id="edu-home-title" className="brand-serif mt-4 text-4xl font-semibold leading-tight sm:text-6xl">{copy.homeTitle}</h2>
          <p className="mt-6 text-base leading-8 text-[#6f5d55]">{copy.homeText}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/leitura-com-edu#contato" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#241b18] px-5 py-3 text-sm font-semibold text-[#fff7e8] transition hover:-translate-y-0.5 hover:bg-[#3a2920]">{copy.primary}<ArrowRight size={17} /></Link>
            <Link href="/leitura-com-edu#historia" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#8a6b3f]/45 bg-white/50 px-5 py-3 text-sm font-semibold text-[#6f5134] transition hover:bg-white">{copy.secondary}<ArrowRight size={17} /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function EduReadingPage() {
  const { locale } = useI18n();
  const copy = COPY[locale];
  return <main className="min-h-screen overflow-hidden bg-[#f7f0e5] text-[#241b18]">
    <section className="relative overflow-hidden bg-[#171225] px-4 pb-16 pt-8 text-[#fff7e8] sm:px-6 lg:px-8 lg:pb-24 lg:pt-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_35%,rgba(124,78,178,0.46),transparent_26%),radial-gradient(circle_at_84%_48%,rgba(225,174,83,0.24),transparent_25%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl"><Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d896] transition hover:text-white">← {copy.back}</Link>
        <div className="mt-12 grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f5d896]">{copy.heroEyebrow}</p><h1 className="brand-serif mt-5 text-5xl font-semibold leading-[0.98] sm:text-7xl">{copy.heroTitle}</h1><p className="mt-7 max-w-xl text-base leading-8 text-[#d8ccc0]">{copy.heroText}</p><div className="mt-8"><a href="#agendar" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#241b18] transition hover:bg-[#ffe3a3]">{locale === "en" ? "Start my request" : "Começar meu pedido"}<ArrowRight size={16}/></a></div></div>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[32rem] overflow-hidden rounded-[2rem] border border-[#f4d58d]/35 bg-black/20 shadow-[0_35px_100px_rgba(0,0,0,0.4)]"><Image src={PDU_ASSETS.people.eduReadingPortrait} alt={copy.portraitAlt} fill priority sizes="(max-width: 1024px) min(92vw, 32rem), 42vw" className="object-cover object-[center_22%]" /></div>
        </div>
      </div>
    </section>
    <EduReadingBookingPanel />
    <section id="historia" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8e674d]">{copy.storyEyebrow}</p><h2 className="brand-serif mt-4 text-4xl font-semibold leading-tight sm:text-5xl">{copy.storyTitle}</h2></div><div className="space-y-5 text-base leading-8 text-[#6f5d55]">{copy.story.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></div></section>
    <section className="bg-[#ede1cf] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><div className="mx-auto max-w-6xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8e674d]">{copy.stepsEyebrow}</p><h2 className="brand-serif mt-4 max-w-2xl text-4xl font-semibold sm:text-5xl">{copy.stepsTitle}</h2><div className="mt-10 grid gap-5 md:grid-cols-3">{copy.steps.map(([title,text],index) => {
      const visuals = [
        { src: PDU_ASSETS.people.eduReadingLetter, alt: locale === "en" ? "Letter sealed with a crescent moon" : "Carta selada com uma lua crescente" },
        { src: PDU_ASSETS.people.eduReadingCards, alt: locale === "en" ? "Three luminous tarot cards" : "Três cartas de tarot luminosas" },
        { src: PDU_ASSETS.people.eduReadingCalendar, alt: locale === "en" ? "Mystical calendar with a crescent moon" : "Calendário místico com uma lua crescente" },
      ];
      const visual = visuals[index];
      return <article key={title} className="group relative isolate flex min-h-[31rem] flex-col overflow-hidden rounded-[1.75rem] border border-[#d8c3a6] bg-[#fffaf2] p-6 shadow-[0_18px_48px_rgba(91,63,35,0.08)] sm:p-7"><div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-[radial-gradient(circle_at_50%_80%,rgba(230,185,95,0.22),transparent_66%)]" aria-hidden="true" /><span className="relative text-xs font-bold tracking-[0.16em] text-[#9d753e]">0{index+1}</span><h3 className="relative mt-5 text-2xl font-semibold">{title}</h3><p className="relative mt-3 max-w-[18rem] text-sm leading-7 text-[#6f5d55]">{text}</p><div className="relative mt-auto flex min-h-[14rem] items-end justify-center pt-4"><Image src={visual.src} alt={visual.alt} width={720} height={690} sizes="(max-width: 767px) min(90vw, 28rem), 30vw" className="h-auto w-[min(25rem,118%)] max-w-none translate-y-6 transition duration-500 group-hover:-translate-y-1 group-hover:scale-[1.03]" /></div></article>;
    })}</div></div></section>
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><div className="mx-auto max-w-6xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8e674d]">{copy.differenceEyebrow}</p><div className="mt-6 grid gap-4 md:grid-cols-2"><article className="rounded-[1.5rem] border border-[#d8c3a6] bg-white/60 p-7"><Sparkles className="text-[#9d753e]" size={20}/><h2 className="brand-serif mt-6 text-3xl font-semibold">{copy.platform}</h2><p className="mt-4 text-sm leading-7 text-[#6f5d55]">{copy.platformText}</p></article><article className="rounded-[1.5rem] bg-[#241b18] p-7 text-[#fff7e8]"><CheckCircle2 className="text-[#f4d58d]" size={20}/><h2 className="brand-serif mt-6 text-3xl font-semibold">{copy.edu}</h2><p className="mt-4 text-sm leading-7 text-[#d8ccc0]">{copy.eduText}</p></article></div></div></section>
    <section className="bg-[#ede1cf] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><div className="mx-auto max-w-4xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8e674d]">{copy.faqEyebrow}</p><h2 className="brand-serif mt-4 text-4xl font-semibold sm:text-5xl">{copy.faqTitle}</h2><div className="mt-10 grid gap-3">{copy.faq.map(([question,answer]) => <details key={question} className="rounded-2xl border border-[#d8c3a6] bg-[#fffaf2] p-5"><summary className="cursor-pointer font-semibold text-[#2c1f1b]">{question}</summary><p className="mt-4 text-sm leading-7 text-[#6f5d55]">{answer}</p></details>)}</div></div></section>
    <section id="contato" className="scroll-mt-24 bg-[#171225] px-4 py-20 text-[#fff7e8] sm:px-6 lg:px-8 lg:py-28"><div className="mx-auto max-w-3xl text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f5d896]">Leitura com o Edu</p><h2 className="brand-serif mt-4 text-5xl font-semibold leading-tight sm:text-6xl">{copy.closeTitle}</h2><p className="mt-6 text-base leading-8 text-[#d8ccc0]">{copy.closeText}</p><div className="mt-8 flex justify-center"><a href="#agendar" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#241b18] transition hover:bg-[#ffe3a3]">{locale === "en" ? "Start my request" : "Começar meu pedido"}<ArrowRight size={16}/></a></div></div></section>
  </main>;
}
