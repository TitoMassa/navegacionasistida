// Inicializar el mapa
const map = L.map('map').setView([0, 0], 15); // Coordenadas iniciales (se actualizarán con la geolocalización)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let userMarker = null; // Marcador de la ubicación del usuario
let points = []; // Array para almacenar los puntos agregados
let currentPointIndex = 0; // Índice del punto actual en la navegación
const pointRadius = 20; // Radio de 20 metros alrededor de cada punto

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

            // Verificar si el usuario está dentro del radio de algún punto
            checkIfUserIsInsidePoint(userLatLng);
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

    if (arrivalTime && departureTime) {
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
        item.innerHTML = `Punto ${index + 1}: Lat: ${point.lat}, Lng: ${point.lng}, Llegada: ${point.arrivalTime}, Salida: ${point.departureTime}`;
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

// Verificar si el usuario está dentro del radio de algún punto
function checkIfUserIsInsidePoint(userLatLng) {
    const userLat = userLatLng[0];
    const userLng = userLatLng[1];

    points.forEach((point, index) => {
        const pointLatLng = [point.lat, point.lng];
        const distance = calculateDistance(userLat, userLng, point.lat, point.lng);

        if (distance <= pointRadius) {
            // El usuario está dentro del radio del punto
            alert(`¡Estás dentro del radio del Punto ${index + 1}!`);
            adjustTimeBasedOnDeparture(point.departureTime);
        }
    });
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

// Ajustar el horario según el horario de salida del punto
function adjustTimeBasedOnDeparture(departureTime) {
    const currentTime = new Date();
    const departureDate = new Date(currentTime.toDateString() + ' ' + departureTime);

    if (currentTime < departureDate) {
        alert(`Aún no es hora de salir. La salida está programada para ${departureTime}`);
    } else {
        alert(`Es hora de salir. ¡Adelante!`);
    }
}

// Función para agregar puntos manualmente
document.getElementById('add-point').addEventListener('click', function() {
    map.once('click', function(e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);

        const arrivalTime = prompt("Ingrese la hora de llegada (HH:mm):");
        const departureTime = prompt("Ingrese la hora de salida (HH:mm):");

        if (arrivalTime && departureTime) {
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
});

// Inicializar la ubicación del usuario al cargar la página
getUserLocation();
