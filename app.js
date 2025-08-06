function calculatePositions() {
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const latitude = parseFloat(document.getElementById('latitude').value);
    const longitude = parseFloat(document.getElementById('longitude').value);

    if (!date || !time || isNaN(latitude) || isNaN(longitude)) {
        alert("Please enter valid inputs.");
        return;
    }

    const mockResponse = {
        date: date + " " + time,
        positions: {
            Sun: { degree: 10.25, sign: "Aries" },
            Moon: { degree: 5.60, sign: "Taurus", nakshatra: "Rohini", pada: 2 },
            Mercury: { degree: 18.75, sign: "Gemini" },
            Venus: { degree: 2.15, sign: "Cancer" },
            Mars: { degree: 27.30, sign: "Leo" },
            Jupiter: { degree: 15.50, sign: "Virgo" },
            Saturn: { degree: 3.80, sign: "Libra" }
        }
    };

    let output = `Date: ${mockResponse.date}\n\nPlanet Positions:\n`;
    for (const [planet, details] of Object.entries(mockResponse.positions)) {
        output += `${planet}: ${details.degree}° ${details.sign}`;
        if (planet === "Moon") {
            output += ` (Nakshatra: ${details.nakshatra} - Pada ${details.pada})`;
        }
        output += `\n`;
    }

    document.getElementById('results').textContent = output;
}

window.addEventListener("DOMContentLoaded", () => {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().slice(0, 5);
  const tzOffset = -now.getTimezoneOffset() / 60;

  document.getElementById("date").value = dateStr;
  document.getElementById("time").value = timeStr;
  document.getElementById("tz_offset").value = tzOffset;

  // Set default city: Toronto
  const defaultCityValue = "Toronto,43.6532,-79.3832";
  document.getElementById("city").value = defaultCityValue;
  const [_, lat, lon] = defaultCityValue.split(",");
  document.getElementById("latitude").value = lat;
  document.getElementById("longitude").value = lon;

  // Show default result on load
  calculatePositions();
});

function overrideCoordinates() {
  const cityDropdown = document.getElementById("city");
  const selected = cityDropdown.value;

  if (selected) {
    const parts = selected.split(",");
    const lat = parts[1];
    const lon = parts[2];
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

  const url = `http://localhost:8000/api/planet-positions?date=${date}&time=${time}&tz_offset=${tz}&lat=${lat}&lon=${lon}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    let output = `Date: ${data.date} ${time}\n\nPlanet Positions:\n`;
    for (const [planet, info] of Object.entries(data.positions)) {
      let line = `${planet}: ${info.degree}° ${info.sign}`;
      if (planet === "Moon" && info.nakshatra) {
        line += ` (Nakshatra: ${info.nakshatra} - Pada ${info.pada})`;
      }
      output += line + "\n";
    }

    document.getElementById("results").textContent = output;
  } catch (err) {
    document.getElementById("results").textContent = "Failed to fetch positions.";
    console.error(err);
  }
}
