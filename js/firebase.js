import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCAa5Nq36drZhFJ3ErukbRSANxh-PQ_m2A",
    authDomain: "weighbridge-system-b70c0.firebaseapp.com",
    projectId: "weighbridge-system-b70c0",
    storageBucket: "weighbridge-system-b70c0.firebasestorage.app",
    messagingSenderId: "113791475541",
    appId: "1:113791475541:web:18fd39c89502cf44a319dc"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// You can now use auth and db in your app
export {auth, db};