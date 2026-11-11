/**
 * Linha do tempo: formação, méritos e projetos.
 * Fonte: currículo (formação acadêmica, prêmios e méritos, projetos acadêmicos).
 */

export interface JourneyEntry {
  when: string
  title: string
  place?: string
  detail: string
  /** Prêmios e bolsas recebem destaque visual. */
  merit?: boolean
  /** Marcos dentro de um período (ex.: módulos do Inteli). */
  steps?: { when: string; text: string }[]
}

export const journey: JourneyEntry[] = [
  {
    when: '2022',
    title: 'Medalha de prata na 16ª OBMEP',
    place: 'Olimpíada Brasileira de Matemática das Escolas Públicas',
    detail: 'A medalha veio acompanhada de uma bolsa de estudos do CNPq.',
    merit: true,
  },
  {
    when: '2023 – 2025',
    title: 'Ensino Médio no Colégio Embraer Juarez Wanderley',
    place: 'São José dos Campos, SP',
    detail: 'Cursado com bolsa de 100%.',
    merit: true,
  },
  {
    when: '2026',
    title: 'Engenharia de Software no Inteli',
    place: 'Instituto de Tecnologia e Liderança, São Paulo',
    detail:
      'Graduação com metodologia baseada em projetos, cursada com bolsa de 100%. A cada módulo, dez semanas para resolver o problema de um parceiro real.',
    merit: true,
    steps: [
      { when: 'Fev – abr', text: 'Módulo 1: TimeRush, jogo acessível com a Unifesp' },
      { when: 'Abr – jun', text: 'Módulo 2: Stamina, aplicação web com a Red Bull' },
      { when: 'Ago – out', text: 'Módulo 3: PrediDiesel, modelo preditivo com a Cocamar' },
    ],
  },
  {
    when: 'Agora',
    title: 'Em busca de estágio',
    detail:
      'Quero colocar em prática o que aprendi, participar de projetos e ganhar experiência profissional que me faça crescer técnica e pessoalmente.',
  },
  {
    when: '2029',
    title: 'Conclusão prevista da graduação',
    detail: 'Engenharia de Software, Inteli.',
  },
]
