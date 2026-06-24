import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

/**
 * Verifica usuário logado e retorna dados completos
 */
export function observeAuth(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }

    const userRef = doc(db, "clientes", user.uid);
    const snap = await getDoc(userRef);

    const userData = snap.exists() ? snap.data() : {};

    callback({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      ...userData,
    });
  });
}
