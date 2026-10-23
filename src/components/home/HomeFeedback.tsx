"use client";

import { useEffect, useState } from "react";
import FeedbackDialog from "@/components/FeedbackDialog";
import { useI18n } from "@/components/I18nProvider";
import styles from "./HomePortal.module.css";

type Testimonial = { id: string; name: string; location: string; text: string };

function isTestimonial(value: unknown): value is Testimonial {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return ["id", "name", "location", "text"].every((key) => typeof item[key] === "string");
}

export default function HomeFeedback() {
  const { locale } = useI18n();
  const en = locale === "en";
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/testimonials", { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data: unknown) => {
        if (!data || typeof data !== "object" || !("testimonials" in data)) return;
        if (Array.isArray(data.testimonials)) setTestimonials(data.testimonials.filter(isTestimonial));
      })
      .catch(() => { /* The feedback invitation remains available without the feed. */ });
    return () => controller.abort();
  }, []);

  const moving = testimonials.length > 1;
  return (
    <section id="feedbacks" className={styles.feedback} aria-labelledby="feedback-title">
      <div className={styles.feedbackHeading}>
        <h2 id="feedback-title">{en ? "Experiences from our community." : "Experiências de quem passou por aqui."}</h2>
        <FeedbackDialog source="footer" readingId={null} locale={locale} />
      </div>
      {testimonials.length > 0 ? (
        <>
          <div className={styles.carousel} role="region" aria-roledescription={en ? "carousel" : "carrossel"} aria-label={en ? "Community feedback" : "Feedbacks da comunidade"}>
            <div className={styles.track} data-moving={moving} data-paused={paused}>
              {(moving ? [0, 1] : [0]).map((copy) => (
                <div key={copy} className={styles.feedbackGroup} aria-hidden={copy === 1 ? true : undefined}>
                  {testimonials.map((item) => (
                    <blockquote key={item.id} className={styles.testimonial}>
                      <p>“{item.text}”</p>
                      <footer>{item.name}{item.location ? <span>{item.location}</span> : null}</footer>
                    </blockquote>
                  ))}
                </div>
              ))}
            </div>
          </div>
          {moving ? <button className={styles.pause} type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? (en ? "Resume movement" : "Continuar movimento") : (en ? "Pause movement" : "Pausar movimento")}</button> : null}
        </>
      ) : <p className={styles.feedbackHint}>{en ? "Already tried an experience? Tell us what worked and what could be better." : "Já experimentou? Conte o que funcionou e o que pode melhorar."}</p>}
    </section>
  );
}
