import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  query,
  where,
  getDocs,
  collection,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { setupPushNotifications } from "./notificationService.js";

function initPrincipalPage() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    // Busca dados do usuário para exibir o nome
    const q = query(
      collection(db, "clientes"),
      where("email", "==", user.email),
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      const nameEl = document.getElementById("nome-cliente");
      if (nameEl) nameEl.innerText = data.nome || "Cliente";
    }

    setupPushNotifications(user.uid);
  });

  // Lógica do Botão Sair (Event Delegation)
  document.addEventListener("click", async (e) => {
    if (e.target && e.target.id === "logoutBtn") {
      try {
        await signOut(auth);
        window.location.href = "index.html";
      } catch (err) {
        console.error("Erro ao sair:", err);
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", initPrincipalPage);
