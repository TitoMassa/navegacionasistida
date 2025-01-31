// Inicializar el mapa
const map = L.map('map').setView([0, 0], 15); // Coordenadas iniciales (se actualizarán con la geolocalización)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let userMarker = null; // Marcador de la ubicación del usuario
let points = []; // Array para almacenar los puntos agregados
let currentPointIndex = -1; // Índice del punto actual (-1 significa que no está en ningún punto)
const pointRadius = 20; // Radio de 20 metros alrededor de cada punto
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

            // Verificar si el usuario está dentro del radio de algún punto
            if (isNavigationActive) {
                checkIfUserIsInsidePoint(userLatLng);
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

    // Solicitar al usuario la hora de salida
    const departureTime = prompt("Ingrese la hora de salida (HH:mm):");

    if (departureTime) {
        const point = {
            lat,
            lng,
            departureTime
        };

        points.push(point);
        addPointToMapAndList(point);
    }
});

// Agregar un punto al mapa y a la lista
function addPointToMapAndList(point) {
    const marker = L.circleMarker([point.lat, point.lng], { radius: 5, color: 'blue' }).addTo(map).bindPopup(`Salida: ${point.departureTime}`);
    updatePointsList();
}

// Actualizar la lista de puntos en el panel
function updatePointsList() {
    const list = document.getElementById('points-list');
    list.innerHTML = '';
    points.forEach((point, index) => {
        const item = document.createElement('div');
        item.className = 'point-item';
        item.innerHTML = `Punto ${index + 1}: Lat: ${point.lat}, Lng: ${point.lng}, Salida: ${point.departureTime}`;
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

    let isInsideAnyPoint = false;

    points.forEach((point, index) => {
        const pointLatLng = [point.lat, point.lng];
        const distance = calculateDistance(userLat, userLng, point.lat, point.lng);

        if (distance <= pointRadius) {
            // El usuario está dentro del radio del punto
            isInsideAnyPoint = true;
            if (currentPointIndex !== index) {
                currentPointIndex = index;
                document.getElementById('location-status').innerHTML = `Ubicación: Punto ${index + 1}`;
                calculateTimeDifferenceForDeparture(point.departureTime);
            }
        }
    });

    // Si el usuario no está dentro de ningún punto
    if (!isInsideAnyPoint && currentPointIndex !== -1) {
        currentPointIndex = -1;
        document.getElementById('location-status').innerHTML = "Ubicación: No estás dentro de ningún punto.";
        document.getElementById('time-difference').innerHTML = "";
    }
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

// Calcular la diferencia de tiempo con respecto a la hora de salida
function calculateTimeDifferenceForDeparture(departureTime) {
    const currentTime = new Date();
    const departureDate = new Date(currentTime.toDateString() + ' ' + departureTime);

    let timeDifference = Math.floor((departureDate - currentTime) / 1000); // Diferencia en segundos
    let sign = timeDifference >= 0 ? '+' : '-';
    timeDifference = Math.abs(timeDifference);

    const minutes = Math.floor(timeDifference / 60);
    const seconds = timeDifference % 60;

    const formattedDifference = `${sign}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('time-difference').innerHTML = `Diferencia de tiempo: <span class="time-difference">${formattedDifference}</span>`;
}

// Botón "Iniciar Navegación"
document.getElementById('start-navigation').addEventListener('click', function() {
    if (points.length === 0) {
        alert("No hay puntos para navegar.");
        return;
    }

    isNavigationActive = true;
    getUserLocation(); // Iniciar la obtención de la ubicación en tiempo real
});

// Inicializar la ubicación del usuario al cargar la página
getUserLocation();
