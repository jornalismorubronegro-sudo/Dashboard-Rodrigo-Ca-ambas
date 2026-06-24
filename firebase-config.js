import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCRkIeBCkJp_RBPR-dj-dQSZ3lK5_Nr8Nk",
  authDomain: "dashboard-rodrigo-ca.firebaseapp.com",
  projectId: "dashboard-rodrigo-ca",
  storageBucket: "dashboard-rodrigo-ca.firebasestorage.app",
  messagingSenderId: "718174252886",
  appId: "1:718174252886:web:a0fc6c2de5a1859fbf30f7",
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// 🔥 EXPORTA OS SERVIÇOS QUE VAMOS USAR
export const db = getFirestore(app);
export const auth = getAuth(app);
