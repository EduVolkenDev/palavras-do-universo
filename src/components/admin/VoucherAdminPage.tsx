"use client";

import {
  ArrowRightLeft,
  CheckCircle2,
  Copy,
  Gift,
  PauseCircle,
  Percent,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { pricingPlans, productCards } from "@/lib/product/catalog";

type VoucherKind = "invite" | "discount" | "hybrid";
type VoucherStatus = "draft" | "active" | "paused" | "cancelled" | "deleted";

type VoucherView = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  kind: VoucherKind;
  status: VoucherStatus;
  target_email: string | null;
  target_user_id: string | null;
  transferable: boolean;
  max_uses: number;
  times_used: number;
  expires_at: string | null;
  product_key: string | null;
  eligible_product_keys: string[] | null;
  grant_product_keys: string[] | null;
  grant_usage_limit: number | null;
  grant_expires_days: number | null;
  discount_percent: number | null;
  share_url: string;
  primary_title: string | null;
  created_at: string;
};

type VoucherFormState = {
  code: string;
  label: string;
  description: string;
  kind: VoucherKind;
  productKey: string;
  eligibleProductKeys: string[];
  grantProductKeys: string[];
  grantUsageLimit: string;
  grantExpiresDays: string;
  discountPercent: string;
  maxUses: string;
  expiresAt: string;
  targetEmail: string;
  transferable: boolean;
};

const ALL_PRODUCT_OPTIONS = Array.from(
  new Map(
    [...productCards, ...pricingPlans]
      .filter((item) => typeof item.productKey === "string" && item.productKey.length > 0)
      .map((item) => [item.productKey as string, item.title])
  )
).map(([key, title]) => ({ key, title }));

const DEFAULT_FORM: VoucherFormState = {
  code: "",
  label: "",
  description: "",
  kind: "invite",
  productKey: "caminho_3_cartas",
  eligibleProductKeys: ["caminho_3_cartas", "sinais_do_amor", "clareza_urgente"],
  grantProductKeys: ["caminho_3_cartas"],
  grantUsageLimit: "1",
  grantExpiresDays: "",
  discountPercent: "20",
  maxUses: "1",
  expiresAt: "",
  targetEmail: "",
  transferable: false,
};

function fromDateTimeLocal(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function kindIcon(kind: VoucherKind) {
  switch (kind) {
    case "invite":
      return Gift;
    case "discount":
      return Percent;
    default:
      return Sparkles;
  }
}

function statusTone(status: VoucherStatus) {
  switch (status) {
    case "active":
      return "border-[#bfd9cf] bg-[#edf7f2] text-[#315d56]";
    case "paused":
      return "border-[#e6d6a8] bg-[#fff7dc] text-[#8a6b3f]";
    case "cancelled":
    case "deleted":
      return "border-[#e2c4c2] bg-[#fff1f0] text-[#8a4540]";
    default:
      return "border-[#d9d1cb] bg-[#f7f2ed] text-[#5f544c]";
  }
}

function joinProducts(values: string[] | null) {
  if (!values?.length) return "—";
  return values
    .map((key) => ALL_PRODUCT_OPTIONS.find((item) => item.key === key)?.title ?? key)
    .join(", ");
}

function isGrantKind(kind: VoucherKind) {
  return kind === "invite" || kind === "hybrid";
}

function isDiscountKind(kind: VoucherKind) {
  return kind === "discount" || kind === "hybrid";
}

export default function VoucherAdminPage({
  ownerEmail,
  hasSupabase,
}: {
  ownerEmail: string;
  hasSupabase: boolean;
}) {
  const { t } = useI18n();
  const [vouchers, setVouchers] = useState<VoucherView[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState<VoucherFormState>(DEFAULT_FORM);
  const [transferEmail, setTransferEmail] = useState<Record<string, string>>({});
  const [transferAccess, setTransferAccess] = useState<Record<string, boolean>>({});

  const summary = useMemo(
    () => ({
      total: vouchers.length,
      active: vouchers.filter((item) => item.status === "active").length,
      paused: vouchers.filter((item) => item.status === "paused").length,
      redeemed: vouchers.reduce((total, item) => total + item.times_used, 0),
    }),
    [vouchers]
  );

  async function loadVouchers() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/vouchers", { cache: "no-store" });
      const data = (await res.json()) as { vouchers?: VoucherView[]; error?: string };
      if (!res.ok || !Array.isArray(data.vouchers)) {
        throw new Error(data.error || "Could not load vouchers");
      }
      setVouchers(data.vouchers);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load vouchers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadVouchers();
  }, []);

  async function postAdmin(body: Record<string, unknown>) {
    const res = await fetch("/api/admin/vouchers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { error?: string; voucher?: VoucherView };
    if (!res.ok) {
      throw new Error(data.error || t("Não foi possível concluir a ação."));
    }
    await loadVouchers();
    return data;
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await postAdmin({
        action: "create",
        voucher: {
          code: form.code || null,
          label: form.label,
          description: form.description || null,
          kind: form.kind,
          productKey: form.productKey || null,
          eligibleProductKeys: isDiscountKind(form.kind) ? form.eligibleProductKeys : [],
          grantProductKeys: isGrantKind(form.kind) ? form.grantProductKeys : [],
          grantUsageLimit:
            isGrantKind(form.kind) && form.grantUsageLimit
              ? Number(form.grantUsageLimit)
              : null,
          grantExpiresDays:
            isGrantKind(form.kind) && form.grantExpiresDays
              ? Number(form.grantExpiresDays)
              : null,
          discountPercent:
            isDiscountKind(form.kind) && form.discountPercent
              ? Number(form.discountPercent)
              : null,
          maxUses: Number(form.maxUses || "1"),
          expiresAt: fromDateTimeLocal(form.expiresAt),
          targetEmail: form.targetEmail || null,
          transferable: form.transferable,
        },
      });
      setForm(DEFAULT_FORM);
      setMessage(t("Voucher criado e pronto para compartilhar."));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("Não foi possível criar o voucher."));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(voucherId: string, status: VoucherStatus) {
    setError("");
    setMessage("");
    try {
      await postAdmin({ action: "status", id: voucherId, status });
      setMessage(
        status === "active"
          ? t("Voucher reativado.")
          : status === "paused"
            ? t("Voucher pausado.")
            : t("Voucher cancelado.")
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("Não foi possível atualizar o voucher."));
    }
  }

  async function handleDelete(voucherId: string) {
    setError("");
    setMessage("");
    try {
      await postAdmin({ action: "delete", id: voucherId });
      setMessage(t("Voucher movido para a lixeira lógica."));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("Não foi possível excluir o voucher."));
    }
  }

  async function handleTransfer(voucherId: string) {
    const targetEmail = transferEmail[voucherId]?.trim();
    if (!targetEmail) {
      setError(t("Informe um e-mail para a transferência."));
      return;
    }

    setError("");
    setMessage("");
    try {
      await postAdmin({
        action: "transfer",
        id: voucherId,
        targetEmail,
        transferGrantedAccess: transferAccess[voucherId] === true,
      });
      setMessage(t("Transferência registrada."));
      setTransferEmail((current) => ({ ...current, [voucherId]: "" }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("Não foi possível transferir o voucher."));
    }
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(t("Copiado."));
      setError("");
    } catch {
      setError(t("Não foi possível copiar."));
    }
  }

  function toggleProduct(setter: "eligibleProductKeys" | "grantProductKeys", key: string) {
    setForm((current) => {
      const list = current[setter];
      const next = list.includes(key) ? list.filter((item) => item !== key) : [...list, key];
      return { ...current, [setter]: next };
    });
  }

  return (
    <main className="ritual-texture min-h-screen bg-[#120f16] px-4 py-6 text-[#f3eadf] sm:px-6 sm:py-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(244,213,141,0.2),transparent_24%),linear-gradient(180deg,rgba(24,21,31,0.96),rgba(11,9,16,0.94))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.34)] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#5e5137] bg-[#1b1713] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#f4d58d]">
                <ShieldCheck size={14} />
                {t("Admin do Oráculo")}
              </div>
              <h1 className="brand-serif mt-4 text-4xl font-semibold leading-none sm:text-5xl">
                {t("Convites e vouchers sob controle total.")}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#cdbfae] sm:text-base">
                {t(
                  "Crie acessos, descontos e links de resgate do Palavras do Universo com pausa, cancelamento, exclusão lógica e transferência de usuário."
                )}
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 sm:items-end">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#dbcfc1]">
                <strong className="block text-[#fff7e8]">{ownerEmail || "Owner"}</strong>
                <span>{t("Acesso restrito por OWNER_ACCESS.")}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void loadVouchers()}
                  className="inline-flex items-center gap-2 rounded-full border border-[#4e473f] bg-[#18141d] px-4 py-2 text-sm font-semibold text-[#efe2d2] transition hover:border-[#f4d58d] hover:text-white"
                >
                  <RefreshCw size={16} />
                  {t("Atualizar")}
                </button>
                <Link
                  href="/admin/feedback"
                  className="inline-flex items-center gap-2 rounded-full border border-[#8faea3] bg-[#10251f] px-4 py-2 text-sm font-semibold text-[#c6eadb]"
                >
                  Feedbacks
                </Link>
                <Link
                  href="/meu-universo"
                  className="inline-flex items-center gap-2 rounded-full bg-[#f4d58d] px-4 py-2 text-sm font-semibold text-[#1b1713]"
                >
                  {t("Voltar ao Meu Universo")}
                </Link>
              </div>
            </div>
          </div>
        </header>

        {!hasSupabase ? (
          <section className="rounded-[24px] border border-[#62433f] bg-[#251717] p-5 text-[#f6d9d5]">
            {t("Supabase não está configurado neste ambiente.")}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: t("Total"), value: summary.total, icon: Ticket },
            { label: t("Ativos"), value: summary.active, icon: CheckCircle2 },
            { label: t("Pausados"), value: summary.paused, icon: PauseCircle },
            { label: t("Usos"), value: summary.redeemed, icon: Sparkles },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.label}
                className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(21,18,28,0.94),rgba(12,10,17,0.94))] p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a59a8e]">
                    {item.label}
                  </span>
                  <Icon size={18} className="text-[#f4d58d]" />
                </div>
                <strong className="mt-4 block text-3xl font-semibold text-[#fff7e8]">
                  {item.value}
                </strong>
              </article>
            );
          })}
        </section>

        {message ? (
          <div className="rounded-2xl border border-[#bfd9cf] bg-[#edf7f2] px-4 py-3 text-sm text-[#315d56]">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-[#e2c4c2] bg-[#fff1f0] px-4 py-3 text-sm text-[#8a4540]">
            {error}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <article className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(21,18,28,0.96),rgba(9,8,14,0.96))] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-[#f4d58d]" />
              <h2 className="brand-serif text-2xl font-semibold">
                {t("Criar novo voucher")}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#bdb0a1]">
              {t(
                "Use convite para liberar acesso, desconto para alterar checkout e híbrido quando os dois precisam coexistir."
              )}
            </p>

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#f3eadf]">{t("Rótulo")}</span>
                  <input
                    value={form.label}
                    onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[#f4d58d]"
                    placeholder={t("Ex: Convite fundador do Círculo")}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#f3eadf]">{t("Código customizado")}</span>
                  <input
                    value={form.code}
                    onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[#f4d58d]"
                    placeholder="PDU-FOUNDER"
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#f3eadf]">{t("Descrição")}</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  rows={3}
                  className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[#f4d58d]"
                  placeholder={t("Contexto interno para você saber onde esse voucher será usado.")}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#f3eadf]">{t("Tipo")}</span>
                  <select
                    value={form.kind}
                    onChange={(event) =>
                      setForm((current) => {
                        const kind = event.target.value as VoucherKind;
                        const grantProductKeys =
                          isGrantKind(kind) &&
                          current.productKey &&
                          !current.grantProductKeys.includes(current.productKey)
                            ? [...current.grantProductKeys, current.productKey]
                            : current.grantProductKeys;
                        const eligibleProductKeys =
                          isDiscountKind(kind) &&
                          current.productKey &&
                          !current.eligibleProductKeys.includes(current.productKey)
                            ? [...current.eligibleProductKeys, current.productKey]
                            : current.eligibleProductKeys;

                        return {
                          ...current,
                          kind,
                          grantProductKeys,
                          eligibleProductKeys,
                        };
                      })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[#f4d58d]"
                  >
                    <option value="invite">{t("Convite")}</option>
                    <option value="discount">{t("Desconto")}</option>
                    <option value="hybrid">{t("Híbrido")}</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#f3eadf]">{t("Produto principal")}</span>
                  <select
                    value={form.productKey}
                    onChange={(event) =>
                      setForm((current) => {
                        const productKey = event.target.value;
                        const grantProductKeys =
                          isGrantKind(current.kind) &&
                          productKey &&
                          !current.grantProductKeys.includes(productKey)
                            ? [...current.grantProductKeys, productKey]
                            : current.grantProductKeys;
                        const eligibleProductKeys =
                          isDiscountKind(current.kind) &&
                          productKey &&
                          !current.eligibleProductKeys.includes(productKey)
                            ? [...current.eligibleProductKeys, productKey]
                            : current.eligibleProductKeys;

                        return {
                          ...current,
                          productKey,
                          grantProductKeys,
                          eligibleProductKeys,
                        };
                      })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[#f4d58d]"
                  >
                    {ALL_PRODUCT_OPTIONS.map((option) => (
                      <option key={option.key} value={option.key}>
                        {t(option.title)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {isGrantKind(form.kind) ? (
                <fieldset className="rounded-[24px] border border-white/10 bg-black/10 p-4">
                  <legend className="px-2 text-sm font-semibold text-[#f3eadf]">
                    {t("Produtos desbloqueados")}
                  </legend>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {ALL_PRODUCT_OPTIONS.map((option) => (
                      <label
                        key={`grant-${option.key}`}
                        className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/5 px-3 py-3 text-sm text-[#dbcfc1]"
                      >
                        <input
                          type="checkbox"
                          checked={form.grantProductKeys.includes(option.key)}
                          onChange={() => toggleProduct("grantProductKeys", option.key)}
                          className="mt-1"
                        />
                        <span>{t(option.title)}</span>
                      </label>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-[#f3eadf]">{t("Limite por produto")}</span>
                      <input
                        value={form.grantUsageLimit}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, grantUsageLimit: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[#f4d58d]"
                        placeholder="1"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-[#f3eadf]">{t("Expira após dias")}</span>
                      <input
                        value={form.grantExpiresDays}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, grantExpiresDays: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[#f4d58d]"
                        placeholder={t("Vazio = sem expiração")}
                      />
                    </label>
                  </div>
                </fieldset>
              ) : null}

              {isDiscountKind(form.kind) ? (
                <fieldset className="rounded-[24px] border border-white/10 bg-black/10 p-4">
                  <legend className="px-2 text-sm font-semibold text-[#f3eadf]">
                    {t("Regras de desconto")}
                  </legend>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-[#f3eadf]">{t("Percentual")}</span>
                      <input
                        value={form.discountPercent}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, discountPercent: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[#f4d58d]"
                        placeholder="20"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-[#f3eadf]">{t("Usos totais")}</span>
                      <input
                        value={form.maxUses}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, maxUses: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[#f4d58d]"
                        placeholder="1"
                      />
                    </label>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {ALL_PRODUCT_OPTIONS.map((option) => (
                      <label
                        key={`eligible-${option.key}`}
                        className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/5 px-3 py-3 text-sm text-[#dbcfc1]"
                      >
                        <input
                          type="checkbox"
                          checked={form.eligibleProductKeys.includes(option.key)}
                          onChange={() => toggleProduct("eligibleProductKeys", option.key)}
                          className="mt-1"
                        />
                        <span>{t(option.title)}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : (
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#f3eadf]">{t("Usos totais")}</span>
                  <input
                    value={form.maxUses}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, maxUses: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[#f4d58d]"
                    placeholder="1"
                  />
                </label>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#f3eadf]">{t("Reservado para e-mail")}</span>
                  <input
                    type="email"
                    value={form.targetEmail}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, targetEmail: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[#f4d58d]"
                    placeholder="alguem@exemplo.com"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#f3eadf]">{t("Expira em")}</span>
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, expiresAt: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[#f4d58d]"
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#dbcfc1]">
                <input
                  type="checkbox"
                  checked={form.transferable}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, transferable: event.target.checked }))
                  }
                />
                <span>{t("Transferível ou utilizável por qualquer conta")}</span>
              </label>

              <button
                type="submit"
                disabled={saving || !hasSupabase}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#1b1713] disabled:cursor-default disabled:opacity-60"
              >
                <Sparkles size={16} />
                {saving ? t("Criando...") : t("Criar voucher")}
              </button>
            </form>
          </article>

          <article className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(21,18,28,0.96),rgba(9,8,14,0.96))] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="brand-serif text-2xl font-semibold">
                  {t("Vouchers recentes")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#bdb0a1]">
                  {t("Cada item abaixo já está pronto para ser pausado, cancelado, excluído ou transferido.")}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-[#bdb0a1]">
                  {t("Carregando vouchers...")}
                </div>
              ) : vouchers.length ? (
                vouchers.map((voucher) => {
                  const Icon = kindIcon(voucher.kind);
                  return (
                    <article
                      key={voucher.id}
                      className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 sm:p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#5e5137] bg-[#1b1713] text-[#f4d58d]">
                              <Icon size={18} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-semibold text-[#fff7e8]">
                                  {voucher.label}
                                </h3>
                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] ${statusTone(
                                    voucher.status
                                  )}`}
                                >
                                  {t(
                                    voucher.status === "active"
                                      ? "Ativo"
                                      : voucher.status === "paused"
                                        ? "Pausado"
                                        : voucher.status === "cancelled"
                                          ? "Cancelado"
                                          : voucher.status === "deleted"
                                            ? "Excluído"
                                            : "Rascunho"
                                  )}
                                </span>
                              </div>
                              <p className="mt-1 break-all text-sm text-[#cdbfae]">{voucher.code}</p>
                            </div>
                          </div>

                          {voucher.description ? (
                            <p className="mt-4 text-sm leading-6 text-[#c9bbab]">
                              {voucher.description}
                            </p>
                          ) : null}

                          <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            <div className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                              <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#a59a8e]">
                                {t("Tipo")}
                              </dt>
                              <dd className="mt-2 text-sm text-[#fff7e8]">
                                {t(
                                  voucher.kind === "invite"
                                    ? "Convite"
                                    : voucher.kind === "discount"
                                      ? "Desconto"
                                      : "Híbrido"
                                )}
                              </dd>
                            </div>
                            <div className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                              <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#a59a8e]">
                                {t("Uso")}
                              </dt>
                              <dd className="mt-2 text-sm text-[#fff7e8]">
                                {voucher.times_used}/{voucher.max_uses}
                              </dd>
                            </div>
                            <div className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                              <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#a59a8e]">
                                {t("Público")}
                              </dt>
                              <dd className="mt-2 text-sm text-[#fff7e8]">
                                {voucher.target_email || (voucher.transferable ? t("Qualquer conta") : t("Sem restrição"))}
                              </dd>
                            </div>
                            <div className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                              <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#a59a8e]">
                                {t("Produtos")}
                              </dt>
                              <dd className="mt-2 text-sm text-[#fff7e8]">
                                {joinProducts(
                                  isGrantKind(voucher.kind)
                                    ? voucher.grant_product_keys
                                    : voucher.eligible_product_keys
                                )}
                              </dd>
                            </div>
                            <div className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                              <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#a59a8e]">
                                {t("Desconto")}
                              </dt>
                              <dd className="mt-2 text-sm text-[#fff7e8]">
                                {voucher.discount_percent ? `${voucher.discount_percent}%` : "—"}
                              </dd>
                            </div>
                            <div className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
                              <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#a59a8e]">
                                {t("Expiração")}
                              </dt>
                              <dd className="mt-2 text-sm text-[#fff7e8]">
                                {voucher.expires_at
                                  ? new Date(voucher.expires_at).toLocaleString()
                                  : t("Sem data limite")}
                              </dd>
                            </div>
                          </dl>
                        </div>

                        <div className="flex w-full max-w-[320px] flex-col gap-3">
                          <button
                            type="button"
                            onClick={() => void copyText(voucher.share_url)}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#4e473f] bg-[#18141d] px-4 py-3 text-sm font-semibold text-[#efe2d2]"
                          >
                            <Copy size={15} />
                            {t("Copiar link de resgate")}
                          </button>

                          {voucher.status === "active" ? (
                            <button
                              type="button"
                              onClick={() => void handleStatus(voucher.id, "paused")}
                              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#4e473f] bg-[#18141d] px-4 py-3 text-sm font-semibold text-[#efe2d2]"
                            >
                              <PauseCircle size={15} />
                              {t("Pausar")}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void handleStatus(voucher.id, "active")}
                              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#4e473f] bg-[#18141d] px-4 py-3 text-sm font-semibold text-[#efe2d2]"
                            >
                              <CheckCircle2 size={15} />
                              {t("Reativar")}
                            </button>
                          )}

                          {voucher.status !== "cancelled" && voucher.status !== "deleted" ? (
                            <button
                              type="button"
                              onClick={() => void handleStatus(voucher.id, "cancelled")}
                              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#664543] bg-[#221517] px-4 py-3 text-sm font-semibold text-[#f4d8d5]"
                            >
                              <XCircle size={15} />
                              {t("Cancelar")}
                            </button>
                          ) : null}

                          {voucher.status !== "deleted" ? (
                            <button
                              type="button"
                              onClick={() => void handleDelete(voucher.id)}
                              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#664543] bg-[#221517] px-4 py-3 text-sm font-semibold text-[#f4d8d5]"
                            >
                              <Trash2 size={15} />
                              {t("Excluir")}
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 rounded-[22px] border border-white/8 bg-black/10 p-4">
                        <div className="flex items-center gap-2">
                          <ArrowRightLeft size={16} className="text-[#f4d58d]" />
                          <strong className="text-sm font-semibold text-[#fff7e8]">
                            {t("Transferência")}
                          </strong>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[#bdb0a1]">
                          {t(
                            "Troque o e-mail alvo do voucher. Se o acesso já foi entregue, você pode mover também os entitlements vinculados."
                          )}
                        </p>
                        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                          <input
                            type="email"
                            value={transferEmail[voucher.id] ?? ""}
                            onChange={(event) =>
                              setTransferEmail((current) => ({
                                ...current,
                                [voucher.id]: event.target.value,
                              }))
                            }
                            placeholder="novo@destino.com"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[#f4d58d]"
                          />
                          <button
                            type="button"
                            onClick={() => void handleTransfer(voucher.id)}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f4d58d] px-5 py-3 text-sm font-semibold text-[#1b1713]"
                          >
                            {t("Transferir")}
                          </button>
                        </div>
                        <label className="mt-3 flex items-center gap-3 text-sm text-[#dbcfc1]">
                          <input
                            type="checkbox"
                            checked={transferAccess[voucher.id] === true}
                            onChange={(event) =>
                              setTransferAccess((current) => ({
                                ...current,
                                [voucher.id]: event.target.checked,
                              }))
                            }
                          />
                          <span>{t("Mover também o acesso já entregue")}</span>
                        </label>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-[#bdb0a1]">
                  {t("Nenhum voucher criado ainda.")}
                </div>
              )}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
