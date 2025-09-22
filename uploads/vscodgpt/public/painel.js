// painel/painel.js

const listaPremios = document.getElementById("lista-premios");
const btnAddPremio = document.getElementById("add-premio");

// Elementos de configuração geral
const descricaoTopoInput = document.getElementById("descricaoTopo");
const logoSuperiorInput = document.getElementById("logoSuperior");
const logoCentroInput = document.getElementById("logoCentro");
const corFundoTemaInput = document.getElementById("corFundoTema");
const textoPopupInput = document.getElementById("textoPopup");
const linkWhatsappInput = document.getElementById("linkWhatsapp");
const textoWhatsappInput = document.getElementById("textoWhatsapp");

// Função para criar um campo de prêmio com todas as propriedades
function criarPremio(premio = { texto: "", cor: "#ffffff", img: "", imgSize: 80 }) {
  const div = document.createElement("div");
  div.classList.add("premio-item");

  div.innerHTML = `
    <div class="input-group">
      <label>Texto:</label>
      <input type="text" class="premio-texto" value="${premio.texto}" placeholder="Nome do prêmio">
    </div>
    <div class="input-group">
      <label>Cor:</label>
      <input type="color" class="premio-cor" value="${premio.cor}">
    </div>
    <div class="input-group">
      <label>URL Imagem:</label>
      <input type="text" class="premio-img" value="${premio.img}" placeholder="assets/p1.png">
    </div>
    <div class="input-group">
      <label>Tam. Imagem:</label>
      <input type="number" class="premio-imgSize" value="${premio.imgSize}" min="10" max="200">
    </div>
    <button type="button" class="btn-remover">Remover</button>
  `;

  div.querySelector(".btn-remover").onclick = () => div.remove();
  listaPremios.appendChild(div);
}

// Função para carregar configuração do servidor
async function carregarConfig() {
  try {
    const res = await fetch("/config");
    const config = await res.json();

    // Preencher campos de configuração geral
    descricaoTopoInput.value = config.descricaoTopo || "";
    logoSuperiorInput.value = config.logoSuperior || "";
    logoCentroInput.value = config.logoCentro || "";
    corFundoTemaInput.value = config.corFundoTema || "#f0f0f0";
    textoPopupInput.value = config.textoPopup || "";
    linkWhatsappInput.value = config.linkWhatsapp || "";
    textoWhatsappInput.value = config.textoWhatsapp || "";

    listaPremios.innerHTML = ""; // limpa lista
    if (config.premios && config.premios.length > 0) {
      config.premios.forEach(p => criarPremio(p));
    }
  } catch (err) {
    console.error("Erro ao carregar configuração:", err);
  }
}

// Função para salvar configuração no servidor
async function salvarConfig() {
  const premiosColetados = Array.from(listaPremios.querySelectorAll(".premio-item")).map(item => ({
    texto: item.querySelector(".premio-texto").value.trim(),
    cor: item.querySelector(".premio-cor").value,
    img: item.querySelector(".premio-img").value.trim(),
    imgSize: parseInt(item.querySelector(".premio-imgSize").value, 10)
  }));

  const configParaSalvar = {
    descricaoTopo: descricaoTopoInput.value.trim(),
    logoSuperior: logoSuperiorInput.value.trim(),
    logoCentro: logoCentroInput.value.trim(),
    corFundoTema: corFundoTemaInput.value,
    textoPopup: textoPopupInput.value.trim(),
    linkWhatsapp: linkWhatsappInput.value.trim(),
    textoWhatsapp: textoWhatsappInput.value.trim(),
    premios: premiosColetados.filter(p => p.texto !== "") // Filtra prêmios vazios
  };

  try {
    const res = await fetch("/salvar-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(configParaSalvar)
    });

    const result = await res.json();
    alert(result.message || "Configuração salva!");
  } catch (err) {
    console.error("Erro ao salvar configuração:", err);
    alert("Erro ao salvar configuração!");
  }
}

// Evento para adicionar novo prêmio
btnAddPremio.addEventListener("click", () => criarPremio());

// Carregar config ao abrir o painel
carregarConfig();


