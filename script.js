document.addEventListener("DOMContentLoaded", function () {
    let routeSelector = document.getElementById("route-selector");
    loadRoutes();

    function loadRoutes() {
        let storedRoutes = JSON.parse(localStorage.getItem("routes")) || [];
        routeSelector.innerHTML = '<option value="">Seleccionar ruta...</option>';

        storedRoutes.forEach((route, index) => {
            let option = document.createElement("option");
            option.value = index;
            option.textContent = route.name;
            routeSelector.appendChild(option);
        });
    }

    document.getElementById("delete-route").addEventListener("click", function () {
        let selectedIndex = routeSelector.value;
        if (selectedIndex === "") {
            alert("Selecciona una ruta para eliminar.");
            return;
        }

        let storedRoutes = JSON.parse(localStorage.getItem("routes")) || [];
        storedRoutes.splice(selectedIndex, 1);
        localStorage.setItem("routes", JSON.stringify(storedRoutes));

        alert("Ruta eliminada.");
        loadRoutes(); // Recargar la lista sin recargar la página
    });
});

let map = L.map('map').setView([0, 0], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
let routeLayer = L.layerGroup().addTo(map);
let marker = L.marker([0, 0]).addTo(map);
let watchId = null;
let selectedRoute = null;

// Mostrar la ruta seleccionada en el mapa
function loadRouteOnMap(route) {
    routeLayer.clearLayers();

    if (route.route.length > 0) {
        let polyline = L.polyline(route.route.map(p => [p.lat, p.lon]), { color: 'blue' }).addTo(routeLayer);
        map.fitBounds(polyline.getBounds());
    }

    route.stops.forEach(stop => {
        L.marker([stop.lat, stop.lon]).addTo(routeLayer)
            .bindPopup(`${stop.name} - ${stop.time}`);
    });
}

function startNavigation() {
let timeUpdateInterval = null;
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
        }, error => {
            console.error("Error obteniendo ubicación:", error);
        }, { enableHighAccuracy: true, maximumAge: 0 });

        // Actualizar diferencia de tiempo cada 5 segundos
        if (timeUpdateInterval) clearInterval(timeUpdateInterval);
        timeUpdateInterval = setInterval(updateTimeDifference, 5000);
    } else {
        alert("Tu navegador no soporta geolocalización.");
    }
}

function stopNavigation() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    if (timeUpdateInterval !== null) {
        clearInterval(timeUpdateInterval);
        timeUpdateInterval = null;
    }
    document.getElementById("time-difference").textContent = "";
}

function updateTimeDifference() {
    if (!selectedRoute) return;
    
    navigator.geolocation.getCurrentPosition(position => {
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;
        calculateTimeDifference(lat, lon);
    });
}
function calculateTimeDifference(lat, lon) {
    let closestStop = null;
    let minDistance = Infinity;
    
    // Encuentra la parada más cercana
    selectedRoute.stops.forEach(stop => {
        let stopLat = stop.lat;
        let stopLon = stop.lon;
        let stopTime = new Date(stop.time);
        
        // Calcular distancia entre la posición actual y la parada
        let distance = haversine(lat, lon, stopLat, stopLon);  // Función haversine para calcular la distancia
        
        if (distance < minDistance) {
            closestStop = stop;
            minDistance = distance;
        }
    });

    if (closestStop) {
        let now = new Date();
        let stopTime = new Date(closestStop.time);
        
        // Calcula la diferencia de tiempo en milisegundos
        let timeDiff = now - stopTime;
        let minutes = Math.floor(timeDiff / 60000); // Convierte a minutos
        let seconds = Math.floor((timeDiff % 60000) / 1000); // Convierte el resto a segundos

        // Ajusta la diferencia para que siempre tenga el formato correcto
        let timeDifference = `${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
        
        // Aquí corregimos el signo y el color
        if (timeDiff < 0) {
            // Si timeDiff es negativo, está atrasado
            timeDifference = `-${timeDifference}`; // Atrasado
            document.getElementById("time-difference").style.color = "red"; // Rojo si está atrasado
        } else if (timeDiff > 0) {
            // Si timeDiff es positivo, está adelantado
            timeDifference = `+${timeDifference}`; // Adelantado
            document.getElementById("time-difference").style.color = "blue"; // Azul si está adelantado
        } else {
            // Si no hay diferencia, está a tiempo
            timeDifference = `+00:00`; // A tiempo
            document.getElementById("time-difference").style.color = "green"; // Verde si está a tiempo
        }

        document.getElementById("time-difference").textContent = timeDifference;
    }
}

document.getElementById("start-navigation").addEventListener("click", startNavigation);
document.getElementById("stop-navigation").addEventListener("click", stopNavigation);
document.getElementById("delete-route").addEventListener("click", function () {
    let routeSelector = document.getElementById("route-selector");
    let selectedIndex = routeSelector.value;

    if (selectedIndex === "") {
        alert("Selecciona una ruta para eliminar.");
        return;
    }

    let storedRoutes = JSON.parse(localStorage.getItem("routes")) || [];
    storedRoutes.splice(selectedIndex, 1);
    localStorage.setItem("routes", JSON.stringify(storedRoutes));

    alert("Ruta eliminada.");
    location.reload(); // Recargar la página para actualizar la lista de rutas
});
window.addEventListener("visibilitychange", function() {
    if (document.hidden) {
        alert("Para un mejor funcionamiento, mantén la aplicación abierta.");
    }
window.addEventListener("visibilitychange", function() {
    if (document.hidden) {
        alert("Para un mejor funcionamiento, mantén la aplicación abierta.");
    }
});
});
