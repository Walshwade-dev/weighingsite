import { auth, db } from './firebase.js';
import {
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  if (!loginForm) {
    console.error("Login form not found.");
    return;
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("User UID:", user.uid);

      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const role = userData.role || "user";

        localStorage.setItem("username", email);
        localStorage.setItem("role", role);

        window.location.href = role === "admin" ? "admin.html" : "index.html";
      } else {
        alert("User record not found in Firestore. Please contact admin.");
        await signOut(auth);
      }

    } catch (error) {
      alert("Login failed: " + error.message);
    }
  });
});
