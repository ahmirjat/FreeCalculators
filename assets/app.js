const cachedDataByCity = {};

const cityTimezone = {
  "Toronto": "-4",
  "New York": "-4",
  "London": "1",
  "Hyderabad": "5",
  "Dubai": "4",
  "Tokyo": "9",
  "Sydney": "10"
};

const nakshatraIndex = {
  "Ashwini": 1, "Bharani": 2, "Krittika": 3, "Rohini": 4, "Mrigashira": 5,
  "Ardra": 6, "Punarvasu": 7, "Pushya": 8, "Ashlesha": 9, "Magha": 10,
  "Purva Phalguni": 11, "Uttara Phalguni": 12, "Hasta": 13, "Chitra": 14, "Swati": 15,
  "Vishakha": 16, "Anuradha": 17, "Jyeshta": 18, "Mula": 19, "Purva Ashadha": 20,
  "Uttara Ashadha": 21, "Shravana": 22, "Dhanishta": 23, "Shatabhisha": 24,
  "Purva Bhadrapada": 25, "Uttara Bhadrapada": 26, "Revati": 27
};

const nakshatraAbbr = {
  "Ashwini": "Asv", "Bharani": "Bhr", "Krittika": "Kri", "Rohini": "Roh", "Mrigashira": "Mrg",
  "Ardra": "Ard", "Punarvasu": "Pun", "Pushya": "Pus", "Ashlesha": "Asl", "Magha": "Mag",
  "Purva Phalguni": "PPha", "Uttara Phalguni": "UPha", "Hasta": "Has", "Chitra": "Chi", "Swati": "Swa",
  "Vishakha": "Vis", "Anuradha": "Anu", "Jyeshta": "Jye", "Mula": "Mul", "Purva Ashadha": "PAs",
  "Uttara Ashadha": "UAs", "Shravana": "Shr", "Dhanishta": "Dha", "Shatabhisha": "Sha",
  "Purva Bhadrapada": "PBr", "Uttara Bhadrapada": "UBr", "Revati": "Rev"
};

const padaSymbols = {
  1: "\u2460",
  2: "\u2461",
  3: "\u2462",
  4: "\u2463"
};

const planetStyles = {
  "Sun": { symbol: "☉", color: "#FFD700" },
  "Moon": { symbol: "☽", color: "#ADD8E6" },
  "Mercury": { symbol: "☿", color: "#87CEEB" },
  "Venus": { symbol: "♀", color: "#FF69B4" },
  "Mars": { symbol: "♂", color: "#FF4500" },
  "Jupiter": { symbol: "♃", color: "#FFA500" },
  "Saturn": { symbol: "♄", color: "#DAA520" },
  "Uranus": { symbol: "♅", color: "#40E0D0" },
  "Neptune": { symbol: "♆", color: "#4169E1" },
  "Pluto": { symbol: "♇", color: "#B266FF" },
  "Rahu": { symbol: "☊", color: "#B5BDC8" },
  "Ketu": { symbol: "☋", color: "#8B95A3" }
};

const planetSymbols = Object.fromEntries(
  Object.entries(planetStyles).map(([planet, style]) => [planet, style.symbol])
);

const signSymbols = {
  "Aries": "♈", "Taurus": "♉", "Gemini": "♊", "Cancer": "♋",
  "Leo": "♌", "Virgo": "♍", "Libra": "♎", "Scorpio": "♏",
  "Sagittarius": "♐", "Capricorn": "♑", "Aquarius": "♒", "Pisces": "♓"
};

const knownCacheFiles = [
  "planet-cache-Toronto-UTC-4-2025-08-6mo.json"
];

function circledNum(n) {
  if (n >= 1 && n <= 20) return String.fromCharCode(0x2460 + (n - 1));
  if (n >= 21 && n <= 27) return String.fromCharCode(0x3251 + (n - 21));
  return String(n || "");
}

function normalizeDegree(degree) {
  return ((degree % 360) + 360) % 360;
}

function positionFromLongitude(longitude) {
  const signs = Object.keys(signSymbols);
  const normalized = normalizeDegree(longitude);
  const signIndex = Math.floor(normalized / 30);
  return {
    degree: normalized - signIndex * 30,
    sign: signs[signIndex]
  };
}

function julianDay(dateStr, timeStr = "00:00") {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour = 0, minute = 0] = timeStr.split(":").map(Number);
  const utcDate = Date.UTC(year, month - 1, day, hour, minute);
  return utcDate / 86400000 + 2440587.5;
}

function meanRahuLongitude(dateStr, timeStr) {
  const t = (julianDay(dateStr, timeStr) - 2451545.0) / 36525;
  return normalizeDegree(125.04452 - 1934.136261 * t + 0.0020708 * t * t + (t * t * t) / 450000);
}

function addMissingLunarNodes(data) {
  const date = (data.date || document.getElementById("date")?.value || "").slice(0, 10);
  const time = data.time || document.getElementById("time")?.value || "00:00";
  if (!date) return data;

  const positions = { ...data.positions };
  if (!positions.Rahu || !positions.Ketu) {
    const rahuLongitude = meanRahuLongitude(date, time);
    if (!positions.Rahu) {
      positions.Rahu = {
        ...positionFromLongitude(rahuLongitude),
        source: "Mean lunar node"
      };
    }
    if (!positions.Ketu) {
      positions.Ketu = {
        ...positionFromLongitude(rahuLongitude + 180),
        source: "Opposite Rahu"
      };
    }
  }

  return { ...data, positions };
}

function setStatus(title, detail = "") {
  const results = document.getElementById("results");
  if (!results) return;
  results.innerHTML = `<strong>${title}</strong>${detail ? `<span>${detail}</span>` : ""}`;
}

function selectedCityName() {
  return document.getElementById("city").value.split(",")[0];
}

async function preloadCachedFiles() {
  for (const filename of knownCacheFiles) {
    const url = `https://ahmirjat.github.io/FreeCalculators/data/${filename}`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      const parts = filename.replace(".json", "").split("-");
      const city = parts.slice(2, -5).join("-") || parts[2];
      if (!cachedDataByCity[city]) cachedDataByCity[city] = [];
      cachedDataByCity[city].push(json);
    } catch (err) {
      console.warn(`Failed to preload ${filename}`, err);
    }
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  const now = new Date();
  document.getElementById("date").value = now.toISOString().split("T")[0];
  document.getElementById("time").value = now.toTimeString().slice(0, 5);

  const defaultCityValue = "Toronto,43.6532,-79.3832";
  document.getElementById("city").value = defaultCityValue;
  overrideCoordinates();

  await preloadCachedFiles();
  calculatePositions();
});

function overrideCoordinates() {
  const selected = document.getElementById("city").value;
  if (!selected) return;

  const [city, lat, lon] = selected.split(",");
  document.getElementById("latitude").value = lat;
  document.getElementById("longitude").value = lon;
  document.getElementById("tz_offset").value = cityTimezone[city] || "0";
}

async function calculatePositions() {
  overrideCoordinates();

  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const tz = document.getElementById("tz_offset").value;
  const lat = document.getElementById("latitude").value;
  const lon = document.getElementById("longitude").value;
  const cityLabel = selectedCityName();

  if (!date || !time) {
    setStatus("Choose a date and time.", "The calculator needs both fields before it can draw a chart.");
    return;
  }

  setStatus("Calculating chart...", `${cityLabel} at ${date} ${time}`);

  const params = new URLSearchParams({ date, time, tz_offset: tz, lat, lon });
  const apiUrl = `http://localhost:8000/api/planet-positions?${params}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`API error ${response.status}`);
    const data = await response.json();
    displayPositions(data, "Live data", `${cityLabel} on ${data.date || date} ${data.time || time}`);
    localStorage.setItem(`planetData_${date}_${lat}_${lon}`, JSON.stringify(data));
  } catch (error) {
    console.warn("API failed, trying cache...", error);
    const cached = localStorage.getItem(`planetData_${date}_${lat}_${lon}`);
    if (cached) {
      const data = JSON.parse(cached);
      displayPositions(data, "Local cache used", `${cityLabel} on ${data.date || date}`);
    } else {
      await fetchCachedData(cityLabel, date);
    }
  }
}

function displayPositions(data, title = "Planet Positions", detail = "") {
  if (!data || !data.positions) {
    setStatus("No chart data found.", "Try another date or city.");
    return;
  }

  const chartData = addMissingLunarNodes(data);
  setStatus(title, detail);
  drawZodiacWheel(chartData);

  const chart = document.getElementById("chart");
  chart.innerHTML = "";

  const table = document.createElement("table");
  table.className = "positions-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Planet</th>
        <th>Degree</th>
        <th>Sign</th>
        <th>Nakshatra</th>
        <th>Pada</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");
  for (const [planet, info] of Object.entries(chartData.positions)) {
    const p = planetStyles[planet] || { symbol: planet, color: "#ccc" };
    const degree = Number.isFinite(info.degree) ? `${info.degree.toFixed(1)}°` : "";
    const nakshatraName = info.nakshatra || "";
    const nakshatraNumber = nakshatraName ? circledNum(nakshatraIndex[nakshatraName]) : "";
    const nakshatraCode = nakshatraName ? (nakshatraAbbr[nakshatraName] || nakshatraName) : "";
    const pada = info.pada ? (padaSymbols[info.pada] || info.pada) : "";
    const sourceTitle = info.source ? `${planet}: ${info.source}` : planet;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><span class="planet-cell" title="${sourceTitle}"><span class="planet-symbol" style="color:${p.color}">${p.symbol}</span>${planet}</span></td>
      <td>${degree}</td>
      <td class="sign-cell" title="${info.sign || ""}">${signSymbols[info.sign] || info.sign || ""}</td>
      <td>${nakshatraNumber}${nakshatraCode ? `<span class="nakshatra-code" title="${nakshatraName}">${nakshatraCode}</span>` : ""}</td>
      <td>${pada}</td>
    `;
    tbody.appendChild(row);
  }

  chart.appendChild(table);
}

async function fetchCachedData(city, dateStr) {
  const allFiles = cachedDataByCity[city];
  if (!allFiles || !allFiles.length) {
    setStatus("No cached data available.", `The public page cannot reach the local API for ${city}, and no cache was found for this city.`);
    document.getElementById("chart").innerHTML = '<p class="empty-state">Start the API locally or choose a cached city/date.</p>';
    return;
  }

  for (const file of allFiles) {
    const dates = Object.keys(file.positions || {}).sort();
    const fallbackDate = dates.find(d => d >= dateStr) || dates.at(-1);
    if (fallbackDate) {
      const data = {
        date: fallbackDate,
        positions: file.positions[fallbackDate]
      };
      displayPositions(data, "Cached data", `${city} on ${fallbackDate}`);
      return;
    }
  }

  setStatus("API unavailable and no cache matched.", "Try a different date or run the local API server.");
}

function drawZodiacWheel(data) {
  const svg = document.getElementById("zodiac-wheel");
  if (!svg || !data.positions) return;

  svg.innerHTML = "";

  const cx = 200;
  const cy = 200;
  const r = 150;
  const signs = Object.keys(signSymbols);
  const signColors = [
    "#ff6b5f", "#f2b84b", "#99c45f", "#4fc3b4", "#5f95d6", "#8d75d6",
    "#c767c9", "#d66395", "#c86560", "#c9905d", "#c8c75f", "#56bf89"
  ];

  const outer = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  outer.setAttribute("cx", cx);
  outer.setAttribute("cy", cy);
  outer.setAttribute("r", r + 8);
  outer.setAttribute("fill", "#0d1118");
  outer.setAttribute("stroke", "#2c3544");
  outer.setAttribute("stroke-width", "2");
  svg.appendChild(outer);

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
    path.setAttribute("stroke", "#11151c");
    path.setAttribute("stroke-width", "1.5");
    svg.appendChild(path);

    const mid = (i * 30 + 15 - 90) * Math.PI / 180;
    const lx = cx + (r + 30) * Math.cos(mid);
    const ly = cy + (r + 30) * Math.sin(mid);

    const link = document.createElementNS("http://www.w3.org/2000/svg", "a");
    link.setAttribute("href", `content/signs/${signs[i].toLowerCase()}.html`);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", lx);
    label.setAttribute("y", ly);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "middle");
    label.setAttribute("font-size", "30");
    label.setAttribute("fill", "#eef3f7");
    label.textContent = signSymbols[signs[i]];

    link.appendChild(label);
    svg.appendChild(link);
  }

  let planetDistance = 40;
  for (const planet in data.positions) {
    const { degree, sign } = data.positions[planet];
    const signIndex = signs.indexOf(sign);
    if (signIndex === -1 || !Number.isFinite(degree)) continue;

    const absDeg = signIndex * 30 + degree;
    const angle = (absDeg - 90) * Math.PI / 180;
    const px = cx + (r - planetDistance) * Math.cos(angle);
    const py = cy + (r - planetDistance) * Math.sin(angle);
    planetDistance = Math.min(112, planetDistance + 9);

    const pStyle = planetStyles[planet] || { symbol: planet, color: "#ccc" };
    const link = document.createElementNS("http://www.w3.org/2000/svg", "a");
    link.setAttribute("href", `content/planets/${planet.toLowerCase()}.html`);

    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", px);
    dot.setAttribute("cy", py - 8);
    dot.setAttribute("r", 17);
    dot.setAttribute("fill", "rgba(13, 17, 24, 0.72)");
    dot.setAttribute("stroke", pStyle.color);
    dot.setAttribute("stroke-width", "1");

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", px);
    label.setAttribute("y", py);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "25");
    label.setAttribute("fill", pStyle.color);
    label.textContent = planetSymbols[planet] || planet;

    link.appendChild(dot);
    link.appendChild(label);
    svg.appendChild(link);
  }
}
