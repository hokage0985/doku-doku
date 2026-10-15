/* ==========================================================
   Doku-Doku — lógica do jogo
   ========================================================== */

/* ---------- Configurações gerais ---------- */

// Quantas cores de região existem no CSS (.regiao-0, .regiao-1, ...).
const NUMERO_DE_CORES = 12;

// Deixe true apenas para testar: mostra as posições dos pugs no console.
const MODO_DEPURACAO = false;

// Limites do gerador (só mexa se a geração começar a falhar).
// (Valores medidos no tabuleiro 10 x 10: cerca de 0,1 s por partida; ajustes
// demais por tentativa deixam a geração mais lenta, não mais confiável.)
const TENTATIVAS_POR_TABULEIRO = 200;
const AJUSTES_POR_TENTATIVA = 40;
const SOLUCOES_POR_RODADA = 12; // quantas soluções erradas são atacadas por rodada de ajustes

/* Configuração por dificuldade.
   "tamanho" é, ao mesmo tempo, o número de linhas, de colunas, de pugs e de
   regiões coloridas (um pug por cor): Fácil = 5 x 5 com 5 pugs, Médio = 8 x 8
   com 8 pugs, Difícil = 10 x 10 com 10 pugs. O tamanho máximo é
   NUMERO_DE_CORES. "vidas" é quantos palpites errados o jogador pode dar
   antes de perder. Tudo o que muda de um nível para outro fica aqui. */
const CONFIG_DIFICULDADES = {
  facil:   { nome: "Fácil",   tamanho: 5,  vidas: 3 },
  medio:   { nome: "Médio",   tamanho: 8,  vidas: 3 },
  dificil: { nome: "Difícil", tamanho: 10, vidas: 3 }
};

// Os quatro vizinhos de uma casa (cima, baixo, esquerda, direita).
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

let tamanhoAtual = 0;      // linhas = colunas = pugs = regiões da partida atual
let vidasIniciais = 0;
let vidas = 0;
let pugsEncontrados = 0;
let jogoTerminado = false;

// Posições secretas dos pugs: lista de { linha, coluna }, índices a partir de 0.
// Ficam apenas aqui, em memória: nada no HTML revela onde eles estão.
let posicoesPugs = [];

// Número da região (cor) de cada casa: mapaRegioes[linha][coluna].
let mapaRegioes = [];

// O que o jogador fez em cada casa: "vazia", "marcada" (X), "pug" ou "errada".
let estadoCasas = [];

// Os elementos HTML das casas: casasDOM[linha][coluna].
let casasDOM = [];

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
  // Escreve no botão o tamanho do tabuleiro e o número de pugs do nível,
  // lendo CONFIG_DIFICULDADES (assim o texto nunca fica diferente do jogo).
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

// Embaralha uma lista (Fisher-Yates) sem alterar a original.
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

// Cria uma matriz n x n preenchida com o valor dado.
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
   Gerador dos pugs (backtracking com ordem aleatória)
   ========================================================== */

// Duas casas são adjacentes quando a diferença de linha e a de coluna
// são ambas menores ou iguais a 1 (inclui as diagonais).
function saoAdjacentes(a, b) {
  return Math.abs(a.linha - b.linha) <= 1 && Math.abs(a.coluna - b.coluna) <= 1;
}

// Diz se um pug pode ser colocado em (linha, coluna), dado o que já foi colocado.
function posicaoValida(linha, coluna, colocados) {
  const candidato = { linha: linha, coluna: coluna };

  for (let i = 0; i < colocados.length; i++) {
    const outro = colocados[i];
    if (outro.linha === linha) return false;           // mesma linha
    if (outro.coluna === coluna) return false;         // mesma coluna
    if (saoAdjacentes(candidato, outro)) return false; // vizinha ou diagonal
  }
  return true;
}

// Gera as posições dos n pugs de um tabuleiro n x n.
// Como não pode haver dois pugs na mesma linha e são n linhas e n pugs,
// cada linha recebe exatamente um pug. O algoritmo percorre as linhas de cima
// para baixo e, em cada uma, testa as colunas em ordem aleatória. Se uma
// escolha impede completar o tabuleiro, ele retrocede e tenta outra coluna.
function gerarPugs(n) {
  const todasAsColunas = [];
  for (let c = 0; c < n; c++) {
    todasAsColunas.push(c);
  }

  const colocados = [];

  function colocarNaLinha(linha) {
    if (linha === n) return true; // todos os pugs foram colocados

    const colunasEmOrdemAleatoria = embaralhar(todasAsColunas);

    for (let i = 0; i < colunasEmOrdemAleatoria.length; i++) {
      const coluna = colunasEmOrdemAleatoria[i];

      if (posicaoValida(linha, coluna, colocados)) {
        colocados.push({ linha: linha, coluna: coluna });

        if (colocarNaLinha(linha + 1)) return true;

        colocados.pop(); // retrocede e tenta outra coluna
      }
    }
    return false;
  }

  if (!colocarNaLinha(0)) {
    throw new Error("Não foi possível gerar uma configuração válida de pugs.");
  }

  return colocados;
}

// Confere uma configuração do zero, sem depender do gerador.
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

/* ==========================================================
   Regiões coloridas
   Cada cor é um bloco de casas ligadas (lado com lado) e tem exatamente
   um pug. Além disso, o tabuleiro precisa ter UMA ÚNICA solução; do
   contrário, um palpite que segue a lógica poderia ser punido.
   ========================================================== */

// Faz crescer n regiões a partir das sementes (a região k nasce na casa
// sementes[k]). A cada passo, sorteia uma região e anexa a ela uma casa livre
// vizinha, então toda região continua ligada.
function crescerRegioes(sementes, n) {
  const mapa = criarMatriz(n, -1);
  sementes.forEach(function (casa, k) {
    mapa[casa.linha][casa.coluna] = k;
  });

  let faltam = n * n - sementes.length;

  while (faltam > 0) {
    // Casas livres encostadas em cada região.
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

// Diz se a região continua inteira e ligada se a casa (ignorarLinha,
// ignorarColuna) deixar de pertencer a ela. Use -1 para não ignorar nenhuma.
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

// Procura soluções do tabuleiro: n pugs, um por linha, coluna e região, sem
// pugs vizinhos. Para assim que achar "limite" soluções. Cada solução é uma
// lista com a coluna do pug de cada linha.
// A busca é por região (backtracking): em cada passo escolhe a região sem pug
// que tem MENOS casas livres e tenta um pug em cada uma. Se alguma região
// ficar sem casa livre, desiste do ramo na hora. Isso poda quase tudo.
function encontrarSolucoes(mapa, n, limite) {
  // Casas de cada região.
  const casasDaRegiao = [];
  for (let r = 0; r < n; r++) casasDaRegiao.push([]);
  for (let l = 0; l < n; l++) {
    for (let c = 0; c < n; c++) {
      casasDaRegiao[mapa[l][c]].push({ linha: l, coluna: c });
    }
  }

  // bloqueios[l][c] = quantos pugs já colocados proíbem aquela casa
  // (mesma linha, mesma coluna ou vizinha/diagonal).
  const bloqueios = criarMatriz(n, 0);
  const regiaoComPug = new Array(n).fill(false);
  const solucao = new Array(n);
  const solucoes = [];

  function alterarBloqueios(linha, coluna, delta) {
    for (let i = 0; i < n; i++) {
      bloqueios[linha][i] += delta;                  // a linha inteira
      if (i !== linha) bloqueios[i][coluna] += delta; // a coluna inteira
    }
    // As quatro diagonais (os vizinhos laterais já estão na linha e na coluna).
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

      if (livres.length === 0) return false; // essa região não tem mais onde pôr o pug

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

// Diz se uma solução (coluna do pug de cada linha) ainda vale no mapa, isto é,
// se seus pugs caem em regiões todas diferentes.
function solucaoValeNoMapa(solucao, mapa, n) {
  const vistas = new Set();
  for (let linha = 0; linha < n; linha++) {
    vistas.add(mapa[linha][solucao[linha]]);
  }
  return vistas.size === n;
}

// Ajusta as regiões até a única solução ser a dos pugs sorteados.
// A cada rodada, busca algumas soluções diferentes da verdadeira. Para cada
// uma, pega uma casa dela (que não seja pug de verdade) e a passa para uma
// região vizinha. Assim aquela solução passa a ter dois pugs na mesma região
// e deixa de valer, enquanto a verdadeira continua valendo. A casa só muda se a
// região de onde ela sai continuar ligada. Devolve false se travar; nesse caso
// o chamador recomeça com outros pugs.
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
      // Só deve restar a verdadeira; se nem ela apareceu, algo está errado.
      return solucoes.length === 1;
    }

    let avancou = false;

    outras.forEach(function (outra) {
      // Um ajuste desta mesma rodada pode já ter eliminado essa solução.
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

    if (!avancou) return false; // travou
  }

  return false;
}

// Confere as regiões do zero: n regiões, todas existentes, ligadas e com
// exatamente um pug cada.
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

// Gera um tabuleiro completo: posições dos pugs + mapa de regiões.
function gerarTabuleiro(n) {
  if (n > NUMERO_DE_CORES) {
    throw new Error("Não há cores suficientes para um tabuleiro " + n + " x " + n + ".");
  }

  for (let tentativa = 0; tentativa < TENTATIVAS_POR_TABULEIRO; tentativa++) {
    const pugs = gerarPugs(n);

    // A ordem das regiões é sorteada, para o número/cor de uma região não
    // revelar em que linha está o pug dela.
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

// Cria as casas. Cada uma recebe id, coordenadas (linha, coluna), a classe da
// cor da sua região e, quando o vizinho de cima/da esquerda é de outra região,
// uma classe para desenhar a divisa. Como o tabuleiro é esvaziado antes,
// chamar esta função de novo nunca duplica casas.
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

      // Cada casa desenha só o seu lado de cima e o da esquerda: linha grossa
      // ("limite") se o vizinho é de outra região, linha fina ("divisa") se é da
      // mesma. A primeira linha e a primeira coluna não precisam (o tabuleiro tem borda).
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

// Atualiza a aparência de uma casa conforme o seu estado.
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
   Interação com o tabuleiro
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

// 1º clique em uma casa vazia: marca um X ("acho que aqui não tem pug").
// Clique seguinte na casa marcada: é um palpite de que ali TEM pug.
//   - Acertou: o pug aparece e a casa fica travada.
//   - Errou: perde uma vida e a casa fica travada com um X vermelho.
// Casas já resolvidas (pug ou errada) não respondem mais.
function tratarCliqueNaCasa(linha, coluna) {
  if (jogoTerminado) return;

  const estado = estadoCasas[linha][coluna];
  if (estado === "pug" || estado === "errada") return;

  if (estado === "vazia") {
    estadoCasas[linha][coluna] = "marcada";
  } else if (temPug(linha, coluna)) {
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

// Um único ouvinte no tabuleiro inteiro (em vez de um por casa). Ele é
// registrado uma vez só, então "Novo Jogo" nunca acumula eventos repetidos.
tabuleiro.addEventListener("click", function (evento) {
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
