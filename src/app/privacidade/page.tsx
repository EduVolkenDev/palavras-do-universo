import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { PDU_ASSETS } from "@/lib/pdu-assets";

export const metadata: Metadata = {
  alternates: { canonical: "/privacidade" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Confiança"
      title="Privacidade"
      intro="Coletamos somente o necessário para entregar a experiência, proteger sua conta e comprovar acessos pagos."
      visual={PDU_ASSETS.surfaces.legalPrivacy}
      visualAlt="Escudo de privacidade"
      updatedAt="Atualizado em 2 de novembro de 2026."
      sections={[
        {
          title: "Cookies e armazenamento local",
          body: "Usamos cookies e armazenamento do navegador para autenticação, idioma, moeda, recuperação da experiência e leituras que você escolhe guardar. O controle Cookies e privacidade permite aceitar ou recusar diagnósticos opcionais e rever a escolha. A preferência é lembrada neste navegador por até 180 dias; limpar o armazenamento faz a pergunta aparecer novamente. Isso não autoriza e-mails de marketing.",
        },
        {
          title: "Diagnósticos opcionais",
          body: "Somente com sua autorização, nossa telemetria envia registros de falhas, interações, rota, características da tela e contexto técnico da leitura para melhorar a experiência. Recusar impede novos envios dessa telemetria sem bloquear login, compras ou leituras. Ao revogar, removemos o identificador de telemetria e seu contador local; isso não apaga registros já recebidos. Você pode solicitar exclusão pelo suporte.",
        },
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
          title: "Céu diário por e-mail",
          body: "Esta publicação exige inscrição e confirmação específicas. Guardamos o endereço, idioma, confirmação e registros de entrega; a Brevo processa o envio. Nenhuma preferência genérica de marketing inscreve você automaticamente. Cada mensagem permite cancelar a inscrição sem entrar na conta.",
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
