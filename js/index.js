import { db, auth } from './firebase.js';
import {
  addDoc, collection, serverTimestamp,
  query, where, orderBy, limit, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { generatePDFReceipt } from './receipt.js';


// === Constants ===
const FRONT_AXLE_LIMIT = 8000;
const REAR_AXLE_LIMIT = 10500;
const TOTAL_VEHICLE_LIMIT = 18000;
const REWEIGH_WINDOW_MINUTES = 10;

// === State Variables ===
let axleWeight = 0;
let rearAxleWeight = 0;
let totalWeight = 0;
let reweighCount = 0;
let vehicleOnDeck = false;

// === Auth & Role Check ===
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const data = userDoc.exists() ? userDoc.data() : {};
  const displayName = data.displayName || user.email.split("@")[0];

  document.getElementById("currentUser").textContent = displayName.toUpperCase();
  localStorage.setItem("username", displayName);
  localStorage.setItem("role", data.role || "user");

  if (data.role !== "admin") {
    document.getElementById("downloadCSVBtn")?.style.setProperty("display", "none");
  }
});

// === Utility Functions ===
function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
}

function loadVehicleCount() {
  const countData = JSON.parse(localStorage.getItem("vehicleCountData")) || {};
  return countData[getTodayKey()] || 0;
}

function saveVehicleCount(count) {
  const countData = JSON.parse(localStorage.getItem("vehicleCountData")) || {};
  countData[getTodayKey()] = count;
  localStorage.setItem("vehicleCountData", JSON.stringify(countData));
}

function updateVehicleCountDisplay() {
  const count = loadVehicleCount();
  document.getElementById("vehicleCount").textContent = `Vehicles Weighed Today: ${count}`;
}

function generateRandomWeight(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomPlate() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const first = letters[Math.floor(Math.random() * letters.length)];
  const second = letters[Math.floor(Math.random() * letters.length)];
  const digits = Math.floor(100 + Math.random() * 900);
  const suffix = "Q";
  return `K${first}${second} ${digits}${suffix}`;
}

function setWeightClass(el, value, limit) {
  el.classList.remove("safe", "warning", "overload");
  if (value > limit) {
    el.classList.add("overload");
    el.title = "Overload! Exceeds legal limit.";
  } else if (value > limit * 0.9) {
    el.classList.add("warning");
    el.title = "Warning: Near legal limit.";
  } else {
    el.classList.add("safe");
    el.title = "";
  }
}

function showModal(message) {
  const modal = document.getElementById("customModal");
  const modalMessage = document.getElementById("modalMessage");
  const modalOkBtn = document.getElementById("modalOkBtn");

  modalMessage.textContent = message;
  modal.classList.remove("hidden");
  modalOkBtn.onclick = () => modal.classList.add("hidden");
}

async function getLastWeighEntry(plate) {
  const q = query(
    collection(db, "weighLogs"),
    where("plate", "==", plate),
    orderBy("timestamp", "desc"),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) return snapshot.docs[0].data();
  return null;
}

export async function saveWeighData(data) {
  const user = auth.currentUser;
  if (!user) return;
  await addDoc(collection(db, "weighLogs"), {
    ...data,
    userId: user.uid,
    timestamp: serverTimestamp()
  });
}

// === Finish Handling ===
async function handleFinishWeighing(plate) {
  try {
    const q = query(
      collection(db, "weighLogs"),
      where("plate", "==", plate),
      orderBy("timestamp", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      showModal("Could not generate PDF. No data found.");
      return;
    }

    const latest = snapshot.docs[0].data();
    latest.timestamp = latest.timestamp?.toDate().toLocaleString() || new Date().toLocaleString();
    if (!latest.officer && latest.user) latest.officer = latest.user;

    generatePDFReceipt(latest);
  } catch (error) {
    console.error("Error fetching latest weigh log:", error);
    showModal("Error generating receipt. Please try again.");
  }
}

// === Main Logic ===
document.addEventListener("DOMContentLoaded", () => {
  const currentDateSpan = document.getElementById("currentDate");
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  currentDateSpan.textContent = today.toLocaleDateString('en-US', options);

  updateVehicleCountDisplay();

  const simulateBtn = document.getElementById("simulateBtn");
  const scanBtn = document.getElementById("scanPlateBtn");
  const editBtn = document.getElementById("editPlateBtn");
  const plateInput = document.getElementById("plateNumber");
  const frontImage = document.getElementById("frontImage");
  const sideImage = document.getElementById("sideImage");
  const frontPlaceholder = document.getElementById("frontPlaceholder");
  const sidePlaceholder = document.getElementById("sidePlaceholder");
  const deckStatus = document.getElementById("deckStatus");
  const takeWeightBtn = document.getElementById("takeWeightBtn");
  const finishBtn = document.getElementById("finishBtn");
  const axleWeightEl = document.getElementById("axleWeight");
  const rearAxleWeightEl = document.getElementById("rearAxleWeight");
  const totalWeightEl = document.getElementById("totalWeight");

  const toggle = document.getElementById("dropdownToggle");
  const menu = document.getElementById("dropdownMenu");

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      menu.classList.toggle("show");
    });

    // Optional: Hide menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!toggle.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove("show");
      }
    });
  }


  const themeToggle = document.getElementById("toggleTheme");

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
      const newTheme = currentTheme === "light" ? "dark" : "light";

      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
    });

    // Load saved theme on startup
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }


  simulateBtn.addEventListener("click", () => {
    if (vehicleOnDeck) return showModal("A vehicle is already on the deck.");
    frontImage.src = "images/front.png";
    sideImage.src = "images/side.png";
    frontPlaceholder.style.display = "none";
    sidePlaceholder.style.display = "none";
    frontImage.style.display = "block";
    sideImage.style.display = "block";
    deckStatus.innerHTML = '<span>Deck Status:</span> ✅ Vehicle on deck';
    plateInput.value = generateRandomPlate();
    plateInput.disabled = true;
    vehicleOnDeck = true;
    takeWeightBtn.disabled = false;
    finishBtn.disabled = true;
  });

  scanBtn.addEventListener("click", () => {
    plateInput.value = generateRandomPlate();
    plateInput.disabled = true;
  });

  editBtn.addEventListener("click", () => {
    plateInput.disabled = false;
    plateInput.focus();
  });

  takeWeightBtn.addEventListener("click", () => {
    if (!vehicleOnDeck) return showModal("No vehicle on deck. Simulate first.");
    axleWeight = rearAxleWeight = totalWeight = 0;
    axleWeightEl.textContent = rearAxleWeightEl.textContent = totalWeightEl.textContent = "0";
    finishBtn.disabled = true;

    setTimeout(() => {
      axleWeight = generateRandomWeight(2000, 8000);
      axleWeightEl.textContent = axleWeight;
      showModal("Front axle captured. Please wait while total weight is being measured...");

      setTimeout(() => {
        totalWeight = axleWeight + generateRandomWeight(3000, 12000);
        rearAxleWeight = totalWeight - axleWeight;

        totalWeightEl.textContent = totalWeight;
        rearAxleWeightEl.textContent = rearAxleWeight;

        setWeightClass(axleWeightEl, axleWeight, FRONT_AXLE_LIMIT);
        setWeightClass(rearAxleWeightEl, rearAxleWeight, REAR_AXLE_LIMIT);
        setWeightClass(totalWeightEl, totalWeight, TOTAL_VEHICLE_LIMIT);

        finishBtn.disabled = false;
        showModal("Weight captured successfully. Please click 'Finish' to complete.");
      }, 2000);
    }, 1000);
  });

  finishBtn.addEventListener("click", async () => {
    if (!vehicleOnDeck) return showModal("No vehicle to finish.");
    const plate = plateInput.value.trim().toUpperCase();
    const now = new Date();
    const username = localStorage.getItem("username") || auth.currentUser?.email;
    const role = localStorage.getItem("role") || "user";

    const lastEntry = await getLastWeighEntry(plate);
    let statusMessage = "";

    if (lastEntry && (now - lastEntry.timestamp.toDate()) < REWEIGH_WINDOW_MINUTES * 60 * 1000) {
      reweighCount++;
      statusMessage = `Reweigh recorded for ${plate}.`;
    } else {
      reweighCount = 0;
      let count = loadVehicleCount();
      count++;
      saveVehicleCount(count);
      updateVehicleCountDisplay();
      statusMessage = `New vehicle weighed: ${plate}.`;
    }

    await saveWeighData({
      plate,
      frontAxle: axleWeight,
      rearAxle: rearAxleWeight,
      totalWeight,
      user: username,
      role,
      reweighCount
    });

    frontImage.src = sideImage.src = "";
    frontImage.style.display = sideImage.style.display = "none";
    frontPlaceholder.style.display = sidePlaceholder.style.display = "block";
    deckStatus.innerHTML = '<span>Deck Status:</span> No vehicle on deck';
    axleWeight = rearAxleWeight = totalWeight = 0;
    axleWeightEl.textContent = rearAxleWeightEl.textContent = totalWeightEl.textContent = "0";
    vehicleOnDeck = false;
    plateInput.value = "";
    plateInput.disabled = true;
    takeWeightBtn.disabled = true;
    finishBtn.disabled = true;

    handleFinishWeighing(plate);
    showModal(`${statusMessage} Weighing complete.`);
  });

  // === Logout ===
  document.getElementById("logoutLink").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });
});
