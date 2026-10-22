# Site — Estação de Saúde DANX

Site institucional e comercial da **Estação de Saúde DANX**, em Next.js 16 (App Router), com direção visual no estilo das páginas de produto da Apple (conceito C, "Escola viva": brancos quentes, fotos de escola e o produto em 3D reagindo à rolagem).

## Rodar

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de produção (Vercel ou `npm start`)
npm run export     # versão 100% estática em out/ (sem a rota /api/cotacao)
```

Para testar os modos de desempenho, acrescente na URL `?tier=high`, `?tier=low` (menos resolução no 3D) ou `?tier=none` (sem WebGL: usa imagens estáticas). Sem o parâmetro, o site decide sozinho (núcleos, memória, `prefers-reduced-motion`).

## Onde mexer

| O quê | Onde |
|---|---|
| Textos compartilhados e listas (nav, FAQ, especificações, preço, documentos, públicos) | `lib/content.ts` |
| Títulos e textos fixos de cada seção | no próprio componente em `components/sections/*.tsx` |
| Seções da página (ordem) | `app/page.tsx` |
| Cada seção | `components/sections/*.tsx` (+ `.module.css`) |
| Estilos globais e cores | `app/globals.css` |
| Modelo 3D da estação | `components/three/StationModel.tsx` (medidas reais em metros) |
| Telas exibidas no 3D | `components/three/screenUi.ts` (desenhadas em canvas) |
| Roteiro da câmera na rolagem | `components/sections/ProductStory.tsx` (`KEYS` e `CHAPTERS`) |
| Formulário de cotação | `components/sections/Quote.tsx` e `app/api/cotacao/route.ts` |
| Metadados, SEO e JSON-LD | `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts` |
| Imagens otimizadas | `public/media/*.webp` (originais em `gen/`) |
| Prompts usados no Codex | `docs/prompts-imagens/` |

Itens com `tbc: true` (ou `true` no fim de uma linha da tabela de especificações) em `lib/content.ts` aparecem no site com o selo **"A CONFIRMAR"**. Basta trocar o valor e remover o `tbc` quando a DANX confirmar.

## Formulário de cotação

`POST /api/cotacao` valida os campos e:
- se a variável `QUOTE_WEBHOOK_URL` estiver definida (Zapier, Make, n8n, endpoint próprio), repassa o pedido em JSON para ela;
- se não estiver: em produção responde 503 e o formulário oferece o WhatsApp (o pedido não se perde em log); em desenvolvimento, mostra o pedido no terminal.

**Antes de divulgar o site, defina `QUOTE_WEBHOOK_URL` na Vercel**; sem ela, todo pedido vai para o WhatsApp.

Se o envio falhar (ou no export estático), o formulário oferece enviar o pedido pelo WhatsApp, já preenchido com todos os dados, e um botão para tentar de novo sem perder o que foi digitado. A API aceita só os campos do formulário, com limite de tamanho, e exige o consentimento.

## Estrutura da página

1. Topo (foto da estação no ginásio da escola + título)
2. Por que agora (texto que acende palavra a palavra + estatísticas com fonte)
3. **Conheça a estação** (WebGL, seção presa à tela por ~6 telas de rolagem). A câmera percorre o produto:
   - a estação gira e se aproxima;
   - **altura**: anéis do sensor ultrassônico descem do dossel;
   - **composição corporal**: close na plataforma e os eletrodos acendem;
   - **a tela**: as telas de postura, equilíbrio e crescimento se alternam;
   - **instalação**: a estação se separa nos 3 módulos, com rótulos presos às peças;
   - a estação volta inteira, com o botão de cotação.

   Dá para arrastar para girar. Sem WebGL, a seção vira fotos estáticas.
4. Sete avaliações (cartões no estilo do app Saúde)
5. Feita para a rotina da escola (foto que se abre com a rolagem)
6. Relatório (celular)
7. Em números
8. Gestão (painel ilustrativo)
9. Para quem / exclusividade
10. Especificações técnicas (com cotas nas vistas de frente e de lado)
11. Investimento
12. Documentos para gestores
13. Perguntas frequentes
14. Cotação
15. Rodapé com notas

## Imagens

Todas geradas no Codex. As que mostram a estação usaram três fotos de referência do equipamento (vista de três quartos, base e tela, com as marcas cobertas) e a instrução de reproduzir a máquina com fidelidade; as de família e de gestão não mostram o equipamento. Os prompts estão em `docs/prompts-imagens/`, com o mesmo nome do arquivo publicado.

| Publicada (`public/media/`) | Original (`gen/`) |
|---|---|
| `hero-school.webp`, `hero-school-tall.webp` | `c-hero-wide.png`, `c-hero-tall.png` |
| `test-balance.webp` | `c-balance.png` |
| `school-hallway.webp` | `c-hallway.png` |
| `station-studio.webp`, `station-front.webp`, `station-side.webp` | `c-studio.png`, `c-front.png`, `c-side.png` |
| `family-report.webp` | `ap-family.png` |
| `gestao.webp` | `gestor.png` |

A imagem de compartilhamento (`public/og.jpg`, 1200 × 630) foi montada a partir de `c-hero-wide.png`.

O modelo 3D foi construído com as medidas da apresentação (2,10 m de altura, base de 48 × 93,5 cm) e conferido por sobreposição com a foto oficial.

## Pendências com a cliente

- **Preço, formas de pagamento e o que está incluído** (entrega, instalação, treinamento, garantia).
- **Dados da empresa**: razão social, CNPJ, e-mail e endereço (o telefone (27) 99292-1830 e o site danx.com.br vieram da apresentação).
- **Especificações divergentes entre os materiais**: faixa de peso (0–160 kg × 0–200 kg), faixa de altura (80–200 cm × 0–200 cm) e alimentação (220 V × 110/220 V).
- **Corda de pular com Bluetooth e espirômetro**: vêm com a estação ou são acessórios? (no site, o espirômetro e os bocais aparecem como acessórios, a confirmar).
- **Embalagem**: os materiais falam em 2 e em 3 volumes; o site só diz que a estação chega desmontada em 3 módulos.
- **Registros e certificações** (ANVISA, INMETRO etc.). O material do fabricante cita outras certificações internacionais, mas nada foi publicado no site sem confirmação.
- **Documentos para gestores**: ficha técnica, proposta modelo, declaração de exclusividade.
- **LGPD**: política de privacidade, termos e consentimento dos responsáveis (art. 14).
- **Compra pública**: como comunicar a modalidade de compra (confirmar com o jurídico antes de falar em inexigibilidade).
- **Prazo de resposta** do formulário ("até 1 dia útil" está marcado como a confirmar).
- **App e relatório**: confirmar que saem com a marca DANX.
- **Fotos reais** do equipamento com a marca DANX, quando existirem. As atuais foram geradas por IA e **não mostram logotipo** no equipamento; confirmar onde a marca DANX vai aplicada (tela de abertura, dossel, base).
- **Direito de uso das fotos do fabricante como referência** para gerar as imagens (nenhuma foto do fabricante é publicada no site).
- **Painel da gestão**: confirmar que a plataforma agrega dados por escola, ano e turma (o painel do site é ilustrativo) e se a nuvem tem armazenamento ilimitado (marcado a confirmar).
- **Relatório**: confirmar se traz sugestões de atividade física e de hábitos alimentares, impressão em rede e acesso por QR code.
- **Aluno de exemplo**: o IMC 20,2 do relatório de exemplo (10 anos, 148 cm, 44,2 kg) fica acima da faixa de referência da OMS para a idade. O site não classifica o resultado; se a DANX tiver outro exemplo, vale trocar.
- **Antes do lançamento**: revisar os itens "a confirmar", definir `QUOTE_WEBHOOK_URL` e só então deixar o domínio final ser indexado (hoje `robots.txt` libera tudo).

## Regras de conteúdo

- Não citar o fabricante nem o país de origem em nenhum lugar (texto, código, metadados, nomes de arquivo).
- A estação faz **triagem e avaliação**, nunca "diagnóstico".
- Valores de avaliação são ilustrativos. Só peso, gordura, músculo e IMC vêm do relatório de exemplo da apresentação (aluno de 10 anos, 148 cm).

## Prévias

`preview/` guarda o vídeo do tour (`danx-tour.mp4`, acelerado porque foi gravado com renderização por software), capturas de tela no desktop e no celular e, em `preview/conceitos/`, os três conceitos visuais apresentados antes da escolha do conceito C.
