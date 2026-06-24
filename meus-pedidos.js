import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const lista = document.getElementById("lista-pedidos");

// 🔧 normaliza status (evita erro de "Concluído", "concluido ", etc)
const normalizeStatus = (raw) => {
  if (!raw) return "";
  return String(raw)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
};

async function carregarPedidos() {
  lista.innerHTML = "";

  try {
    const snap = await getDocs(collection(db, "agendamentos"));

    if (snap.empty) {
      lista.innerHTML = "<p>Nenhum pedido encontrado.</p>";
      return;
    }

    snap.forEach((d) => {
      const data = d.data();
      const status = normalizeStatus(data.status);

      const card = document.createElement("div");
      card.className = "pedido-card";

      card.innerHTML = `
        <div class="pedido-title">
          ${data.nomeCliente || "Sem nome"}
        </div>

        <div class="pedido-info">
          Serviço: ${data.servico || "-"}<br>
          Endereço: ${data.endereco || "-"}<br>
          Quantidade: ${data.quantidade || 1}<br>
          Valor: R$ ${data.valor || 0}<br>
          Status: ${data.status || "-"}
        </div>

        <div class="actions">
          <button class="btn-ok">Concluir</button>
          <button class="btn-cancel">Cancelar</button>
        </div>
      `;

      // ✅ CONCLUIR
      card.querySelector(".btn-ok").onclick = async () => {
        await updateDoc(doc(db, "agendamentos", d.id), {
          status: "concluido",
        });
        carregarPedidos();
      };

      // ❌ CANCELAR
      card.querySelector(".btn-cancel").onclick = async () => {
        await updateDoc(doc(db, "agendamentos", d.id), {
          status: "cancelado",
        });
        carregarPedidos();
      };

      lista.appendChild(card);
    });
  } catch (err) {
    console.error("Erro ao carregar pedidos:", err);
    lista.innerHTML = "<p>Erro ao carregar pedidos.</p>";
  }
}

carregarPedidos();
