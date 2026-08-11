"use client";

import Image from "next/image";

export type PduAssetStoryItem = {
  src: string;
  alt: string;
  label: string;
  title: string;
  text: string;
};

export type PduAssetStoryData = {
  eyebrow: string;
  title: string;
  description: string;
  items: PduAssetStoryItem[];
};

export function PduAssetStory(props: PduAssetStoryData & { tone?: "dark" | "light" }) {
  const items = props.items;
  const tone = props.tone ?? "dark";

  return (
    <section className={`pdu-asset-story pdu-asset-story--${tone}`}>
      <div className="pdu-asset-story__copy">
        <p className="pdu-asset-story__eyebrow">{props.eyebrow}</p>
        <h2 className="brand-serif pdu-asset-story__title">{props.title}</h2>
        <p className="pdu-asset-story__description">{props.description}</p>
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
                alt={item.alt}
                fill
                loading="lazy"
                sizes={index === 0 ? "(max-width: 620px) 90vw, 420px" : "(max-width: 620px) 45vw, 220px"}
                className="object-contain"
              />
            </div>
            <figcaption>
              <span>{item.label}</span>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
