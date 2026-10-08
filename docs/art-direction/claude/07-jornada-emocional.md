# Revisão da Jornada Emocional

Responsável: Claude  
Data: 2026-06-27  
Escopo: verificação crítica de cada etapa da jornada — se a pergunta emocional do usuário é respondida e se a transição para a próxima etapa é natural.

---

## Metodologia

Para cada etapa, avalio:
1. **O que o usuário sente ao entrar** — estado emocional de chegada
2. **O que a experiência promete** — o que a etapa se propõe a entregar
3. **O que realmente entrega** — análise crítica do que foi especificado
4. **Risco de ruptura** — onde o contrato emocional pode quebrar
5. **A transição é natural?** — se a passagem para a próxima etapa faz sentido emocional

---

## Etapa 1 — Chegada

**Estado emocional de entrada:**  
O usuário chegou com uma pergunta, uma angústia ou uma curiosidade. Pode ser cético. Provavelmente já viu dezenas de páginas de tarot online. Sua pergunta implícita é: "por que isso seria diferente?"

**O que a experiência promete:**  
Presença. Um universo que existe antes de qualquer explicação.

**O que realmente entrega:**  
Um portal distante, uma headline contida, silêncio visual. Isso é correto — não tenta convencer, apenas existe.

**Risco de ruptura:**  
A headline "Palavras do Universo. Clareza que emerge do símbolo." é boa, mas depende do tempo de carregamento. Se o portal demora para aparecer e a headline entra antes em um fundo preto ou em um estado de transição incompleto, a primeira impressão é de carregamento lento, não de atmosfera. **O carregamento da cena precisa ser invisível — o portal só aparece quando já pode aparecer corretamente.**

**A transição é natural?**  
Sim. O scroll como aproximação ao portal é intuitivo — o usuário quer chegar mais perto do que viu. O CTA "Começar" é um atalho para quem já está convencido.

**Observação crítica:**  
A headline atual propõe "clareza que emerge do símbolo" — é abstrata. Para um usuário em angústia real (decisão difícil, relação complicada, momento de transição), essa frase pode parecer distante demais. Considerar uma variante mais próxima do estado emocional de quem chega em crise:  
*"Para quando você precisa de clareza, não de previsão."*

---

## Etapa 2 — Reconhecimento

**Estado emocional de entrada:**  
O usuário se aproximou — já está parcialmente engajado. Sua pergunta agora é: "isso é para mim ou para um público genérico?"

**O que a experiência promete:**  
Espelho. A sensação de ser visto.

**O que realmente entrega:**  
Copy de reconhecimento + ícone protagonista que reflete uma fase ou intenção. Isso é conceitualmente correto.

**Risco de ruptura (crítico):**  
O ícone protagonista neste capítulo deve ser dinâmico ou contextual para criar reconhecimento real. Um ícone estático, sempre o mesmo para todos os usuários, entrega reconhecimento genérico — o oposto do que a etapa promete. **Questão para o produto:** o ícone de reconhecimento é personalizado (baseado no onboarding ou na hora do dia) ou é um ícone fixo editorial?

Se for fixo, a copy de reconhecimento precisa ser mais ampla e honesta: não "isso é para você", mas "isso é para quem [descrição genuína]". A especificidade da audiência substitui a personalização.

**A transição é natural?**  
Sim. Do espelho para a escolha é uma progressão lógica: "agora que me reconheci aqui, o que posso fazer?"

**Observação crítica:**  
Este é o capítulo de maior risco de over-promise. "Você está sendo visto" é uma promessa emocional forte. Se a implementação não sustentar isso (ícone genérico, copy genérica), o usuário sente o contraste entre o que foi prometido e o que foi entregue — e isso corrói a confiança mais que uma promessa menor teria feito.

---

## Etapa 3 — Escolha

**Estado emocional de entrada:**  
O usuário está engajado e orientado. Sua pergunta é: "o que faço agora?"

**O que a experiência promete:**  
Caminhos claros sem pressão de decisão.

**O que realmente entrega:**  
Três pontos ao redor do portal, cada um um caminho. Sem cards, sem tabela comparativa, sem texto de venda.

**Risco de ruptura:**  
A diferença entre os três caminhos (Carta do Dia, Leitura de 3 Cartas, Clareza Urgente) precisa ser óbvia sem texto explicativo extenso. Se o usuário não entende a diferença entre eles apenas pelo nome e ícone, o design falhou — e ele volta para o estado de "não sei o que fazer", que é o oposto do que a etapa promete.

**A transição é natural?**  
Sim, mas com uma ressalva: se o usuário escolhe "Clareza Urgente" (produto pago), ele precisa entender que vai pagar antes de entrar no ritual de Abertura. A transição não pode chegar na Revelação e surpreender o usuário com um paywall. A natureza paga de "Clareza Urgente" deve ser comunicada no momento da Escolha — não depois.

**Observação crítica:**  
O capítulo de Escolha resolve um problema de arquitetura de informação (quais caminhos existem) mas pode criar um problema de carga cognitiva (qual escolher agora). Uma sugestão editorial: o portal pode "favorecer" sutilmente um caminho baseado na hora do dia ou no comportamento de scroll — não de forma intrusiva, mas como uma sugestão gentil. Isso não quebra a autonomia do usuário, mas reduz a paralisia de escolha.

---

## Etapa 4 — Abertura

**Estado emocional de entrada:**  
O usuário escolheu. Está em estado de entrega — pronto para participar. Sua pergunta agora é: "o que acontece quando eu confio nisso?"

**O que a experiência promete:**  
Transformar uma ação funcional (digitar uma pergunta) em ritual.

**O que realmente entrega:**  
Portal em máxima presença, campo de input integrado à composição.

**Risco de ruptura (crítico):**  
**O campo de input é o ponto de maior risco técnico-emocional do fluxo inteiro.** Se o teclado do celular empurrar o portal para fora do viewport, se o campo tiver placeholder genérico ("Digite sua pergunta aqui"), se o botão de submit parecer um formulário web convencional — o ritual quebra imediatamente e o usuário volta a se sentir num produto genérico.

O placeholder deve ser poético e real:  
*"O que está pesando agora?"*  
*"Qual decisão você está adiando?"*  
*"O que você precisaria ver com mais clareza?"*

O botão de submit não deve dizer "Enviar" ou "Submit". Deve dizer algo que pertence ao ritual:  
*"Revelar"* ou *"Abrir"*.

**A transição é natural?**  
A sequência de contração → expansão do portal após o submit é correta emocionalmente. Cria antecipação sem parecer delay técnico. O risco é se a resposta da API demorar — o portal não pode ficar em estado de expansão infinita enquanto aguarda. Precisa de um estado de "preparação ativa" que comunique que algo está acontecendo, não que algo quebrou.

---

## Etapa 5 — Revelação

**Estado emocional de entrada:**  
O usuário está em estado de abertura máxima. Ele entregou a pergunta e está esperando algo real. Sua pergunta implícita: "o que isso significa para mim especificamente?"

**O que a experiência promete:**  
Conexão entre pergunta, cartas e significado pessoal.

**O que realmente entrega:**  
Três cartas com interpretação conectada à pergunta do usuário.

**Risco de ruptura (alto):**  
Este é o capítulo onde o produto precisa ser bom. A direção de arte pode criar o momento de revelação mais belo já construído — se a interpretação for genérica, o usuário vai embora e não volta. A copy de interpretação precisa referenciar a pergunta original de forma explícita, não apenas retornar um significado padrão de cada carta.

**Questão técnica que afeta a emoção:** se a API falhar após o usuário já ter visto as cartas surgindo, o tratamento de erro não pode ser uma página branca ou uma mensagem técnica. Precisa de uma resposta humana:  
*"Algo não chegou como deveria. Sua pergunta foi guardada — tente novamente quando o momento voltar."*

**A transição é natural?**  
Da Revelação para a Integração: as cartas diminuindo e a síntese emergindo é narrativamente correto. O usuário passou da abertura para a digestão. Mas a transição não pode ser abrupta — as cartas precisam estar visíveis como referência durante toda a leitura da síntese, mesmo que em tamanho menor.

---

## Etapa 6 — Integração

**Estado emocional de entrada:**  
O usuário acabou de receber algo significativo. Está em estado de digestão. Sua pergunta: "e agora? O que faço com isso?"

**O que a experiência promete:**  
Síntese, conselho e próximo passo — sem pressão.

**O que realmente entrega:**  
Texto de síntese, conselho, afirmação e CTAs.

**Risco de ruptura:**  
A afirmação é o elemento de maior risco desta etapa. Afirmações genéricas ("você tem força para isso", "confie no processo") destroem a credibilidade de tudo que veio antes. A afirmação precisa ser derivada da leitura específica, não de um banco de frases motivacionais.

O CTA de Círculo (assinatura) neste capítulo precisa ser cuidadosamente posicionado. Se aparecer muito cedo (antes da síntese completa), interrompe a digestão. Se usar linguagem de urgência ("Oferta por tempo limitado!"), quebra toda a atmosfera construída. O contexto certo:  
*"Se esta leitura foi útil, o Círculo traz isso todos os dias."*

**A transição é natural?**  
A Integração é o fim do ritual — não deve haver pressão de transição para mais conteúdo. O usuário deve sentir que pode sair com algo real. O estado final da cena (portal menor, luz sage, composição calma) comunica isso corretamente.

---

## Mapa de riscos emocionais

| Etapa | Risco principal | Gravidade | Mitigação |
|---|---|---|---|
| Chegada | Carregamento lento quebra atmosfera | Alta | Canvas só renderiza quando pronto |
| Reconhecimento | Personalização prometida não entregue | Alta | Honestidade sobre o que é fixo vs dinâmico |
| Escolha | Natureza paga de Clareza Urgente não comunicada | Alta | Label de preço visível na Escolha |
| Abertura | Input parece formulário web convencional | Alta | Placeholder e submit com linguagem ritual |
| Abertura | API lenta → portal em estado indefinido | Média | Estado de preparação ativa explícito |
| Revelação | Interpretação genérica | Crítica | Produto — não é questão de design |
| Revelação | Erro de API após cards surgidas | Média | Tratamento de erro humano e contextual |
| Integração | Afirmação genérica | Alta | Derivar da leitura específica |
| Integração | CTA de assinatura com urgência artificial | Alta | Linguagem de continuidade, não de pressão |

---

## Uma tensão que precisa ser resolvida antes do protótipo

A jornada está bem arquitetada. Mas há uma tensão fundamental entre duas intenções:

**Intenção 1:** criar uma experiência emocional real, sem artifício.  
**Intenção 2:** converter o usuário em cliente.

Estas não são incompatíveis — mas a ordem importa muito. A monetização deve acontecer depois do valor percebido, nunca antes. O risco real do produto não é técnico — é fazer o usuário sentir que foi conduzido por um funil de vendas disfarçado de experiência espiritual. Isso é percebido quase sempre, e quando é percebido, a confiança é irrecuperável.

A recomendação: manter o checklist da Etapa 7 (Monetizar Hoje) separado da jornada emocional. O checkout e a oferta são um produto dentro do produto — com suas próprias regras de comunicação e timing — não uma continuação natural da jornada ritual.
