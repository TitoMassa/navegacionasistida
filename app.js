// Inicializar el mapa
const map = L.map('map').setView([0, 0], 15); // Coordenadas iniciales (se actualizarán con la geolocalización)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let userMarker = null; // Marcador de la ubicación del usuario
let points = []; // Array para almacenar los puntos agregados
let currentPointIndex = 0; // Índice del punto actual en la navegación

// Obtener la ubicación actual del usuario
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 15);
            if (userMarker) {
                map.removeLayer(userMarker);
            }
            userMarker = L.marker([latitude, longitude]).addTo(map).bindPopup("Tu ubicación").openPopup();
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
    const marker = L.marker([point.lat, point.lng]).addTo(map).bindPopup(`Llegada: ${point.arrivalTime}, Salida: ${point.departureTime}`);
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
            if (layer instanceof L.Marker && layer !== userMarker) {
                map.removeLayer(layer);
            }
        });
        points.forEach(point => {
            L.marker([point.lat, point.lng]).addTo(map);
        });
    } else {
        alert("No hay puntos para eliminar.");
    }
});

// Iniciar la navegación
document.getElementById('start-navigation').addEventListener('click', function() {
    if (points.length === 0) {
        alert("No hay puntos para navegar.");
        return;
    }

    currentPointIndex = 0;
    updateNavigation();
});

// Actualizar la navegación y calcular la diferencia de tiempo
function updateNavigation() {
    const currentTime = new Date();
    const currentPoint = points[currentPointIndex];
    const arrivalTime = new Date(currentTime.toDateString() + ' ' + currentPoint.arrivalTime);

    let timeDifference = Math.floor((arrivalTime - currentTime) / 1000); // Diferencia en segundos
    let sign = timeDifference >= 0 ? '+' : '-';
    timeDifference = Math.abs(timeDifference);

    const minutes = Math.floor(timeDifference / 60);
    const seconds = timeDifference % 60;

    const formattedDifference = `${sign}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('time-difference').innerHTML = `Diferencia de tiempo: <span class="time-difference">${formattedDifference}</span>`;
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

// Actualizar la diferencia de tiempo cada segundo
setInterval(updateNavigation, 1000);
