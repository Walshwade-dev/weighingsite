// app.js

const plateInput = document.getElementById('plateNumber');
const scanBtn = document.getElementById('scanPlateBtn');
const editBtn = document.getElementById('editPlateBtn');
const takeWeightBtn = document.getElementById('takeWeightBtn');
const deckWeightsContainer = document.getElementById('deckWeights');
const toggleThemeBtn = document.getElementById('toggleTheme');
const frontImage = document.getElementById('frontImage');
const sideImage = document.getElementById('sideImage');

let frontAxleWeight = 0;
let totalWeight = 0;
let step = 0;

// Theme toggle
if (toggleThemeBtn) {
  toggleThemeBtn.addEventListener('click', () => {
    const html = document.documentElement;
    const isLight = html.getAttribute("data-theme") === "light";
    html.setAttribute("data-theme", isLight ? "dark" : "light");
  });
}

// Load simulated truck images and auto-scan plate
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    frontImage.src = '/images/front.png';
    sideImage.src = '/images/side.png';

    setTimeout(() => {
      alert('Getting plate number...');

      setTimeout(() => {
        plateInput.value = "KPR 001B"; // wrong/mistaken plate
        editBtn.classList.remove("hidden");
        alert("Plate number appears incorrect. Please edit if necessary.");
      }, 1000);

    }, 500);
  }, 500);
});

editBtn.addEventListener('click', () => {
  plateInput.disabled = false;
  plateInput.focus();
});

// Simulated weight reading from indicator
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

// Simulate axle-by-axle weighing logic
// Step 1: Front axle only
// Step 2: Full vehicle for total weight

takeWeightBtn.addEventListener('click', () => {
  if (step === 0) {
    frontAxleWeight = readWeight(2500, 5000); // front axle
    displayAxleWeights(frontAxleWeight, "--", "--");
    takeWeightBtn.textContent = "Weigh Total Vehicle";
    step = 1;
  } else {
    totalWeight = readWeight(frontAxleWeight + 1500, frontAxleWeight + 6000); // total must be greater than front
    let rearAxleWeight = totalWeight - frontAxleWeight;
    displayAxleWeights(frontAxleWeight, rearAxleWeight, totalWeight);
    takeWeightBtn.textContent = "Restart Weighing";
    step = 2;
  }
});

// Allow restarting the process
if (takeWeightBtn) {
  takeWeightBtn.addEventListener('dblclick', () => {
    step = 0;
    frontAxleWeight = 0;
    totalWeight = 0;
    deckWeightsContainer.innerHTML = "";
    plateInput.value = "";
    plateInput.disabled = true;
    takeWeightBtn.textContent = "Weigh Front Axle";
  });
}