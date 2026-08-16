"use client";

import Image from "next/image";
import { useI18n } from "@/components/I18nProvider";

export type PduAssetStoryItem = {
  src: string;
  alt: string;
  label: string;
  title: string;
  text: string;
};

export type PduAssetStoryStep = {
  label: string;
  title: string;
  text: string;
};

export type PduAssetStoryData = {
  eyebrow: string;
  title: string;
  description: string;
  steps?: PduAssetStoryStep[];
  items: PduAssetStoryItem[];
};

export function PduAssetStory(props: PduAssetStoryData & { tone?: "dark" | "light" }) {
  const { t } = useI18n();
  const items = props.items;
  const tone = props.tone ?? "dark";

  return (
    <section className={`pdu-asset-story pdu-asset-story--${tone}`}>
      <div className="pdu-asset-story__copy">
        <p className="pdu-asset-story__eyebrow">{t(props.eyebrow)}</p>
        <h2 className="brand-serif pdu-asset-story__title">{t(props.title)}</h2>
        <p className="pdu-asset-story__description">{t(props.description)}</p>

        {props.steps?.length ? (
          <ol className="pdu-asset-story__flow" aria-label={t("Fluxo da leitura no Palavras do Universo")}>
            {props.steps.map((step, index) => (
              <li key={step.title}>
                <span className="pdu-asset-story__flow-badge">{index + 1}</span>
                <div>
                  <span>{t(step.label)}</span>
                  <strong>{t(step.title)}</strong>
                  <p>{t(step.text)}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      <div className="pdu-asset-story__visuals">
        {items.map((item, index) => (
          <figure
            key={item.src}
            className={`pdu-asset-story__card ${index === 0 ? "pdu-asset-story__card--feature" : ""}`}
          >
            <div className="pdu-asset-story__image">
              <Image
                src={item.src}
                alt={t(item.alt)}
                fill
                loading="lazy"
                sizes={index === 0 ? "(max-width: 620px) 90vw, 420px" : "(max-width: 620px) 45vw, 220px"}
                className="object-contain"
              />
            </div>
            <figcaption>
              <span>{t(item.label)}</span>
              <strong>{t(item.title)}</strong>
              <p>{t(item.text)}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
