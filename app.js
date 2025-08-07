// Define timezone mappings for each city label
const cityTimezone = {
  "Toronto": "-4",
  "New York": "-4",
  "London": "1",
  "Istanbul": "3",
  "Hyderabad": "5.5",
  "Beijing": "8",
  "Dubai": "4",
  "Tokyo": "9",
  "Sydney": "10"
};

// On page load
window.addEventListener("DOMContentLoaded", () => {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().slice(0, 5);
  const tzOffset = -now.getTimezoneOffset() / 60;

  document.getElementById("date").value = dateStr;
  document.getElementById("time").value = timeStr;
  document.getElementById("tz_offset").value = tzOffset;

  const defaultCityValue = "Toronto,43.6532,-79.3832";
  document.getElementById("city").value = defaultCityValue;
  const [cityLabel, lat, lon] = defaultCityValue.split(",");
  document.getElementById("latitude").value = lat;
  document.getElementById("longitude").value = lon;

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

async function calculatePositions() {
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const tz = document.getElementById("tz_offset").value;
  const lat = document.getElementById("latitude").value;
  const lon = document.getElementById("longitude").value;
  const city = document.getElementById("city").value.split(",")[0];

  const apiUrl = `http://localhost:8000/api/planet-positions?date=${date}&time=${time}&tz_offset=${tz}&lat=${lat}&lon=${lon}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`API error ${response.status}`);
    const data = await response.json();
    console.log("✅ Data loaded from API");

    displayPositions(data, `Date: ${data.date}`);
  } catch (err) {
    console.warn("⚠️ API failed, trying fallback:", err.message);
    await fetchCachedData(city, date);
  }
}

function displayPositions(data, header) {
  let output = header + `\n\nPlanet Positions:\n`;
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
  const month = dateStr.slice(0, 7);
  const url = `https://ahmirjat.github.io/FreeCalculators/data/planet-cache-${safeCity}-UTC${tz.replace('.', '_')}-${month}-6mo.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Cached file not found`);
    const cached = await response.json();

    const availableDates = Object.keys(cached.positions).sort();
    let fallbackDate = availableDates.find(d => d >= dateStr) || availableDates.at(-1);

    const position = cached.positions[fallbackDate];
    const data = {
      date: fallbackDate,
      positions: position
    };

    displayPositions(data, `⚠️ Showing cached data for ${city} on ${fallbackDate}`);
  } catch (e) {
    console.error("Fallback failed:", e.message);
    document.getElementById("results").textContent = "API unavailable and no cached data found.";
  }
}
