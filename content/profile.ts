/**
 * Dados pessoais e de posicionamento.
 * Fontes: currículo (PDF) e perfil do LinkedIn — nada aqui é inventado.
 */

export const profile = {
  firstName: 'Marcelo',
  lastName: 'Aguilar',
  name: 'Marcelo Aguilar',
  role: 'Estudante de Engenharia de Software',
  school: 'Inteli',
  schoolFull: 'Inteli — Instituto de Tecnologia e Liderança',
  classOf: 2029,
  location: 'São Paulo, SP',
  status: 'Em busca de estágio',
  /** Tradução direta da abertura do "Sobre" do LinkedIn. */
  positioning: 'Movido pela curiosidade e pela vontade de entender como as coisas funcionam.',
  email: 'marceloaguilargta@gmail.com',
  links: {
    linkedin: 'https://www.linkedin.com/in/marcelo-aguilar-/',
    github: 'https://github.com/marcelo-aguilar',
  },
  /**
   * Opcional: caminho de um PDF do currículo dentro de /public (ex.: "curriculo.pdf").
   * Fica vazio de propósito — o PDF atual contém telefone pessoal.
   */
  resumeUrl: '',
} as const

export const about = {
  statement:
    'Sempre fui movido pela curiosidade e pela vontade de entender como as coisas funcionam. Gosto de desafios, de resolver problemas e, acima de tudo, de aprender coisas novas.',
  paragraphs: [
    'Sou apaixonado por tecnologia, programação, computadores, games e por tudo que combina lógica e criatividade.',
    'Hoje exploro áreas diferentes, como desenvolvimento de software e sistemas, análise de dados e cibersegurança. Quero construir uma base sólida enquanto descubro os caminhos com que mais me identifico.',
    'Valorizo trabalho em equipe e liderança. Gosto de estar perto de pessoas dedicadas, de contribuir com quem está ao meu redor e acredito que a tecnologia pode ser uma ferramenta de impacto positivo.',
  ],
  photoCaption: 'Apresentando um pitch.',
  facts: [
    { term: 'Formação', detail: 'Engenharia de Software no Inteli, de 2026 a 2029' },
    { term: 'Onde estou', detail: 'São Paulo, SP' },
    { term: 'Objetivo', detail: 'Estágio em engenharia de software e áreas similares' },
    { term: 'Idiomas', detail: 'Português nativo, inglês avançado e espanhol intermediário' },
  ],
  numbers: [
    { value: 3, suffix: '', label: 'projetos entregues a parceiros reais: Unifesp, Red Bull e Cocamar' },
    { value: 30, suffix: '', label: 'semanas de desenvolvimento em equipe, dez por projeto' },
    { value: 65, suffix: ' mil', label: 'pedidos de diesel analisados para treinar o PrediDiesel' },
    { value: 100, suffix: '%', label: 'de bolsa no Inteli e no Colégio Embraer' },
  ],
} as const

export const contact = {
  heading: 'Vamos conversar?',
  lead: 'Estou em busca de um estágio em engenharia de software e áreas similares. Se o meu trabalho fez sentido para o seu time, me escreva.',
} as const

export const sections = [
  { id: 'sobre', label: 'Sobre' },
  { id: 'projetos', label: 'Projetos' },
  { id: 'habilidades', label: 'Habilidades' },
  { id: 'trajetoria', label: 'Trajetória' },
  { id: 'contato', label: 'Contato' },
] as const

export type SectionId = (typeof sections)[number]['id']
