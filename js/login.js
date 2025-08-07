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
  const loginBtn = document.getElementById("loginBtn");

  if (!loginBtn) {
    console.error("❌ Login button not found in DOM.");
    return;
  }

  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("✅ Logged in as:", user.email);
      console.log("🔑 UID:", user.uid);

      const userDocRef = doc(db, "users", user.uid);
      console.log("📄 Checking Firestore path:", userDocRef.path);

      const userSnap = await getDoc(userDocRef);
      console.log("🧾 Snapshot exists:", userSnap.exists());

      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log("📦 Firestore data:", userData);

        const role = userData.role || "user";
        localStorage.setItem("username", email);
        localStorage.setItem("role", role);

        const redirectPage = role === "admin" ? "admin.html" : "index.html";
        console.log("➡️ Redirecting to:", redirectPage);
        window.location.replace(redirectPage);
      } else {
        console.warn("⚠️ Firestore document not found!");
        alert("User record not found in Firestore. Please contact admin.");
        await signOut(auth);
      }
    } catch (error) {
      console.error("❌ Login failed:", error);
      alert("Login failed: " + error.message);
    }
  });
});
