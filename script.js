// ==========================
// ELEMENTOS DAS TELAS
// ==========================

const telaInicial = document.getElementById("telaInicial");
const telaInstrucoes = document.getElementById("telaInstrucoes");
const telaJogo = document.getElementById("telaJogo");


// ==========================
// BOTÕES
// ==========================

const btnInstrucoes = document.getElementById("btnInstrucoes");
const btnVoltar = document.getElementById("btnVoltar");
const btnComecar = document.getElementById("btnComecar");
const btnNovoJogo = document.getElementById("btnNovoJogo");
const btnMenu = document.getElementById("btnMenu");

const botoesDificuldade = document.querySelectorAll(".dificuldade");


// ==========================
// DIFICULDADE
// ==========================

let dificuldadeSelecionada = null;


// ==========================
// TELA DE INSTRUÇÕES
// ==========================

btnInstrucoes.addEventListener("click", () => {

    telaInicial.classList.add("escondido");
    telaInstrucoes.classList.remove("escondido");

});


// ==========================
// VOLTAR AO MENU
// ==========================

btnVoltar.addEventListener("click", () => {

    telaInstrucoes.classList.add("escondido");
    telaInicial.classList.remove("escondido");

});


// ==========================
// SELECIONAR DIFICULDADE
// ==========================

botoesDificuldade.forEach(botao => {

    botao.addEventListener("click", () => {

        botoesDificuldade.forEach(b => {
            b.classList.remove("selecionada");
        });

        botao.classList.add("selecionada");

        dificuldadeSelecionada = botao.dataset.dificuldade;

    });

});


// ==========================
// COMEÇAR JOGO
// ==========================

btnComecar.addEventListener("click", () => {

    if (dificuldadeSelecionada === null) {
        alert("Escolha uma dificuldade primeiro!");
        return;
    }

    telaInicial.classList.add("escondido");
    telaJogo.classList.remove("escondido");

    document.getElementById("dificuldadeAtual").textContent =
        "Dificuldade: " + dificuldadeSelecionada;

    iniciarJogo();

});


// ==========================
// VOLTAR AO MENU
// ==========================

btnMenu.addEventListener("click", () => {

    telaJogo.classList.add("escondido");
    telaInicial.classList.remove("escondido");

});


// ==========================
// NOVO JOGO
// ==========================

btnNovoJogo.addEventListener("click", () => {

    iniciarJogo();

});


// ==========================
// INICIAR JOGO
// ==========================

function iniciarJogo() {

    console.log("Iniciando Doku-Doku...");
    console.log("Dificuldade:", dificuldadeSelecionada);

    // O gerador dos 10 pugs entra aqui.
}