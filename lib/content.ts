// Textos compartilhados e listas do site (os títulos e textos fixos de cada seção ficam no próprio componente).
// Itens marcados com `tbc: true` (to be confirmed) ainda dependem de validação da DANX.

/**
 * Modo de revisão (NEXT_PUBLIC_REVISAO=1, ligado nas prévias da Vercel): os itens a confirmar aparecem com o selo
 * "A CONFIRMAR". Na produção eles ficam de fora, ou dão lugar a um texto provisório que não afirma nada que a DANX
 * ainda não confirmou (ex.: preço "sob proposta").
 */
export const REVISAO = process.env.NEXT_PUBLIC_REVISAO === "1";

export const site = {
  product: "Estação de Saúde DANX",
  url: "https://www.danx.com.br",
  phone: "(27) 99292-1830",
  whatsapp: "5527992921830",
  email: { value: "contato@danx.com.br", tbc: true },
  cnpj: { value: "00.000.000/0000-00", tbc: true },
  razaoSocial: { value: "Razão social da DANX", tbc: true },
  description:
    "Triagem e avaliação corporal de crianças e adolescentes na escola: altura, composição corporal, equilíbrio, agilidade, capacidade pulmonar, acuidade visual e postura em uma só estação.",
};

export const nav = [
  { href: "#tecnologia", label: "Tecnologia" },
  { href: "#para-quem", label: "Para quem" },
  { href: "#relatorio", label: "Relatório" },
  { href: "#especificacoes", label: "Especificações" },
  { href: "#como-comprar", label: "Como comprar" },
  { href: "#faq", label: "Dúvidas" },
];

export const hero = {
  product: "Estação de Saúde DANX",
  title: "Triagem de saúde de cada aluno,",
  titleEnd: "dentro da escola.",
  lead: "Sete testes em uma só estação, com relatório para a família e painel para a gestão: a escola acompanha a saúde de cada aluno, ano a ano.",
  note: "Vendida apenas a redes públicas, Sistema S e escolas particulares.",
};

export const manifesto = {
  title: "Crescer é rápido. Perceber o que muda, nem sempre.",
  text: "Cada aluno que passa pela estação gera dados que escola, família e gestão acompanham ao longo dos anos.",
  bridge:
    "Postura, composição corporal, equilíbrio e agilidade mudam devagar, e o problema costuma aparecer só quando vira queixa. A estação registra cada medida, aluno a aluno, para a escola ver a tendência cedo. É triagem: indica sinais de atenção e apoia as ações do Programa Saúde na Escola.",
  stats: [
    {
      value: 84,
      decimals: 0,
      suffix: "%",
      label: "dos adolescentes brasileiros não praticam os 60 minutos diários de atividade física recomendados.",
      link: "Na estação: composição corporal, agilidade e capacidade pulmonar.",
      source: "Guthold et al. (OMS), The Lancet Child & Adolescent Health, 2019",
    },
    {
      value: 55.7,
      decimals: 1,
      suffix: "%",
      label:
        "dos estudantes de 11 a 16 anos relataram dor nas costas nos últimos três meses, em um estudo regional em Teutônia (RS).",
      link: "Na estação: postura e equilíbrio.",
      source: "Noll et al., Revista de Saúde Pública, 2016",
    },
  ],
};

export const report = {
  points: [
    { k: "62", v: "indicadores por avaliação" },
    { k: "Impresso", v: "em A4, direto na impressora da rede" },
    { k: "No celular", v: "pelo QR code, para a família" },
  ],
  student: { age: "10 anos", sex: "Masculino", height: "148 cm", score: 86 },
  bars: [
    { label: "Peso", value: "44,2 kg", pct: 0.62, tone: "ok" },
    { label: "Gordura", value: "21,3%", pct: 0.55, tone: "ok" },
    { label: "Músculo", value: "52,2%", pct: 0.72, tone: "ok" },
    { label: "Água", value: "58,9%", pct: 0.66, tone: "ok" },
    { label: "Proteína", value: "16,1%", pct: 0.58, tone: "ok" },
    { label: "IMC", value: "20,2", pct: 0.6, tone: "ok" },
  ],
};

export const management = {
  lead: "Cada avaliação alimenta o painel da gestão, com a saúde dos alunos por escola, ano e turma.",
  benefits: [
    {
      title: "Prevenção com dados",
      text: "Indicadores por escola, ano e turma para planejar ações de saúde, esporte e alimentação.",
    },
    {
      title: "Resultados visíveis",
      text: "A evolução dos alunos de um ano para o outro, útil para prestar contas e divulgar o programa.",
    },
    {
      title: "Uma medida comum",
      text: "O mesmo protocolo em todas as escolas, para comparar turmas e acompanhar cada programa com a mesma régua.",
    },
  ],
};

export const audience = {
  title: "Para quem cuida de crianças e adolescentes.",
  lead: "Vendida somente a instituições que atendem crianças e adolescentes, nunca no varejo.",
  segments: [
    {
      title: "Prefeituras e secretarias",
      sub: "Saúde e Educação",
      cta: "Solicitar cotação para a rede",
      tipo: "Prefeitura / Secretaria de Educação",
      text: "Uma linha de base anual da saúde dos alunos da rede, para apoiar ações de alimentação saudável, atividade física e saúde ocular, temas do Programa Saúde na Escola.",
    },
    {
      title: "Sistema S",
      sub: "Sesi, Sesc, Senac e outros",
      cta: "Solicitar cotação para o seu programa",
      tipo: "Sistema S",
      text: "Avaliação padronizada para programas de esporte, saúde e educação: histórico de cada participante, relatório com o nome da unidade e uso de 3 a 99 anos.",
    },
    {
      title: "Escolas particulares",
      sub: "Educação infantil, ensino fundamental e médio",
      cta: "Solicitar cotação para a sua escola",
      tipo: "Escola particular",
      text: "Um cuidado que as famílias enxergam, com relatório individual, acompanhamento anual e o nome da escola no relatório. Um diferencial para a matrícula e a rematrícula.",
    },
  ],
  exclusive: {
    title: "Compra direta com a DANX.",
    text: "A DANX é o único canal de venda deste equipamento no Brasil, para o poder público, o Sistema S e escolas particulares. A declaração de exclusividade acompanha o seu processo de compra.",
  },
};

export const specs = [
  {
    group: "Dimensões e estrutura",
    rows: [
      ["Dimensões (A × L × P)", "2.100 × 480 × 935 mm"],
      ["Estrutura", "Vidro temperado preto e alumínio anodizado"],
      ["Eletrodos", "4 placas em aço inox austenítico 304"],
      ["Módulos", "Torre com tela, plataforma de medição e dossel ultrassônico"],
      ["Acessórios", "Espirômetro e bocais descartáveis", true],
    ],
  },
  {
    group: "Tela e sistema",
    rows: [
      ["Tela", "32″ IPS Full HD (1920 × 1080), sensível ao toque (capacitiva)"],
      ["Sistema", "Sistema embarcado, com orientação por voz durante o teste"],
      ["Identificação", "Por número de identificação (ID)"],
    ],
  },
  {
    group: "Medição",
    rows: [
      ["Composição corporal", "Bioimpedância (BIA) multifrequência, 4 eletrodos"],
      ["Altura", "Sensor ultrassônico de alta frequência"],
      ["Capacidade pulmonar", "Sensor de pressão de ar de alta precisão"],
      ["Postura", "Câmera com visão computacional (IA)"],
      ["Equilíbrio", "Na plataforma: 10 s em uma perna, olhos fechados"],
      ["Agilidade", "Tempo de reação na tela sensível ao toque (5 estímulos), em ms"],
      ["Acuidade visual", "Optotipo E na tela, a 2,5 m, um olho de cada vez"],
      ["Faixa de peso", "0 a 160 kg, resolução de 0,1 kg", true],
      ["Faixa de altura", "80 a 200 cm", true],
      ["Faixa etária", "3 a 99 anos"],
      ["Corrente de medição", "< 280 µA"],
    ],
  },
  {
    group: "Dados e conectividade",
    rows: [
      ["Armazenamento local", "Mais de 100 mil avaliações"],
      ["Nuvem", "Sem limite de registros, com backup automático", true],
      ["Conexões", "Wi-Fi 2,4 GHz e 5 GHz, rede cabeada (LAN), Bluetooth, 2 × USB 2.0"],
      ["Relatório", "Tela, A4 (impressora laser ou jato de tinta), web e celular"],
      ["Personalização", "Nome e contato da instituição no relatório"],
    ],
  },
  {
    group: "Ambiente de operação",
    rows: [
      ["Alimentação", "220 V, 60 W", true],
      ["Temperatura de operação", "10 a 40 °C"],
      ["Umidade relativa", "Até 80%, sem condensação"],
    ],
  },
] as const;

export const pricing = {
  lead: "Preço público, para que gestores encontrem o valor na pesquisa de preços. Emitimos proposta comercial formal para processos de compra.",
  // Enquanto o preço não é confirmado (produção)
  pending: {
    title: "Proposta formal para a sua rede ou escola.",
    lead: "Cada proposta é montada para a sua instituição. Valor, condições de pagamento e prazo chegam por escrito, prontos para o processo de compra.",
    includesTitle: "Na proposta detalhamos",
  },
  // Como a compra acontece (só passos que não dependem de dado a confirmar)
  steps: [
    { title: "Você pede a cotação", text: "Pelo formulário, WhatsApp ou telefone." },
    { title: "Recebe a proposta formal", text: "Com valor, condições de pagamento e prazo." },
    { title: "A estação chega e é montada", text: "No local, pronta para as avaliações." },
  ],
  price: { value: "R$ 00.000,00", per: "por estação", tbc: true },
  conditions: [
    { title: "À vista", text: "Condição especial para pagamento à vista.", tbc: true },
    { title: "Parcelado", text: "Parcelamento para escolas particulares e Sistema S.", tbc: true },
    { title: "Compra pública", text: "Proposta formal, prazos e documentação para licitação.", tbc: true },
  ],
  includes: [
    { text: "Entrega e instalação no local", tbc: true },
    { text: "Treinamento da equipe", tbc: true },
    { text: "Garantia", tbc: true },
    { text: "Acesso ao painel da gestão", tbc: true },
  { text: "Tratamento dos dados dos alunos (LGPD)", tbc: true },
  ],
};

export const docs = [
  { title: "Ficha técnica", text: "Especificações completas do equipamento.", tbc: true },
  { title: "Proposta comercial modelo", text: "Base para o processo de compra.", tbc: true },
  { title: "Declaração de exclusividade", text: "Documento do canal exclusivo de venda.", tbc: true },
  { title: "Relatório de exemplo", text: "Um relatório completo, como a família recebe.", tbc: true },
  { title: "Registros e certificações", text: "Registros e certificações aplicáveis ao equipamento.", tbc: true, hide: true },
];

export const faq = [
  {
    id: "lgpd",
    open: true,
    q: "Como ficam os dados das crianças (LGPD)?",
    a: "Os dados são armazenados com criptografia e acesso por permissão. A política de consentimento dos responsáveis e o tratamento de dados de crianças, conforme o art. 14 da LGPD, serão detalhados aqui.",
    tbc: true,
    // Na produção, enquanto a resposta completa não é confirmada: só o que o produto já mostra
    pub: "O aluno é identificado só pelo número de matrícula, e a estação exibe o aviso de coleta de dados antes de cada avaliação. Para menores, a LGPD pede o consentimento de um dos pais ou do responsável legal: esse fluxo é combinado com a sua instituição. Onde os dados ficam e quem tem acesso a eles é detalhado na proposta.",
  },
  {
    q: "A estação faz diagnóstico?",
    a: "Não. A Estação de Saúde DANX faz triagem e avaliação: identifica sinais de atenção e apoia o encaminhamento para profissionais de saúde. O diagnóstico é sempre feito por um profissional habilitado.",
  },
  {
    q: "Como funciona a compra por órgãos públicos?",
    a: "O preço é público e emitimos proposta comercial formal para processos de compra. A modalidade adequada e a documentação de exclusividade devem ser confirmadas com o jurídico de cada órgão.",
    tbc: true,
  },
  {
    q: "Como é a instalação?",
    a: "A estação chega desmontada (torre com tela, plataforma de medição e dossel ultrassônico) e é montada no local. Acompanham espirômetro e bocais descartáveis. Prazo de entrega e treinamento da equipe serão informados na proposta.",
    tbc: true,
    pub: "A estação chega desmontada e é montada no local: torre com tela, plataforma de medição e dossel ultrassônico. Ocupa uma base de 48 × 93,5 cm; os detalhes de entrega e instalação vêm na proposta.",
  },
  {
    q: "Qual é a garantia e como funciona a manutenção?",
    a: "Garantia, assistência técnica e manutenção preventiva serão detalhadas aqui.",
    tbc: true,
  },
  {
    q: "Quem opera a estação?",
    a: "Um profissional da escola acompanha a avaliação, e o aluno segue as instruções da própria estação, na tela e por voz. O relatório sai na hora. O treinamento da equipe é detalhado na proposta.",
  },
  {
    q: "O que preparar na escola?",
    a: "Uma base de 48 × 93,5 cm, 2,5 m livres à frente da tela para a triagem de acuidade visual e um ambiente entre 10 e 40 °C, com umidade de até 80%, sem condensação.",
  },
  {
    q: "Precisa de internet para funcionar?",
    a: "Não para avaliar. As avaliações ficam salvas no próprio equipamento, com capacidade para mais de 100 mil, e são sincronizadas com a nuvem quando há conexão. O acesso pelo QR code e o painel da gestão usam os dados que chegam à nuvem.",
  },
  {
    q: "Para qual faixa etária ela serve?",
    a: "De 3 a 99 anos. Para crianças e adolescentes, o algoritmo usa curvas de crescimento por idade e sexo. A estação também pode ser usada com professores e funcionários.",
  },
];

export const quote = {
  title: "Leve a Estação de Saúde DANX para a sua escola ou rede.",
  lead: "Receba o valor, as condições e uma proposta formal. Respondemos em até um dia útil.",
  leadTbc: true,
  leadPub: "Receba o valor, as condições e uma proposta comercial formal.",
  next: "Depois do envio, a equipe da DANX entra em contato para apresentar a proposta.",
  docs: ["Ficha técnica", "Proposta comercial modelo", "Declaração de exclusividade", "Relatório de exemplo"],
  types: [
    "Prefeitura / Secretaria de Saúde",
    "Prefeitura / Secretaria de Educação",
    "Sistema S",
    "Escola particular",
    "Outro",
  ],
};
