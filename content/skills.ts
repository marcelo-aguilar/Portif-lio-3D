/**
 * Habilidades agrupadas por domínio.
 * Fonte: seção "Conhecimentos" do currículo + tecnologias usadas nos projetos.
 */

export interface SkillGroup {
  id: string
  name: string
  note: string
  items: string[]
}

export const skillGroups: SkillGroup[] = [
  {
    id: 'interface',
    name: 'Interface',
    note: 'O que o usuário vê e toca.',
    items: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Tailwind', 'Bootstrap', 'Phaser', 'Figma'],
  },
  {
    id: 'sistemas',
    name: 'Sistemas',
    note: 'Regras, dados e testes por trás da tela.',
    items: ['Node.js', 'SQL', 'PostgreSQL', 'Supabase', 'MongoDB', 'Jest', 'C/C++'],
  },
  {
    id: 'dados',
    name: 'Dados e ML',
    note: 'Da base bruta à previsão.',
    items: ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'Jupyter'],
  },
  {
    id: 'base',
    name: 'Base',
    note: 'O que sustenta o trabalho em equipe.',
    items: ['Git e GitHub', 'Linux', 'Métodos ágeis'],
  },
]

export const languages = [
  { name: 'Português', level: 'Nativo' },
  { name: 'Inglês', level: 'Avançado' },
  { name: 'Espanhol', level: 'Intermediário' },
] as const
