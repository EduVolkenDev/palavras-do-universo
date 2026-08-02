import { LegalPage } from "@/components/LegalPage";
import { PDU_ASSETS } from "@/lib/pdu-assets";

export default function RefundPage() {
  return (
    <LegalPage
      eyebrow="Compra segura"
      title="Cancelamentos e reembolsos"
      intro="Queremos que toda compra seja clara, recuperável e tratada com respeito."
      visual={PDU_ASSETS.surfaces.legalRefunds}
      visualAlt="Marcador de compra segura"
      sections={[
        {
          title: "Compras avulsas",
          body:
            "Solicitações de cancelamento ou reembolso serão analisadas conforme a legislação aplicável, incluindo o direito de arrependimento quando cabível. Informe o e-mail usado na compra e o produto adquirido.",
        },
        {
          title: "Assinaturas",
          body:
            "A assinatura pode ser cancelada pelo portal de cobrança disponível no Meu Universo. O cancelamento interrompe renovações futuras e o acesso segue as condições exibidas no portal.",
        },
        {
          title: "Falha de entrega",
          body:
            "Se o pagamento for confirmado e o acesso não aparecer, entre na mesma conta usada na compra e tente a recuperação no Meu Universo. Persistindo a falha, use o canal de suporte informado no comprovante.",
        },
        {
          title: "Após o reembolso",
          body:
            "Quando um reembolso for aprovado, o acesso relacionado poderá ser revogado. O prazo de crédito depende do meio de pagamento e da instituição financeira.",
        },
      ]}
    />
  );
}
