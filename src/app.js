window.onload = () => {
    const now = new Date();
    document.getElementById('date').value = now.toISOString().split('T')[0];
    document.getElementById('time').value = now.toTimeString().split(' ')[0].slice(0,5);
};

function detectLocation() {
    fetch('https://ip-api.com/json/')
        .then(res => res.json())
        .then(data => {
            if (data.lat && data.lon) {
                document.getElementById('latitude').value = data.lat;
                document.getElementById('longitude').value = data.lon;
                displayMessage(`Location detected: ${data.city}, ${data.country}`);
            } else {
                displayMessage("Failed to detect location.");
            }
        })
        .catch(() => displayMessage("Error detecting location."));
}

function calculatePositions() {
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const latitude = parseFloat(document.getElementById('latitude').value);
    const longitude = parseFloat(document.getElementById('longitude').value);

    if (!date || !time || isNaN(latitude) || isNaN(longitude)) {
        displayMessage("Please enter valid Date, Time, Latitude, and Longitude.");
        return;
    }

    // Mock Data Placeholder
    const mockResponse = {
        date: `${date} ${time}`,
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

    displayResults(mockResponse);
}

function displayResults(data) {
    let output = `<strong>Date:</strong> ${data.date}<br><br><strong>Planet Positions:</strong><br>`;
    for (const [planet, details] of Object.entries(data.positions)) {
        output += `${planet}: ${details.degree}° ${details.sign}`;
        if (planet === "Moon" && details.nakshatra) {
            output += ` (Nakshatra: ${details.nakshatra} - Pada ${details.pada})`;
        }
        output += `<br>`;
    }
    document.getElementById('results').innerHTML = output;
}

function displayMessage(msg) {
    document.getElementById('results').innerHTML = `<em>${msg}</em>`;
}
