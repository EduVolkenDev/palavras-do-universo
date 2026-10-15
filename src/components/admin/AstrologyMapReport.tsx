"use client";

import Image from "next/image";
import { useI18n } from "@/components/I18nProvider";
import { PlacementDetail, PersonalizedPlacementReading } from "@/components/astrology/AstrologyChartExperience";
import { getAscendantInterpretation, getAspectInterpretation, getBodyInterpretation, getHouseInterpretation, getSignInterpretation } from "@/lib/astrology/interpretations";
import type { NatalChart, NatalAspectType, ZodiacSign } from "@/lib/astrology/natal-chart";
import { describePlanetRulership } from "@/lib/astrology/rulership";
import { ASTROLOGY_VISUALS } from "@/lib/astrology/visual-assets";
import styles from "./AstrologyMapAdminPage.module.css";
import type { AstrologyBirthDataPayload } from "@/lib/astrology/birth-data";

const signs: ZodiacSign[] = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
const aspectTypes: NatalAspectType[] = ["conjunction", "sextile", "square", "trine", "opposition"];

export async function printCompleteAstrologyMap() {
  const report = document.querySelector("[data-astrology-report]");
  if (!report) throw new Error("O relatório ainda está carregando. Tente novamente.");
  const images = Array.from(report.querySelectorAll("img"));
  images.forEach((image) => { image.loading = "eager"; });
  await Promise.all(images.map((image) => image.decode()));
  await document.fonts.ready;
  window.print();
}

export default function AstrologyMapReport({ chart, studentName, birthData }: { chart: NatalChart; studentName: string; birthData: AstrologyBirthDataPayload }) {
  const { locale } = useI18n();
  const en = locale === "en";
  const ascendantIndex = chart.ascendant ? signs.indexOf(chart.ascendant.sign) : -1;
  return (
    <article className={styles.report} data-astrology-report data-i18n-ignore>
      <h1>{studentName} · {en ? "Complete natal chart" : "Mapa natal completo"}</h1>
      <p>Palavras do Universo · {chart.locationLabel} · {chart.timezone}</p>
      <p>{en ? "Birth" : "Nascimento"}: {birthData.localDate} · {birthData.precision === "unknown" ? (en ? "Time unknown" : "Horário desconhecido") : birthData.localTime} · {birthData.location.countryCode}</p>
      <p>{en ? "Symbolic interpretation for reflection. Whole-sign houses. Birth-time precision:" : "Interpretação simbólica para reflexão. Casas por signos inteiros. Precisão do horário:"} {chart.timePrecision}</p>
      {chart.limitations.map((limitation) => <p key={limitation}>{limitation}</p>)}
      <div className={styles.reportArtwork}><Image src={ASTROLOGY_VISUALS.overview.hero} alt="" fill sizes="600px" loading="eager" /></div>
      {chart.ascendant ? (
        <section>
          <h2>{getAscendantInterpretation(locale).label}</h2>
          <p>{getAscendantInterpretation(locale).explanation}</p>
          <p>{getAscendantInterpretation(locale).inLife}</p>
          <PlacementDetail body="Ascendant" position={{ ...chart.ascendant, house: 1 }} aspects={chart.aspects} locale={locale} />
        </section>
      ) : null}
      {chart.positions.map((position) => {
        const body = getBodyInterpretation(position.body, locale);
        const sign = getSignInterpretation(position.sign, locale);
        return (
          <section key={position.body} data-report-body={position.body}>
            <h2>{body.label} {en ? "in" : "em"} {sign.label} · {position.degreesInSign.toFixed(2)}°{position.house !== null ? ` · ${en ? "House" : "Casa"} ${position.house}` : ""}</h2>
            <p>{body.archetype}</p><p>{body.explanation}</p><p>{body.inLife}</p>
            <p>{describePlanetRulership(position.body, locale)}</p>
            <p>{sign.label} · {sign.element} · {sign.mode}. {sign.tone}. {sign.gifts}. {sign.tension}.</p>
            <p>{sign.question}</p>
            <PlacementDetail body={position.body} position={position} aspects={chart.aspects} locale={locale} />
            <PersonalizedPlacementReading position={position} aspects={chart.aspects} locale={locale} artwork={ASTROLOGY_VISUALS.natalMap.planetByBody[position.body]} />
            <p>{body.question}</p>
          </section>
        );
      })}
      <h2>{en ? "The twelve houses" : "As doze casas"}</h2>
      {Array.from({ length: 12 }, (_, index) => {
        const house = getHouseInterpretation(index + 1, locale);
        const sign = ascendantIndex >= 0 ? getSignInterpretation(signs[(ascendantIndex + index) % 12], locale) : null;
        return <section key={index} data-report-house={index + 1}>
          <h3>{house.label} · {house.area}{sign ? ` · ${sign.label}` : ""}</h3>
          <p>{house.explanation}</p>
          {sign ? <p>{sign.tone}. {sign.gifts}. {sign.tension}.</p> : <p>{en ? "Birth time is required to assign the sign to this house." : "É necessário o horário de nascimento para determinar o signo nesta casa."}</p>}
          <p>{house.question}</p>
          <div className={styles.reportArtwork}><Image src={ASTROLOGY_VISUALS.natalMap.houses[index]} alt="" fill sizes="600px" loading="eager" /></div>
        </section>;
      })}
      <h2>{en ? "Aspects" : "Aspectos"}</h2>
      {aspectTypes.map((type, index) => {
        const copy = getAspectInterpretation(type, locale);
        return <section key={type}><h3>{copy.label}</h3><p>{copy.explanation}</p><p>{copy.experience}</p><p>{copy.question}</p><div className={styles.reportArtwork}><Image src={ASTROLOGY_VISUALS.transitAspects.general[index]} alt="" fill sizes="600px" loading="eager" /></div></section>;
      })}
      {chart.aspects.map((aspect) => {
        const copy = getAspectInterpretation(aspect.type, locale);
        return <section key={aspect.id}><h3>{getBodyInterpretation(aspect.firstBody, locale).label} · {copy.label} · {getBodyInterpretation(aspect.secondBody, locale).label}</h3><p>{en ? "Orb" : "Orbe"}: {aspect.orb.toFixed(2)}° · {en ? "Exact angle" : "Ângulo exato"}: {aspect.exactAngle}°</p><p>{copy.experience}</p><p>{copy.question}</p></section>;
      })}
    </article>
  );
}
