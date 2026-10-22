/* ==========================================================
   Doku-Doku — lógica do jogo com Habilidades Matemáticas
   ========================================================== */

/* ---------- Configurações gerais ---------- */

const NUMERO_DE_CORES = 12;
const MODO_DEPURACAO = false;

const TENTATIVAS_POR_TABULEIRO = 200;
const AJUSTES_POR_TENTATIVA = 40;
const SOLUCOES_POR_RODADA = 12;

const TEMPO_CLIQUE_DUPLO = 350;

const CONFIG_DIFICULDADES = {
  facil:   { nome: "Fácil",   tamanho: 5,  vidas: 3 },
  medio:   { nome: "Médio",   tamanho: 8,  vidas: 3 },
  dificil: { nome: "Difícil", tamanho: 10, vidas: 3 }
};

const DIRECOES = [[-1, 0], [1, 0], [0, -1], [0, 1]];

/* Nomes amigáveis para as cores das regiões (baseadas no CSS) */
const NOME_CORES = [
  "Rosa",         // Região 0
  "Laranja",      // Região 1
  "Amarelo",      // Região 2
  "Verde",        // Região 3
  "Turquesa",     // Região 4
  "Azul",         // Região 5
  "Lilás",        // Região 6
  "Rosa Claro",   // Região 7
  "Bege",         // Região 8
  "Cinza",        // Região 9
  "Pêssego",      // Região 10
  "Verde-Limão"   // Região 11
];

/* ---------- Elementos da página ---------- */

const telaInicial = document.getElementById("tela-inicial");
const telaInstrucoes = document.getElementById("tela-instrucoes");
const telaJogo = document.getElementById("tela-jogo");

const btnInstrucoes = document.getElementById("btn-instrucoes");
const btnVoltar = document.getElementById("btn-voltar");
const btnComecar = document.getElementById("btn-comecar");
const btnNovoJogo = document.getElementById("btn-novo-jogo");
const btnMenu = document.getElementById("btn-menu");

const botoesDificuldade = document.querySelectorAll("[data-dificuldade]");
const avisoDificuldade = document.getElementById("aviso-dificuldade");
const textoDificuldadeAtual = document.getElementById("dificuldade-atual");
const tabuleiro = document.getElementById("tabuleiro");
const elementoVidas = document.getElementById("vidas");
const mensagemJogo = document.getElementById("mensagem-jogo");
const contadorPugs = document.getElementById("pugs-encontrados");
const totalPugs = document.getElementById("pugs-total");

/* Elementos das Habilidades e Quiz */
const btnHabFacil = document.getElementById("btn-hab-facil");
const btnHabMedia = document.getElementById("btn-hab-media");
const btnHabDificil = document.getElementById("btn-hab-dificil");

const modalQuiz = document.getElementById("modal-quiz");
const quizTitulo = document.getElementById("quiz-titulo");
const quizEnunciado = document.getElementById("quiz-enunciado");
const quizOpcoes = document.getElementById("quiz-opcoes");
const quizFeedback = document.getElementById("quiz-feedback");
const btnQuizFechar = document.getElementById("btn-quiz-fechar");

/* ---------- Estado do jogo ---------- */

let dificuldadeSelecionada = null;

let tamanhoAtual = 0;
let vidasIniciais = 0;
let vidas = 0;
let pugsEncontrados = 0;
let jogoTerminado = false;

let posicoesPugs = [];
let mapaRegioes = [];
let estadoCasas = [];
let ultimoClique = null;
let casasDOM = [];

/* Estado de Arraste do Mouse */
let mousePressionado = false;
let arrastando = false;
let estadoAlvoArraste = null;
let pontoInicialX = 0;
let pontoInicialY = 0;
let ignorarProximoClique = false;

/* Estado das Habilidades */
let habilidadesUsadas = {
  facil: false,
  media: false,
  dificil: false
};
let habilidadeAtualQuiz = null;

/* ---------- Banco Expandido de Questões (6º Ano do Ensino Fundamental) ---------- */

const QUESTOES_QUIZ = {
  facil: [
    { pergunta: "Qual é o resultado de 48 ÷ 6 + 5?", opcoes: ["13", "11", "12", "9"], correta: 0 },
    { pergunta: "Qual é o valor de 7 × 8 - 12?", opcoes: ["42", "44", "46", "52"], correta: 1 },
    { pergunta: "Calcule: (15 + 25) ÷ 5", opcoes: ["6", "8", "10", "12"], correta: 1 },
    { pergunta: "Quanto é 100 - 4 × 15?", opcoes: ["40", "50", "60", "30"], correta: 0 },
    { pergunta: "Qual é o resultado de 81 ÷ 9 + 14?", opcoes: ["21", "23", "25", "22"], correta: 1 },
    { pergunta: "Quanto é 125 + 375?", opcoes: ["500", "450", "525", "480"], correta: 0 },
    { pergunta: "Qual é o triplo de 24?", opcoes: ["68", "72", "76", "80"], correta: 1 },
    { pergunta: "Quanto é 144 ÷ 12?", opcoes: ["11", "12", "13", "14"], correta: 1 },
    { pergunta: "Calcule: 50 - 3 × 9", opcoes: ["23", "27", "21", "33"], correta: 0 },
    { pergunta: "Qual é o resto da divisão de 29 por 4?", opcoes: ["1", "2", "3", "0"], correta: 0 },
    { pergunta: "Quanto é 6 × (12 - 4)?", opcoes: ["48", "42", "54", "60"], correta: 0 },
    { pergunta: "Qual é o quádruplo de 15?", opcoes: ["45", "60", "75", "50"], correta: 1 }
  ],
  media: [
    { pergunta: "Qual fração é equivalente a 3/4?", opcoes: ["6/8", "5/6", "4/5", "9/10"], correta: 0 },
    { pergunta: "Qual número é maior: 3/4 ou 2/3?", opcoes: ["3/4", "2/3", "São iguais", "Não é possível comparar"], correta: 0 },
    { pergunta: "Qual é a soma de 0,45 + 0,35?", opcoes: ["0,70", "0,80", "0,75", "0,85"], correta: 1 },
    { pergunta: "Quanto é 1/2 + 1/4?", opcoes: ["2/6", "3/4", "1/6", "2/4"], correta: 1 },
    { pergunta: "Em forma decimal, como escrevemos a fração 1/5?", opcoes: ["0,5", "0,2", "0,15", "0,25"], correta: 1 },
    { pergunta: "Qual é o resultado de 2,5 × 4?", opcoes: ["10", "8,5", "9,5", "12"], correta: 0 },
    { pergunta: "Qual fração simplificada é equivalente a 10/15?", opcoes: ["1/3", "2/3", "3/5", "2/5"], correta: 1 },
    { pergunta: "Quanto é 1,2 - 0,75?", opcoes: ["0,45", "0,55", "0,35", "0,50"], correta: 0 },
    { pergunta: "Qual número decimal representa 3/10?", opcoes: ["0,03", "0,3", "3,0", "0,33"], correta: 1 },
    { pergunta: "Se você comer 2/8 de uma pizza, qual fração simplificada resta?", opcoes: ["3/4", "1/4", "1/2", "5/8"], correta: 0 },
    { pergunta: "Qual é o resultado de 0,6 + 0,04?", opcoes: ["0,10", "0,64", "0,46", "0,604"], correta: 1 },
    { pergunta: "Qual é a metade de 0,5?", opcoes: ["0,25", "0,20", "0,15", "0,05"], correta: 0 }
  ],
  dificil: [
    { pergunta: "Um retângulo tem 8 cm de comprimento e 3 cm de largura. Qual é seu perímetro?", opcoes: ["22 cm", "24 cm", "11 cm", "16 cm"], correta: 0 },
    { pergunta: "Qual é a área de um quadrado cujo lado mede 6 cm?", opcoes: ["24 cm²", "36 cm²", "12 cm²", "18 cm²"], correta: 1 },
    { pergunta: "Qual é o próximo número da sequência: 2, 5, 10, 17, ...?", opcoes: ["24", "25", "26", "27"], correta: 2 },
    { pergunta: "Qual é o menor múltiplo comum (MMC) de 4 e 6?", opcoes: ["12", "24", "18", "8"], correta: 0 },
    { pergunta: "Um terreno retangular tem área de 60 m² e largura de 5 m. Quanto mede o comprimento?", opcoes: ["10 m", "12 m", "15 m", "20 m"], correta: 1 },
    { pergunta: "Qual é o perímetro de um triângulo equilátero com lado de 9 cm?", opcoes: ["18 cm", "27 cm", "36 cm", "24 cm"], correta: 1 },
    { pergunta: "Qual é o maior divisor comum (MDC) de 18 e 24?", opcoes: ["3", "6", "12", "4"], correta: 1 },
    { pergunta: "Qual é a área de um retângulo de 12 cm de base e 5 cm de altura?", opcoes: ["34 cm²", "60 cm²", "30 cm²", "50 cm²"], correta: 1 },
    { pergunta: "Qual é o próximo termo da sequência: 3, 6, 12, 24, ...?", opcoes: ["36", "48", "30", "50"], correta: 1 },
    { pergunta: "Um quadrado tem perímetro de 32 cm. Qual é a medida do seu lado?", opcoes: ["6 cm", "8 cm", "16 cm", "4 cm"], correta: 1 },
    { pergunta: "Qual é o MMC entre 5 e 7?", opcoes: ["35", "12", "1", "70"], correta: 0 },
    { pergunta: "Um paralelogramo tem base de 10 cm e altura de 4 cm. Qual é a sua área?", opcoes: ["20 cm²", "28 cm²", "40 cm²", "50 cm²"], correta: 2 }
  ]
};

/* ==========================================================
   Controle de telas
   ========================================================== */

function mostrarTela(tela) {
  [telaInicial, telaInstrucoes, telaJogo].forEach(function (t) {
    t.classList.add("escondido");
  });
  tela.classList.remove("escondido");
}

btnInstrucoes.addEventListener("click", function () {
  mostrarTela(telaInstrucoes);
});

btnVoltar.addEventListener("click", function () {
  mostrarTela(telaInicial);
});

btnMenu.addEventListener("click", function () {
  mostrarTela(telaInicial);
});

/* ==========================================================
   Seleção de dificuldade
   ========================================================== */

botoesDificuldade.forEach(function (botao) {
  const config = CONFIG_DIFICULDADES[botao.dataset.dificuldade];
  botao.querySelector(".detalhe").textContent =
    config.tamanho + "×" + config.tamanho + " · " + config.tamanho + " pugs";

  botao.addEventListener("click", function () {
    botoesDificuldade.forEach(function (b) {
      b.classList.remove("selecionada");
    });
    botao.classList.add("selecionada");

    dificuldadeSelecionada = botao.dataset.dificuldade;
    avisoDificuldade.textContent = "";
  });
});

btnComecar.addEventListener("click", function () {
  if (!dificuldadeSelecionada) {
    avisoDificuldade.textContent = "Escolha uma dificuldade para começar.";
    return;
  }

  textoDificuldadeAtual.textContent = CONFIG_DIFICULDADES[dificuldadeSelecionada].nome;
  mostrarTela(telaJogo);
  iniciarJogo();
});

btnNovoJogo.addEventListener("click", iniciarJogo);

/* ==========================================================
   Utilitários
   ========================================================== */

function embaralhar(lista) {
  const copia = lista.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temporario = copia[i];
    copia[i] = copia[j];
    copia[j] = temporario;
  }
  return copia;
}

function criarMatriz(n, valor) {
  const matriz = [];
  for (let i = 0; i < n; i++) {
    matriz.push(new Array(n).fill(valor));
  }
  return matriz;
}

function dentroDoTabuleiro(linha, coluna, n) {
  return linha >= 0 && linha < n && coluna >= 0 && coluna < n;
}

/* ==========================================================
   Gerador dos pugs e regiões (Backtracking)
   ========================================================== */

function saoAdjacentes(a, b) {
  return Math.abs(a.linha - b.linha) <= 1 && Math.abs(a.coluna - b.coluna) <= 1;
}

function posicaoValida(linha, coluna, colocados) {
  const candidato = { linha: linha, coluna: coluna };

  for (let i = 0; i < colocados.length; i++) {
    const outro = colocados[i];
    if (outro.linha === linha) return false;
    if (outro.coluna === coluna) return false;
    if (saoAdjacentes(candidato, outro)) return false;
  }
  return true;
}

function gerarPugs(n) {
  const todasAsColunas = [];
  for (let c = 0; c < n; c++) {
    todasAsColunas.push(c);
  }

  const colocados = [];

  function colocarNaLinha(linha) {
    if (linha === n) return true;

    const colunasEmOrdemAleatoria = embaralhar(todasAsColunas);

    for (let i = 0; i < colunasEmOrdemAleatoria.length; i++) {
      const coluna = colunasEmOrdemAleatoria[i];

      if (posicaoValida(linha, coluna, colocados)) {
        colocados.push({ linha: linha, coluna: coluna });

        if (colocarNaLinha(linha + 1)) return true;

        colocados.pop();
      }
    }
    return false;
  }

  if (!colocarNaLinha(0)) {
    throw new Error("Não foi possível gerar uma configuração válida de pugs.");
  }

  return colocados;
}

function configuracaoValida(pugs, n) {
  if (pugs.length !== n) return false;

  for (let i = 0; i < pugs.length; i++) {
    const p = pugs[i];
    if (!dentroDoTabuleiro(p.linha, p.coluna, n)) return false;

    for (let j = i + 1; j < pugs.length; j++) {
      const q = pugs[j];
      if (p.linha === q.linha) return false;
      if (p.coluna === q.coluna) return false;
      if (saoAdjacentes(p, q)) return false;
    }
  }
  return true;
}

function crescerRegioes(sementes, n) {
  const mapa = criarMatriz(n, -1);
  sementes.forEach(function (casa, k) {
    mapa[casa.linha][casa.coluna] = k;
  });

  let faltam = n * n - sementes.length;

  while (faltam > 0) {
    const fronteiras = sementes.map(function () { return []; });

    for (let l = 0; l < n; l++) {
      for (let c = 0; c < n; c++) {
        if (mapa[l][c] !== -1) continue;

        const jaAdicionada = new Set();
        DIRECOES.forEach(function (d) {
          const vl = l + d[0];
          const vc = c + d[1];
          if (!dentroDoTabuleiro(vl, vc, n)) return;
          const regiao = mapa[vl][vc];
          if (regiao !== -1 && !jaAdicionada.has(regiao)) {
            jaAdicionada.add(regiao);
            fronteiras[regiao].push({ linha: l, coluna: c });
          }
        });
      }
    }

    const comFronteira = [];
    fronteiras.forEach(function (lista, k) {
      if (lista.length > 0) comFronteira.push(k);
    });

    const regiao = comFronteira[Math.floor(Math.random() * comFronteira.length)];
    const lista = fronteiras[regiao];
    const escolhida = lista[Math.floor(Math.random() * lista.length)];
    mapa[escolhida.linha][escolhida.coluna] = regiao;
    faltam--;
  }

  return mapa;
}

function regiaoContinuaLigada(mapa, n, regiao, ignorarLinha, ignorarColuna) {
  let inicio = null;
  let total = 0;

  for (let l = 0; l < n; l++) {
    for (let c = 0; c < n; c++) {
      if (mapa[l][c] === regiao && !(l === ignorarLinha && c === ignorarColuna)) {
        total++;
        if (inicio === null) inicio = { linha: l, coluna: c };
      }
    }
  }
  if (total === 0) return false;

  const visitada = criarMatriz(n, false);
  const fila = [inicio];
  visitada[inicio.linha][inicio.coluna] = true;
  let alcancadas = 0;

  while (fila.length > 0) {
    const atual = fila.pop();
    alcancadas++;

    DIRECOES.forEach(function (d) {
      const vl = atual.linha + d[0];
      const vc = atual.coluna + d[1];
      if (!dentroDoTabuleiro(vl, vc, n)) return;
      if (visitada[vl][vc]) return;
      if (mapa[vl][vc] !== regiao) return;
      if (vl === ignorarLinha && vc === ignorarColuna) return;
      visitada[vl][vc] = true;
      fila.push({ linha: vl, coluna: vc });
    });
  }

  return alcancadas === total;
}

function encontrarSolucoes(mapa, n, limite) {
  const casasDaRegiao = [];
  for (let r = 0; r < n; r++) casasDaRegiao.push([]);
  for (let l = 0; l < n; l++) {
    for (let c = 0; c < n; c++) {
      casasDaRegiao[mapa[l][c]].push({ linha: l, coluna: c });
    }
  }

  const bloqueios = criarMatriz(n, 0);
  const regiaoComPug = new Array(n).fill(false);
  const solucao = new Array(n);
  const solucoes = [];

  function alterarBloqueios(linha, coluna, delta) {
    for (let i = 0; i < n; i++) {
      bloqueios[linha][i] += delta;
      if (i !== linha) bloqueios[i][coluna] += delta;
    }
    for (let dl = -1; dl <= 1; dl += 2) {
      for (let dc = -1; dc <= 1; dc += 2) {
        if (dentroDoTabuleiro(linha + dl, coluna + dc, n)) {
          bloqueios[linha + dl][coluna + dc] += delta;
        }
      }
    }
  }

  function buscar(colocados) {
    if (colocados === n) {
      solucoes.push(solucao.slice());
      return solucoes.length >= limite;
    }

    let melhorRegiao = -1;
    let melhorLista = null;

    for (let r = 0; r < n; r++) {
      if (regiaoComPug[r]) continue;

      const livres = [];
      casasDaRegiao[r].forEach(function (casa) {
        if (bloqueios[casa.linha][casa.coluna] === 0) livres.push(casa);
      });

      if (livres.length === 0) return false;

      if (melhorLista === null || livres.length < melhorLista.length) {
        melhorRegiao = r;
        melhorLista = livres;
      }
    }

    regiaoComPug[melhorRegiao] = true;

    for (let i = 0; i < melhorLista.length; i++) {
      const casa = melhorLista[i];
      solucao[casa.linha] = casa.coluna;
      alterarBloqueios(casa.linha, casa.coluna, 1);

      const parar = buscar(colocados + 1);

      alterarBloqueios(casa.linha, casa.coluna, -1);
      if (parar) {
        regiaoComPug[melhorRegiao] = false;
        return true;
      }
    }

    regiaoComPug[melhorRegiao] = false;
    return false;
  }

  buscar(0);
  return solucoes;
}

function solucaoValeNoMapa(solucao, mapa, n) {
  const vistas = new Set();
  for (let linha = 0; linha < n; linha++) {
    vistas.add(mapa[linha][solucao[linha]]);
  }
  return vistas.size === n;
}

function tornarSolucaoUnica(mapa, pugs, n) {
  const ehPugDeVerdade = new Set();
  pugs.forEach(function (p) {
    ehPugDeVerdade.add(p.linha * n + p.coluna);
  });

  function ehAVerdadeira(solucao) {
    return pugs.every(function (p) { return solucao[p.linha] === p.coluna; });
  }

  for (let ajuste = 0; ajuste < AJUSTES_POR_TENTATIVA; ajuste++) {
    const solucoes = encontrarSolucoes(mapa, n, SOLUCOES_POR_RODADA);
    const outras = solucoes.filter(function (s) { return !ehAVerdadeira(s); });

    if (outras.length === 0) {
      return solucoes.length === 1;
    }

    let avancou = false;

    outras.forEach(function (outra) {
      if (!solucaoValeNoMapa(outra, mapa, n)) {
        avancou = true;
        return;
      }

      const candidatas = [];
      outra.forEach(function (coluna, linha) {
        if (!ehPugDeVerdade.has(linha * n + coluna)) {
          candidatas.push({ linha: linha, coluna: coluna });
        }
      });

      let moveu = false;

      embaralhar(candidatas).forEach(function (casa) {
        if (moveu) return;

        const atual = mapa[casa.linha][casa.coluna];
        if (!regiaoContinuaLigada(mapa, n, atual, casa.linha, casa.coluna)) return;

        const vizinhas = [];
        DIRECOES.forEach(function (d) {
          const vl = casa.linha + d[0];
          const vc = casa.coluna + d[1];
          if (!dentroDoTabuleiro(vl, vc, n)) return;
          const regiao = mapa[vl][vc];
          if (regiao !== atual && vizinhas.indexOf(regiao) === -1) vizinhas.push(regiao);
        });
        if (vizinhas.length === 0) return;

        mapa[casa.linha][casa.coluna] = vizinhas[Math.floor(Math.random() * vizinhas.length)];
        moveu = true;
      });

      if (moveu) avancou = true;
    });

    if (!avancou) return false;
  }

  return false;
}

function regioesValidas(mapa, pugs, n) {
  if (n > NUMERO_DE_CORES) return false;

  const tamanhos = new Array(n).fill(0);
  const pugsPorRegiao = new Array(n).fill(0);

  for (let l = 0; l < n; l++) {
    for (let c = 0; c < n; c++) {
      const regiao = mapa[l][c];
      if (!Number.isInteger(regiao) || regiao < 0 || regiao >= n) return false;
      tamanhos[regiao]++;
    }
  }

  pugs.forEach(function (p) {
    pugsPorRegiao[mapa[p.linha][p.coluna]]++;
  });

  for (let r = 0; r < n; r++) {
    if (tamanhos[r] === 0) return false;
    if (pugsPorRegiao[r] !== 1) return false;
    if (!regiaoContinuaLigada(mapa, n, r, -1, -1)) return false;
  }
  return true;
}

function gerarTabuleiro(n) {
  if (n > NUMERO_DE_CORES) {
    throw new Error("Não há cores suficientes para um tabuleiro " + n + " x " + n + ".");
  }

  for (let tentativa = 0; tentativa < TENTATIVAS_POR_TABULEIRO; tentativa++) {
    const pugs = gerarPugs(n);
    const mapa = crescerRegioes(embaralhar(pugs), n);

    if (
      tornarSolucaoUnica(mapa, pugs, n) &&
      configuracaoValida(pugs, n) &&
      regioesValidas(mapa, pugs, n)
    ) {
      return { pugs: pugs, regioes: mapa };
    }
  }

  throw new Error("Não foi possível gerar um tabuleiro com solução única.");
}

/* ==========================================================
   Tabuleiro (HTML)
   ========================================================== */

function criarTabuleiro() {
  tabuleiro.replaceChildren();
  tabuleiro.style.setProperty("--n", tamanhoAtual);

  casasDOM = [];
  const fragmento = document.createDocumentFragment();

  for (let linha = 0; linha < tamanhoAtual; linha++) {
    const linhaDeCasas = [];

    for (let coluna = 0; coluna < tamanhoAtual; coluna++) {
      const regiao = mapaRegioes[linha][coluna];

      const casa = document.createElement("div");
      casa.className = "casa regiao-" + regiao;
      casa.id = "casa-" + linha + "-" + coluna;
      casa.dataset.linha = linha;
      casa.dataset.coluna = coluna;

      if (linha > 0) {
        casa.classList.add(mapaRegioes[linha - 1][coluna] !== regiao ? "limite-cima" : "divisa-cima");
      }
      if (coluna > 0) {
        casa.classList.add(mapaRegioes[linha][coluna - 1] !== regiao ? "limite-esquerda" : "divisa-esquerda");
      }

      linhaDeCasas.push(casa);
      fragmento.appendChild(casa);
    }

    casasDOM.push(linhaDeCasas);
  }

  tabuleiro.appendChild(fragmento);
}

function desenharCasa(linha, coluna) {
  const casa = casasDOM[linha][coluna];
  casa.classList.remove("marcada", "pug", "errada");

  const estado = estadoCasas[linha][coluna];
  if (estado !== "vazia") {
    casa.classList.add(estado);
  }
}

function atualizarVidas() {
  elementoVidas.textContent = "♥".repeat(vidas) + "♡".repeat(vidasIniciais - vidas);
}

function atualizarContadorDePugs() {
  contadorPugs.textContent = pugsEncontrados;
  totalPugs.textContent = tamanhoAtual;
}

/* ==========================================================
   Interação com o tabuleiro (Cliques e Arraste)
   ========================================================== */

function temPug(linha, coluna) {
  return posicoesPugs.some(function (p) {
    return p.linha === linha && p.coluna === coluna;
  });
}

function terminarJogo(mensagem, venceu) {
  jogoTerminado = true;
  mensagemJogo.textContent = mensagem;
  mensagemJogo.className = "mensagem-jogo " + (venceu ? "vitoria" : "derrota");
  tabuleiro.classList.add("encerrado");
}

function agora() {
  return Date.now();
}

function ehCliqueDuplo(linha, coluna) {
  const momento = agora();

  const duplo =
    ultimoClique !== null &&
    ultimoClique.linha === linha &&
    ultimoClique.coluna === coluna &&
    momento - ultimoClique.quando <= TEMPO_CLIQUE_DUPLO;

  ultimoClique = duplo ? null : { linha: linha, coluna: coluna, quando: momento };
  return duplo;
}

function alternarX(linha, coluna) {
  const marcada = estadoCasas[linha][coluna] === "marcada";
  estadoCasas[linha][coluna] = marcada ? "vazia" : "marcada";
  desenharCasa(linha, coluna);
}

function palpitar(linha, coluna) {
  if (temPug(linha, coluna)) {
    estadoCasas[linha][coluna] = "pug";
    pugsEncontrados++;
  } else {
    estadoCasas[linha][coluna] = "errada";
    vidas--;
  }

  desenharCasa(linha, coluna);
  atualizarVidas();
  atualizarContadorDePugs();

  if (pugsEncontrados === tamanhoAtual) {
    terminarJogo("Você encontrou todos os pugs! 🎉", true);
  } else if (vidas === 0) {
    terminarJogo("Acabaram as suas vidas. Fim de jogo.", false);
  }
}

function tratarCliqueNaCasa(linha, coluna) {
  if (jogoTerminado) return;

  const estado = estadoCasas[linha][coluna];
  if (estado === "pug" || estado === "errada") return;

  if (ehCliqueDuplo(linha, coluna)) {
    palpitar(linha, coluna);
  } else {
    alternarX(linha, coluna);
  }
}

// Eventos de mouse para clique e arraste
tabuleiro.addEventListener("mousedown", function (evento) {
  if (jogoTerminado) return;
  const casa = evento.target.closest(".casa");
  if (!casa) return;

  mousePressionado = true;
  arrastando = false;
  pontoInicialX = evento.clientX;
  pontoInicialY = evento.clientY;

  const linha = Number(casa.dataset.linha);
  const coluna = Number(casa.dataset.coluna);
  const estado = estadoCasas[linha][coluna];

  if (estado === "pug" || estado === "errada") {
    mousePressionado = false;
    return;
  }

  estadoAlvoArraste = (estado === "vazia") ? "marcada" : "vazia";
});

window.addEventListener("mousemove", function (evento) {
  if (!mousePressionado) return;

  const dx = Math.abs(evento.clientX - pontoInicialX);
  const dy = Math.abs(evento.clientY - pontoInicialY);
  if (dx > 5 || dy > 5) {
    arrastando = true;
  }

  if (arrastando) {
    const elementoSobMouse = document.elementFromPoint(evento.clientX, evento.clientY);
    if (!elementoSobMouse) return;
    const casa = elementoSobMouse.closest(".casa");
    if (!casa || !tabuleiro.contains(casa)) return;

    const linha = Number(casa.dataset.linha);
    const coluna = Number(casa.dataset.coluna);
    const estado = estadoCasas[linha][coluna];

    if (estado !== "pug" && estado !== "errada" && estado !== estadoAlvoArraste) {
      estadoCasas[linha][coluna] = estadoAlvoArraste;
      desenharCasa(linha, coluna);
    }
  }
});

window.addEventListener("mouseup", function () {
  if (arrastando) {
    ignorarProximoClique = true;
  }
  mousePressionado = false;
  arrastando = false;
});

tabuleiro.addEventListener("click", function (evento) {
  if (ignorarProximoClique) {
    ignorarProximoClique = false;
    return;
  }
  const casa = evento.target.closest(".casa");
  if (!casa) return;

  tratarCliqueNaCasa(Number(casa.dataset.linha), Number(casa.dataset.coluna));
});

/* ==========================================================
   Lógica das Habilidades Matemáticas & Quiz
   ========================================================== */

function reiniciarHabilidades() {
  habilidadesUsadas = { facil: false, media: false, dificil: false };
  
  [btnHabFacil, btnHabMedia, btnHabDificil].forEach(function (btn) {
    btn.classList.remove("usado");
    btn.disabled = false;
  });
}

function abrirQuizHabilidade(nivel) {
  if (jogoTerminado || habilidadesUsadas[nivel]) return;

  habilidadeAtualQuiz = nivel;
  const listaQuestoes = QUESTOES_QUIZ[nivel];
  const questao = listaQuestoes[Math.floor(Math.random() * listaQuestoes.length)];

  quizTitulo.textContent = "Desafio - " + (nivel === "facil" ? "Fácil" : nivel === "media" ? "Médio" : "Difícil");
  quizEnunciado.textContent = questao.pergunta;
  quizFeedback.textContent = "";
  quizOpcoes.replaceChildren();

  questao.opcoes.forEach(function (opcaoTexto, idx) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-opcao";
    btn.textContent = opcaoTexto;
    btn.addEventListener("click", function () {
      validarRespostaQuiz(idx, questao.correta);
    });
    quizOpcoes.appendChild(btn);
  });

  modalQuiz.classList.remove("escondido");
}

function fecharQuiz() {
  modalQuiz.classList.add("escondido");
  habilidadeAtualQuiz = null;
}

btnQuizFechar.addEventListener("click", fecharQuiz);

btnHabFacil.addEventListener("click", function () { abrirQuizHabilidade("facil"); });
btnHabMedia.addEventListener("click", function () { abrirQuizHabilidade("media"); });
btnHabDificil.addEventListener("click", function () { abrirQuizHabilidade("dificil"); });

function validarRespostaQuiz(opcaoSelecionada, opcaoCorreta) {
  if (opcaoSelecionada === opcaoCorreta) {
    quizFeedback.style.color = "#28a745";
    quizFeedback.textContent = "Correto! Recompensa concedida.";
    
    const nivelConquistado = habilidadeAtualQuiz;

    setTimeout(function () {
      fecharQuiz();
      aplicarRecompensa(nivelConquistado);
    }, 900);
  } else {
    quizFeedback.style.color = "#c0263f";
    quizFeedback.textContent = "Resposta incorreta! Tente novamente mais tarde.";
    
    setTimeout(function () {
      fecharQuiz();
    }, 1200);
  }
}

function marcarHabilidadeComoUsada(nivel) {
  habilidadesUsadas[nivel] = true;
  let btn = nivel === "facil" ? btnHabFacil : nivel === "media" ? btnHabMedia : btnHabDificil;
  btn.classList.add("usado");
  btn.disabled = true;
}

/* Recompensas */

function aplicarRecompensa(nivel) {
  if (nivel === "facil") {
    let reveladas = 0;
    
    // Define a quantidade de quadrados revelados com base na dificuldade atual
    let limite = 3; // fácil
    if (dificuldadeSelecionada === "medio") limite = 5;
    if (dificuldadeSelecionada === "dificil") limite = 8;
    
    const casasVaziasSemPug = [];
    for (let l = 0; l < tamanhoAtual; l++) {
      for (let c = 0; c < tamanhoAtual; c++) {
        if (estadoCasas[l][c] === "vazia" && !temPug(l, c)) {
          casasVaziasSemPug.push({ linha: l, coluna: c });
        }
      }
    }

    const sorteadas = embaralhar(casasVaziasSemPug).slice(0, limite);
    sorteadas.forEach(function (p) {
      estadoCasas[p.linha][p.coluna] = "marcada";
      desenharCasa(p.linha, p.coluna);
      reveladas++;
    });

    mensagemJogo.textContent = reveladas > 0 
      ? "Visão de Pug: " + reveladas + " casas sem pugs foram marcadas com X!" 
      : "Visão de Pug utilizada!";
    mensagemJogo.className = "mensagem-jogo";

    marcarHabilidadeComoUsada("facil");

  } else if (nivel === "media") {
    const pugsEscondidos = posicoesPugs.filter(function (p) {
      return estadoCasas[p.linha][p.coluna] !== "pug";
    });

    if (pugsEscondidos.length > 0) {
      const escolhido = pugsEscondidos[Math.floor(Math.random() * pugsEscondidos.length)];
      const numLinha = escolhido.linha + 1;
      const numRegiao = mapaRegioes[escolhido.linha][escolhido.coluna];
      const nomeCor = NOME_CORES[numRegiao] || ("Cor " + (numRegiao + 1));

      mensagemJogo.textContent = "Faro Matemático: Há um pug escondido na Linha " + numLinha + " (Região " + nomeCor + ")!";
      mensagemJogo.className = "mensagem-jogo";
    }

    marcarHabilidadeComoUsada("media");

  } else if (nivel === "dificil") {
    const pugsEscondidos = posicoesPugs.filter(function (p) {
      return estadoCasas[p.linha][p.coluna] !== "pug";
    });

    if (pugsEscondidos.length > 0) {
      const escolhido = pugsEscondidos[Math.floor(Math.random() * pugsEscondidos.length)];
      estadoCasas[escolhido.linha][escolhido.coluna] = "pug";
      pugsEncontrados++;
      
      desenharCasa(escolhido.linha, escolhido.coluna);
      atualizarContadorDePugs();

      mensagemJogo.textContent = "Mestre do Doku: Um pug foi revelado no tabuleiro!";
      mensagemJogo.className = "mensagem-jogo";

      if (pugsEncontrados === tamanhoAtual) {
        terminarJogo("Você encontrou todos os pugs! 🎉", true);
      }
    }

    marcarHabilidadeComoUsada("dificil");
  }
}

/* ==========================================================
   Início de partida
   ========================================================== */

function iniciarJogo() {
  console.log("Iniciando partida. Dificuldade: " + dificuldadeSelecionada);

  const config = CONFIG_DIFICULDADES[dificuldadeSelecionada];
  const novoTabuleiro = gerarTabuleiro(config.tamanho);

  tamanhoAtual = config.tamanho;
  vidasIniciais = config.vidas;
  vidas = config.vidas;
  pugsEncontrados = 0;
  jogoTerminado = false;

  posicoesPugs = novoTabuleiro.pugs;
  mapaRegioes = novoTabuleiro.regioes;
  estadoCasas = criarMatriz(tamanhoAtual, "vazia");
  ultimoClique = null;

  mensagemJogo.textContent = "";
  mensagemJogo.className = "mensagem-jogo";
  tabuleiro.classList.remove("encerrado");

  criarTabuleiro();
  atualizarVidas();
  atualizarContadorDePugs();
  reiniciarHabilidades();

  if (MODO_DEPURACAO) {
    console.table(posicoesPugs);
  }
}
