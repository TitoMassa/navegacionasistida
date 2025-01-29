document.addEventListener("DOMContentLoaded", function () {
    let storedRoutes = JSON.parse(localStorage.getItem("routes")) || [];
    let routeSelector = document.getElementById("route-selector");

    // Llenar el selector con las rutas guardadas
    storedRoutes.forEach((route, index) => {
        let option = document.createElement("option");
        option.value = index;
        option.textContent = route.name;
        routeSelector.appendChild(option);
    });
});

let map = L.map('map').setView([0, 0], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
let marker = L.marker([0, 0]).addTo(map);
let watchId = null;
let selectedRoute = null;

function startNavigation() {
    let storedRoutes = JSON.parse(localStorage.getItem("routes")) || [];
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

function stopNavigation() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        document.getElementById("time-difference").textContent = "";
    }
}

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
    let formattedTime = `${sign}${minutesDiff}:${secondsDiff}`;
    let timeDifferenceElement = document.getElementById("time-difference");

    // Aplicar colores según el tiempo de diferencia
    let totalDiffInSeconds = Math.abs(timeDiff);
    if (totalDiffInSeconds > 120) {
        timeDifferenceElement.style.color = timeDiff < 0 ? "red" : "blue";
    } else {
        timeDifferenceElement.style.color = "green";
    }

    timeDifferenceElement.style.fontSize = "24px";
    timeDifferenceElement.style.fontWeight = "bold";
    timeDifferenceElement.textContent = formattedTime;
}

document.getElementById("start-navigation").addEventListener("click", startNavigation);
document.getElementById("stop-navigation").addEventListener("click", stopNavigation);
