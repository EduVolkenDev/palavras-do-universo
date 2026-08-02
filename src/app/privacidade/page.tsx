import { LegalPage } from "@/components/LegalPage";
import { PDU_ASSETS } from "@/lib/pdu-assets";

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Confiança"
      title="Privacidade"
      intro="Coletamos somente o necessário para entregar a experiência, proteger sua conta e comprovar acessos pagos."
      visual={PDU_ASSETS.surfaces.legalPrivacy}
      visualAlt="Escudo de privacidade"
      sections={[
        {
          title: "Dados utilizados",
          body:
            "Podemos tratar e-mail, leituras, mensagens salvas, compromissos pessoais, histórico de acesso e registros de pagamento. Dados de cartão são processados pela Stripe e não ficam armazenados no Palavras do Universo.",
        },
        {
          title: "Como usamos",
          body:
            "Os dados são usados para autenticação, sincronização, entrega de produtos, prevenção de abuso, suporte e melhoria da experiência. Leituras podem ser processadas por serviços de inteligência artificial.",
        },
        {
          title: "Correntes de ação",
          body:
            "Correntes públicas mostram apenas tipo de ação e contagens agregadas declaradas. Planos pessoais, beneficiários e reflexões permanecem privados.",
        },
        {
          title: "Seus direitos",
          body:
            "Você pode solicitar acesso, correção ou exclusão dos seus dados pelo canal de suporte informado no checkout ou no comprovante de pagamento.",
        },
      ]}
    />
  );
}
