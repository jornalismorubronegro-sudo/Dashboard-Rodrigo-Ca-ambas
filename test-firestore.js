import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

async function testarConexao() {
  try {
    const ref = collection(db, "agendamentos");
    const snapshot = await getDocs(ref);

    console.log("TOTAL DOCUMENTOS:", snapshot.size);

    snapshot.forEach((doc) => {
      console.log("DOC:", doc.id, doc.data());
    });
  } catch (error) {
    console.error("ERRO AO LER FIRESTORE:", error);
  }
}

testarConexao();
