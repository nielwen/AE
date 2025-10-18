/**
 * ALKOHOLENHETSKALKULATOR
 * ======================
 * 
 * Denne filen inneholder all JavaScript-funksjonalitet for alkoholenhetskalkulatoren.
 * Kalkulatoren beregner alkoholenheter basert på volum, alkoholprosent og antall.
 * 
 * Formel for alkoholenheter: Volum (liter) × Alkoholprosent × Antall × 8 / 12
 */

// ===========================
// KONSTANTER OG DATA
// ===========================

/**
 * Oversettelser for alle språk
 */
const translations = {
  no: {
    title: "Kalkulator for beregning av alkoholenheter",
    beerCider: "Øl/cider",
    wine: "Vin", 
    spirits: "Brennevin",
    addCustom: "Legg til egendefinert",
    totalUnits: "Totalt antall alkoholenheter:",
    reset: "Tøm",
    copy: "Kopier oppsummering",
    print: "Utskrift",
    custom: "Egendefinert",
    volume: "Volum",
    alcoholPercent: "Alkohol%",
    amount: "Antall",
    liter: "Liter",
    ciwaLink: "Gå til CIWA scoring for vurdering av alkoholabstinenser"
  },
  en: {
    title: "Alcohol Unit Calculator",
    beerCider: "Beer/Cider",
    wine: "Wine",
    spirits: "Spirits",
    addCustom: "Add custom",
    totalUnits: "Total alcohol units:",
    reset: "Clear",
    copy: "Copy summary",
    print: "Print",
    custom: "Custom",
    volume: "Volume",
    alcoholPercent: "Alcohol%",
    amount: "Amount",
    liter: "Liters",
    units: "Units",
    ciwaLink: "Go to CIWA scoring for alcohol withdrawal assessment"
  }
};

/**
 * Aktuelt språk (standard norsk)
 */
let currentLanguage = 'no';

/**
 * Oversetter visningsnavn basert på aktuelt språk
 * @param {string} visning - Norsk visningsnavn
 * @returns {string} Oversatt visningsnavn
 */
function translateVolumeName(visning) {
  if (currentLanguage === 'no') return visning;
  
  const volumeTranslations = {
    '125 cl (glass)': '125 cl (glass)',
    '0,75 liter (flaske)': '0.75 liter (bottle)',
    '3 liter': '3 liters',
    '0,5 liter': '0.5 liters',
    '0,33 liter': '0.33 liters',
    '4 cl (shot)': '4 cl (shot)',
    '0,7 liter': '0.7 liters'
  };
  
  return volumeTranslations[visning] || visning;
}

/**
 * Predefinerte drikkevaretyper med standardverdier
 * Hver kategori inneholder volum (i liter), visningstekst og typisk alkoholprosent
 */
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

// ===========================
// GLOBALE VARIABLER
// ===========================

/**
 * DOM-elementer som brukes gjennom hele applikasjonen
 */
const kalkulatorDiv = document.getElementById("kalkulator");
const egendefinertSeksjon = document.getElementById("egendefinertseksjon");

/**
 * Variabler for egendefinerte drikkevarer
 */
let egendefinertH2 = null;
let egendefinertTable = null;

// ===========================
// HOVEDFUNKSJONER
// ===========================

/**
 * Initialiserer kalkulatoren ved oppstart
 * 
 * Denne funksjonen:
 * - Lager tabeller for alle forhåndsdefinerte drikkekategorier
 * - Legger til overskrifter for hver kategori
 * - Kjører første beregning for å vise startverdi (0 AE)
 */
function initKalkulator() {
  // Oversett kategorinavn
  const categoryTranslations = {
    "Øl/cider": "beerCider",
    "Vin": "wine", 
    "Brennevin": "spirits"
  };
  
  // Gå gjennom alle drikkekategorier i datasettet
  for (const kategori in drikkedata) {
    // Lag overskrift for kategorien
    const h2 = document.createElement("h2");
    const translationKey = categoryTranslations[kategori];
    h2.textContent = translations[currentLanguage][translationKey] || kategori;
    kalkulatorDiv.appendChild(h2);

    // Lag tabell med alle drikkevarene i kategorien
    const tableContainer = lagTabell(kategori, drikkedata[kategori]);
    kalkulatorDiv.appendChild(tableContainer);
  }
  
  // Kjør første kalkulasjon for å vise "0 AE" som startverdi
  oppdaterKalkulasjon();
}

/**
 * Viser og håndterer egendefinert drikke-seksjonen
 * 
 * Denne funksjonen kalles når bruker trykker "Legg til egendefinert"-knappen.
 * Første gang: Lager overskrift og tabell for egendefinerte drikkevarer
 * Påfølgende ganger: Legger bare til en ny rad
 */
function visEgendefinert() {
  // Vis den skjulte egendefinerte seksjonen
  egendefinertSeksjon.style.display = "block";
  
  if (!egendefinertTable) {
    // Første gang: Lag overskrift
    egendefinertH2 = document.createElement("h2");
    egendefinertH2.textContent = translations[currentLanguage].custom;
    egendefinertSeksjon.appendChild(egendefinertH2);

    // Lag tom tabell for egendefinerte drikkevarer
    egendefinertTable = lagTabell("Egendefinert", [], true);
    egendefinertSeksjon.appendChild(egendefinertTable);
  } else {
    // Påfølgende ganger: Bare legg til en ny rad
    leggTilEgendefinertRad();
  }
}

// ===========================
// TABELL-FUNKSJONER
// ===========================

/**
 * Lager en HTML-tabell for en drikkekategori
 * 
 * @param {string} kategori - Navn på kategorien (f.eks. "Øl/cider")
 * @param {Array} rader - Array med drikkedata for kategorien
 * @param {boolean} egendefinert - Om dette er tabellen for egendefinerte drikkevarer
 * @returns {HTMLElement} - Container-div med tabellen
 */
function lagTabell(kategori, rader, egendefinert = false) {
  // Lag wrapper-container for horizontal scrolling på mobile enheter
  const tableContainer = document.createElement("div");
  tableContainer.className = "table-container";
  
  // Lag selve tabellen
  const table = document.createElement("table");
  table.dataset.kategori = kategori; // Sett kategori som data-attributt for senere referanse
  
  // Lag tabellhode med kolonner
  const thead = document.createElement("thead");
  const unitLabel = currentLanguage === 'en' ? translations[currentLanguage].units : 'AE';
  thead.innerHTML = `
    <tr>
      <th>${translations[currentLanguage].volume}</th>
      <th>${translations[currentLanguage].alcoholPercent}</th>
      <th>${translations[currentLanguage].amount}</th>
      <th>${unitLabel}</th>
    </tr>`;
  table.appendChild(thead);

  // Lag tabellkropp
  const tbody = document.createElement("tbody");
  table.appendChild(tbody);
  
  // Legg tabellen inn i container
  tableContainer.appendChild(table);

  if (!egendefinert) {
    // For forhåndsdefinerte drikkevarer: Lag rader med faste verdier
    rader.forEach(({ volum, visning, prosent }) => {
      const tr = document.createElement("tr");
      tr.dataset.volume = volum; // Lagre volum som data-attributt
      const translatedVisning = translateVolumeName(visning);
      tr.innerHTML = `
        <td>${translatedVisning}</td>
        <td><input type="number" class="prosent" value="${prosent}" step="any"></td>
        <td><input type="number" class="antall" value="0" step="any"></td>
        <td class="ae"></td>`;
      tbody.appendChild(tr);
      leggTilLyttere(tr); // Legg til event listeners for input-feltene
    });
  } else {
    // For egendefinerte drikkevarer: Legg til en tom rad
    leggTilEgendefinertRad(tbody);
  }

  return tableContainer;
}

/**
 * Legger til en ny rad i egendefinert-tabellen
 * 
 * @param {HTMLElement} tbody - Tabellkroppen å legge til rad i (valgfri)
 */
function leggTilEgendefinertRad(tbody = null) {
  // Hvis ingen tbody er spesifisert, finn den for egendefinerte drikkevarer
  if (!tbody) {
    tbody = document.querySelector("table[data-kategori='Egendefinert'] tbody");
  }
  
  // Lag ny rad med input-felt for alle verdier
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="number" class="volum" step="any" placeholder="${translations[currentLanguage].liter}"></td>
    <td><input type="number" class="prosent" step="any" placeholder="%"></td>
    <td><input type="number" class="antall" value="1" step="any"></td>
    <td class="ae"><button class="fjern-knapp" onclick="fjernRad(this)">&times;</button></td>`;
  
  tbody.appendChild(tr);
  leggTilLyttere(tr); // Legg til event listeners for den nye raden
}

// ===========================
// EVENT LISTENERS
// ===========================

/**
 * Legger til event listeners for alle input-felt i en tabellrad
 * 
 * Denne funksjonen håndterer:
 * - Focus-hendelser (tømmer felt ved første bruk)
 * - Input-hendelser (oppdaterer kalkulasjoner)
 * - Mobile-spesifikk funksjonalitet (scrolling og touch)
 * - Keyboard-hendelser (lukker tastatur ved Enter)
 * 
 * @param {HTMLElement} tr - Tabellraden å legge til listeners for
 */
function leggTilLyttere(tr) {
  const inputs = tr.querySelectorAll("input");
  
  inputs.forEach(input => {
    const initial = input.value; // Husk opprinnelig verdi
    let touched = false; // Flag for å spore om feltet har blitt endret
    let originalValue = input.value; // Lagre den opprinnelige verdien permanent
    
    // Spesiell håndtering for number-input
    if (input.type === "number") {
      // Focus-hendelse: Marker all tekst for direkte skriving
      input.addEventListener("focus", () => {
        // Mobile-optimalisering: Scroll til felt på små skjermer
        if (window.innerWidth <= 480) {
          setTimeout(() => {
            input.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 300);
        }
        
        // Marker all tekst så brukeren kan skrive direkte
        setTimeout(() => {
          input.select();
        }, 10); // Kort delay for å sikre at select() fungerer
      });
      
      // Blur-hendelse: Sett tilbake til opprinnelig verdi hvis tomt
      input.addEventListener("blur", () => {
        // Hvis feltet er tomt eller bare whitespace, sett tilbake til opprinnelig verdi
        if (!input.value.trim()) {
          input.value = originalValue;
          touched = false; // Reset touched-status
          oppdaterKalkulasjon(); // Oppdater kalkulasjon med opprinnelig verdi
        }
      });
      
      // Mobile touch-optimalisering
      input.addEventListener("touchstart", () => {
        input.focus();
      });
    }
    
    // Input-hendelse: Marker som endret og oppdater kalkulasjoner
    input.addEventListener("input", () => {
      // Kun marker som touched hvis det faktisk er skrevet noe
      if (input.value.trim()) {
        touched = true;
      }
      oppdaterKalkulasjon();
    });
    
    // Keyboard-hendelse: Lukk tastatur ved Enter-trykk
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        input.blur();
      }
    });
  });
}

// ===========================
// KALKULASJONSFUNKSJONER
// ===========================

/**
 * Beregner alkoholenheter for en drikkevare
 * 
 * Formel: Volum (liter) × Alkoholprosent × Antall × 8 / 12
 * 
 * @param {number} volum - Volum i liter
 * @param {number} prosent - Alkoholprosent
 * @param {number} antall - Antall enheter konsumert
 * @returns {number} - Antall alkoholenheter (0 hvis noen verdier mangler)
 */
function kalkulerAE(volum, prosent, antall) {
  // Returner 0 hvis noen av verdiene mangler eller er 0
  if (!volum || !prosent || !antall) return 0;
  
  // Beregn alkoholenheter med standard norsk formel
  return volum * prosent * antall * 8 / 12;
}

/**
 * Oppdaterer alle kalkulasjoner på siden
 * 
 * Denne funksjonen:
 * - Går gjennom alle rader i alle tabeller
 * - Beregner alkoholenheter for hver rad
 * - Oppdaterer visuell status (aktiv/inaktiv)
 * - Summerer totalt antall alkoholenheter
 * - Oppdaterer total-visningen
 */
function oppdaterKalkulasjon() {
  let total = 0;
  
  // Gå gjennom alle tabellrader
  document.querySelectorAll("tbody tr").forEach(tr => {
    // Hent input-felt og resultat-celle
    const volumInput = tr.querySelector(".volum");
    const prosentInput = tr.querySelector(".prosent");
    const antallInput = tr.querySelector(".antall");
    const aeTd = tr.querySelector(".ae");

    // Hent verdier - bruk dataset.volume for forhåndsdefinerte, input.value for egendefinerte
    const volum = volumInput ? parseFloat(volumInput.value) : parseFloat(tr.dataset.volume);
    const prosent = parseFloat(tr.querySelector(".prosent").value);
    const antall = parseFloat(tr.querySelector(".antall").value);

    // Beregn alkoholenheter for denne raden
    const ae = kalkulerAE(volum, prosent, antall);
    
    // Sjekk om dette er en egendefinert rad (har fjern-knapp)
    const fjernKnapp = aeTd.querySelector(".fjern-knapp");
    
    if (fjernKnapp) {
      // Egendefinert rad: Vis AE-verdi ved siden av fjern-knappen
      const aeText = ae ? ae.toFixed(1) : "";
      aeTd.innerHTML = `${aeText}<button class="fjern-knapp" onclick="fjernRad(this)">&times;</button>`;
    } else {
      // Forhåndsdefinert rad: Vis bare AE-verdi
      aeTd.textContent = ae ? ae.toFixed(1) : "";
    }

    // Marker raden som aktiv hvis antall > 0
    if (antall > 0) {
      tr.classList.add("aktiv");
    } else {
      tr.classList.remove("aktiv");
    }
    
    // Legg til i total
    total += ae;
  });
  
  // Oppdater totalvisning (avrundet til nærmeste hele tall)
  document.getElementById("grandTotal").textContent = Math.round(total);
}

// ===========================
// HJELPE- OG KONTROLLSFUNKSJONER
// ===========================

/**
 * Nullstiller hele kalkulatoren til startverdi
 * 
 * Denne funksjonen:
 * - Setter alle input-felt tilbake til standardverdier
 * - Fjerner "aktiv"-klasse fra alle rader
 * - Nullstiller totalvisningen
 * - Kjører ny kalkulasjon for å oppdatere alt
 */
function resetKalkulator() {
  // Reset alle number-input til standardverdi (eller "0")
  document.querySelectorAll("input[type=number]").forEach(input => {
    input.value = input.defaultValue || "0";
  });
  
  // Fjern "aktiv"-klasse fra alle rader
  document.querySelectorAll("tr.aktiv").forEach(tr => tr.classList.remove("aktiv"));
  
  // Nullstill total-visning
  document.getElementById("grandTotal").textContent = "0";
  
  // Kjør kalkulasjon for å sikre at alt er oppdatert
  oppdaterKalkulasjon();
}

/**
 * Fjerner en egendefinert rad fra tabellen
 * Hvis det var den siste raden, fjernes hele egendefinert-seksjonen
 * 
 * @param {HTMLElement} knapp - Fjern-knappen som ble trykket
 */
function fjernRad(knapp) {
  // Finn den nærmeste tabellraden oppover i DOM-hierarkiet
  const tr = knapp.closest("tr");
  const tbody = tr.closest("tbody");
  
  // Sjekk hvor mange rader som finnes FØR vi fjerner denne raden
  const currentRows = tbody.querySelectorAll("tr");
  const isLastRow = currentRows.length === 1;
  
  // Fjern raden fra DOM
  tr.remove();
  
  // Hvis det var den siste raden, fjern hele egendefinert-seksjonen
  if (isLastRow) {
    // Skjul egendefinert-seksjonen
    egendefinertSeksjon.style.display = "none";
    
    // Fjern overskrift og tabell-container
    if (egendefinertH2 && egendefinertH2.parentNode) {
      egendefinertH2.remove();
    }
    if (egendefinertTable && egendefinertTable.parentNode) {
      egendefinertTable.remove();
    }
    
    // Nullstill globale variabler så de kan lages på nytt senere
    egendefinertH2 = null;
    egendefinertTable = null;
  }
  
  // Oppdater kalkulasjoner siden en rad er fjernet
  oppdaterKalkulasjon();
}

/**
 * Viser feedback på knapp når noe er kopiert
 * 
 * @param {HTMLElement} btn - Knappen som skal vise feedback
 */
function showCopyFeedback(btn) {
  if (btn) {
    const old = btn.textContent;
    btn.textContent = 'Kopiert!';
    setTimeout(() => btn.textContent = old, 1600);
  }
}

/**
 * Lager en tekstlig oppsummering av alkoholenheter og kopierer til utklippstavlen
 * 
 * Denne funksjonen:
 * - Samler all data fra aktive rader (med antall > 0)
 * - Lager en formatert tekstoppsummering
 * - Kopierer teksten til utklippstavlen
 * - Viser visuell bekreftelse på knappen
 */
async function kopierOppsummering(btn) {
  try {
    const dato = new Date().toLocaleDateString('no-NO');
    const tid = new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
    
    let oppsummering = `ALKOHOLENHETER - OVERSIKT\n`;
    oppsummering += `=======================================\n\n`;
    
    let totalAE = 0;
    let harAktiveRader = false;
    
    // Gå gjennom alle tabeller og finn aktive rader
    document.querySelectorAll("table").forEach(table => {
      const kategori = table.dataset.kategori;
      let kategoriAE = 0;
      let kategoriRader = [];
      
      table.querySelectorAll("tbody tr.aktiv").forEach(tr => {
        const volumInput = tr.querySelector(".volum");
        const prosentInput = tr.querySelector(".prosent");
        const antallInput = tr.querySelector(".antall");
        
        // Hent verdier
        const volum = volumInput ? parseFloat(volumInput.value) : parseFloat(tr.dataset.volume);
        const prosent = parseFloat(prosentInput.value);
        const antall = parseFloat(antallInput.value);
        
        if (antall > 0) {
          const ae = kalkulerAE(volum, prosent, antall);
          totalAE += ae;
          kategoriAE += ae;
          harAktiveRader = true;
          
          // Bestem beskrivelse
          let beskrivelse;
          if (volumInput) {
            // Egendefinert rad
            beskrivelse = `${volum}L (${prosent}%)`;
          } else {
            // Forhåndsdefinert rad
            const visning = tr.cells[0].textContent;
            beskrivelse = `${visning} (${prosent}%)`;
          }
          
          kategoriRader.push({
            beskrivelse: beskrivelse,
            antall: antall,
            ae: ae
          });
        }
      });
      
      // Legg til kategori i oppsummering hvis den har aktive rader
      if (kategoriRader.length > 0) {
        oppsummering += `${kategori.toUpperCase()}:\n`;
        kategoriRader.forEach(rad => {
          oppsummering += `  ${rad.beskrivelse} × ${rad.antall} = ${rad.ae.toFixed(1)} AE\n`;
        });
        oppsummering += `  Subtotal: ${kategoriAE.toFixed(1)} AE\n\n`;
      }
    });
    
    if (!harAktiveRader) {
      oppsummering += `Ingen drikkevarer registrert.\n\n`;
    }
    
    oppsummering += `=======================================\n`;
    oppsummering += `TOTALT: ${Math.round(totalAE)} AE\n`;
    oppsummering += `=======================================\n\n`;
    
    // Kopier til utklippstavlen
    await navigator.clipboard.writeText(oppsummering);
    
    // Vis visuell bekreftelse på knappen
    showCopyFeedback(btn);
    
  } catch (error) {
    console.error('Feil ved kopiering:', error);
    // Vis feilmelding som popup kun hvis kopiering feiler
    alert('Kunne ikke kopiere til utklippstavlen. Prøv igjen eller sjekk nettleser-tillatelser.');
  }
}

// ===========================
// SPRÅKFUNKSJONER
// ===========================

/**
 * Bytter språk og oppdaterer all tekst på siden
 * 
 * @param {string} lang - Språkkode ('no' eller 'en')
 */
function changeLanguage(lang) {
  console.log('Changing language to:', lang);
  currentLanguage = lang;
  
  // Oppdater aktiv språkknapp
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('lang-' + lang).classList.add('active');
  
  // Oppdater alle elementer med data-translate attributt
  document.querySelectorAll('[data-translate]').forEach(element => {
    const key = element.getAttribute('data-translate');
    if (translations[lang][key]) {
      element.textContent = translations[lang][key];
    }
  });
  
  // Oppdater unit label - fjern AE på engelsk
  const unitLabel = document.getElementById('unitLabel');
  if (unitLabel) {
    unitLabel.textContent = (lang === 'en') ? '' : 'AE';
  }
  
  // Håndter CIWA-link - skjul på engelsk, vis på norsk
  const footerLink = document.querySelector('.footer-link');
  if (footerLink) {
    footerLink.style.display = (lang === 'en') ? 'none' : 'block';
  }
  
  // Gjenoppbygg kalkulatoren med nytt språk
  kalkulatorDiv.innerHTML = '';
  initKalkulator();
}

// ===========================
// OPPSTART
// ===========================

/**
 * Starter applikasjonen når DOM-en er ferdig lastet
 * Dette sikrer at alle HTML-elementer er tilgjengelige før JavaScript kjører
 */
document.addEventListener('DOMContentLoaded', () => {
  // Sett riktig aktiv språkknapp basert på detektert språk
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('lang-' + currentLanguage).classList.add('active');
  
  // Oppdater oversettelser hvis engelsk er detektert
  if (currentLanguage === 'en') {
    document.querySelectorAll('[data-translate]').forEach(element => {
      const key = element.getAttribute('data-translate');
      if (translations[currentLanguage][key]) {
        element.textContent = translations[currentLanguage][key];
      }
    });
    
    // Fjern AE på engelsk
    const unitLabel = document.getElementById('unitLabel');
    if (unitLabel) {
      unitLabel.textContent = '';
    }
    
    // Skjul CIWA-link på engelsk
    const footerLink = document.querySelector('.footer-link');
    if (footerLink) {
      footerLink.style.display = 'none';
    }
  }
  
  // Start kalkulatoren
  initKalkulator();
});