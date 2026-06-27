import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  const loadingScreen = document.getElementById("loading-screen");

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    // 1. Verifica permissão de admin
    const q = query(
      collection(db, "clientes"),
      where("email", "==", user.email),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty || snapshot.docs[0].data().role !== "admin") {
      alert("Acesso restrito a administradores.");
      window.location.href = "principal.html";
      return;
    }

    // 2. Carrega as métricas (Lógica direta, sem funções inexistentes)
    const agendamentosRef = collection(db, "agendamentos");
    const snap = await getDocs(agendamentosRef);
    const anosDisponiveis = new Set();

    // Helpers
    const safeNumber = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const normalizeStatus = (raw) => {
      if (!raw) return "";
      // remove diacritics, lower case, replace non-word with space
      const s = String(raw)
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .replace(/[-_]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      // normalize common variants
      if (s === "concluido" || s === "conclu" || s === "concluido")
        return "concluido";
      if (s.startsWith("em uso") || s === "emuso") return "em uso";
      if (s === "agendado" || s === "agendar") return "agendado";
      if (s === "cancelado") return "cancelado";
      return s;
    };

    // Aggregators
    let total = 0;
    let receita = 0;
    let cancelados = 0;
    let clientesAguardandoEntrega = 0;

    // NOVAS MÉTRICAS
    let carteira = 0;
    let faturamentoConcluido = 0;
    let locacoesAtivasCount = 0; // CONTAGEM DE PEDIDOS
    let cancelamentosCount = 0;
    let cacambasOcupadas = 0;
    let clientesAtivosQtd = 0;
    let servicosAgendadosPedidos = 0;
    let servicosAgendadosCacambas = 0;
    const statusDistribution = {};
    const bairroDistribution = {};
    const faturamentoMensal = {};
    const metaMensal = {};
    const META_PADRAO = 5000;
    let concluidoCount = 0;

    // Single pass over documents
    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.data) {
        const dataStr = String(data.data);

        if (dataStr.length >= 7) {
          const ano = dataStr.slice(0, 4);
          anosDisponiveis.add(ano);
        }
      }
      total += 1;

      const valor = safeNumber(data.valor);
      receita += valor;

      const status = normalizeStatus(data.status);

      if (status === "agendado") {
        clientesAguardandoEntrega += 1;
        servicosAgendadosPedidos += 1;
        servicosAgendadosCacambas += safeNumber(data.quantidade);
      }

      if (status === "cancelado") {
        cancelados += 1;
        cancelamentosCount += 1;
      }

      if (status !== "cancelado") {
        carteira += valor;
      }

      if (status === "concluido") {
        faturamentoConcluido += valor;
        concluidoCount += 1;

        const mes = data.data ? String(data.data).slice(0, 7) : null;
        if (mes) {
          faturamentoMensal[mes] = (faturamentoMensal[mes] || 0) + valor;
        }
      }

      // Caçambas ocupadas: soma quantidade quando em uso
      if (status === "em uso") {
        cacambasOcupadas += safeNumber(data.quantidade);
      }

      // Clientes únicos
      // Clientes ativos (CAÇAMBAS NA RUA)
      if (status === "em uso") {
        clientesAtivosQtd += 1;
      }

      // Distribuições
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
      if (data.bairro)
        bairroDistribution[data.bairro] =
          (bairroDistribution[data.bairro] || 0) + 1;
    });

    // Update original UI elements (preserve existing metrics)
    const elFaturamento = document.getElementById("total-faturamento");
    const elAtendimentos = document.getElementById("total-atendimentos");
    const elCancelamento = document.getElementById("valor-cancelamento");

    if (elFaturamento) elFaturamento.innerText = `R$ ${receita.toFixed(2)}`;
    if (elAtendimentos) elAtendimentos.innerText = total;
    if (elCancelamento)
      elCancelamento.innerText =
        total > 0 ? `${((cancelados / total) * 100).toFixed(0)}%` : "0%";

    // 4. Sucesso: esconde o loading
    if (loadingScreen) loadingScreen.style.display = "none";

    // (Duplicated aggregation removed) single-pass aggregation already computed above

    // Caçambas Disponíveis: lê configurações/geral -> totalCacambas (fallback seguro)
    let cacambasDisponiveis = 0;
    try {
      const configDoc = await getDoc(doc(db, "configuracoes", "geral"));
      const totalCacambas =
        (configDoc.exists() && safeNumber(configDoc.data().totalCacambas)) || 0;
      cacambasDisponiveis = Math.max(
        0,
        totalCacambas - (cacambasOcupadas + servicosAgendadosCacambas),
      );
    } catch (e) {
      console.warn("Erro ao carregar total de caçambas:", e);
    }

    // Ticket Médio: faturamentoConcluido / quantidade de concluidos (seguro)
    let ticketMedio = 0;
    if (concluidoCount > 0) {
      ticketMedio = faturamentoConcluido / concluidoCount;
    }

    // Atualiza os novos elementos
    const els = {
      "valor-carteira": `R$ ${carteira.toFixed(2)}`,
      "valor-faturamento-concluido": `R$ ${faturamentoConcluido.toFixed(2)}`,
      "valor-servicos-agendados": `${servicosAgendadosPedidos} (${servicosAgendadosCacambas})`,
      "valor-cancelamentos": cancelamentosCount.toString(),
      "valor-cacambas-ocupadas": cacambasOcupadas.toString(),
      "valor-cacambas-disponiveis": cacambasDisponiveis.toString(),
      "valor-ticket-medio": `R$ ${ticketMedio.toFixed(2)}`,
      "valor-clientes-ativos": clientesAtivosQtd.toString(),
      "valor-clientes-aguardando": clientesAguardandoEntrega.toString(),
    };

    Object.keys(els).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerText = els[id];
    });
    const yearSelect = document.getElementById("filter-year");

    if (yearSelect) {
      [...anosDisponiveis]
        .sort((a, b) => b.localeCompare(a))

        .forEach((ano) => {
          const option = document.createElement("option");
          option.value = ano;
          option.textContent = ano;
          yearSelect.appendChild(option);
        });
    }

    // ============================================
    // GRÁFICOS ADICIONADOS
    // ============================================

    // Gráfico de Locações por Status
    const statusCtx = document.getElementById("statusChart");
    if (statusCtx) {
      const statusLabels = Object.keys(statusDistribution);
      const statusData = Object.values(statusDistribution);
      new Chart(statusCtx, {
        type: "doughnut",
        data: {
          labels: statusLabels.map(
            (s) => s.charAt(0).toUpperCase() + s.slice(1),
          ),
          datasets: [
            {
              data: statusData,
              backgroundColor: ["#7c3aed", "#22c55e", "#ff4d4d", "#f59e0b"],
              borderColor: "#1a1a1d",
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: "#282828" } },
          },
          scales: {
            x: { ticks: { color: "#282828" }, grid: { color: "#333333" } },
            y: {
              beginAtZero: true, // Garante que o gráfico comece no zero
              ticks: {
                ticks: { color: "#282828" },
                callback: (value) => `R$ ${value.toLocaleString()}`,
              },
              grid: { color: "#333333" },
            },
          },
        },
      });
    }

    // Gráfico de Locações por Bairro
    const bairroCtx = document.getElementById("bairroChart");
    if (bairroCtx) {
      const bairroLabels = Object.keys(bairroDistribution).slice(0, 10);
      const bairroData = bairroLabels.map((b) => bairroDistribution[b]);
      new Chart(bairroCtx, {
        type: "bar",
        data: {
          labels: bairroLabels,
          datasets: [
            {
              label: "Locações",
              data: bairroData,
              backgroundColor: "#7c3aed",
              borderColor: "#a78bfa",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: "y",
          plugins: {
            legend: {
              labels: { color: "#282828", font: { size: 12 } },
            },
          },
          scales: {
            x: {
              ticks: { color: "#282828" },
              grid: { color: "#333333" },
            },
            y: {
              ticks: { color: "#282828" },
              grid: { color: "#333333" },
            },
          },
        },
      });
    }
  } catch (e) {
    console.error("Erro ao carregar dashboard:", e);
    // Mesmo com erro, esconde o loading para não travar a tela do usuário
    if (loadingScreen) loadingScreen.style.display = "none";
  }
});
