import { ArrowRight, CheckCircle2, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { IMPACT_AREA_LABELS, type ImpactArea } from "@/lib/impact/actions";
import { PDU_ASSETS } from "@/lib/pdu-assets";

type PublicParticipation = {
  action_key: string;
  action_title: string;
  area: ImpactArea;
  root_chain_token: string;
};

export default async function PublicActionPage(props: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await props.params;
  let participation: PublicParticipation | null = null;
  let participants = 0;
  let completed = 0;

  if (hasSupabaseConfig()) {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("impact_public_participations")
      .select("action_key,action_title,area,root_chain_token")
      .eq("public_token", token)
      .maybeSingle();
    participation = data as PublicParticipation | null;

    if (participation) {
      const { data: chain } = await supabase
        .from("impact_public_participations")
        .select("status")
        .eq("root_chain_token", participation.root_chain_token);
      participants = chain?.length ?? 0;
      completed = chain?.filter((item) => item.status === "completed").length ?? 0;
    }
  }

  if (!participation) {
    return (
      <main className="ritual-texture grid min-h-screen place-items-center px-4 py-12 text-[#241b18]">
        <section className="w-full max-w-xl rounded-lg border border-[#dfccb0] bg-[#fffaf2] p-7 text-center">
          <Image
            src={PDU_ASSETS.surfaces.action}
            alt=""
            width={44}
            height={44}
            className="mx-auto h-11 w-11 object-contain"
          />
          <h1 className="brand-serif mt-5 text-4xl font-semibold">
            Esta corrente ainda não pode ser aberta.
          </h1>
          <Link href="/#acao" className="mt-6 inline-flex rounded-full bg-[#241b18] px-5 py-3 text-sm font-semibold text-white">
            Escolher uma ação
          </Link>
        </section>
      </main>
    );
  }

  const continueUrl = `/?acao=${encodeURIComponent(
    participation.action_key
  )}&corrente=${encodeURIComponent(token)}#acao`;

  return (
    <main className="ritual-texture min-h-screen px-4 py-12 text-[#241b18] sm:py-20">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-[#bdd2c2] bg-[#fffaf2] shadow-[0_28px_90px_rgba(49,93,86,0.16)]">
        <div className="bg-[#173b38] px-6 py-9 text-[#fff7e8] sm:px-10">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#f4d58d]/20 bg-white/[0.06]">
            <Image
              src={PDU_ASSETS.surfaces.action}
              alt=""
              width={34}
              height={34}
              className="h-8 w-8 object-contain"
            />
          </span>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[#cde3d7]">
            Uma palavra virou ação
          </p>
          <h1 className="brand-serif mt-3 text-4xl font-semibold leading-tight sm:text-6xl">
            Alguém convidou você para continuar uma corrente de cuidado.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#d9e7e1]">
            Não existe cobrança, competição ou obrigação. Adapte o gesto à sua
            realidade e faça somente o que for seguro e possível.
          </p>
        </div>

        <div className="p-6 sm:p-10">
          <span className="rounded-full bg-[#dceade] px-3 py-1.5 text-xs font-semibold text-[#315d56]">
            {IMPACT_AREA_LABELS[participation.area]}
          </span>
          <h2 className="brand-serif mt-5 text-4xl font-semibold">
            {participation.action_title}
          </h2>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[#d7e4da] bg-[#f3f8f3] p-4">
              <Users size={18} className="text-[#315d56]" />
              <strong className="mt-3 block text-2xl">{participants}</strong>
              <span className="text-sm text-[#5f7163]">gestos foram assumidos</span>
            </div>
            <div className="rounded-lg border border-[#d7e4da] bg-[#f3f8f3] p-4">
              <CheckCircle2 size={18} className="text-[#315d56]" />
              <strong className="mt-3 block text-2xl">{completed}</strong>
              <span className="text-sm text-[#5f7163]">ações foram declaradas concluídas</span>
            </div>
          </div>

          <p className="mt-5 text-xs leading-5 text-[#7a7068]">
            Os números representam compromissos e conclusões declarados pelos
            participantes. Nenhum plano pessoal ou reflexão é exibido.
          </p>

          <Link
            href={continueUrl}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#315d56] px-5 py-3 text-sm font-semibold text-white"
          >
            Continuar esta corrente
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
