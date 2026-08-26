import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck } from "lucide-react";
import VoucherClaimCard from "@/components/vouchers/VoucherClaimCard";
import { buildLoginPath } from "@/lib/auth/redirect";
import { getAuthenticatedUser, hasSupabaseConfig } from "@/lib/supabase/server";
import { getVoucherByCode } from "@/lib/vouchers/service";
import { pricingPlans, productCards } from "@/lib/product/catalog";
import { PDU_ASSETS } from "@/lib/pdu-assets";
import { PduAssetStory } from "@/components/PduAssetStory";
import { PDU_ASSET_STORIES } from "@/lib/pdu-asset-stories";

function getProductTitle(productKey: string | null) {
  if (!productKey) return null;
  const card = productCards.find((item) => item.productKey === productKey);
  if (card) return card.title;
  const plan = pricingPlans.find((item) => item.productKey === productKey);
  return plan?.title ?? productKey;
}

export default async function VoucherClaimPage(props: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await props.params;
  const user = await getAuthenticatedUser();
  const voucher = hasSupabaseConfig() ? await getVoucherByCode(code) : null;

  const productTitles = Array.from(
    new Set(
      [...(voucher?.grant_product_keys ?? []), ...(voucher?.eligible_product_keys ?? [])]
        .map((key) => getProductTitle(key))
        .filter(Boolean)
    )
  ) as string[];

  const kindVisual =
    voucher?.kind === "invite"
      ? PDU_ASSETS.surfaces.voucherInvite
      : voucher?.kind === "discount"
        ? PDU_ASSETS.surfaces.voucherDiscount
        : PDU_ASSETS.surfaces.voucherAccess;

  return (
    <main className="ritual-texture min-h-screen bg-[#110f16] px-4 py-10 text-[#f3eadf]">
      <section className="w-full max-w-3xl rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(244,213,141,0.14),transparent_22%),linear-gradient(180deg,rgba(20,17,27,0.96),rgba(8,7,13,0.96))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.32)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#5e5137] bg-[#1b1713] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#f4d58d]">
              <ShieldCheck size={14} />
              Palavras do Universo
            </div>
            <h1 className="brand-serif mt-5 text-4xl font-semibold leading-none sm:text-5xl">
              {voucher ? voucher.label : "Esse código não pode ser aberto agora."}
            </h1>
            <p className="mt-4 text-base leading-7 text-[#cdbfae]">
              {voucher
                ? voucher.description ||
                  "Esse acesso foi preparado para abrir uma leitura, um desconto ou um convite específico dentro do seu universo."
                : "O link pode ter expirado, sido pausado ou removido pelo administrador."}
            </p>
          </div>

          <div className="grid h-16 w-16 place-items-center rounded-[24px] border border-[#5e5137] bg-[#1b1713] text-[#f4d58d]">
            <Image
              src={kindVisual}
              alt=""
              width={42}
              height={42}
              className="h-10 w-10 object-contain"
            />
          </div>
        </div>

        {voucher ? (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#a59a8e]">
                  Tipo
                </span>
                <strong className="mt-2 block text-lg text-[#fff7e8]">
                  {voucher.kind === "invite"
                    ? "Convite"
                    : voucher.kind === "discount"
                      ? "Desconto"
                      : "Híbrido"}
                </strong>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#a59a8e]">
                  Código
                </span>
                <strong className="mt-2 block break-all text-lg text-[#fff7e8]">
                  {voucher.code}
                </strong>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#a59a8e]">
                  Expiração
                </span>
                <strong className="mt-2 block text-lg text-[#fff7e8]">
                  {voucher.expires_at
                    ? new Date(voucher.expires_at).toLocaleDateString()
                    : "Sem prazo"}
                </strong>
              </div>
            </div>

            {productTitles.length ? (
              <div className="mt-6 rounded-[24px] border border-white/10 bg-black/10 px-4 py-4">
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#a59a8e]">
                  Produtos relacionados
                </span>
                <p className="mt-2 text-sm leading-6 text-[#fff7e8]">
                  {productTitles.join(", ")}
                </p>
              </div>
            ) : null}

            <div className="mt-6">
              <VoucherClaimCard
                code={voucher.code}
                kind={voucher.kind}
                userEmail={user?.email ?? ""}
                isAuthenticated={Boolean(user)}
              />
            </div>
          </>
        ) : (
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#1b1713]"
            >
              Voltar para a página inicial
            </Link>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {!user ? (
            <Link
              href={buildLoginPath(`/voucher/${encodeURIComponent(code)}`)}
              className="inline-flex items-center gap-2 rounded-full border border-[#4e473f] bg-[#18141d] px-5 py-3 text-sm font-semibold text-[#efe2d2]"
            >
              Entrar para continuar
              <ArrowRight size={15} />
            </Link>
          ) : (
            <Link
              href="/meu-universo"
              className="inline-flex items-center gap-2 rounded-full border border-[#4e473f] bg-[#18141d] px-5 py-3 text-sm font-semibold text-[#efe2d2]"
            >
              Abrir Meu Universo
              <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </section>
      <PduAssetStory {...PDU_ASSET_STORIES.auth} />
    </main>
  );
}
