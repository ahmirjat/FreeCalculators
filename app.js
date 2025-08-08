const cachedDataByCity = {};

// === CONFIGURATION ===
const cityTimezone = {
  "Toronto": "-4",
  "New York": "-4",
  "London": "1",
  "Hyderabad": "5",
  "Dubai": "4",
  "Tokyo": "9",
  "Sydney": "10"
};

const planetStyles = {
  "Sun":     { symbol: "☉", color: "#FFD700" }, // gold
  "Moon":    { symbol: "☽", color: "#ADD8E6" }, // light blue
  "Mercury": { symbol: "☿", color: "#87CEEB" }, // sky blue
  "Venus":   { symbol: "♀", color: "#FF69B4" }, // pink
  "Mars":    { symbol: "♂", color: "#FF4500" }, // red-orange
  "Jupiter": { symbol: "♃", color: "#FFA500" }, // orange
  "Saturn":  { symbol: "♄", color: "#DAA520" }, // goldenrod
  "Uranus":  { symbol: "♅", color: "#40E0D0" }, // turquoise
  "Neptune": { symbol: "♆", color: "#4169E1" }, // royal blue
  "Pluto":   { symbol: "♇", color: "#8B008B" }, // dark magenta
  "Rahu":    { symbol: "☊", color: "#999999" }, // gray
  "Ketu":    { symbol: "☋", color: "#666666" }  // darker gray
};


const planetSymbols = {
  "Sun": "☉", "Moon": "☽", "Mercury": "☿", "Venus": "♀", "Mars": "♂",
  "Jupiter": "♃", "Saturn": "♄", "Rahu": "☊", "Ketu": "☋",
  "Uranus": "♅", "Neptune": "♆", "Pluto": "♇"
};
  const signSymbols = {
    "Aries": "♈", "Taurus": "♉", "Gemini": "♊", "Cancer": "♋",
    "Leo": "♌", "Virgo": "♍", "Libra": "♎", "Scorpio": "♏",
    "Sagittarius": "♐", "Capricorn": "♑", "Aquarius": "♒", "Pisces": "♓"
  };
const knownCacheFiles = [
  "planet-cache-Toronto-UTC-4-2025-08-6mo.json",
  "planet-cache-New-York-UTC-4-2025-08-6mo.json",
  "planet-cache-London-UTC1-2025-08-6mo.json",
  "planet-cache-Hyderabad-UTC5-2025-08-6mo.json",
  "planet-cache-Dubai-UTC4-2025-08-6mo.json",
  "planet-cache-Tokyo-UTC9-2025-08-6mo.json",
  "planet-cache-Sydney-UTC10-2025-08-6mo.json"
];


// === PRELOAD CACHE FILES ===
async function preloadCachedFiles() {
  for (const filename of knownCacheFiles) {
    const url = `https://ahmirjat.github.io/FreeCalculators/data/${filename}`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();

      const parts = filename.replace(".json", "").split("-");
      const city = parts.slice(2, -4).join("-");
      const rawTz = parts[parts.length - 4];
      const key = `${city}-${rawTz}`;

      if (!cachedDataByCity[key]) cachedDataByCity[key] = [];
      cachedDataByCity[key].push(json);
    } catch (err) {
      console.warn(`❌ Failed to preload ${filename}`);
    }
  }
}

// === INITIAL SETUP ===
window.addEventListener("DOMContentLoaded", async () => {
  const now = new Date();
  document.getElementById("date").value = now.toISOString().split("T")[0];
  document.getElementById("time").value = now.toTimeString().slice(0, 5);
  document.getElementById("tz_offset").value = -now.getTimezoneOffset() / 60;

  const defaultCityValue = "Toronto,43.6532,-79.3832";
  document.getElementById("city").value = defaultCityValue;
  const [ , defLat, defLon ] = defaultCityValue.split(",");
  document.getElementById("latitude").value = defLat;
  document.getElementById("longitude").value = defLon;

  await preloadCachedFiles();
  calculatePositions();
});

function overrideCoordinates() {
  const cityDropdown = document.getElementById("city");
  const selected = cityDropdown.value;
  if (selected) {
    const [ , lat, lon ] = selected.split(",");
    document.getElementById("latitude").value = lat;
    document.getElementById("longitude").value = lon;
  }
}

// === CALCULATE POSITIONS ===
async function calculatePositions() {
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const tz   = document.getElementById("tz_offset").value;
  const lat  = document.getElementById("latitude").value;
  const lon  = document.getElementById("longitude").value;
  const cityLabel = document.getElementById("city").value.split(",")[0];

  const apiUrl = `http://localhost:8000/api/planet-positions?date=${date}&time=${time}&tz_offset=${tz}&lat=${lat}&lon=${lon}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`API error ${response.status}`);
    const data = await response.json();
    displayPositions(data, `✅ Live data for ${cityLabel} on ${data.date}`);
    localStorage.setItem(`planetData_${date}_${lat}_${lon}`, JSON.stringify(data));
  } catch (error) {
    console.warn("⚠️ API failed, trying cache...");
    const cached = localStorage.getItem(`planetData_${date}_${lat}_${lon}`);
    if (cached) {
      const data = JSON.parse(cached);
      displayPositions(data, `⚠️ Local cache used for ${cityLabel} on ${data.date}`);
    } else {
      await fetchCachedData(cityLabel, date);
    }
  }
}

function displayPositions(data, heading = "Planet Positions") {
  document.getElementById("results").textContent = `${heading}\n\nDate: ${data.date}\n\n`;

  drawZodiacWheel(data); // ✅ make sure this is active

  const chart = document.getElementById("chart");
  chart.innerHTML = "";

  const container = document.createElement("div");
  container.style.display = "grid";
  container.style.gridTemplateColumns = "auto auto auto";
  container.style.gap = "6px";
  container.style.background = "#0b0c10";
  container.style.padding = "0.5em";

  const signs = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];


  let i = 0;
  for (const [planet, info] of Object.entries(data.positions)) {
    const row = document.createElement("div");
    row.style.display = "contents";

    const cell1 = document.createElement("div");
    const cell2 = document.createElement("div");
    const cell3 = document.createElement("div");

const p = planetStyles[planet] || { symbol: planet, color: "#ccc" };

cell1.innerHTML = `<span style="color:${p.color}">${p.symbol}</span>`;
    cell2.textContent = `${info.degree.toFixed(1)}°`;
    cell3.textContent = `${signSymbols[info.sign] || info.sign}` + (info.nakshatra ? ` ${info.nakshatra} ${info.pada}` : "");

    [cell1, cell2, cell3].forEach(cell => {
      cell.style.padding = "6px";
      cell.style.background = i % 2 === 0 ? "#1f2833" : "#182024";
      cell.style.fontFamily = "monospace";
    });

    container.append(cell1, cell2, cell3);
    i++;
  }

  chart.appendChild(container);
}


// === FALLBACK FETCH ===
async function fetchCachedData(city, dateStr) {
  const tz = cityTimezone[city] || "0";
  const safeCity = city.replace(/ /g, "-").replace(/[()]/g, "");
  const cityPrefix = `${safeCity}-UTC`;

  const key = Object.keys(cachedDataByCity).find(k => k.startsWith(cityPrefix));
  if (!key || !cachedDataByCity[key]) {
    document.getElementById("results").textContent = "⚠️ No cached data available for selected city.";
    return;
  }

  const allFiles = cachedDataByCity[key];
  for (const file of allFiles) {
    const dates = Object.keys(file.positions).sort();
    const fallbackDate = dates.find(d => d >= dateStr) || dates.at(-1);
    if (fallbackDate) {
      const position = file.positions[fallbackDate];
      const data = {
        date: fallbackDate,
        positions: position
      };
      displayPositions(data, `⚠️ Cached data for ${city} on ${fallbackDate}`);
      return;
    }
  }

  document.getElementById("results").textContent = "⚠️ API unavailable and no cached data found.";
}

function drawZodiacWheel(data) {
  console.log("Drawing wheel with data:", data);

  const svg = document.getElementById("zodiac-wheel");
  if (!svg) {
    console.warn("Zodiac SVG element not found.");
    return;
  }

  svg.innerHTML = ""; // clear previous

  const cx = 200, cy = 200, r = 150;
  const signs = Object.keys(signSymbols);  // ✅ from your standard

  const signColors = [
    "#FF6666", "#FFCC66", "#99CC66", "#66CCCC", "#6699CC", "#9966CC",
    "#CC66CC", "#CC6699", "#CC6666", "#CC9966", "#CCCC66", "#66CC99"
  ];

  // Draw pie segments
  for (let i = 0; i < 12; i++) {
    const start = (i * 30 - 90) * Math.PI / 180;
    const end = ((i + 1) * 30 - 90) * Math.PI / 180;

    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`);
    path.setAttribute("fill", signColors[i]);
    path.setAttribute("stroke", "#222");
    svg.appendChild(path);

    // Sign symbol label
    const mid = (i * 30 + 15 - 90) * Math.PI / 180;
    const lx = cx + (r + 30) * Math.cos(mid);
    const ly = cy + (r + 30) * Math.sin(mid);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", lx);
    label.setAttribute("y", ly);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("alignment-baseline", "middle");
    label.setAttribute("font-size", "36");
    label.setAttribute("fill", "#fff");
    label.textContent = signSymbols[signs[i]];
    svg.appendChild(label);
  }

    let planetDistance=40;
  // Draw planet positions
  for (const planet in data.positions) {
    const { degree, sign } = data.positions[planet];
    const signIndex = signs.indexOf(sign);
    if (signIndex === -1) {
      console.warn("Unrecognized sign:", sign);
      continue;
    }

    const absDeg = signIndex * 30 + degree;
    const angle = (absDeg - 90) * Math.PI / 180;

    const px = cx + (r - planetDistance) * Math.cos(angle);
    const py = cy + (r - planetDistance) * Math.sin(angle);

      planetDistance=planetDistance+10;

      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", px);
    dot.setAttribute("cy", py);
    dot.setAttribute("r", 4);
    dot.setAttribute("fill", "#000");
    svg.appendChild(dot);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", px);
    label.setAttribute("y", py - 10);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "36");
    label.setAttribute("fill", "#ffff");
    label.textContent = planetSymbols[planet] || planet;
    svg.appendChild(label);
  }
}

