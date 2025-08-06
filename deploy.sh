#!/bin/bash

echo "Deploying FreeCalculators to GitHub Pages..."

# Create/Recreate index.html with latest working content
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>FreeCalculators - Planet Positions</title>
    <script src="app.js" defer></script>
</head>
<body>
    <h1>Planet Positions Calculator</h1>
    <input type="date" id="date">
    <input type="time" id="time">
    <input type="number" id="latitude" placeholder="Latitude" step="any">
    <input type="number" id="longitude" placeholder="Longitude" step="any">
    <button onclick="calculatePositions()">Calculate</button>
    <pre id="results">No data yet.</pre>
</body>
</html>
EOF

# Create/Recreate app.js with mock logic
cat > app.js << 'EOF'
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
EOF

# Git add, commit, and push
git add index.html app.js
git commit -m "Force redeploy: Fresh index.html and app.js"
git push origin main

echo "Deploy script completed. Check GitHub Pages URL in 1 minute."
