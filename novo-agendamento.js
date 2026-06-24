import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const form = document.getElementById("formNovoAgendamento");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Cria o objeto com todos os dados do formulário
  const novoAgendamento = {
    nomeCliente: document.getElementById("nomeCliente").value,
    telefone: document.getElementById("telefone").value,
    cpfCnpj: document.getElementById("cpfCnpj").value,
    endereco: document.getElementById("enderecoEntrega").value,
    bairro: document.getElementById("bairro").value,
    cidade: document.getElementById("cidade").value,
    quantidade: document.getElementById("quantidade").value,
    valor: document.getElementById("valorLocacao").value,
    dataEntrega: document.getElementById("dataEntrega").value,
    dataRetirada: document.getElementById("dataRetirada").value,
    status: document.getElementById("statusLocacao").value,
    observacoes: document.getElementById("observacoes").value,
    criadoEm: new Date().toISOString(),
  };

  try {
    await addDoc(collection(db, "agendamentos"), novoAgendamento);

    // Exibe a mensagem de sucesso
    const msg = document.getElementById("feedback-msg");
    msg.style.display = "block";

    // Aguarda 2 segundos e redireciona
    setTimeout(() => {
      window.location.href = "principal.html";
    }, 2000);
  } catch (error) {
    console.error("Erro ao salvar:", error);
    alert("Erro ao salvar locação. Verifique o console.");
  }
});
