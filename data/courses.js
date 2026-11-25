module.exports = [
  {
    id: "web", title: "Fundamentos da Web", icon: "🌐", level: "Iniciante",
    description: "Entenda como páginas e estilos são construídos.",
    lessons: [
      { id: "html-1", title: "Sua primeira página", topic: "HTML", minutes: 8, xp: 100, explanation: "HTML organiza o conteúdo. A tag <h1> representa o título principal de uma página.", type: "choice", question: "Qual elemento HTML representa o título principal?", options: ["<p>", "<h1>", "<img>", "<footer>"], answer: "<h1>", hint: "O número 1 indica o nível mais alto de título.", solution: "Use <h1> para o título principal. Os títulos vão de h1 até h6." },
      { id: "html-2", title: "Links e imagens", topic: "HTML", minutes: 10, xp: 100, explanation: "A tag <a> cria links. O atributo href informa o destino. A tag <img> exibe imagens e usa src para o arquivo.", type: "fill", question: "Complete o link: <a ____=\"https://exemplo.com\">Visitar</a>", answer: "href", hint: "É o atributo que aponta para o endereço de destino.", solution: "href define o destino de um link." },
      { id: "css-1", title: "Dando estilo com CSS", topic: "CSS", minutes: 10, xp: 120, explanation: "CSS controla cores, fontes, espaçamentos e layout. Um seletor escolhe o elemento que receberá as regras.", type: "choice", question: "Qual propriedade CSS altera a cor do texto?", options: ["background", "font-size", "color", "border"], answer: "color", hint: "O nome da propriedade é a palavra em inglês para cor.", solution: "color altera a cor do texto; background-color altera o fundo." },
      { id: "css-2", title: "Layout com Flexbox", topic: "CSS", minutes: 12, xp: 120, explanation: "Flexbox organiza itens em linhas ou colunas. display: flex ativa o modelo flexível no elemento pai.", type: "fill", question: "Complete a regra para ativar Flexbox: .menu { display: ____; }", answer: "flex", hint: "A palavra está no próprio nome Flexbox.", solution: "display: flex ativa o Flexbox." }
    ]
  },
  {
    id: "javascript", title: "Lógica com JavaScript", icon: "⚡", level: "Iniciante",
    description: "Aprenda variáveis, condições, funções e listas.",
    lessons: [
      { id: "js-1", title: "Variáveis", topic: "JavaScript", minutes: 10, xp: 140, explanation: "Use const quando não pretende reatribuir uma variável e let quando o valor poderá mudar.", type: "choice", question: "Qual palavra declara uma variável que pode receber outro valor?", options: ["const", "let", "固定", "return"], answer: "let", hint: "É uma declaração curta, com três letras.", solution: "let permite reatribuição. const impede reatribuir a variável." },
      { id: "js-2", title: "Condições", topic: "JavaScript", minutes: 12, xp: 140, explanation: "A estrutura if executa um bloco quando uma condição é verdadeira. else permite tratar o caso contrário.", type: "fill", question: "Complete: ____ (idade >= 18) { console.log('Maior de idade'); }", answer: "if", hint: "Palavra em inglês que significa 'se'.", solution: "if verifica uma condição antes de executar o bloco." },
      { id: "js-3", title: "Funções", topic: "JavaScript", minutes: 12, xp: 160, explanation: "Funções agrupam instruções reutilizáveis. Parâmetros recebem dados e return devolve um resultado.", type: "code", question: "Complete a função para devolver a soma: function somar(a, b) { ____ a + b; }", answer: "return", hint: "É a palavra usada para devolver o resultado de uma função.", solution: "return a + b devolve a soma para quem chamou a função." }
    ]
  },
  {
    id: "backend", title: "Back-end e dados", icon: "🧩", level: "Intermediário",
    description: "Conheça Node.js, APIs, JSON e bancos de dados.",
    lessons: [
      { id: "node-1", title: "Node.js", topic: "Node.js", minutes: 12, xp: 180, explanation: "Node.js permite executar JavaScript fora do navegador, por exemplo para criar servidores.", type: "choice", question: "Para que o Node.js é usado?", options: ["Somente criar estilos", "Executar JavaScript no servidor", "Editar imagens", "Substituir HTML"], answer: "Executar JavaScript no servidor", hint: "Pense no lado do servidor de uma aplicação.", solution: "Node.js executa JavaScript no servidor e em ferramentas de linha de comando." },
      { id: "json-1", title: "Dados em JSON", topic: "JSON", minutes: 10, xp: 180, explanation: "JSON representa dados em pares de chave e valor. As chaves são strings entre aspas duplas.", type: "fill", question: "Complete o JSON: { ____: \"Ana\" }", answer: "\"nome\"", hint: "A chave precisa estar entre aspas duplas.", solution: "Um objeto JSON válido usa chaves como \"nome\" e valores separados por dois-pontos." },
      { id: "db-1", title: "Bancos de dados SQL", topic: "MySQL", minutes: 14, xp: 200, explanation: "SQL consulta dados relacionais. SELECT lê registros e FROM indica a tabela consultada.", type: "fill", question: "Complete: SELECT * ____ usuarios;", answer: "FROM", hint: "Palavra em inglês que significa 'de', usada para indicar a tabela.", solution: "SELECT * FROM usuarios; consulta todas as colunas da tabela usuarios." },
      { id: "db-2", title: "NoSQL e MongoDB", topic: "MongoDB", minutes: 14, xp: 200, explanation: "MongoDB é um banco orientado a documentos. Os documentos são armazenados em coleções e têm estrutura semelhante a JSON.", type: "choice", question: "No MongoDB, documentos são agrupados em:", options: ["Planilhas", "Coleções", "Arquivos CSS", "Funções"], answer: "Coleções", hint: "O nome lembra um conjunto de documentos.", solution: "Coleções agrupam documentos no MongoDB." },
      { id: "api-1", title: "Integração front-end e back-end", topic: "APIs", minutes: 16, xp: 220, explanation: "O front-end pode chamar uma API com fetch(). O servidor responde, frequentemente, com dados JSON.", type: "code", question: "Complete a chamada para buscar dados: fetch('/api/alunos').then(res => res.____());", answer: "json", hint: "Método que transforma a resposta JSON em objeto JavaScript.", solution: "res.json() interpreta o corpo da resposta como JSON." }
    ]
  }
];