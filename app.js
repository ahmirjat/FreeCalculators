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
