"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { consentSnapshot, diagnosticsAllowed, saveConsent, subscribeConsent } from "@/lib/client/privacy-consent";
import styles from "./PrivacyConsent.module.css";

export default function PrivacyConsent() {
  const { locale } = useI18n();
  const text = (pt: string, en: string) => locale === "en" ? en : pt;
  const saved = useSyncExternalStore(subscribeConsent, consentSnapshot, () => "loading");
  const [editing, setEditing] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const visible = editing || saved === "";

  function choose(allow: boolean) {
    saveConsent(allow);
    setEditing(false);
    trigger.current?.focus();
  }

  return (
    <div className={styles.root} data-i18n-ignore>
      <button ref={trigger} type="button" className={styles.trigger} aria-expanded={visible}
        aria-controls="pdu-privacy-choices" onClick={() => setEditing(!editing)}>
        {text("Cookies e privacidade", "Cookies & privacy")}
      </button>
      {visible && <section id="pdu-privacy-choices" aria-labelledby="pdu-privacy-title" className={styles.panel}>
        <p className={styles.eyebrow}>{text("SUA ESCOLHA, COM CLAREZA", "YOUR CHOICE, CLEARLY")}</p>
        <h2 id="pdu-privacy-title">{text("Um espaço que respeita sua privacidade.", "A space that respects your privacy.")}</h2>
        <p>{text("Usamos cookies e armazenamento local para manter seu acesso, idioma, moeda e leituras que você escolhe guardar. Com sua permissão, também coletamos diagnósticos de falhas e interações para melhorar a experiência.", "We use cookies and local storage for your access, language, currency and readings you choose to save. With your permission, we also collect error and interaction diagnostics to improve the experience.")}</p>
        <p className={styles.detail}>{text("Recusar mantém os recursos essenciais. Esta escolha não inscreve você em e-mails. Você pode alterá-la aqui a qualquer momento.", "Declining keeps essential features available. This choice does not subscribe you to emails. You can change it here at any time.")}</p>
        {saved && saved !== "loading" && <p className={styles.detail}>{diagnosticsAllowed()
          ? text("Escolha atual: diagnósticos permitidos.", "Current choice: diagnostics allowed.")
          : text("Escolha atual: somente essenciais.", "Current choice: essential only.")}</p>}
        <div className={styles.actions}>
          <button type="button" onClick={() => choose(false)}>{text("Somente essenciais", "Essential only")}</button>
          <button type="button" onClick={() => choose(true)}>{text("Aceitar diagnósticos", "Allow diagnostics")}</button>
        </div>
        <Link href="/privacidade">{text("Como cuidamos dos seus dados", "How we care for your data")}</Link>
      </section>}
    </div>
  );
}
