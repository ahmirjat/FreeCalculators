// Auto-fill current date and time on page load
window.onload = function() {
    const now = new Date();

    // Format date as YYYY-MM-DD
    const dateStr = now.toISOString().split('T')[0];
    document.getElementById('dateInput').value = dateStr;

    // Format time as HH:MM (local time)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    document.getElementById('timeInput').value = timeStr;
};

// Detect user's city and approximate location via IP
function useMyLocation() {
    fetch('http://ip-api.com/json/')
        .then(response => response.json())
        .then(data => {
            document.getElementById('latitudeInput').value = data.lat;
            document.getElementById('longitudeInput').value = data.lon;
            alert(`Detected Location: ${data.city}, ${data.regionName}, ${data.country}`);
        })
        .catch(error => {
            console.error('Error fetching location:', error);
            alert('Failed to get location via IP.');
        });
}

// Placeholder function for planetary position calculations
function calculatePositions() {
    const date = document.getElementById('dateInput').value;
    const time = document.getElementById('timeInput').value;
    const latitude = parseFloat(document.getElementById('latitudeInput').value);
    const longitude = parseFloat(document.getElementById('longitudeInput').value);

    if (!date || !time || isNaN(latitude) || isNaN(longitude)) {
        alert('Please enter valid date, time, latitude, and longitude.');
        return;
    }

    const selectedDateTime = new Date(`${date}T${time}`);
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `<p>Calculating planet positions for ${selectedDateTime.toUTCString()} at Latitude: ${latitude}, Longitude: ${longitude}</p>`;

    // Placeholder: Simulated Planet Positions (To be replaced with real calculations)
    const planets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
    let output = "<ul>";
    planets.forEach(planet => {
        output += `<li>${planet}: Position calculation placeholder</li>`;
    });
    output += "</ul>";
    resultsDiv.innerHTML += output;
}
