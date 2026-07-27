import { LegalPage } from "@/components/LegalPage";
import { PDU_ASSETS } from "@/lib/pdu-assets";

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Transparência"
      title="Termos de uso"
      intro="Estes termos explicam o que o Palavras do Universo oferece e os limites necessários para uma experiência responsável."
      visual={PDU_ASSETS.surfaces.legalTerms}
      visualAlt="Livro dos termos"
      sections={[
        {
          title: "Natureza da experiência",
          body: (
            <p>
              O Palavras do Universo oferece conteúdo simbólico, reflexivo e de
              entretenimento. Leituras, cartas e ações sugeridas não substituem
              aconselhamento médico, psicológico, jurídico ou financeiro.
            </p>
          ),
        },
        {
          title: "Conta e uso responsável",
          body: (
            <p>
              Você é responsável por proteger o acesso ao seu e-mail e por usar
              a plataforma de forma legal e respeitosa. Não use o serviço para
              ameaçar, controlar, diagnosticar ou tomar decisões em nome de outras pessoas.
            </p>
          ),
        },
        {
          title: "Produtos pagos",
          body: (
            <p>
              Preços, periodicidade e conteúdo incluído são apresentados antes
              do pagamento. Compras avulsas liberam os usos informados. Assinaturas
              permanecem ativas enquanto o pagamento estiver regular e podem ser
              gerenciadas no Meu Universo.
            </p>
          ),
        },
        {
          title: "Disponibilidade e mudanças",
          body: (
            <p>
              Podemos melhorar recursos e conteúdo sem reduzir acessos já pagos.
              Em caso de indisponibilidade relevante, trabalharemos para restaurar
              o serviço ou oferecer uma solução adequada.
            </p>
          ),
        },
      ]}
    />
  );
}
