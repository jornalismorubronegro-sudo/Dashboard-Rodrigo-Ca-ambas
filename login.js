import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  query,
  where,
  getDocs,
  collection,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// Inicialização
function initializeLogin() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const email = document.getElementById("emailInput").value.trim();
    const password = document.getElementById("passwordInput").value;

    if (!email || !password) {
      alert("Por favor, preencha todos os campos");
      return;
    }
    performLogin(email, password);
  });
}

// A função que estava faltando
async function performLogin(email, password) {
  const loginBtn = document.querySelector(".login-button--primary");
  loginBtn.disabled = true;
  loginBtn.textContent = "Entrando...";

  try {
    // 1. Autentica no Firebase Auth
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Autenticado com sucesso!");

    // 2. Redireciona direto para a tela principal
    window.location.href = "principal.html";
  } catch (err) {
    console.error("Erro no login:", err);
    alert("E-mail ou senha incorretos.");

    // Libera o botão novamente em caso de erro
    loginBtn.disabled = false;
    loginBtn.textContent = "Entrar";
  }
}
document.addEventListener("DOMContentLoaded", initializeLogin);
