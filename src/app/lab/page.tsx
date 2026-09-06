"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Feather,
  Heart,
  MoonStar,
  RotateCcw,
  Sparkles,
  Wind,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import {
  getLocalSavedMessages,
  saveLocalPracticeMessage,
} from "@/lib/client/localUniverse";
import { syncLocalUniverseToAccount } from "@/lib/client/syncLocalUniverse";
import { PDU_ASSETS } from "@/lib/pdu-assets";
import {
  LAB_ARRIVAL_KEYS,
  LAB_PRACTICE_KEYS,
  getLabPracticeContinuity,
  isLabPracticeKey,
  type LabArrivalKey,
  type LabPracticeContinuity,
  type LabPracticeKey,
  type LabPracticePayload,
} from "@/lib/lab/practice";

type AnswerKey = "signal" | "care" | "nextStep";

const answerKeys: AnswerKey[] = ["signal", "care", "nextStep"];

function getStoredLabContinuity() {
  const practicePayloads = getStoredLabPracticePayloads();
  return getLabPracticeContinuity(practicePayloads);
}

function getStoredLabPracticePayloads() {
  return getLocalSavedMessages()
    .filter((message) => message.message_type === "practice")
    .map((message) => message.payload);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getRemoteLabPracticePayloads(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.messages)) return [];
  return value.messages.flatMap((message) => {
    if (!isRecord(message) || message.message_type !== "practice") return [];
    return [message.payload];
  });
}

const arrivalIcons: Record<LabArrivalKey, LucideIcon> = {
  unclear: Compass,
  transition: MoonStar,
  overloaded: Wind,
  ready: Sparkles,
};

const practiceIcons: Record<LabPracticeKey, LucideIcon> = {
  clarity_checkin: Compass,
  decision_pause: Sparkles,
  transition_anchor: MoonStar,
  quiet_the_noise: Wind,
  self_care_reset: Heart,
};

const copy = {
  pt: {
    eyebrow: "LABORATÓRIO DO AGORA",
    title: "Nem todo momento pede uma carta.",
    intro: "Às vezes, o que você precisa é de um espaço para organizar o que está vivo, perceber o que merece cuidado e escolher um gesto possível.",
    primaryCta: "Começar minha prática",
    secondaryCta: "Voltar para o portal",
    noCards: "Sem cartas. Sem respostas prontas.",
    choosePractice: "Escolha o que você precisa sustentar agora",
    choosePracticeHint: "Cada porta muda o ponto de partida. O caminho continua sendo seu.",
    practices: {
      clarity_checkin: { title: "Dar nome ao momento", text: "Quando tudo parece misturado e você precisa encontrar um fio." },
      decision_pause: { title: "Abrir espaço para decidir", text: "Quando uma escolha pede calma antes de qualquer movimento." },
      transition_anchor: { title: "Atravessar uma mudança", text: "Quando algo terminou, começou ou já não cabe como antes." },
      quiet_the_noise: { title: "Diminuir o ruído", text: "Quando excesso de pensamentos está ocupando todo o espaço." },
      self_care_reset: { title: "Voltar para o cuidado", text: "Quando seu corpo e sua rotina estão pedindo atenção real." },
    },
    openingPrompts: {
      clarity_checkin: { label: "O que precisa ganhar nome em você agora?", helper: "Escreva a sensação, situação ou pensamento que está pedindo espaço." },
      decision_pause: { label: "Que escolha está pedindo espaço dentro de você?", helper: "Não procure a resposta ainda. Descreva os dois lados com honestidade." },
      transition_anchor: { label: "O que está deixando de ser como antes?", helper: "Nomeie o que termina, muda de forma ou abre passagem." },
      quiet_the_noise: { label: "O que está fazendo mais barulho do que deveria?", helper: "Diferencie o que é urgente do que apenas está exigindo atenção." },
      self_care_reset: { label: "O que seu corpo ou sua rotina está pedindo?", helper: "Observe uma necessidade concreta que você costuma empurrar para depois." },
    },
    arrivalEyebrow: "Primeiro, chegue como você está",
    arrivalTitle: "Qual frase se aproxima mais do seu momento?",
    arrivalSubtitle: "Não é um diagnóstico. É só um ponto de partida para a prática conversar com você.",
    arrivals: {
      unclear: { title: "Chego sem conseguir nomear", text: "Muita coisa está acontecendo ao mesmo tempo." },
      transition: { title: "Estou atravessando uma mudança", text: "Uma parte já terminou; outra ainda está tomando forma." },
      overloaded: { title: "Preciso diminuir o ruído", text: "O corpo pede menos pressão e mais espaço para respirar." },
      ready: { title: "Quero me mover com intenção", text: "A direção existe; falta transformar vontade em um gesto." },
    },
    prompts: [
      { label: "O que está mais vivo em você agora?", helper: "Escreva sem organizar demais." },
      { label: "O que está sob o seu cuidado hoje?", helper: "Separe o que depende da sua presença do que precisa de tempo." },
      { label: "Qual é o menor gesto possível nas próximas 24 horas?", helper: "Algo pequeno o bastante para realmente acontecer." },
    ],
    step: "Passo",
    of: "de",
    next: "Continuar",
    back: "Voltar",
    finish: "Guardar minha prática",
    saving: "Guardando no seu Universo...",
    savedDevice: "Salva neste dispositivo",
    savedAccountHint: "Quando você entrar, esta prática pode seguir com você.",
    resultEyebrow: "UMA PAUSA QUE GANHOU FORMA",
    resultTitle: "Você não precisa resolver tudo hoje.",
    resultBody: "Leve esta página como uma pequena âncora. O que importa agora é reconhecer o próximo gesto sem transformar clareza em cobrança.",
    arrivalLabel: "Como você chegou",
    signalLabel: "O que está vivo",
    careLabel: "O que pede cuidado",
    nextStepLabel: "Seu próximo gesto",
    restart: "Fazer outra prática",
    readingCta: "Abrir uma leitura depois",
    universeCta: "Abrir Meu Universo",
    lastPractice: "Sua última prática",
    lastPracticeHint: "Você pode voltar a esse gesto quando quiser.",
    patternHint: "Essa porta já apareceu mais de uma vez. Talvez o próximo passo peça outro ângulo.",
    resumeLast: "Retomar esta prática",
    nextDoor: "Abrir próxima porta",
    otherDoors: "Outras portas do PDU",
    cardDoor: "Quando quiser um símbolo para contemplar",
    cardCta: "Abrir Carta do Dia",
    readingDoor: "Quando uma pergunta pedir mais profundidade",
    readingCtaShort: "Fazer uma leitura",
  },
  en: {
    eyebrow: "THE NOW LAB",
    title: "Not every moment needs a card.",
    intro: "Sometimes what you need is a space to organize what is alive, notice what deserves care, and choose one possible gesture.",
    primaryCta: "Start my practice",
    secondaryCta: "Back to the portal",
    noCards: "No cards. No ready-made answers.",
    choosePractice: "Choose what you need to hold right now",
    choosePracticeHint: "Each door changes the starting point. The path remains yours.",
    practices: {
      clarity_checkin: { title: "Name the moment", text: "When everything feels mixed together and you need to find a thread." },
      decision_pause: { title: "Make room to decide", text: "When a choice needs calm before any movement." },
      transition_anchor: { title: "Move through a change", text: "When something ended, began, or no longer fits as it did." },
      quiet_the_noise: { title: "Lower the noise", text: "When too many thoughts are taking up all the space." },
      self_care_reset: { title: "Return to care", text: "When your body and routine are asking for real attention." },
    },
    openingPrompts: {
      clarity_checkin: { label: "What needs a name in you right now?", helper: "Write the feeling, situation, or thought that is asking for room." },
      decision_pause: { label: "What choice is asking for room inside you?", helper: "Do not look for the answer yet. Describe both sides honestly." },
      transition_anchor: { label: "What is no longer the way it was?", helper: "Name what is ending, changing shape, or opening a passage." },
      quiet_the_noise: { label: "What is making more noise than it should?", helper: "Separate what is urgent from what is simply demanding attention." },
      self_care_reset: { label: "What is your body or routine asking for?", helper: "Notice one concrete need you often keep pushing aside." },
    },
    arrivalEyebrow: "First, arrive as you are",
    arrivalTitle: "Which sentence feels closest to your moment?",
    arrivalSubtitle: "This is not a diagnosis. It is simply a starting point for the practice to meet you.",
    arrivals: {
      unclear: { title: "I arrive without a name for it", text: "A lot is happening at once." },
      transition: { title: "I am moving through a change", text: "One part has ended; another is still taking shape." },
      overloaded: { title: "I need to lower the noise", text: "Your body is asking for less pressure and more room to breathe." },
      ready: { title: "I want to move with intention", text: "The direction is there; now it needs to become a gesture." },
    },
    prompts: [
      { label: "What feels most alive in you right now?", helper: "Write without trying to organize it too much." },
      { label: "What is in your care today?", helper: "Separate what depends on your presence from what needs time." },
      { label: "What is the smallest possible gesture in the next 24 hours?", helper: "Something small enough to actually happen." },
    ],
    step: "Step",
    of: "of",
    next: "Continue",
    back: "Back",
    finish: "Save my practice",
    saving: "Saving to your Universe...",
    savedDevice: "Saved on this device",
    savedAccountHint: "When you sign in, this practice can follow you.",
    resultEyebrow: "A PAUSE WITH A SHAPE",
    resultTitle: "You do not have to solve everything today.",
    resultBody: "Keep this page as a small anchor. What matters now is recognizing the next gesture without turning clarity into pressure.",
    arrivalLabel: "How you arrived",
    signalLabel: "What is alive",
    careLabel: "What asks for care",
    nextStepLabel: "Your next gesture",
    restart: "Start another practice",
    readingCta: "Open a reading later",
    universeCta: "Open My Universe",
    lastPractice: "Your last practice",
    lastPracticeHint: "You can return to this gesture whenever you want.",
    patternHint: "This door has appeared more than once. Perhaps the next step needs another angle.",
    resumeLast: "Resume this practice",
    nextDoor: "Open next door",
    otherDoors: "Other PDU doors",
    cardDoor: "When you want a symbol to contemplate",
    cardCta: "Open Card of the Day",
    readingDoor: "When a question needs more depth",
    readingCtaShort: "Start a reading",
  },
} as const;

export default function LabPage() {
  const { locale } = useI18n();
  const language = locale === "en" ? copy.en : copy.pt;
  const [practiceKey, setPracticeKey] = useState<LabPracticeKey | null>(null);
  const [arrivalKey, setArrivalKey] = useState<LabArrivalKey | null>(null);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [answers, setAnswers] = useState<Record<AnswerKey, string>>({
    signal: "",
    care: "",
    nextStep: "",
  });
  const [completed, setCompleted] = useState<LabPracticePayload | null>(null);
  const [continuity, setContinuity] = useState<LabPracticeContinuity>(() => getLabPracticeContinuity([]));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      const localPayloads = getStoredLabPracticePayloads();
      const storedContinuity = getLabPracticeContinuity(localPayloads);
      if (!active) return;
      setContinuity(storedContinuity);
      const params = new URLSearchParams(window.location.search);
      const requestedPractice = params.get("porta");
      const applyRequestedState = (current: LabPracticeContinuity) => {
        if (!active) return;
        if (params.get("retomar") === "1" && current.latest) {
          setPracticeKey(current.latest.practiceKey);
          setArrivalKey(current.latest.arrivalKey);
          setStep(1);
          setAnswers({
            signal: current.latest.signal,
            care: current.latest.care,
            nextStep: current.latest.nextStep,
          });
        } else if (isLabPracticeKey(requestedPractice)) {
          setPracticeKey(requestedPractice);
        }
      };
      applyRequestedState(storedContinuity);

      void fetch("/api/saved-messages?limit=50", { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) return;
          const remotePayloads = getRemoteLabPracticePayloads(await response.json());
          if (!active || !remotePayloads.length) return;
          const mergedContinuity = getLabPracticeContinuity([...localPayloads, ...remotePayloads]);
          setContinuity(mergedContinuity);
          applyRequestedState(mergedContinuity);
        })
        .catch(() => {
          // Local continuity remains available when the account is offline or signed out.
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, []);

  const selectedPractice = practiceKey ? language.practices[practiceKey] : null;
  const selectedArrival = arrivalKey ? language.arrivals[arrivalKey] : null;
  const prompt = step > 0
    ? step === 1 && practiceKey
      ? language.openingPrompts[practiceKey]
      : language.prompts[step - 1]
    : null;
  const activeAnswerKey = step > 0 ? answerKeys[step - 1] : null;
  const canAdvance = Boolean(
    step === 0
      ? practiceKey && arrivalKey
      : activeAnswerKey && answers[activeAnswerKey].trim().length >= (step === 3 ? 4 : 3)
  );

  const lastPracticeDate = useMemo(() => {
    if (!continuity.latest) return "";
    const date = new Date(continuity.latest.savedAt);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "pt-BR", {
      dateStyle: "medium",
    }).format(date);
  }, [continuity.latest, locale]);

  function updateAnswer(value: string) {
    if (!activeAnswerKey) return;
    setAnswers((current) => ({ ...current, [activeAnswerKey]: value }));
  }

  function beginPractice(key: LabPracticeKey) {
    setCompleted(null);
    setPracticeKey(key);
    setArrivalKey(null);
    setStep(0);
    setAnswers({ signal: "", care: "", nextStep: "" });
  }

  function resumeLastPractice() {
    const practice = continuity.latest;
    if (!practice) return;

    setCompleted(null);
    setPracticeKey(practice.practiceKey);
    setArrivalKey(practice.arrivalKey);
    setStep(1);
    setAnswers({
      signal: practice.signal,
      care: practice.care,
      nextStep: practice.nextStep,
    });
  }

  function advance() {
    if (!canAdvance) return;
    if (step === 3 && arrivalKey && practiceKey) {
      setSaving(true);
      const payload: LabPracticePayload = {
        savedAt: new Date().toISOString(),
        locale,
        practiceKey,
        arrivalKey,
        signal: answers.signal.trim(),
        care: answers.care.trim(),
        nextStep: answers.nextStep.trim(),
      };
      saveLocalPracticeMessage(payload);
      setCompleted(payload);
      setContinuity(getStoredLabContinuity());
      setSaving(false);
      void syncLocalUniverseToAccount();
      return;
    }
    setStep((current) => (current + 1) as 0 | 1 | 2 | 3);
  }

  function reset() {
    setCompleted(null);
    setPracticeKey(null);
    setArrivalKey(null);
    setStep(0);
    setAnswers({ signal: "", care: "", nextStep: "" });
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-[#f6f0e5] text-[#2b211c]">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_15%_8%,rgba(244,213,141,0.36),transparent_28%),radial-gradient(circle_at_90%_58%,rgba(177,214,197,0.28),transparent_32%)]" />
      <header className="relative z-10 border-b border-[#2e2018]/10 bg-[#f6f0e5]/85 px-4 py-4 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2b211c]" aria-label={language.secondaryCta}>
            <ArrowLeft size={17} />
            <span className="hidden sm:inline">{language.secondaryCta}</span>
            <span className="sm:hidden">PDU</span>
          </Link>
          <div className="relative h-8 w-36 sm:h-10 sm:w-48">
            <Image src={PDU_ASSETS.brand.headerWordmark} alt="Palavras do Universo" fill sizes="12rem" className="object-contain object-right" priority />
          </div>
        </div>
      </header>

      <section id="lab" className="relative z-10 px-4 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:gap-16">
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#8a6b3f]">
              <span className="h-px w-8 bg-[#c3984b]" aria-hidden="true" />
              {language.eyebrow}
            </p>
            <h1 className="brand-serif max-w-xl text-5xl font-semibold leading-[0.96] tracking-[-0.04em] sm:text-7xl">{language.title}</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#6f615a] sm:text-lg sm:leading-8">{language.intro}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a href="#pratica" className="inline-flex items-center gap-2 rounded-full bg-[#2b211c] px-5 py-3 text-sm font-semibold text-[#fff8eb] shadow-[0_16px_38px_rgba(43,33,28,0.18)] transition hover:-translate-y-0.5 hover:bg-[#45342a]">
                {language.primaryCta}
                <ArrowRight size={16} />
              </a>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a6b3f]">
                <Feather size={15} />
                {language.noCards}
              </span>
            </div>
          </div>

          <div className="relative min-h-[22rem] overflow-hidden rounded-[2rem] border border-[#d6c3a7] bg-[#29213b] p-5 shadow-[0_26px_80px_rgba(66,45,35,0.18)] sm:min-h-[31rem] sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(244,213,141,0.32),transparent_28%),linear-gradient(145deg,rgba(20,15,37,0.4),rgba(42,28,57,0.92))]" />
            <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full border border-[#f4d58d]/30 sm:h-64 sm:w-64" aria-hidden="true" />
            <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full border border-[#8dd9ca]/25 sm:h-80 sm:w-80" aria-hidden="true" />
            <div className="relative flex h-full min-h-[20rem] flex-col justify-between sm:min-h-[28rem]">
              <div className="flex items-center justify-between gap-4 text-[#fff7e8]">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#f4d58d]">{language.eyebrow}</span>
                <span className="rounded-full border border-[#f4d58d]/35 px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#fff7e8]/75">{language.noCards}</span>
              </div>
              <div className="relative mx-auto aspect-square w-[72%] max-w-[22rem]">
                <Image src={PDU_ASSETS.ambient.mandala} alt="" fill sizes="(max-width: 768px) 70vw, 20rem" className="object-contain opacity-90 drop-shadow-[0_0_44px_rgba(244,213,141,0.34)]" />
                <div className="absolute inset-[24%] rounded-full border border-[#f4d58d]/45 bg-[#1c1630]/35 backdrop-blur-sm" />
                <div className="absolute inset-0 flex items-center justify-center text-center">
                  <span className="max-w-[9rem] text-sm leading-6 text-[#fff7e8]/85">{language.intro}</span>
                </div>
              </div>
              <p className="max-w-sm text-sm leading-6 text-[#fff7e8]/70">{language.savedAccountHint}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="pratica" className="relative z-10 px-4 pb-24 sm:px-8 sm:pb-32">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-[#d6c3a7] bg-[#fffaf2]/90 p-5 shadow-[0_24px_80px_rgba(71,49,35,0.08)] sm:p-10 lg:p-14">
          {completed ? (
            <div className="mx-auto max-w-4xl">
             <div className="flex flex-wrap items-center justify-between gap-4">
               <p className="inline-flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#8a6b3f]"><Check size={16} />{language.resultEyebrow}</p>
               <span className="rounded-full bg-[#e7eee3] px-3 py-1.5 text-xs font-semibold text-[#48634f]">{language.savedDevice}</span>
             </div>
              {selectedPractice ? <p className="mt-5 inline-flex rounded-full border border-[#d8c7ad] bg-[#f8f0e3] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#8a6b3f]">{selectedPractice.title}</p> : null}
             <h2 className="brand-serif mt-6 max-w-2xl text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-6xl">{language.resultTitle}</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#6f615a]">{language.resultBody}</p>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {([
                  [language.signalLabel, completed.signal],
                  [language.careLabel, completed.care],
                  [language.nextStepLabel, completed.nextStep],
                ] as const).map(([label, value]) => (
                  <article key={label} className="rounded-2xl border border-[#e4d3ba] bg-[#f8f0e3] p-5">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#8a6b3f]">{label}</p>
                    <p className="mt-3 text-sm leading-6 text-[#44362f]">{value}</p>
                  </article>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/#leitura" className="inline-flex items-center gap-2 rounded-full bg-[#2b211c] px-5 py-3 text-sm font-semibold text-[#fff8eb] hover:bg-[#45342a]">{language.readingCta}<ArrowRight size={16} /></Link>
                <Link href="/meu-universo" className="inline-flex items-center gap-2 rounded-full border border-[#bda77f] px-5 py-3 text-sm font-semibold text-[#5c4635] hover:bg-[#f4eadb]">{language.universeCta}</Link>
                <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[#8a6b3f] hover:bg-[#f4eadb]"><RotateCcw size={16} />{language.restart}</button>
              </div>
            </div>
          ) : (
            <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
             <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#8a6b3f]">{practiceKey ? language.arrivalEyebrow : language.choosePractice}</p>
                <h2 className="brand-serif mt-4 text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">{practiceKey ? language.arrivalTitle : language.choosePractice}</h2>
                <p className="mt-4 text-sm leading-6 text-[#6f615a]">{practiceKey ? language.arrivalSubtitle : language.choosePracticeHint}</p>
               {continuity.latest ? (
                  <div className="mt-8 rounded-2xl border border-[#d8cfb9] bg-[#f3f5ec] p-4">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#59705a]">{language.lastPractice}</p>
                    <p className="mt-2 text-sm font-semibold text-[#354a39]">{language.practices[continuity.latest.practiceKey].title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#405344]">{continuity.latest.nextStep}</p>
                    <p className="mt-2 text-xs leading-5 text-[#6d776b]">{lastPracticeDate ? `${lastPracticeDate} · ` : ""}{language.lastPracticeHint}</p>
                    {continuity.repeatedPracticeKey ? <p className="mt-3 text-xs leading-5 text-[#59705a]">{language.patternHint}</p> : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={resumeLastPractice} className="inline-flex items-center gap-2 rounded-full bg-[#315d56] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#264b45]">{language.resumeLast}<ArrowRight size={14} /></button>
                      {continuity.recommendedPracticeKey ? <button type="button" onClick={() => beginPractice(continuity.recommendedPracticeKey!)} className="inline-flex items-center gap-2 rounded-full border border-[#9db8a4] px-4 py-2.5 text-xs font-semibold text-[#48634f] hover:bg-[#e6efe5]">{language.nextDoor}<ArrowRight size={14} /></button> : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <div>
                <div className="mb-6 flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold text-[#8a6b3f]">{practiceKey ? `${language.step} ${step + 1} ${language.of} 4` : language.choosePractice}</p>
                  <div className="flex gap-1.5" aria-label={`${language.step} ${step + 1} ${language.of} 4`}>
                    {[0, 1, 2, 3].map((item) => <span key={item} className={`h-1.5 w-10 rounded-full sm:w-14 ${practiceKey && item <= step ? "bg-[#2b211c]" : "bg-[#e5d8c6]"}`} aria-hidden="true" />)}
                  </div>
                </div>

                {!practiceKey ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {LAB_PRACTICE_KEYS.map((key) => {
                      const Icon = practiceIcons[key];
                      const item = language.practices[key];
                      return (
                        <button key={key} type="button" aria-pressed={false} onClick={() => beginPractice(key)} className="group rounded-2xl border border-[#e4d3ba] bg-[#fffdf8] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#bda77f]">
                          <span className="mb-5 inline-flex rounded-full bg-[#f2e8d8] p-2 text-[#8a6b3f]"><Icon size={18} /></span>
                          <span className="block text-base font-semibold text-[#332720]">{item.title}</span>
                          <span className="mt-2 block text-sm leading-5 text-[#6f615a]">{item.text}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : step === 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {LAB_ARRIVAL_KEYS.map((key) => {
                      const Icon = arrivalIcons[key];
                      const item = language.arrivals[key];
                      const selected = arrivalKey === key;
                      return (
                        <button key={key} type="button" aria-pressed={selected} onClick={() => setArrivalKey(key)} className={`group rounded-2xl border p-5 text-left transition ${selected ? "border-[#8a6b3f] bg-[#f5e8cf] shadow-[0_14px_28px_rgba(138,107,63,0.12)]" : "border-[#e4d3ba] bg-[#fffdf8] hover:-translate-y-0.5 hover:border-[#bda77f]"}`}>
                          <span className={`mb-5 inline-flex rounded-full p-2 ${selected ? "bg-[#2b211c] text-[#f4d58d]" : "bg-[#f2e8d8] text-[#8a6b3f]"}`}><Icon size={18} /></span>
                          <span className="block text-base font-semibold text-[#332720]">{item.title}</span>
                          <span className="mt-2 block text-sm leading-5 text-[#6f615a]">{item.text}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[#e4d3ba] bg-[#fffdf8] p-5 sm:p-7">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#8a6b3f]">{language.step} {step}</p>
                    <h3 className="brand-serif mt-4 text-3xl font-semibold leading-tight text-[#332720] sm:text-4xl">{prompt?.label}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#6f615a]">{prompt?.helper}</p>
                    <label htmlFor={`lab-${activeAnswerKey}`} className="sr-only">{prompt?.label}</label>
                    <textarea id={`lab-${activeAnswerKey}`} value={activeAnswerKey ? answers[activeAnswerKey] : ""} onChange={(event) => updateAnswer(event.target.value)} rows={6} maxLength={800} autoFocus className="mt-6 min-h-36 w-full resize-y rounded-xl border border-[#d8c7ad] bg-[#fffaf2] px-4 py-3 text-base leading-7 text-[#332720] outline-none transition placeholder:text-[#aa998d] focus:border-[#8a6b3f] focus:ring-2 focus:ring-[#d9bb7d]/40" placeholder={locale === "en" ? "Write here..." : "Escreva aqui..."} />
                    <p className="mt-2 text-right text-xs text-[#927f70]">{activeAnswerKey ? answers[activeAnswerKey].length : 0}/800</p>
                  </div>
                )}

                {selectedArrival && step > 0 ? <p className="mt-4 text-sm text-[#6f615a]"><span className="font-semibold text-[#8a6b3f]">{language.arrivalLabel}: </span>{selectedArrival.title}</p> : null}
                {practiceKey ? <div className="mt-6 flex flex-wrap justify-between gap-3">
                 <button type="button" onClick={() => setStep((current) => (current > 0 ? (current - 1) as 0 | 1 | 2 | 3 : 0))} disabled={step === 0 || saving} className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[#8a6b3f] disabled:cursor-not-allowed disabled:opacity-35 hover:bg-[#f4eadb]"><ArrowLeft size={16} />{language.back}</button>
                 <button type="button" onClick={advance} disabled={!canAdvance || saving} className="inline-flex items-center gap-2 rounded-full bg-[#2b211c] px-5 py-3 text-sm font-semibold text-[#fff8eb] transition hover:bg-[#45342a] disabled:cursor-not-allowed disabled:opacity-40">{saving ? language.saving : step === 3 ? language.finish : language.next}<ArrowRight size={16} /></button>
                </div> : null}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="relative z-10 border-t border-[#d6c3a7] px-4 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#8a6b3f]">{language.otherDoors}</p>
              <h2 className="brand-serif mt-3 text-3xl font-semibold sm:text-4xl">{locale === "en" ? "Your path can begin in more than one place." : "O seu caminho pode começar por mais de um lugar."}</h2>
            </div>
            <Heart className="text-[#bc8b58]" size={28} strokeWidth={1.4} aria-hidden="true" />
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Link href="/carta-do-dia" className="group rounded-2xl border border-[#e4d3ba] bg-[#fffaf2] p-5 transition hover:-translate-y-0.5 hover:border-[#bda77f]">
              <p className="text-sm text-[#6f615a]">{language.cardDoor}</p>
              <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#5d432c]">{language.cardCta}<ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
            </Link>
            <Link href="/#leitura" className="group rounded-2xl border border-[#e4d3ba] bg-[#fffaf2] p-5 transition hover:-translate-y-0.5 hover:border-[#bda77f]">
              <p className="text-sm text-[#6f615a]">{language.readingDoor}</p>
              <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#5d432c]">{language.readingCtaShort}<ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
