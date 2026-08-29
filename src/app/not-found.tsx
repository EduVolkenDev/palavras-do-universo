import { Compass, Home, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { LOCALE_COOKIE_NAME, normalizeLocale } from "@/lib/i18n/config";
import { PDU_ASSETS } from "@/lib/pdu-assets";

export const metadata: Metadata = {
  title: "Página não encontrada | Palavras do Universo",
  description:
    "A rota não foi encontrada, mas você pode voltar ao Palavras do Universo e continuar sua leitura.",
};

const COPY = {
  "pt-BR": {
    eyebrow: "404 - rota fora do mapa",
    title: "A página saiu do mapa.",
    description:
      "O endereço pode ter mudado ou essa passagem não existe mais. Volte ao início, abra suas tiradas ou continue pelo Meu Universo.",
    primary: "Voltar ao início",
    secondary: "Ver tiradas",
    tertiary: "Meu Universo",
    navLabel: "Navegação 404",
    status: "Portal recalibrando",
    footer: "Palavras do Universo",
  },
  en: {
    eyebrow: "404 - route outside the map",
    title: "This page left the map.",
    description:
      "The address may have changed or this passage no longer exists. Return home, explore readings, or continue through My Universe.",
    primary: "Return home",
    secondary: "View readings",
    tertiary: "My Universe",
    navLabel: "404 navigation",
    status: "Portal recalibrating",
    footer: "Palavras do Universo",
  },
};

export default async function NotFound() {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const copy = COPY[locale];

  return (
    <main className="pdu-not-found">
      <div className="pdu-not-found__grid" aria-hidden="true" />
      <section className="pdu-not-found__panel" aria-labelledby="not-found-title">
        <div className="pdu-not-found__visual" aria-hidden="true">
          <Image
            src={PDU_ASSETS.symbolic.oracle}
            alt=""
            width={420}
            height={420}
            priority
            className="pdu-not-found__orb"
          />
          <Image
            src={PDU_ASSETS.brand.symbol}
            alt=""
            width={88}
            height={88}
            className="pdu-not-found__symbol"
          />
        </div>

        <div className="pdu-not-found__content">
          <p className="pdu-not-found__eyebrow">{copy.eyebrow}</p>
          <h1 id="not-found-title" className="brand-serif pdu-not-found__title">
            {copy.title}
          </h1>
          <p className="pdu-not-found__description">{copy.description}</p>

          <nav className="pdu-not-found__actions" aria-label={copy.navLabel}>
            <Link href="/" className="pdu-not-found__button pdu-not-found__button--primary">
              <Home size={18} />
              {copy.primary}
            </Link>
            <Link href="/tiradas" className="pdu-not-found__button">
              <Sparkles size={18} />
              {copy.secondary}
            </Link>
            <Link href="/meu-universo" className="pdu-not-found__button">
              <Compass size={18} />
              {copy.tertiary}
            </Link>
          </nav>

          <p className="pdu-not-found__status">{copy.status}</p>
        </div>
      </section>
      <p className="pdu-not-found__footer">{copy.footer}</p>
    </main>
  );
}
