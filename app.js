const cityTimezone = {
  "Toronto": "-4",
  "New York": "-4",
  "London": "1",
  "Hyderabad": "5",
  "Dubai": "4",
  "Tokyo": "9",
  "Sydney": "10"
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

const cachedDataByCity = {};

async function preloadCachedFiles() {
  for (const filename of knownCacheFiles) {
    const url = `https://ahmirjat.github.io/FreeCalculators/data/${filename}`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();

      const parts = filename.replace(".json", "").split("-");
      const city = parts.slice(2, -4).join("-"); // e.g. New-York
      const rawTz = parts[parts.length - 4];     // e.g. UTC-4
      const key = `${city}-${rawTz}`;

      if (!cachedDataByCity[key]) cachedDataByCity[key] = [];
      cachedDataByCity[key].push(json);
    } catch (err) {
      console.warn(`❌ Failed to preload ${filename}`);
    }
  }
}

function overrideCoordinates() {
  const cityDropdown = document.getElementById("city");
  const selected = cityDropdown.value;
  if (selected) {
    const [ , lat, lon ] = selected.split(",");
    document.getElementById("latitude").value = lat;
    document.getElementById("longitude").value = lon;
  }
}

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
  let output = `${heading}\n\nDate: ${data.date}\n\n`;
  for (const [planet, info] of Object.entries(data.positions)) {
    let line = `${planet}: ${info.degree}° ${info.sign}`;
    if (info.nakshatra) {
      line += ` (Nakshatra: ${info.nakshatra} - Pada ${info.pada})`;
    }
    output += line + "\n";
  }
  document.getElementById("results").textContent = output;
}

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
