// Inicializar el mapa
const map = L.map('map').setView([0, 0], 15); // Coordenadas iniciales (se actualizarán con la geolocalización)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let userMarker = null; // Marcador de la ubicación del usuario
let points = []; // Array para almacenar los puntos agregados
let isNavigationActive = false; // Indica si la navegación está activa

// Obtener la ubicación actual del usuario en tiempo real
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(position => {
            const { latitude, longitude } = position.coords;
            const userLatLng = [latitude, longitude];

            // Si no existe un marcador de usuario, lo creamos
            if (!userMarker) {
                userMarker = L.marker(userLatLng).addTo(map).bindPopup("Tu ubicación").openPopup();
            } else {
                userMarker.setLatLng(userLatLng); // Actualizar la posición del marcador
            }

            map.setView(userLatLng, 15); // Centrar el mapa en la ubicación actual

            // Verificar la diferencia de tiempo si la navegación está activa
            if (isNavigationActive) {
                calculateTimeDifference(userLatLng);
            }
        }, error => {
            console.error("Error al obtener la ubicación:", error);
        });
    } else {
        alert("La geolocalización no está disponible en este navegador.");
    }
}

// Agregar un punto al hacer clic en el mapa
map.on('click', function(e) {
    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);

    // Solicitar al usuario las horas de llegada y salida
    const arrivalTime = prompt("Ingrese la hora de llegada (HH:mm):");
    const departureTime = prompt("Ingrese la hora de salida (HH:mm):");

    if (arrivalTime || departureTime) {
        const point = {
            lat,
            lng,
            arrivalTime,
            departureTime
        };

        points.push(point);
        addPointToMapAndList(point);
    }
});

// Agregar un punto al mapa y a la lista
function addPointToMapAndList(point) {
    const marker = L.circleMarker([point.lat, point.lng], { radius: 5, color: 'blue' }).addTo(map).bindPopup(`Llegada: ${point.arrivalTime}, Salida: ${point.departureTime}`);
    updatePointsList();
}

// Actualizar la lista de puntos en el panel
function updatePointsList() {
    const list = document.getElementById('points-list');
    list.innerHTML = '';
    points.forEach((point, index) => {
        const item = document.createElement('div');
        item.className = 'point-item';
        item.innerHTML = `Punto ${index + 1}: Lat: ${point.lat}, Lng: ${point.lng}, Llegada: ${point.arrivalTime || 'N/A'}, Salida: ${point.departureTime || 'N/A'}`;
        list.appendChild(item);
    });
}

// Eliminar el último punto agregado
document.getElementById('remove-point').addEventListener('click', function() {
    if (points.length > 0) {
        points.pop(); // Eliminar el último punto del array
        updatePointsList();
        map.eachLayer(layer => {
            if (layer instanceof L.CircleMarker) {
                map.removeLayer(layer);
            }
        });
        points.forEach(point => {
            L.circleMarker([point.lat, point.lng], { radius: 5, color: 'blue' }).addTo(map);
        });
    } else {
        alert("No hay puntos para eliminar.");
    }
});

// Calcular la diferencia de tiempo
function calculateTimeDifference(userLatLng) {
    if (points.length < 2) {
        document.getElementById('time-difference').innerHTML = "Se necesitan al menos 2 puntos para calcular la diferencia de tiempo.";
        return;
    }

    let totalDistance = 0; // Distancia total entre todos los puntos
    let totalTimeInSeconds = 0; // Tiempo total programado entre todos los puntos

    // Calcular la distancia total y el tiempo total programado
    for (let i = 0; i < points.length - 1; i++) {
        const startPoint = points[i];
        const endPoint = points[i + 1];

        const distance = calculateDistance(startPoint.lat, startPoint.lng, endPoint.lat, endPoint.lng);
        totalDistance += distance;

        const startTime = new Date(`1970-01-01T${startPoint.departureTime || startPoint.arrivalTime}`);
        const endTime = new Date(`1970-01-01T${endPoint.arrivalTime || endPoint.departureTime}`);
        totalTimeInSeconds += (endTime - startTime) / 1000;
    }

    // Calcular la distancia recorrida hasta la posición actual
    let currentSegmentIndex = -1;
    let distanceToCurrentPosition = 0;

    for (let i = 0; i < points.length - 1; i++) {
        const startPoint = points[i];
        const endPoint = points[i + 1];

        const segmentDistance = calculateDistance(startPoint.lat, startPoint.lng, endPoint.lat, endPoint.lng);
        const userDistanceToStart = calculateDistance(userLatLng[0], userLatLng[1], startPoint.lat, startPoint.lng);
        const userDistanceToEnd = calculateDistance(userLatLng[0], userLatLng[1], endPoint.lat, endPoint.lng);

        if (userDistanceToStart + userDistanceToEnd <= segmentDistance + 20) { // Margen de 20 metros
            currentSegmentIndex = i;
            distanceToCurrentPosition += segmentDistance - userDistanceToEnd;
            break;
        } else {
            distanceToCurrentPosition += segmentDistance;
        }
    }

    if (currentSegmentIndex === -1) {
        document.getElementById('time-difference').innerHTML = "No estás en el camino hacia ningún punto.";
        return;
    }

    // Calcular el tiempo que debería haber transcurrido
    const timePerMeter = totalTimeInSeconds / totalDistance;
    const expectedTimeInSeconds = distanceToCurrentPosition * timePerMeter;

    const currentTime = new Date();
    const startTime = new Date(`1970-01-01T${points[0].departureTime || points[0].arrivalTime}`);
    const expectedTime = new Date(startTime.getTime() + expectedTimeInSeconds * 1000);

    const timeDifferenceInSeconds = Math.floor((expectedTime - currentTime) / 1000);
    const sign = timeDifferenceInSeconds >= 0 ? '+' : '-';
    const absoluteDifference = Math.abs(timeDifferenceInSeconds);

    const minutes = Math.floor(absoluteDifference / 60);
    const seconds = absoluteDifference % 60;

    const formattedDifference = `${sign}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('time-difference').innerHTML = `Diferencia de tiempo: <span class="time-difference">${formattedDifference}</span>`;
}

// Calcular la distancia entre dos puntos usando la fórmula de Haversine
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
}

// Convertir grados a radianes
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

// Botón "Iniciar Navegación"
document.getElementById('start-navigation').addEventListener('click', function() {
    if (points.length < 2) {
        alert("Se necesitan al menos 2 puntos para iniciar la navegación.");
        return;
    }

    isNavigationActive = true;
    getUserLocation(); // Iniciar la obtención de la ubicación en tiempo real
});

// Inicializar la ubicación del usuario al cargar la página
getUserLocation();
