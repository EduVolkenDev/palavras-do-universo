import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  MessageCircleHeart,
  Orbit,
  Ticket,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";

const ADMIN_SECTIONS = [
  { href: "/admin/eventos", label: "Experiência", detail: "Saúde do site", Icon: Activity },
  { href: "/admin/codigos", label: "Acessos", detail: "Códigos e convites", Icon: Ticket },
  { href: "/admin/feedback", label: "Vozes", detail: "Feedbacks", Icon: MessageCircleHeart },
  { href: "/admin/teste-checkout", label: "Laboratório", detail: "Ensaio interno", Icon: FlaskConical },
];

export default function AdminPageFrame({
  path,
  eyebrow,
  title,
  description,
  ownerEmail,
  hasSupabase,
  actions,
  children,
}: {
  path: string;
  eyebrow: string;
  title: string;
  description: string;
  ownerEmail: string;
  hasSupabase: boolean;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_12%_0%,rgba(202,168,111,0.17),transparent_34rem),linear-gradient(180deg,#f8f3eb_0%,#f2eadf_100%)] px-4 py-4 text-[#281f20] sm:px-6 sm:py-7 lg:px-8">
      <div className="pointer-events-none absolute -right-32 top-[26rem] h-[28rem] w-[28rem] rounded-full bg-[#8e70aa]/[0.07] blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto grid w-full max-w-[94rem] gap-5 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-7">
        <aside className="h-fit rounded-[28px] border border-[#dfd2c2] bg-[#fffaf3]/85 p-4 shadow-[0_18px_50px_rgba(60,39,31,0.07)] backdrop-blur-sm lg:sticky lg:top-6 lg:p-5">
          <Link href="/meu-universo" className="group flex items-center gap-3 rounded-2xl px-2 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[#8e70aa]">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#291e35] text-[#efd59a] shadow-[0_8px_20px_rgba(41,30,53,0.2)]"><Orbit size={23} strokeWidth={1.4} /></span>
            <span className="min-w-0"><span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-[#987a4c]">Palavras do</span><span className="brand-serif block text-lg font-semibold leading-tight text-[#2c2131]">Universo</span></span>
            <ArrowUpRight size={15} className="ml-auto shrink-0 text-[#9b8a7e] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
          <div className="mx-2 my-4 border-t border-[#e8ddd0]" />
          <p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#9c8878]">Seu observatório</p>
          <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label="Navegação da administração">
            {ADMIN_SECTIONS.map(({ href, label, detail, Icon }) => {
              const active = path === href;
              return (
                <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`group flex min-w-max items-center gap-3 rounded-2xl px-3 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8e70aa] lg:min-w-0 ${active ? "bg-[#2b2036] text-[#fff8ed] shadow-[0_9px_20px_rgba(43,32,54,0.16)]" : "text-[#62554f] hover:bg-[#f1e9df] hover:text-[#302335]"}`}>
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${active ? "bg-white/10 text-[#efd59a]" : "bg-[#f1e9df] text-[#8e70aa] group-hover:bg-white"}`}><Icon size={17} /></span>
                  <span className="lg:min-w-0"><span className="block text-xs font-bold">{label}</span><span className={`hidden text-[10px] lg:block ${active ? "text-white/60" : "text-[#9b8a7e]"}`}>{detail}</span></span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-5 hidden rounded-2xl border border-[#e6dacb] bg-[linear-gradient(145deg,#f8f1e6,#fffaf3)] p-4 lg:block">
            <div className="flex items-center gap-2 text-[#7d6541]"><ShieldCheck size={15} /><span className="text-[9px] font-bold uppercase tracking-[0.16em]">Área protegida</span></div>
            <p className="mt-2 break-all text-[11px] leading-5 text-[#79695e]">Acesso restrito à conta proprietária.</p>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="relative isolate overflow-hidden rounded-[28px] border border-[#382c43] bg-[#241a30] px-5 py-6 text-[#fff8ec] shadow-[0_26px_68px_rgba(48,32,57,0.19)] sm:rounded-[34px] sm:px-8 sm:py-8 lg:px-10 lg:py-9">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_86%_10%,rgba(145,105,178,0.35),transparent_27rem),radial-gradient(circle_at_0%_100%,rgba(201,158,91,0.15),transparent_26rem)]" aria-hidden="true" />
            <Orbit className="pointer-events-none absolute -right-8 -top-14 h-52 w-52 text-[#f0d596]/[0.09] sm:h-64 sm:w-64" strokeWidth={0.55} aria-hidden="true" />
            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="inline-flex items-center gap-2 rounded-full border border-[#efd59a]/20 bg-white/[0.06] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#efd59a] sm:text-[10px]"><span className="h-1.5 w-1.5 rounded-full bg-[#d9bb7a]" />{eyebrow}</p>
                <h1 className="brand-serif mt-4 text-4xl font-semibold leading-[1.04] tracking-[-0.025em] text-[#fff8ec] sm:text-5xl">{title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d8cddd] sm:text-[15px]">{description}</p>
              </div>
              {actions ? <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4 xl:border-0 xl:pt-0">{actions}</div> : null}
            </div>
          </header>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 px-1 text-[10px] text-[#806e61] sm:text-xs">
            <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#dfd2c2] bg-white/60 px-3 py-2"><ShieldCheck size={14} className="shrink-0 text-[#477e70]" /><span className="truncate">{ownerEmail || "Conta proprietária autorizada"}</span></span>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 ${hasSupabase ? "border-[#c9ddd2] bg-[#edf6f0] text-[#47715e]" : "border-[#e2bdb5] bg-[#fff2ef] font-semibold text-[#8a4038]"}`}><span className={`h-1.5 w-1.5 rounded-full ${hasSupabase ? "bg-[#5a9a7c]" : "bg-[#bb5c50]"}`} />{hasSupabase ? "Serviços conectados" : "Serviço de dados indisponível"}</span>
          </div>
          <div className="mt-6 space-y-6">{children}</div>
          <footer className="mt-9 flex flex-wrap items-center justify-between gap-2 border-t border-[#dfd2c2] px-1 pt-4 text-[10px] uppercase tracking-[0.14em] text-[#9a887b]"><span>Palavras do Universo · Observatório</span><span>Privado · Acesso proprietário</span></footer>
        </div>
      </div>
    </main>
  );
}
