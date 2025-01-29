let map; // Variable para almacenar el mapa
let selectedRoute = null; // Ruta seleccionada para la navegación
let selectedRoutes = []; // Almacenará todas las rutas creadas
let navigationInterval = null; // Variable para el intervalo de cálculo de tiempo

// Inicializar el mapa de Leaflet
function initMap() {
    // Coordenadas de la ubicación inicial
    const initialLocation = { lat: 19.432608, lng: -99.133209 }; // Ejemplo: Ciudad de México

    // Crear el mapa y añadirlo al div con id "map"
    map = L.map('map').setView([initialLocation.lat, initialLocation.lng], 12); // Centrar el mapa

    // Añadir capa base de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Añadir marcador en la ubicación inicial
    L.marker([initialLocation.lat, initialLocation.lng]).addTo(map)
        .bindPopup('Ubicación Inicial')
        .openPopup();
}

// Función para cargar las rutas desde el localStorage y mostrarlas en el selector
function loadRoutes() {
    const routesData = localStorage.getItem('routes');
    if (routesData) {
        selectedRoutes = JSON.parse(routesData);
        displayRoutes();
    }
}

// Función para mostrar las rutas en el selector de rutas
function displayRoutes() {
    const routeSelector = document.getElementById('route-selector');
    routeSelector.innerHTML = ''; // Limpiar antes de llenar el selector

    selectedRoutes.forEach((route, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = route.name;
        routeSelector.appendChild(option);
    });
}

// Función para cargar la ruta seleccionada en el mapa
function loadRouteOnMap(routeIndex) {
    // Limpiar marcadores previos
    map.eachLayer(function(layer) {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    const route = selectedRoutes[routeIndex];
    route.stops.forEach(stop => {
        // Añadir un marcador para cada parada
        const latLng = [stop.lat, stop.lon];
        L.marker(latLng).addTo(map)
            .bindPopup(`Parada: ${stop.name}, Hora: ${stop.time}`)
            .openPopup();
    });
}

// Función para iniciar la navegación con la ruta seleccionada
function startNavigation() {
    const routeSelector = document.getElementById('route-selector');
    const routeIndex = routeSelector.value;

    if (routeIndex !== '') {
        selectedRoute = selectedRoutes[routeIndex];
        document.getElementById("start-button").disabled = true; // Desactivar el botón

        // Cargar las paradas de la ruta seleccionada en el mapa
        loadRouteOnMap(routeIndex);

        // Iniciar el cálculo de la diferencia de tiempo cada 5 segundos
        navigationInterval = setInterval(calculateTimeDifference, 5000);
    }
}

// Función para detener la navegación
function stopNavigation() {
    clearInterval(navigationInterval); // Detener el intervalo
    document.getElementById("start-button").disabled = false; // Rehabilitar el botón
}

// Función para obtener la ubicación actual
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                },
                error => {
                    reject(error);
                }
            );
        } else {
            reject("Geolocalización no disponible");
        }
    });
}

// Función para calcular la diferencia de tiempo entre la posición actual y la parada más cercana
async function calculateTimeDifference() {
    let lat, lon;

    try {
        const location = await getCurrentLocation();
        lat = location.lat;
        lon = location.lon;
    } catch (error) {
        console.error(error);
        document.getElementById("time-difference").textContent = "Error al obtener ubicación";
        return;
    }

    let closestStop = null;
    let minDistance = Infinity;

    if (!selectedRoute || !selectedRoute.stops || selectedRoute.stops.length === 0) {
        console.error("No hay paradas disponibles en la ruta seleccionada.");
        return;
    }

    selectedRoute.stops.forEach(stop => {
        let stopLat = stop.lat;
        let stopLon = stop.lon;
        let stopTime = new Date(stop.time);

        // Calcular la distancia entre la ubicación actual y la parada usando Haversine
        let distance = haversine(lat, lon, stopLat, stopLon);

        if (distance < minDistance) {
            closestStop = stop;
            minDistance = distance;
        }
    });

    if (!closestStop) {
        console.error("No se pudo encontrar la parada más cercana.");
        document.getElementById("time-difference").textContent = "No se pudo encontrar la parada más cercana.";
        return;
    }

    let now = new Date();
    let stopTime = new Date(closestStop.time);
    let timeDiff = now - stopTime;
    let minutes = Math.floor(timeDiff / 60000); // Convierte a minutos
    let seconds = Math.floor((timeDiff % 60000) / 1000); // Convierte el resto a segundos

    let timeDifference = `${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

    if (timeDiff < 0) {
        timeDifference = `-${timeDifference}`;
        document.getElementById("time-difference").style.color = "red";
    } else if (timeDiff > 0) {
        timeDifference = `+${timeDifference}`;
        document.getElementById("time-difference").style.color = "blue";
    } else {
        timeDifference = `+00:00`;
        document.getElementById("time-difference").style.color = "green";
    }

    document.getElementById("time-difference").textContent = timeDifference;
}

// Función Haversine para calcular la distancia entre dos puntos geográficos
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Devuelve la distancia en kilómetros
}

// Cargar las rutas al iniciar
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadRoutes(); // Cargar rutas creadas
});
