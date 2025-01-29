// Datos de paradas (puedes agregar más)
const stops = [
    { name: "Parada 1", lat: 40.7128, lon: -74.0060, time: "14:30:00" },
    { name: "Parada 2", lat: 40.7306, lon: -73.9352, time: "14:45:00" }
];

let map = L.map('map').setView([0, 0], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
let marker = L.marker([0, 0]).addTo(map);

// Función para obtener la ubicación real
function updateLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(position => {
            let lat = position.coords.latitude;
            let lon = position.coords.longitude;
            document.getElementById("location").textContent = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

            marker.setLatLng([lat, lon]);
            map.setView([lat, lon], 15);

            calculateTimeDifference(lat, lon);
        }, error => {
            console.error("Error obteniendo ubicación:", error);
        });
    } else {
        alert("Tu navegador no soporta geolocalización.");
    }
}

// Función para calcular diferencia de tiempo con la parada más cercana
function calculateTimeDifference(lat, lon) {
    let closestStop = stops[0];
    let minDistance = Infinity;

    stops.forEach(stop => {
        let distance = Math.hypot(lat - stop.lat, lon - stop.lon);
        if (distance < minDistance) {
            minDistance = distance;
            closestStop = stop;
        }
    });

    let now = new Date();
    let stopTime = new Date();
    let [hours, minutes, seconds] = closestStop.time.split(":").map(Number);
    stopTime.setHours(hours, minutes, seconds);

    let timeDiff = Math.floor((now - stopTime) / 1000);
    let minutesDiff = Math.floor(Math.abs(timeDiff) / 60);
    let secondsDiff = Math.abs(timeDiff) % 60;

    let sign = timeDiff < 0 ? "-" : "+";
    document.getElementById("time-difference").textContent = `${sign}${minutesDiff}:${secondsDiff}`;
}

updateLocation();
