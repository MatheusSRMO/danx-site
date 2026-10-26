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
  lead: "Altura, composição corporal, equilíbrio, agilidade, capacidade pulmonar, acuidade visual e postura em uma só estação, com relatório para a família e dados para a gestão.",
  note: "Vendida apenas a redes públicas, Sistema S e escolas particulares.",
};

export const manifesto = {
  title: "Crescer é rápido. Perceber o que muda, nem sempre.",
  text: "A DANX transforma uma passagem pela estação em dados que escola, família e gestão acompanham, ano após ano.",
  bridge:
    "A estação acompanha, aluno a aluno e ano a ano, os indicadores ligados a esses números: postura, composição corporal, equilíbrio e agilidade. São dados que apoiam ações do Programa Saúde na Escola, como alimentação saudável, atividade física e saúde ocular.",
  stats: [
    {
      value: 55.7,
      decimals: 1,
      suffix: "%",
      label:
        "dos estudantes de 11 a 16 anos avaliados em um estudo em Teutônia (RS) relataram dor nas costas nos últimos três meses.",
      source: "Noll et al., Revista de Saúde Pública (USP), 2016",
    },
    {
      value: 84,
      decimals: 0,
      suffix: "%",
      label: "dos adolescentes brasileiros não praticam os 60 minutos diários de atividade física recomendados.",
      source: "OMS / The Lancet Child & Adolescent Health, 2019",
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
      text: "A evolução dos alunos ano a ano, útil para prestar contas e divulgar o programa.",
    },
    {
      title: "Famílias por perto",
      text: "Cada família recebe o relatório individual do próprio filho, com o nome e o contato da escola.",
    },
    {
      title: "Uma medida comum",
      text: "O mesmo protocolo em todas as escolas, para comparar turmas e acompanhar cada programa com a mesma régua.",
    },
  ],
};

export const audience = {
  title: "Vendida só para quem cuida de crianças e adolescentes.",
  lead: "A Estação de Saúde DANX não é vendida no varejo. A distribuição é exclusiva para instituições que atendem o público infantil e juvenil.",
  segments: [
    {
      title: "Prefeituras e secretarias",
      sub: "Saúde e Educação",
      cta: "Solicitar cotação para a rede",
      tipo: "Prefeitura / Secretaria de Educação",
      text: "Uma linha de base anual da saúde dos alunos da rede, para apoiar ações de alimentação saudável, atividade física e saúde ocular, temas do Programa Saúde na Escola. A proposta formal e a declaração de exclusividade acompanham o seu processo de compra.",
    },
    {
      title: "Sistema S",
      sub: "Sesi, Sesc, Senac e outros",
      cta: "Solicitar cotação para o seu programa",
      tipo: "Sistema S",
      text: "Avaliação padronizada para programas de esporte, saúde e educação, com histórico de cada participante.",
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
    title: "Um único canal de venda no Brasil.",
    text: "A DANX tem a exclusividade de venda deste equipamento no Brasil para o poder público, o Sistema S e escolas particulares.",
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
      ["Faixa de peso", "0 a 160 kg, resolução de 0,1 kg", true],
      ["Faixa de altura", "80 a 200 cm", true],
      ["Faixa etária", "3 a 99 anos"],
      ["Corrente de medição", "< 280 µA"],
    ],
  },
  {
    group: "Dados e conectividade",
    rows: [
      ["Armazenamento local", "Mais de 100.000 registros"],
      ["Nuvem", "Sem limite de registros, com backup automático", true],
      ["Conexões", "Wi-Fi 2,4 GHz e 5 GHz, rede cabeada (LAN), Bluetooth, 2 × USB 2.0"],
      ["Relatório", "Tela, A4 (impressora laser ou jato de tinta), web e celular"],
      ["Personalização", "Nome e contato da instituição no relatório"],
    ],
  },
  {
    group: "Energia e ambiente",
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
    pub: "Antes de cada avaliação, a estação pede o consentimento na própria tela. Fale com a nossa equipe para conhecer como os dados são guardados e quem tem acesso a eles na sua instituição.",
  },
  {
    open: true,
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
    pub: "A estação chega desmontada e é montada no local: torre com tela, plataforma de medição e dossel ultrassônico. Ocupa uma base de 48 × 93,5 cm.",
  },
  {
    q: "Qual é a garantia e como funciona a manutenção?",
    a: "Garantia, assistência técnica e manutenção preventiva serão detalhadas aqui.",
    tbc: true,
  },
  {
    q: "Precisa de internet para funcionar?",
    a: "Não. As avaliações ficam salvas no próprio equipamento, com capacidade para mais de 100 mil registros, e são sincronizadas com a nuvem quando há conexão.",
  },
  {
    q: "Para qual faixa etária ela serve?",
    a: "O algoritmo usa curvas de crescimento por idade e sexo, próprias para crianças e adolescentes. A estação avalia pessoas de 3 a 99 anos, então também pode ser usada com professores e funcionários.",
  },
];

export const quote = {
  title: "Leve a DANX para a sua escola ou rede.",
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
