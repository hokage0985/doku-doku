/* ==========================================================
   Doku-Doku — lógica do jogo
   ========================================================== */

/* ---------- Configurações gerais ---------- */

// Quantas cores de região existem no CSS (.regiao-0, .regiao-1, ...).
const NUMERO_DE_CORES = 12;

// Deixe true apenas para testar: mostra as posições dos pugs no console.
const MODO_DEPURACAO = false;

// Limites do gerador (só mexa se a geração começar a falhar).
const TENTATIVAS_POR_TABULEIRO = 200;
const AJUSTES_POR_TENTATIVA = 40;
const SOLUCOES_POR_RODADA = 12;

// Dois cliques na mesma casa com no máximo este intervalo (em milissegundos)
const TEMPO_CLIQUE_DUPLO = 350;

const CONFIG_DIFICULDADES = {
  facil:   { nome: "Fácil",   tamanho: 5,  vidas: 3 },
  medio:   { nome: "Médio",   tamanho: 8,  vidas: 3 },
  dificil: { nome: "Difícil", tamanho: 10, vidas: 3 }
};

const DIRECOES = [[-1, 0], [1, 0], [0, -1], [0, 1]];

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

// Variáveis de controle para o arraste do mouse
let mousePressionado = false;
let arrastando = false;
let estadoAlvoArraste = null;
let pontoInicialX = 0;
let pontoInicialY = 0;
let ignorarProximoClique = false;

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

  // Define se o arraste vai marcar (X) ou desmarcar com base na primeira casa
  estadoAlvoArraste = (estado === "vazia") ? "marcada" : "vazia";
});

window.addEventListener("mousemove", function (evento) {
  if (!mousePressionado) return;

  // Se o mouse se mover mais de 5 pixels, consideramos que é um arraste
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

    // Aplica o estado alvo nas casas percorridas pelo mouse
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

  if (MODO_DEPURACAO) {
    console.table(posicoesPugs);
  }
}
