// Todo o texto do site em um só lugar.
// Itens marcados com `tbc: true` (to be confirmed) aparecem no site com o selo "A CONFIRMAR"
// e precisam de validação da DANX antes da publicação.

export const site = {
  name: "DANX",
  product: "Estação de Saúde DANX",
  productSeo: "Estação de Saúde Infantil DANX",
  url: "https://www.danx.com.br",
  phone: "(27) 99292-1830",
  whatsapp: "5527992921830",
  email: { value: "contato@danx.com.br", tbc: true },
  cnpj: { value: "00.000.000/0000-00", tbc: true },
  razaoSocial: { value: "Razão social da DANX", tbc: true },
  address: { value: "Endereço comercial", tbc: true },
  description:
    "Estação de saúde para crianças e adolescentes: composição corporal, postura com IA, equilíbrio, agilidade, capacidade pulmonar e acuidade visual em uma só estação. Exclusiva para redes públicas, Sistema S e escolas particulares.",
};

export const nav = [
  { href: "#avaliacoes", label: "Avaliações" },
  { href: "#tecnologia", label: "Tecnologia" },
  { href: "#relatorio", label: "Relatório" },
  { href: "#para-quem", label: "Para quem" },
  { href: "#especificacoes", label: "Especificações" },
  { href: "#investimento", label: "Preço" },
  { href: "#faq", label: "Dúvidas" },
];

export const hero = {
  product: "Estação de Saúde DANX",
  title: "Saúde em alta definição.",
  lead: "Avaliação corporal inteligente para crianças e adolescentes, dentro da escola.",
  note: "Exclusiva para redes públicas, Sistema S e escolas particulares.",
};

export const manifesto = {
  text:
    "Crescer é rápido. Perceber o que muda, nem sempre. A DANX transforma uma passagem pela estação em dados que escola, família e gestão conseguem acompanhar, ano após ano.",
  stats: [
    {
      value: 55.7,
      decimals: 1,
      suffix: "%",
      label: "dos estudantes de 11 a 16 anos relataram dor nas costas nos últimos três meses.",
      source: "Revista de Saúde Pública (USP), 2016",
    },
    {
      value: 84,
      decimals: 0,
      suffix: "%",
      label: "dos adolescentes brasileiros não fazem a hora diária de atividade física recomendada.",
      source: "OMS / The Lancet Child & Adolescent Health, 2019",
    },
  ],
};

// Os números das leituras são do exemplo de relatório da apresentação DANX
// (aluno de 10 anos, 148 cm). São ilustrativos e aparecem marcados como exemplo.
export const chapters = [
  {
    id: "altura",
    index: "01",
    kicker: "Crescimento",
    title: "Altura sem régua, sem toque.",
    text:
      "Um sensor ultrassônico de alta frequência no topo da estação mede a altura sem contato. Cada avaliação vira mais um ponto na curva de crescimento da criança.",
    readouts: [
      { label: "Altura", value: 148.0, decimals: 1, unit: "cm" },
      { label: "Peso", value: 44.2, decimals: 1, unit: "kg" },
    ],
  },
  {
    id: "composicao",
    index: "02",
    kicker: "Composição corporal",
    title: "Uma corrente que ninguém sente.",
    text:
      "Quatro eletrodos de aço inox 304 enviam uma corrente imperceptível, abaixo de 280 µA. A bioimpedância separa gordura, músculo, água, proteína e minerais, com algoritmo próprio para quem ainda está crescendo.",
    readouts: [
      { label: "Gordura", value: 21.3, decimals: 1, unit: "%" },
      { label: "Músculo", value: 52.2, decimals: 1, unit: "%" },
      { label: "IMC", value: 20.2, decimals: 1, unit: "" },
    ],
    legend: [
      { label: "Água", color: "var(--c-water)" },
      { label: "Músculo", color: "var(--c-muscle)" },
      { label: "Gordura", color: "var(--c-fat)" },
      { label: "Minerais", color: "var(--c-mineral)" },
    ],
  },
  {
    id: "postura",
    index: "03",
    kicker: "Postura com IA",
    title: "A câmera vê o que o espelho esconde.",
    text:
      "Visão computacional mapeia ombros, coluna, pelve e joelhos em segundos e aponta sinais de atenção, como ombros desnivelados ou pelve inclinada, para apoiar o encaminhamento.",
    readouts: [
      { label: "Ombros", value: 2.1, decimals: 1, unit: "°" },
      { label: "Pelve", value: 1.4, decimals: 1, unit: "°" },
    ],
  },
  {
    id: "equilibrio",
    index: "04",
    kicker: "Equilíbrio",
    title: "Dez segundos em um pé só.",
    text:
      "A plataforma acompanha a oscilação do centro de pressão em tempo real e transforma o controle corporal em uma pontuação de 0 a 100.",
    readouts: [
      { label: "Equilíbrio", value: 92, decimals: 0, unit: "/100" },
      { label: "Oscilação", value: 0.8, decimals: 1, unit: "cm" },
    ],
  },
];

export const tests = [
  {
    id: "reacao",
    title: "Agilidade e reação",
    text: "Estímulos aleatórios na tela. A resposta é medida em milissegundos.",
  },
  {
    id: "pulmao",
    title: "Capacidade pulmonar",
    text: "Espirômetro com sensor de pressão de alta precisão mede o fôlego.",
  },
  {
    id: "visao",
    title: "Acuidade visual",
    text: "Triagem com o optotipo “E” em quatro direções.",
  },
  {
    id: "crescimento",
    title: "Curva de crescimento",
    text: "Percentis de altura e peso por idade e sexo, com projeção de tendência.",
  },
  {
    id: "corda",
    title: "Pular corda, 1 minuto",
    text: "Corda com Bluetooth conta cada salto e alimenta o relatório.",
    tbc: true,
  },
  {
    id: "indicadores",
    title: "62 indicadores",
    text: "Do peso à taxa metabólica basal, em um único relatório.",
  },
];

export const design = {
  title: "Feita para o pátio.\nDesenhada como objeto.",
  lead:
    "Vidro temperado preto, base em alumínio anodizado e eletrodos em aço inox 304. A estação ocupa pouco espaço e foi pensada para uso intenso, turma após turma.",
  features: [
    { k: "2,10 m", v: "de altura, com dossel de medição ultrassônica" },
    { k: "32″", v: "tela Full HD sensível ao toque, com orientação por voz" },
    { k: "3 módulos", v: "tela, plataforma e dossel, montados no local" },
    { k: "100 mil+", v: "avaliações salvas no próprio equipamento, mesmo sem internet" },
  ],
  exploded: [
    { label: "Dossel ultrassônico", detail: "Mede a altura sem contato." },
    { label: "Torre de vidro temperado", detail: "Tela 32″, câmera com IA e processamento." },
    { label: "Plataforma de bioimpedância", detail: "4 eletrodos em aço inox 304 e sensores de pressão." },
  ],
};

export const report = {
  title: "O resultado não fica na escola.",
  lead:
    "Na tela da estação, impresso em A4 ou direto no celular da família. O relatório sai com o nome e o contato da sua instituição.",
  points: [
    { k: "62", v: "indicadores por avaliação" },
    { k: "A4", v: "impressão direta em rede" },
    { k: "QR", v: "acesso pelo celular" },
  ],
  student: { age: "10 anos", sex: "Masculino", height: "148 cm", weight: "44,2 kg", score: 86 },
  bars: [
    { label: "Peso", value: "44,2 kg", pct: 0.62, tone: "ok" },
    { label: "Gordura", value: "21,3 %", pct: 0.55, tone: "ok" },
    { label: "Músculo", value: "52,2 %", pct: 0.72, tone: "ok" },
    { label: "Água", value: "58,9 %", pct: 0.66, tone: "ok" },
    { label: "Proteína", value: "16,1 %", pct: 0.58, tone: "ok" },
    { label: "IMC", value: "20,2", pct: 0.6, tone: "ok" },
  ],
};

export const management = {
  title: "Dados para decidir.\nNão só para guardar.",
  lead:
    "Cada avaliação alimenta uma base que mostra a saúde da rede por escola, série e turma. É informação para planejar ações de saúde, esporte e alimentação e para prestar contas do programa.",
  benefits: [
    {
      title: "Prevenção com dados",
      text: "Indicadores por escola, série e turma para planejar ações de saúde, esporte e alimentação.",
    },
    {
      title: "Resultados visíveis",
      text: "A evolução dos alunos ano a ano, útil para prestar contas e divulgar o programa.",
    },
    {
      title: "Proximidade com as famílias",
      text: "Cada família recebe um retorno concreto sobre o filho, o que fortalece a confiança na escola e na gestão.",
    },
    {
      title: "Diferencial para escolas particulares",
      text: "Tecnologia de ponta e cuidado visível, que também viram argumento de matrícula e rematrícula.",
    },
  ],
  programs: [
    "Saúde Escolar",
    "Prevenção da Obesidade",
    "Incentivo à Atividade Física",
    "Acompanhamento do Crescimento",
    "Avaliação Postural",
    "Desenvolvimento Motor",
    "Programas Esportivos",
  ],
};

export const audience = {
  title: "Exclusiva para quem cuida de crianças e adolescentes.",
  lead:
    "A Estação de Saúde DANX não é vendida no varejo. A distribuição é exclusiva para instituições que atendem o público infantil e juvenil.",
  segments: [
    {
      title: "Prefeituras e secretarias",
      sub: "Saúde e Educação",
      text:
        "Uma linha de base anual da saúde dos alunos da rede, alinhada aos temas do Programa Saúde na Escola: alimentação saudável, atividade física e saúde ocular.",
    },
    {
      title: "Sistema S",
      sub: "SESI, SESC, Senac e outros",
      text:
        "Avaliação padronizada para programas de esporte, saúde e educação, com histórico de cada participante.",
    },
    {
      title: "Escolas particulares",
      sub: "Ensino infantil, fundamental e médio",
      text:
        "Um cuidado que as famílias enxergam, com relatório individual, acompanhamento anual e a marca da escola no laudo.",
    },
  ],
  exclusive: {
    title: "Um canal. Uma estação.",
    text:
      "A DANX tem a exclusividade de venda deste equipamento no Brasil para o poder público, o Sistema S e escolas particulares.",
  },
};

export const specs = [
  {
    group: "Dimensões e estrutura",
    rows: [
      ["Dimensões (A × P × L)", "2100 × 935 × 480 mm"],
      ["Estrutura", "Vidro temperado preto e alumínio anodizado"],
      ["Eletrodos", "4 placas em aço inox austenítico 304"],
      ["Módulos", "Torre com tela, plataforma de medição e dossel ultrassônico"],
      ["Acessórios", "Espirômetro e bocais descartáveis", true],
    ],
  },
  {
    group: "Tela e sistema",
    rows: [
      ["Tela", "32″ IPS Full HD (1920 × 1080), touch capacitivo"],
      ["Sistema", "Android, com orientação por voz durante o teste"],
      ["Identificação", "Por número de ID"],
    ],
  },
  {
    group: "Medição",
    rows: [
      ["Composição corporal", "Bioimpedância (BIA) multifrequência, 4 eletrodos"],
      ["Altura", "Sensor ultrassônico de alta frequência"],
      ["Capacidade pulmonar", "Sensor de pressão de ar de alta precisão"],
      ["Postura", "Câmera com visão computacional (IA)"],
      ["Faixa de peso", "0 a 160 kg, precisão de 0,1 kg", true],
      ["Faixa de altura", "80 a 200 cm", true],
      ["Faixa etária", "3 a 99 anos"],
      ["Corrente de medição", "< 280 µA"],
    ],
  },
  {
    group: "Dados e conectividade",
    rows: [
      ["Armazenamento local", "Mais de 100.000 registros"],
      ["Nuvem", "Sem limite de registros, com backup automático"],
      ["Conexões", "Wi-Fi 2.4G/5G, LAN, Bluetooth, 2 × USB 2.0"],
      ["Relatório", "Tela, A4 (impressora laser ou jato de tinta), web e celular"],
      ["Personalização", "Nome e contato da instituição no relatório"],
    ],
  },
  {
    group: "Energia e ambiente",
    rows: [
      ["Alimentação", "220 V, 60 W", true],
      ["Temperatura de operação", "10 a 40 °C"],
      ["Umidade", "Até 80%, sem condensação"],
    ],
  },
] as const;

export const pricing = {
  title: "Investimento",
  lead:
    "Preço público, para que gestores encontrem o valor na pesquisa de preços. Emitimos proposta comercial formal para processos de compra.",
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
    { text: "Acesso à plataforma de relatórios", tbc: true },
  ],
};

export const docs = [
  { title: "Ficha técnica", text: "Especificações completas do equipamento.", tbc: true },
  { title: "Proposta comercial modelo", text: "Base para o processo de compra.", tbc: true },
  { title: "Declaração de exclusividade", text: "Documento do canal exclusivo de venda.", tbc: true },
  { title: "Registros e certificações", text: "ANVISA, INMETRO e demais documentos aplicáveis.", tbc: true },
];

export const faq = [
  {
    q: "A estação faz diagnóstico?",
    a: "Não. A Estação de Saúde DANX faz triagem e avaliação: identifica sinais de atenção e apoia o encaminhamento para profissionais de saúde. O diagnóstico é sempre de um profissional habilitado.",
  },
  {
    q: "Para qual faixa etária ela serve?",
    a: "O algoritmo foi desenvolvido para crianças e adolescentes, com curvas de crescimento por idade e sexo. O equipamento opera de 3 a 99 anos, então também pode avaliar professores e equipe.",
  },
  {
    q: "Precisa de internet para funcionar?",
    a: "Não. As avaliações ficam salvas no próprio equipamento, com capacidade para mais de 100 mil registros, e sobem para a nuvem quando a conexão volta.",
  },
  {
    q: "Como ficam os dados das crianças (LGPD)?",
    a: "Os dados são armazenados com criptografia e acesso por permissão. A política de consentimento dos responsáveis e o tratamento de dados de crianças, conforme o art. 14 da LGPD, serão detalhados aqui.",
    tbc: true,
  },
  {
    q: "Como uma prefeitura pode comprar?",
    a: "O preço é público e emitimos proposta comercial formal para processos de compra. A modalidade adequada e a documentação de exclusividade devem ser confirmadas com o jurídico de cada órgão.",
    tbc: true,
  },
  {
    q: "Como é a instalação?",
    a: "A estação chega desmontada (torre com tela, plataforma de medição e dossel ultrassônico) e é montada no local. Acompanham espirômetro e bocais descartáveis. Prazo de entrega e treinamento da equipe serão informados na proposta.",
    tbc: true,
  },
  {
    q: "Qual é a garantia e como funciona a manutenção?",
    a: "Garantia, assistência técnica e manutenção preventiva serão detalhadas aqui.",
    tbc: true,
  },
];

export const quote = {
  title: "Leve a DANX para a sua rede.",
  lead: "Receba o valor, as condições e uma proposta formal. Respondemos em até 1 dia útil.",
  leadTbc: true,
  types: [
    "Prefeitura / Secretaria de Saúde",
    "Prefeitura / Secretaria de Educação",
    "Sistema S",
    "Escola particular",
    "Outro",
  ],
};
