export type ReportDimensionId =
  "musical-development" | "learning-process" | "personal-development" | "family-support";

export interface ReportFormulationOption {
  id: string;
  label: string;
  summary: string;
  text: string;
}

export interface ReportTopic {
  id: string;
  title: string;
  options: ReportFormulationOption[];
}

export interface ReportDimension {
  id: ReportDimensionId;
  title: string;
  topics: ReportTopic[];
}

export const REPORT_FORMULATIONS: ReportDimension[] = [
  {
    id: "musical-development",
    title: "Desenvolvimento musical e instrumental",
    topics: [
      {
        id: "musical-reading",
        title: "Leitura e compreensão musical",
        options: [
          {
            id: "musical-reading-developing",
            label: "A desenvolver",
            summary: "Ganhar segurança na leitura e compreender melhor a música trabalhada.",
            text: "Poderá desenvolver maior segurança na leitura musical, de modo a compreender e executar com mais facilidade as peças trabalhadas nas aulas.",
          },
          {
            id: "musical-reading-recent",
            label: "Conquista recente",
            summary: "Maior segurança e facilidade na leitura do repertório.",
            text: "Tem vindo a ganhar segurança na leitura musical, conseguindo compreender e executar com maior facilidade o repertório trabalhado.",
          },
          {
            id: "musical-reading-consistent",
            label: "Consistência",
            summary: "Boa leitura e compreensão, com segurança e autonomia.",
            text: "Demonstra uma boa capacidade de leitura e compreensão musical, que lhe permite abordar o repertório com segurança e autonomia.",
          },
        ],
      },
      {
        id: "repertoire",
        title: "Aprendizagem e domínio do repertório",
        options: [
          {
            id: "repertoire-developing",
            label: "A desenvolver",
            summary: "Consolidar melhor as peças e tocar com mais segurança e continuidade.",
            text: "Poderá consolidar melhor as peças e os estudos trabalhados, procurando tocar com maior segurança e continuidade.",
          },
          {
            id: "repertoire-recent",
            label: "Conquista recente",
            summary: "Progressos na aprendizagem e consolidação das peças.",
            text: "Tem vindo a aprender e a consolidar o repertório com maior segurança, revelando progressos na execução das peças trabalhadas.",
          },
          {
            id: "repertoire-consistent",
            label: "Consistência",
            summary: "Aprendizagem consistente e execução segura e fluida.",
            text: "Tem demonstrado consistência na aprendizagem e consolidação do repertório, conseguindo executar as peças trabalhadas com segurança e fluidez.",
          },
        ],
      },
      {
        id: "instrumental-technique",
        title: "Técnica instrumental",
        options: [
          {
            id: "instrumental-technique-developing",
            label: "A desenvolver",
            summary: "Desenvolver o controlo do instrumento, a facilidade e a qualidade sonora.",
            text: "Poderá continuar a desenvolver o controlo do instrumento, procurando tocar com maior facilidade, segurança e qualidade sonora.",
          },
          {
            id: "instrumental-technique-recent",
            label: "Conquista recente",
            summary: "Maior controlo, facilidade e segurança ao tocar.",
            text: "Tem vindo a demonstrar maior controlo do instrumento, o que lhe permite executar o repertório com mais facilidade e segurança.",
          },
          {
            id: "instrumental-technique-consistent",
            label: "Consistência",
            summary: "Bom domínio instrumental e qualidade sonora consistente.",
            text: "Demonstra um bom domínio do instrumento, tocando com controlo, segurança e uma qualidade sonora consistente.",
          },
        ],
      },
      {
        id: "interpretation",
        title: "Interpretação e expressividade",
        options: [
          {
            id: "interpretation-developing",
            label: "A desenvolver",
            summary: "Explorar melhor o carácter das peças e dar-lhes mais expressão.",
            text: "Poderá explorar melhor o carácter das peças que toca, procurando dar-lhes mais expressão e transmitir aquilo que a música sugere.",
          },
          {
            id: "interpretation-recent",
            label: "Conquista recente",
            summary: "Maior atenção ao carácter e à expressão musical.",
            text: "Tem vindo a dar mais expressão às peças que toca, mostrando uma maior atenção ao seu carácter e às possibilidades de as interpretar musicalmente.",
          },
          {
            id: "interpretation-consistent",
            label: "Consistência",
            summary: "Interpretar com sensibilidade e transmitir o carácter da música.",
            text: "Interpreta as peças com sensibilidade, compreendendo bem o seu carácter e conseguindo transmitir essa compreensão através da música.",
          },
        ],
      },
      {
        id: "musical-creativity",
        title: "Criatividade e iniciativa musical",
        options: [
          {
            id: "musical-creativity-developing",
            label: "A desenvolver",
            summary:
              "Explorar sons, experimentar ideias próprias e desenvolver confiança para criar.",
            text: "Poderá explorar mais as possibilidades sonoras da guitarra e experimentar as suas próprias ideias musicais, desenvolvendo gradualmente a confiança para criar e fazer escolhas.",
          },
          {
            id: "musical-creativity-recent",
            label: "Conquista recente",
            summary: "Maior iniciativa e disponibilidade para experimentar.",
            text: "Tem vindo a mostrar maior iniciativa na exploração de ideias musicais, revelando crescente disponibilidade para experimentar e descobrir novas possibilidades.",
          },
          {
            id: "musical-creativity-consistent",
            label: "Consistência",
            summary: "Curiosidade, iniciativa e expressão de ideias musicais próprias.",
            text: "Demonstra curiosidade e iniciativa na exploração musical, experimentando ideias próprias e encontrando formas pessoais de se expressar através da guitarra.",
          },
        ],
      },
    ],
  },

  {
    id: "learning-process",
    title: "Processo de aprendizagem e autonomia",
    topics: [
      {
        id: "practice-regularity",
        title: "Regularidade do estudo",
        options: [
          {
            id: "practice-regularity-developing",
            label: "A desenvolver",
            summary: "Ganhar regularidade na prática em casa.",
            text: "Poderá ganhar maior regularidade no estudo em casa, para conseguir consolidar melhor o trabalho das aulas e continuar a progredir.",
          },
          {
            id: "practice-regularity-recent",
            label: "Conquista recente",
            summary: "Estudo mais regular, com reflexos na consolidação do trabalho.",
            text: "Tem estudado com maior regularidade, o que já se começa a notar na forma como consolida o trabalho realizado nas aulas.",
          },
          {
            id: "practice-regularity-consistent",
            label: "Consistência",
            summary: "Boa rotina de estudo que favorece o progresso.",
            text: "Tem mantido uma boa rotina de estudo, que lhe permite consolidar o que aprende nas aulas e avançar com segurança.",
          },
        ],
      },
      {
        id: "practice-organization",
        title: "Organização do estudo",
        options: [
          {
            id: "practice-organization-developing",
            label: "A desenvolver",
            summary: "Organizar melhor o tempo e distribuir as tarefas.",
            text: "Poderá organizar melhor o tempo de estudo e distribuir o trabalho ao longo da semana, para aproveitar melhor os momentos de prática.",
          },
          {
            id: "practice-organization-recent",
            label: "Conquista recente",
            summary: "Melhor organização e aproveitamento do tempo de prática.",
            text: "Tem vindo a organizar melhor o estudo, conseguindo distribuir o trabalho com maior cuidado e aproveitar melhor o tempo de prática.",
          },
          {
            id: "practice-organization-consistent",
            label: "Consistência",
            summary: "Organização cuidada e eficaz do trabalho.",
            text: "Organiza o estudo de forma cuidada e eficaz, distribuindo o trabalho de modo a conseguir preparar e consolidar as tarefas propostas.",
          },
        ],
      },
      {
        id: "work-consolidation",
        title: "Preparação e consolidação do trabalho",
        options: [
          {
            id: "work-consolidation-developing",
            label: "A desenvolver",
            summary: "Preparar com maior continuidade o trabalho entre aulas.",
            text: "Poderá preparar com maior continuidade o trabalho proposto nas aulas, para chegar à aula seguinte com as peças e os exercícios mais consolidados.",
          },
          {
            id: "work-consolidation-recent",
            label: "Conquista recente",
            summary: "Progressos na preparação e consolidação do repertório.",
            text: "Tem vindo a preparar melhor o trabalho entre aulas, revelando progressos na consolidação das peças e dos exercícios estudados.",
          },
          {
            id: "work-consolidation-consistent",
            label: "Consistência",
            summary: "Trabalho habitualmente bem preparado e consolidado.",
            text: "Apresenta habitualmente o trabalho bem preparado e consegue consolidar de forma consistente o que é desenvolvido nas aulas.",
          },
        ],
      },
      {
        id: "learning-strategies",
        title: "Estratégias de aprendizagem",
        options: [
          {
            id: "learning-strategies-developing",
            label: "A desenvolver",
            summary: "Experimentar formas mais eficazes de estudar por etapas.",
            text: "Poderá experimentar formas mais eficazes de estudar, dividindo as passagens mais difíceis em partes pequenas e trabalhando-as com calma antes de as tocar por inteiro.",
          },
          {
            id: "learning-strategies-recent",
            label: "Conquista recente",
            summary: "Maior utilização de estratégias para ultrapassar dificuldades.",
            text: "Tem vindo a utilizar estratégias de estudo mais eficazes, procurando trabalhar as dificuldades por etapas e encontrar formas de as ultrapassar.",
          },
          {
            id: "learning-strategies-consistent",
            label: "Consistência",
            summary: "Escolher estratégias adequadas e organizar o trabalho por etapas.",
            text: "Utiliza estratégias de estudo adequadas às dificuldades que encontra, organizando o trabalho por etapas e procurando soluções que lhe permitem progredir.",
          },
        ],
      },
      {
        id: "error-correction",
        title: "Identificação e correção de erros",
        options: [
          {
            id: "error-correction-developing",
            label: "A desenvolver",
            summary: "Reconhecer melhor o que precisa de ser corrigido.",
            text: "Poderá desenvolver a capacidade de reconhecer os aspetos que precisam de ser corrigidos e de trabalhar sobre eles com atenção, em vez de repetir sempre a peça do início ao fim.",
          },
          {
            id: "error-correction-recent",
            label: "Conquista recente",
            summary: "Identificar e corrigir erros com maior consciência.",
            text: "Tem vindo a reconhecer com maior facilidade os erros e as dificuldades, começando a corrigi-los de forma mais consciente durante o estudo.",
          },
          {
            id: "error-correction-consistent",
            label: "Consistência",
            summary: "Identificar dificuldades e procurar resolvê-las eficazmente.",
            text: "Consegue identificar muitas das dificuldades que surgem no seu trabalho e procura corrigi-las de forma atenta e eficaz.",
          },
        ],
      },
      {
        id: "guidance-application",
        title: "Aplicação das orientações",
        options: [
          {
            id: "guidance-application-developing",
            label: "A desenvolver",
            summary: "Aplicar com maior atenção as orientações das aulas.",
            text: "Poderá dar mais atenção às orientações trabalhadas nas aulas e procurar aplicá-las durante o estudo em casa, para tirar maior partido do trabalho realizado em conjunto.",
          },
          {
            id: "guidance-application-recent",
            label: "Conquista recente",
            summary: "Aplicar as orientações com maior regularidade.",
            text: "Tem vindo a aplicar com maior regularidade as orientações dadas nas aulas, o que tem ajudado a melhorar e consolidar o trabalho individual.",
          },
          {
            id: "guidance-application-consistent",
            label: "Consistência",
            summary: "Integrar consistentemente as orientações no estudo.",
            text: "Compreende e aplica de forma consistente as orientações trabalhadas nas aulas, integrando-as no seu estudo e na execução do repertório.",
          },
        ],
      },
      {
        id: "autonomy",
        title: "Autonomia",
        options: [
          {
            id: "autonomy-developing",
            label: "A desenvolver",
            summary: "Assumir maior iniciativa e orientar melhor o próprio estudo.",
            text: "Poderá desenvolver maior autonomia no estudo, procurando começar as tarefas, identificar as dificuldades e decidir como trabalhar antes de pedir ajuda.",
          },
          {
            id: "autonomy-recent",
            label: "Conquista recente",
            summary: "Resolver algumas dificuldades com menos orientação.",
            text: "Tem vindo a ganhar autonomia no estudo, conseguindo resolver algumas dificuldades por si e necessitando de menos orientação em tarefas já conhecidas.",
          },
          {
            id: "autonomy-consistent",
            label: "Consistência",
            summary: "Organizar o trabalho e procurar soluções autonomamente.",
            text: "Demonstra uma boa autonomia no estudo, conseguindo organizar o trabalho, reconhecer dificuldades e procurar formas de as resolver.",
          },
        ],
      },
      {
        id: "challenge-attitude",
        title: "Atitude perante os desafios",
        options: [
          {
            id: "challenge-attitude-developing",
            label: "A desenvolver",
            summary: "Desenvolver persistência e experimentar formas de ultrapassar dificuldades.",
            text: "Poderá desenvolver maior persistência quando encontra dificuldades, procurando encarar os erros como parte da aprendizagem e experimentar diferentes formas de os ultrapassar.",
          },
          {
            id: "challenge-attitude-recent",
            label: "Conquista recente",
            summary: "Maior disponibilidade para enfrentar dificuldades e experimentar soluções.",
            text: "Tem mostrado maior disponibilidade para enfrentar as dificuldades e experimentar outras soluções, revelando progressos na forma como lida com os desafios.",
          },
          {
            id: "challenge-attitude-consistent",
            label: "Consistência",
            summary: "Enfrentar desafios com persistência e vontade de aprender.",
            text: "Enfrenta as dificuldades com persistência e vontade de aprender, procurando compreender os erros e melhorar a partir das orientações dadas nas aulas.",
          },
        ],
      },
      {
        id: "motivation",
        title: "Motivação e envolvimento",
        options: [
          {
            id: "motivation-developing",
            label: "A desenvolver",
            summary: "Participar com maior iniciativa e curiosidade.",
            text: "Poderá envolver-se mais nas atividades propostas e tomar maior iniciativa durante as aulas, explorando com curiosidade as possibilidades de aprender e fazer música.",
          },
          {
            id: "motivation-recent",
            label: "Conquista recente",
            summary: "Interesse crescente e participação mais ativa.",
            text: "Tem demonstrado um interesse crescente nas atividades das aulas, participando com maior iniciativa e mostrando mais curiosidade pelo trabalho musical.",
          },
          {
            id: "motivation-consistent",
            label: "Consistência",
            summary: "Interesse, curiosidade e envolvimento consistentes.",
            text: "Participa nas aulas com interesse e curiosidade, mostrando iniciativa e um envolvimento consistente nas atividades musicais.",
          },
        ],
      },
    ],
  },

  {
    id: "personal-development",
    title: "Desenvolvimento pessoal e relação com a aprendizagem",
    topics: [
      {
        id: "classroom-behaviour",
        title: "Comportamento nas aulas",
        options: [
          {
            id: "classroom-behaviour-developing",
            label: "A desenvolver",
            summary: "Escutar com atenção e contribuir positivamente para o ambiente de aula.",
            text: "Pode melhorar a sua atitude nas aulas, procurando escutar com atenção, respeitar os momentos de trabalho e participar de forma adequada nas atividades propostas.",
          },
          {
            id: "classroom-behaviour-recent",
            label: "Conquista recente",
            summary: "Atitude mais adequada e participação mais atenta.",
            text: "Tem vindo a melhorar a sua atitude nas aulas, revelando progressos na escuta, no respeito pelos momentos de trabalho e na participação nas atividades propostas.",
          },
          {
            id: "classroom-behaviour-consistent",
            label: "Consistência",
            summary: "Atitude respeitadora e colaborativa.",
            text: "Mantém uma atitude respeitadora e colaborativa nas aulas, contribuindo para um ambiente favorável à aprendizagem e à prática musical.",
          },
        ],
      },
      {
        id: "attendance",
        title: "Pontualidade e assiduidade",
        options: [
          {
            id: "attendance-developing",
            label: "A desenvolver",
            summary: "Maior regularidade na presença e pontualidade.",
            text: "Uma maior regularidade na presença e na pontualidade poderá favorecer a continuidade do trabalho e o aproveitamento das aulas.",
          },
          {
            id: "attendance-recent",
            label: "Conquista recente",
            summary: "Presença mais regular e maior pontualidade.",
            text: "Tem vindo a manter uma presença mais regular e a chegar mais pontualmente às aulas, favorecendo a continuidade do trabalho.",
          },
          {
            id: "attendance-consistent",
            label: "Consistência",
            summary: "Presença regular e pontualidade habitual.",
            text: "Mantém uma presença regular e é habitualmente pontual, o que contribui para a continuidade e o bom aproveitamento das aulas.",
          },
        ],
      },
      {
        id: "self-confidence",
        title: "Autoconfiança",
        options: [
          {
            id: "self-confidence-developing",
            label: "A desenvolver",
            summary: "Ganhar confiança para tocar, experimentar e mostrar o trabalho.",
            text: "Poderá ganhar maior confiança nas suas capacidades, sentindo-se mais à vontade para tocar, experimentar e mostrar o trabalho realizado, mesmo quando surgem dificuldades.",
          },
          {
            id: "self-confidence-recent",
            label: "Conquista recente",
            summary: "Maior confiança e disponibilidade para experimentar.",
            text: "Tem vindo a demonstrar maior confiança ao tocar e a partilhar o seu trabalho, mostrando-se mais disponível para experimentar e enfrentar desafios.",
          },
          {
            id: "self-confidence-consistent",
            label: "Consistência",
            summary: "Tocar com confiança e continuar disponível para aprender.",
            text: "Demonstra confiança nas suas capacidades e enfrenta as atividades musicais com segurança, mantendo-se disponível para aprender e experimentar.",
          },
        ],
      },
      {
        id: "materials-care",
        title: "Preparação e cuidado com o material",
        options: [
          {
            id: "materials-care-developing",
            label: "A desenvolver",
            summary: "Preparar e cuidar melhor do material necessário.",
            text: "Poderá dar maior atenção à preparação e ao cuidado com o material necessário para as aulas, de modo a estar mais disponível para o trabalho musical.",
          },
          {
            id: "materials-care-recent",
            label: "Conquista recente",
            summary: "Maior cuidado na preparação e utilização do material.",
            text: "Tem vindo a revelar maior cuidado na preparação e na utilização do material necessário para as aulas.",
          },
          {
            id: "materials-care-consistent",
            label: "Consistência",
            summary: "Trazer o material necessário e cuidar dele.",
            text: "Traz habitualmente o material necessário e demonstra cuidado com o instrumento e os restantes recursos utilizados nas aulas.",
          },
        ],
      },
      {
        id: "relationship-with-music",
        title: "Relação com a música",
        options: [
          {
            id: "relationship-with-music-developing",
            label: "A desenvolver",
            summary: "Descobrir repertório e atividades que despertem curiosidade.",
            text: "Poderá explorar diferentes formas de se relacionar com a música, descobrindo repertório, sonoridades e atividades que despertem a sua curiosidade e interesse.",
          },
          {
            id: "relationship-with-music-recent",
            label: "Conquista recente",
            summary: "Interesse e curiosidade crescentes pelas experiências musicais.",
            text: "Tem vindo a demonstrar maior curiosidade e interesse pelas experiências musicais, mostrando-se mais disponível para descobrir repertório e explorar novas possibilidades.",
          },
          {
            id: "relationship-with-music-consistent",
            label: "Consistência",
            summary: "Interesse e disponibilidade consistentes para explorar música.",
            text: "Revela interesse pela música e disponibilidade para descobrir repertório e explorar diferentes possibilidades musicais, enriquecendo a sua experiência de aprendizagem.",
          },
        ],
      },
    ],
  },

  {
    id: "family-support",
    title: "Contexto de apoio e colaboração com a família",
    topics: [
      {
        id: "home-practice-support",
        title: "Acompanhamento do estudo em casa",
        options: [
          {
            id: "home-practice-support-under-10",
            label: "Até aos 10 anos",
            summary: "Criar uma rotina de estudo e valorizar o esforço.",
            text: "Nesta fase, a ajuda da família é importante para criar uma rotina de estudo. Reservar um momento regular para a guitarra, ouvir o aluno tocar e valorizar os seus progressos, sem o corrigir constantemente, pode contribuir muito para a sua aprendizagem.",
          },
          {
            id: "home-practice-support-11-14",
            label: "Dos 11 aos 14 anos",
            summary: "Facilitar o acesso à guitarra e aproveitar momentos livres.",
            text: "Ter a guitarra acessível e pronta a tocar pode facilitar a criação de hábitos de prática e permitir aproveitar pequenos momentos livres para tocar ou explorar música. O incentivo da família e o reconhecimento dos progressos continuam a ser importantes, sem necessidade de assumir um papel de professor.",
          },
          {
            id: "home-practice-support-15-plus",
            label: "A partir dos 15 anos",
            summary: "Reforçar a autonomia e a continuidade da aprendizagem.",
            text: "À medida que cresce a autonomia do aluno, torna-se importante que a aprendizagem continue para além da aula. A prática regular em casa permite desenvolver e consolidar o trabalho realizado com o professor, aprofundando progressivamente a relação com o instrumento.",
          },
        ],
      },
      {
        id: "practice-conditions",
        title: "Condições para o estudo",
        options: [
          {
            id: "practice-conditions-time",
            label: "Tempo",
            summary: "Reservar momentos para praticar.",
            text: "Sempre que possível, reservar momentos para a prática ao longo da semana poderá ajudar a dar continuidade ao trabalho realizado nas aulas.",
          },
          {
            id: "practice-conditions-space",
            label: "Espaço e acessibilidade",
            summary: "Criar um espaço adequado e manter o instrumento acessível.",
            text: "Ter um local onde o aluno possa tocar e manter o instrumento acessível, quando as condições o permitem, pode facilitar a prática e a exploração musical.",
          },
          {
            id: "practice-conditions-opportunities",
            label: "Pequenas oportunidades",
            summary: "Aproveitar pequenos momentos para tocar.",
            text: "Mesmo quando não é possível dedicar muito tempo ao estudo, aproveitar pequenos momentos para tocar pode ajudar a manter uma relação regular com o instrumento.",
          },
        ],
      },
      {
        id: "family-communication",
        title: "Comunicação e colaboração com a família",
        options: [
          {
            id: "family-communication-availability",
            label: "Disponibilidade para conversar",
            summary: "Disponibilidade para conversar sobre o percurso.",
            text: "Estou disponível para conversar com a família sobre o percurso e a aprendizagem do aluno, sempre que considerem útil.",
          },
          {
            id: "family-communication-cooperation",
            label: "Acompanhamento conjunto",
            summary: "Comunicação para acompanhar e ajustar o apoio.",
            text: "A comunicação entre a família e o professor pode ajudar a acompanhar o percurso do aluno e a ajustar o apoio às suas necessidades.",
          },
          {
            id: "family-communication-questions",
            label: "Dúvidas e questões",
            summary: "Contacto aberto para esclarecer dúvidas e questões.",
            text: "Sempre que surjam dúvidas ou questões relacionadas com a aprendizagem, a família poderá contactar-me para conversarmos sobre a melhor forma de apoiar o aluno.",
          },
        ],
      },
      {
        id: "difficulty-cooperation",
        title: "Articulação perante dificuldades",
        options: [
          {
            id: "difficulty-cooperation-support",
            label: "Procurar apoio",
            summary: "Conversar e procurar formas de apoiar o aluno.",
            text: "Se surgirem dificuldades no percurso, estou disponível para conversar com a família e procurar formas de apoiar o aluno.",
          },
          {
            id: "difficulty-cooperation-adjustment",
            label: "Ajustar o acompanhamento",
            summary: "Ajustar em conjunto o acompanhamento perante dificuldades ou mudanças.",
            text: "Perante alguma dificuldade ou mudança nas condições de aprendizagem, poderemos conversar e ajustar, em conjunto, a forma de acompanhar o aluno.",
          },
          {
            id: "difficulty-cooperation-solutions",
            label: "Encontrar soluções",
            summary: "Colaborar na procura de soluções quando é necessário apoio adicional.",
            text: "A colaboração entre a família e o professor poderá ajudar a encontrar soluções adequadas sempre que o aluno precise de apoio adicional.",
          },
        ],
      },
    ],
  },
];
