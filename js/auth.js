// js/auth.js
import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export function checkAuth(expectedRole) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
    } else {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) return signOut(auth);

      const userData = userDoc.data();
      if (userData.role !== expectedRole) {
        alert("Access Denied: Wrong role");
        signOut(auth);
        window.location.href = "login.html";
      }
    }
  });
}

