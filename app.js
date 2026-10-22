
const STORAGE_KEY = "palmflow_demo_records";

const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll(".nav-button");
const form = document.getElementById("laborForm");

function getRecords() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function showPage(pageId) {
  pages.forEach((page) => {
    page.classList.toggle("hidden", page.id !== pageId);
  });

  navButtons.forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.page === pageId
    );
  });
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => {
    showPage(button.dataset.go);
  });
});

function updateDashboard(records) {
  const realizadas = records.filter(
    (record) => record.estado === "Realizado"
  );

  document.getElementById("totalRegistros").textContent =
    records.length;

  document.getElementById("totalDescapachos").textContent =
    realizadas.filter(
      (record) => record.labor === "Descapacho"
    ).length;

  document.getElementById("totalAplicaciones").textContent =
    realizadas.filter(
      (record) => record.labor === "Aplicación"
    ).length;
}

function renderHistory(records) {
  const body = document.getElementById("historialBody");
  const emptyMessage = document.getElementById("emptyMessage");

  body.replaceChildren();

  emptyMessage.hidden = records.length > 0;

  [...records].reverse().forEach((record) => {
    const row = document.createElement("tr");

    const values = [
      `S${record.sector} · L${record.linea} · P${record.palma}`,
      record.labor,
      record.estado,
      record.fecha
    ];

    values.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    body.appendChild(row);
  });
}

function refreshApp() {
  const records = getRecords();
  updateDashboard(records);
  renderHistory(records);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(form);

  const record = {
    id: crypto.randomUUID(),
    sector: data.get("sector").trim(),
    linea: data.get("linea").trim(),
    palma: data.get("palma").trim(),
    labor: data.get("labor"),
    estado: data.get("estado"),
    observaciones: data.get("observaciones").trim(),
    fecha: new Date().toLocaleString("es-CO")
  };

  const records = getRecords();
  records.push(record);
  saveRecords(records);

  refreshApp();
  form.reset();
  showPage("historial");

  alert("Registro de demostración guardado.");
});

refreshApp();
