/**
 * Projetos acadêmicos com parceiros reais (Inteli, 2026).
 * Textos derivados do currículo e das publicações do próprio Marcelo no LinkedIn.
 * Ordem: do mais recente para o mais antigo, como no currículo.
 */
import predidieselShot from '../assets/projects/predidiesel.webp'
import staminaShot from '../assets/projects/stamina.webp'
import timerushShot from '../assets/projects/timerush.webp'

export interface ProjectLink {
  label: string
  href: string
}

export interface Project {
  id: string
  /** Módulo do curso em que o projeto foi desenvolvido (sequência real). */
  module: number
  period: string
  partner: string
  title: string
  kind: string
  summary: string
  challenge: string
  solution: string
  /** O que o Marcelo fez no projeto. */
  role: string[]
  /** Resultados ou recursos de destaque. */
  highlights: string[]
  /** Aprendizado, nas palavras dele. */
  lesson: string
  stack: string[]
  team?: string
  links: ProjectLink[]
  image: string
  imageAlt: string
}

export const projects: Project[] = [
  {
    id: 'predidiesel',
    module: 3,
    period: 'Ago – out 2026',
    partner: 'Cocamar Cooperativa Agroindustrial',
    title: 'PrediDiesel',
    kind: 'Modelo preditivo de machine learning',
    summary:
      'Modelo que estima quando cada cooperado fará o próximo pedido de óleo diesel e qual será o volume. Com as previsões, a equipe comercial recebe uma lista de prioridade e procura o cooperado antes que o pedido vire emergência.',
    challenge:
      'A Cocamar reúne cerca de 20 mil cooperados e 122 unidades em cinco estados. Grande parte deles só pede diesel quando o tanque está quase vazio, o que gera picos de demanda, pedidos emergenciais, atrasos nas entregas e vendas perdidas.',
    solution:
      'A partir de mais de 65 mil pedidos, a solução faz duas previsões para cada cooperado: quando ele deve pedir de novo (em faixas de até 7 dias, de 8 a 15, de 16 a 30 ou mais de 30 dias) e quanto deve pedir. O projeto seguiu a metodologia CRISP-DM, comparou cinco modelos candidatos para cada previsão, usou divisão cronológica dos dados para simular o uso real e trabalhou com bases pseudonimizadas, seguindo a LGPD. Tudo fica disponível em uma interface web que gera a lista direto das bases da cooperativa.',
    role: [
      'Pré-processamento das bases de dados da cooperativa',
      'Treino, ajuste e avaliação de modelos (Gradient Boosting, Extra Trees e NuSVR) com Python e scikit-learn',
      'Ajustes no front-end e publicação da interface na web',
      'Documentação e análises de negócio, como SWOT e Canvas de Proposta de Valor',
    ],
    highlights: [
      'Gradient Boosting para prever quando: quase dobrou o F1-macro em relação a uma escolha aleatória',
      'Random Forest para prever quanto: erro médio 49% menor que o de um modelo de referência simples',
    ],
    lesson: 'Um bom modelo também precisa deixar claro até onde vai.',
    stack: ['Python', 'Pandas', 'Scikit-learn', 'Jupyter', 'CRISP-DM'],
    team: 'Preditivos',
    links: [
      { label: 'Abrir aplicação', href: 'https://g04-e862d3.pages.git.inteli.edu.br/' },
      { label: 'Ver apresentação', href: 'https://pitch-predidiesel.vercel.app/' },
    ],
    image: predidieselShot,
    imageAlt:
      'Tela do PrediDiesel com a lista de cooperados para contatar na semana e gráficos de litros previstos.',
  },
  {
    id: 'stamina',
    module: 2,
    period: 'Abr – jun 2026',
    partner: 'Red Bull',
    title: 'Stamina',
    kind: 'Aplicação web para o Red Bull 24 Horas',
    summary:
      'Aplicação que substitui as pranchetas dos fiscais do Red Bull 24 Horas. Registra turnos, checkpoints e quilometragem em tablets e consolida o placar das equipes quase em tempo real.',
    challenge:
      'Duas equipes de até 16 corredores se revezam em esteiras por 24 horas. Os fiscais anotavam em pranchetas o início de cada turno, os checkpoints a cada 30 minutos e a quilometragem do painel, e depois passavam tudo para planilhas. Com trocas rápidas e muito cansaço, uma anotação errada podia comprometer o resultado, e as esteiras não enviam os dados automaticamente.',
    solution:
      'Um sistema pensado para tablets: os horários são registrados automaticamente, quilometragens inválidas ou menores que o registro anterior são bloqueadas e tudo fica em um histórico auditável. Há placar quase em tempo real, modo TV para o público, fluxos específicos para fiscais, capitães e gestores e sincronização offline, para que os registros continuem seguros se a conexão cair.',
    role: [
      'Back-end com Node.js e TypeScript',
      'Integração com Supabase e PostgreSQL',
      'Telas usadas pelos fiscais',
      'Testes automatizados com Jest',
      'Documentação do WAD (Web Application Document)',
    ],
    highlights: [
      'Bloqueio de quilometragens inválidas no momento do registro',
      'Sincronização offline e histórico auditável',
      'Placar quase em tempo real, com modo TV para o público',
    ],
    lesson: 'Boa tecnologia precisa respeitar o contexto em que será utilizada.',
    stack: ['Node.js', 'TypeScript', 'Supabase', 'PostgreSQL', 'Jest', 'Bootstrap'],
    team: 'Overclockers',
    links: [{ label: 'Abrir aplicação', href: 'https://inteli-stamina.vercel.app/' }],
    image: staminaShot,
    imageAlt: 'Tela inicial do Stamina com o total de quilômetros e o tempo restante da prova.',
  },
  {
    id: 'timerush',
    module: 1,
    period: 'Fev – abr 2026',
    partner: 'Unifesp',
    title: 'TimeRush',
    kind: 'Jogo educativo acessível',
    summary:
      'Quiz de História para estudantes do Ensino Médio com baixa visão e limitações motoras, jogável com eye tracker: uma tecnologia que permite controlar o computador apenas com o movimento dos olhos.',
    challenge:
      'Para muitos desses alunos, um texto longo de História é um obstáculo físico e cansativo, e não um desafio intelectual. O próprio material de estudo vira a maior barreira para aprender.',
    solution:
      'O TimeRush transforma o conteúdo em uma linha do tempo interativa, com quizzes curtos, alto contraste, fontes ajustáveis, temas para daltonismo e feedback visual e sonoro a cada ação. Nos testes com o eye tracker, ajustar a fonte em incrementos de 10% se mostrou exaustivo para quem usa os olhos como cursor, e o recurso foi repensado.',
    role: [
      'Desenvolvimento geral das cenas com Phaser',
      'Lógica de navegação e sistema de progressão',
      'Configurações de acessibilidade',
      'Documentação do GDD (Game Design Document)',
    ],
    highlights: [
      'Jogável apenas com o movimento dos olhos',
      'Alto contraste, fontes ajustáveis e temas para daltonismo',
      'MVP funcional entregue em dez semanas',
    ],
    lesson: 'Acessibilidade não se acrescenta no fim: ela precisa estar presente em cada decisão do projeto.',
    stack: ['JavaScript', 'Phaser', 'HTML', 'CSS'],
    links: [{ label: 'Jogar', href: 'https://graduacao.pages.git.inteli.edu.br/2026-1a/t27/g05/' }],
    image: timerushShot,
    imageAlt: 'Tela inicial do jogo TimeRush, com o mascote coelho dentro de um relógio.',
  },
]
