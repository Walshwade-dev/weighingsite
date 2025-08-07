import { db } from './firebase.js';
import {
  query,
  collection,
  where,
  getDocs,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// === Auth Protection ===
const role = localStorage.getItem("role");
if (role !== "admin") {
  alert("Access denied. Admins only.");
  window.location.href = "login.html";
}

// === Display Username ===
const username = localStorage.getItem("username");
document.getElementById("currentUser").textContent = username?.toUpperCase() || "ADMIN";

// === Logout ===
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "login.html";
});

// === Fetch Logs by Date ===
async function fetchLogsByDate(isoDateString) {
  const start = Timestamp.fromDate(new Date(`${isoDateString}T00:00:00`));
  const end = Timestamp.fromDate(new Date(`${isoDateString}T23:59:59`));

  const q = query(
    collection(db, "weighLogs"),
    where("timestamp", ">=", start),
    where("timestamp", "<=", end)
  );

  const snapshot = await getDocs(q);
  const logs = [];
  snapshot.forEach(doc => logs.push(doc.data()));
  return logs;
}

// === Handle Date Picker Change ===
document.getElementById("logDatePicker").addEventListener("change", async (e) => {
  const selectedDate = e.target.value;
  if (!selectedDate) return;

  const logs = await fetchLogsByDate(selectedDate);
  renderTable(logs);
  updateSummary(logs);
});

// === Render Table ===
function renderTable(data) {
  const tbody = document.querySelector("#logTable tbody");
  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8">No logs for selected date</td></tr>`;
    return;
  }

  data.forEach(log => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${log.plate}</td>
      <td>${log.frontAxle ?? log.axleWeight ?? 0}</td>
      <td>${log.rearAxle ?? log.rearAxleWeight ?? 0}</td>
      <td>${log.totalWeight ?? 0}</td>
      <td>${log.timestamp?.toDate?.().toLocaleString() || new Date(log.timestamp).toLocaleString()}</td>
      <td>${log.officer || log.user || "Unknown"}</td>
      <td>${log.role || "N/A"}</td>
      <td>${log.reweighCount ?? 0}</td>
    `;
    tbody.appendChild(tr);
  });
}

// === CSV Download ===
document.getElementById("downloadCSVBtn").addEventListener("click", async () => {
  const dateKey = document.getElementById("logDatePicker").value || new Date().toISOString().split("T")[0];
  const logs = await fetchLogsByDate(dateKey);

  if (logs.length === 0) {
    alert(`No records found for ${dateKey}`);
    return;
  }

  let csvContent = "Plate,Front Axle,Rear Axle,Total Weight,Timestamp,Officer,Role,Reweigh Count\n";

  logs.forEach(log => {
    csvContent += [
      log.plate,
      log.frontAxle ?? log.axleWeight ?? 0,
      log.rearAxle ?? log.rearAxleWeight ?? 0,
      log.totalWeight ?? 0,
      log.timestamp?.toDate?.().toLocaleString() || new Date(log.timestamp).toLocaleString(),
      log.officer || log.user || "Unknown",
      log.role || "N/A",
      log.reweighCount ?? 0
    ].join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `weigh_log_${dateKey}.csv`;
  link.click();
});

// === Summary Section ===
function updateSummary(entries) {
  const summary = document.getElementById("summaryContainer");

  if (entries.length) {
    summary.innerHTML = `
      <p><strong>Total Entries:</strong> ${entries.length}</p>
      <p><strong>Unique Vehicles:</strong> ${[...new Set(entries.map(e => e.plate))].length}</p>
    `;
  } else {
    summary.innerHTML = "<p>No weigh-ins recorded for selected date.</p>";
  }
}

// === Init: Load today's logs on page load ===
(async () => {
  const todayKey = new Date().toISOString().split("T")[0];
  document.getElementById("logDatePicker").value = todayKey;

  const initialLogs = await fetchLogsByDate(todayKey);
  renderTable(initialLogs);
  updateSummary(initialLogs);
})();
