// Simulación de rutas guardadas (debería venir de un backend o almacenamiento local)
const storedRoutes = [
    {
        name: "Ruta 1",
        route: [{ lat: 40.7128, lon: -74.0060 }, { lat: 40.7306, lon: -73.9352 }],
        stops: [
            { name: "Parada 1", lat: 40.7128, lon: -74.0060, time: "14:30:00" },
            { name: "Parada 2", lat: 40.7306, lon: -73.9352, time: "14:45:00" }
        ]
    }
];

let map = L.map('map').setView([0, 0], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
let marker = L.marker([0, 0]).addTo(map);
let watchId = null;
let selectedRoute = null;

// Cargar rutas en el selector
function loadRoutes() {
    let selector = document.getElementById("route-selector");
    storedRoutes.forEach((route, index) => {
        let option = document.createElement("option");
        option.value = index;
        option.textContent = route.name;
        selector.appendChild(option);
    });
}

// Iniciar GPS y calcular diferencia de tiempo
function startNavigation() {
    let selectedIndex = document.getElementById("route-selector").value;
    selectedRoute = storedRoutes[selectedIndex];

    if (!selectedRoute) {
        alert("Selecciona una ruta primero.");
        return;
    }

    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(position => {
            let lat = position.coords.latitude;
            let lon = position.coords.longitude;
            document.getElementById("location").textContent = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
            marker.setLatLng([lat, lon]);
            map.setView([lat, lon], 15);

            calculateTimeDifference(lat, lon);
        }, error => {
            console.error("Error obteniendo ubicación:", error);
        }, { enableHighAccuracy: true, maximumAge: 0 });
    } else {
        alert("Tu navegador no soporta geolocalización.");
    }
}

// Detener la navegación
function stopNavigation() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        document.getElementById("time-difference").textContent = "Navegación detenida";
    }
}

// Calcular diferencia de tiempo en formato MM:SS
function calculateTimeDifference(lat, lon) {
    let closestStop = null;
    let minDistance = Infinity;

    selectedRoute.stops.forEach(stop => {
        let distance = Math.hypot(lat - stop.lat, lon - stop.lon);
        if (distance < minDistance) {
            minDistance = distance;
            closestStop = stop;
        }
    });

    if (!closestStop) return;

    let now = new Date();
    let stopTime = new Date();
    let [hours, minutes, seconds] = closestStop.time.split(":").map(Number);
    stopTime.setHours(hours, minutes, seconds);

    let timeDiff = Math.floor((now - stopTime) / 1000);
    let minutesDiff = Math.floor(Math.abs(timeDiff) / 60).toString().padStart(2, '0');
    let secondsDiff = (Math.abs(timeDiff) % 60).toString().padStart(2, '0');

    let sign = timeDiff < 0 ? "-" : "+";
    document.getElementById("time-difference").textContent = `${sign}${minutesDiff}:${secondsDiff}`;
}

// Eventos para iniciar/detener navegación
document.getElementById("start-navigation").addEventListener("click", startNavigation);
document.getElementById("stop-navigation").addEventListener("click", stopNavigation);

// Cargar rutas al iniciar
loadRoutes();
