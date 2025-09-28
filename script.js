// Data for drikkevarer
const drikkedata = {
  "Øl/cider": [
    { volum: 0.5, visning: "0,5 liter", prosent: 4.5 },
    { volum: 0.33, visning: "0,33 liter", prosent: 4.5 },
  ],
  "Vin": [
    { volum: 0.125, visning: "125 cl (glass)", prosent: 12 },
    { volum: 0.75, visning: "0,75 liter (flaske)", prosent: 12 },
    { volum: 3, visning: "3 liter", prosent: 12 },
  ],
  "Brennevin": [
    { volum: 0.04, visning: "4 cl (shot)", prosent: 40 },
    { volum: 0.5, visning: "0,5 liter", prosent: 40 },
    { volum: 0.7, visning: "0,7 liter", prosent: 40 },
  ]
};

// Globale variabler
const kalkulatorDiv = document.getElementById("kalkulator");
const egendefinertSeksjon = document.getElementById("egendefinertseksjon");
let egendefinertH2;
let egendefinertTable;

// Initialiser kalkulatoren
function initKalkulator() {
  for (const kategori in drikkedata) {
    const h2 = document.createElement("h2");
    h2.textContent = kategori;
    kalkulatorDiv.appendChild(h2);

    const table = lagTabell(kategori, drikkedata[kategori]);
    kalkulatorDiv.appendChild(table);
  }
  
  // Initial oppdatering ved innlasting
  oppdaterKalkulasjon();
}

// Vis egendefinert seksjon
function visEgendefinert() {
  egendefinertSeksjon.style.display = "block";
  if (!egendefinertTable) {
    egendefinertH2 = document.createElement("h2");
    egendefinertH2.textContent = "Egendefinert";
    egendefinertSeksjon.appendChild(egendefinertH2);

    egendefinertTable = lagTabell("Egendefinert", [], true);
    egendefinertSeksjon.appendChild(egendefinertTable);
  } else {
    leggTilEgendefinertRad();
  }
}

// Lag tabell for kategori
function lagTabell(kategori, rader, egendefinert = false) {
  // Wrapper for horizontal scrolling på mobile
  const tableContainer = document.createElement("div");
  tableContainer.className = "table-container";
  
  const table = document.createElement("table");
  table.dataset.kategori = kategori;

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Volum</th>
      <th>Alkohol%</th>
      <th>Antall</th>
      <th>AE</th>
    </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  table.appendChild(tbody);
  
  tableContainer.appendChild(table);

  if (!egendefinert) {
    rader.forEach(({ volum, visning, prosent }) => {
      const tr = document.createElement("tr");
      tr.dataset.volume = volum;
      tr.innerHTML = `
        <td>${visning}</td>
        <td><div class="prosent-wrapper"><input type="number" class="prosent" value="${prosent}" step="any"></div></td>
        <td><input type="number" class="antall" value="0" step="any"></td>
        <td class="ae"></td>`;
      tbody.appendChild(tr);
      leggTilLyttere(tr);
    });
  } else {
    leggTilEgendefinertRad(tbody);
  }

  return tableContainer;
}

// Legg til egendefinert rad
function leggTilEgendefinertRad(tbody = null) {
  if (!tbody) {
    tbody = document.querySelector("table[data-kategori='Egendefinert'] tbody");
  }
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="number" class="volum" step="any" placeholder="Liter"></td>
    <td><div class="prosent-wrapper"><input type="number" class="prosent" step="any" placeholder="Alkoholprosent"></div></td>
    <td><input type="number" class="antall" value="0" step="any"></td>
    <td class="ae"><button class="fjern-knapp" onclick="fjernRad(this)">&times;</button></td>`;
  tbody.appendChild(tr);
  leggTilLyttere(tr);
}

// Legg til event listeners for input-felt
function leggTilLyttere(tr) {
  const inputs = tr.querySelectorAll("input");
  inputs.forEach(input => {
    const initial = input.value;
    let touched = false;
    
    // Bedre mobilopplevelse - unngå zoom på focus
    if (input.type === "number") {
      input.addEventListener("focus", () => {
        // Scroll til element på mobile enheter
        if (window.innerWidth <= 480) {
          setTimeout(() => {
            input.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 300);
        }
        
        if (!touched && (input.value === initial || input.value === "0")) {
          input.value = "";
        }
      });
      
      // Bedre touch-respons
      input.addEventListener("touchstart", () => {
        input.focus();
      });
    }
    
    input.addEventListener("input", () => {
      touched = true;
      oppdaterKalkulasjon();
    });
    
    // Lukk tastatur når bruker trykker enter
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        input.blur();
      }
    });
  });
}

// Kalkuler alkoholenheter
function kalkulerAE(volum, prosent, antall) {
  if (!volum || !prosent || !antall) return 0;
  return volum * prosent * antall * 8 / 12;
}

// Oppdater alle kalkulasjoner
function oppdaterKalkulasjon() {
  let total = 0;
  document.querySelectorAll("tbody tr").forEach(tr => {
    const volumInput = tr.querySelector(".volum");
    const prosentInput = tr.querySelector(".prosent");
    const antallInput = tr.querySelector(".antall");
    const aeTd = tr.querySelector(".ae");

    const volum = volumInput ? parseFloat(volumInput.value) : parseFloat(tr.dataset.volume);
    const prosent = prosentInput ? parseFloat(prosentInput.value) : parseFloat(tr.querySelector(".prosent").value);
    const antall = antallInput ? parseFloat(antallInput.value) : parseFloat(tr.querySelector(".antall").value);

    const ae = kalkulerAE(volum, prosent, antall);
    aeTd.textContent = ae ? ae.toFixed(1) : "";

    if (antall > 0) {
      tr.classList.add("aktiv");
    } else {
      tr.classList.remove("aktiv");
    }
    total += ae;
  });
  document.getElementById("grandTotal").textContent = Math.round(total);
}

// Reset kalkulatoren
function resetKalkulator() {
  document.querySelectorAll("input[type=number]").forEach(input => {
    input.value = input.defaultValue || "0";
  });
  document.querySelectorAll("tr.aktiv").forEach(tr => tr.classList.remove("aktiv"));
  document.getElementById("grandTotal").textContent = "0";
  oppdaterKalkulasjon();
}

// Fjern egendefinert rad
function fjernRad(knapp) {
  const tr = knapp.closest("tr");
  tr.remove();
  oppdaterKalkulasjon();
}

// Start applikasjonen når siden er lastet
document.addEventListener('DOMContentLoaded', initKalkulator);