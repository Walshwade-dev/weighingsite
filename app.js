// app.js

const plateInput = document.getElementById('plateNumber');
const scanBtn = document.getElementById('scanPlateBtn');
const editBtn = document.getElementById('editPlateBtn');
const takeWeightBtn = document.getElementById('takeWeightBtn');
const deckWeightsContainer = document.getElementById('deckWeights');
const toggleThemeBtn = document.getElementById('toggleTheme');
const frontImage = document.getElementById('frontImage');
const sideImage = document.getElementById('sideImage');
const deckStatus = document.getElementById('deckStatus');
const vehicleCountSpan = document.getElementById('vehicleCount');
const modal = document.getElementById('customModal');
const modalMessage = document.getElementById('modalMessage');
const modalOkBtn = document.getElementById('modalOkBtn');
const frontPlaceholder = document.getElementById('frontPlaceholder');
const sidePlaceholder = document.getElementById('sidePlaceholder');

let frontAxleWeight = 0;
let totalWeight = 0;
let step = 0;
let vehicleCount = 0;
let firstWeighTime = null;
let currentPlate = "";
let vehicleOnDeck = false;

// Theme toggle
if (toggleThemeBtn) {
  toggleThemeBtn.addEventListener('click', () => {
    const html = document.documentElement;
    const isLight = html.getAttribute("data-theme") === "light";
    html.setAttribute("data-theme", isLight ? "dark" : "light");
  });
}

function showModal(message, callback) {
  modal.classList.remove("hidden");
  modalMessage.textContent = message;
  modalOkBtn.onclick = () => {
    modal.classList.add("hidden");
    if (callback) callback();
  };
}

// Load simulated truck images and auto-scan plate
window.addEventListener('DOMContentLoaded', () => {
  resetDeckView();

  setTimeout(() => {
    frontImage.src = '/images/front.png';
    sideImage.src = '/images/side.png';
    frontImage.style.display = "block";
    sideImage.style.display = "block";
    frontPlaceholder.style.display = "none";
    sidePlaceholder.style.display = "none";
    deckStatus.innerHTML = '<span>Deck Status:</span>Vehicle on deck';
    vehicleOnDeck = true;

    setTimeout(() => {
      showModal('Getting plate number...', () => {
        setTimeout(() => {
          plateInput.value = "KPR 001B";
          currentPlate = plateInput.value;
          editBtn.classList.remove("hidden");
          showModal("Plate number appears incorrect. Please edit if necessary.");
        }, 1000);
      });
    }, 500);
  }, 1000);
});

editBtn.addEventListener('click', () => {
  plateInput.disabled = false;
  plateInput.focus();
});

function readWeight(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function displayAxleWeights(front, rear, total) {
  deckWeightsContainer.innerHTML = `
    <p>Front Axle: <strong>${front} kg</strong></p>
    <p>Rear Axle: <strong>${rear} kg</strong></p>
    <hr />
    <p>Total Weight: <strong>${total} kg</strong></p>
  `;
}

function resetDeckView(fullReset = true) {
  frontImage.style.display = "none";
  sideImage.style.display = "none";
  frontPlaceholder.style.display = "block";
  sidePlaceholder.style.display = "block";
  plateInput.value = "";
  plateInput.disabled = true;
  deckStatus.innerHTML = '<span>Deck Status:</span>No vehicle on deck';
  deckWeightsContainer.innerHTML = "";
  frontAxleWeight = 0;
  totalWeight = 0;
  step = 0;
  vehicleOnDeck = false;
  takeWeightBtn.textContent = "Take New Weighs";
  if (fullReset) firstWeighTime = null;
}

takeWeightBtn.addEventListener('click', () => {
  const now = new Date();
  const plate = plateInput.value.trim();

  if (!vehicleOnDeck) {
    showModal("No vehicle on deck. Please wait for a vehicle before weighing.");
    return;
  }

  if (step === 0) {
    // First step: front axle weight
    frontAxleWeight = 0;
    totalWeight = 0;
    displayAxleWeights(0, 0, 0);

    frontAxleWeight = readWeight(2500, 5000);
    displayAxleWeights(frontAxleWeight, "--", "--");
    takeWeightBtn.textContent = "Weigh Total Vehicle";
    step = 1;
    firstWeighTime = now;
    currentPlate = plate;
  } else if (step === 1) {
    if (firstWeighTime && (now - firstWeighTime) > 5 * 60 * 1000 && plate === currentPlate) {
      showModal("Reweighing window (5 mins) expired. Starting new instance.", () => {
        resetDeckView();
      });
      return;
    }

    totalWeight = readWeight(frontAxleWeight + 1500, frontAxleWeight + 6000);
    const rearAxleWeight = totalWeight - frontAxleWeight;
    displayAxleWeights(frontAxleWeight, rearAxleWeight, totalWeight);
    takeWeightBtn.textContent = "Reweigh Vehicle (within 5 mins)";

    if (step !== 2) {
      vehicleCount++;
      vehicleCountSpan.textContent = `Vehicles Weighed Today: ${vehicleCount}`;
    }

    step = 2;
  }
});

// Double-click to restart weighing
if (takeWeightBtn) {
  takeWeightBtn.addEventListener('dblclick', () => {
    if (!vehicleOnDeck) {
      showModal("Cannot reweigh — no vehicle on deck.");
      return;
    }

    frontAxleWeight = 0;
    totalWeight = 0;
    displayAxleWeights(0, 0, 0);
    step = 0;
    takeWeightBtn.textContent = "Reweigh Vehicle (within 5 mins)";
  });
}
