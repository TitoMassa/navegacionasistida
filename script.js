// Función para calcular la distancia entre dos puntos usando la fórmula de Haversine
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distancia en km
    return distance;
}

// Función para obtener la ubicación actual del usuario
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            calculateTimeDifference(lat, lon);  // Llamamos a la función para calcular la diferencia de tiempo
        }, function(error) {
            console.error("Error obteniendo la ubicación: " + error.message);
        });
    } else {
        console.log("Geolocalización no es soportada por este navegador.");
    }
}

// Función para calcular la diferencia de tiempo entre la posición del usuario y la parada más cercana
function calculateTimeDifference(lat, lon) {
    let closestStop = null;
    let minDistance = Infinity;

    // Verifica si se seleccionó una ruta y si tiene paradas
    if (!selectedRoute || !selectedRoute.stops || selectedRoute.stops.length === 0) {
        console.error("No hay paradas disponibles en la ruta seleccionada.");
        return;
    }

    // Encuentra la parada más cercana
    selectedRoute.stops.forEach(stop => {
        let stopLat = stop.lat;
        let stopLon = stop.lon;
        let stopTime = new Date(stop.time);
        
        // Calcular la distancia entre la posición actual y la parada
        let distance = haversine(lat, lon, stopLat, stopLon);  // Función haversine para calcular la distancia

        if (distance < minDistance) {
            closestStop = stop;
            minDistance = distance;
        }
    });

    // Si no encontramos ninguna parada válida, mostramos un error
    if (!closestStop) {
        console.error("No se pudo encontrar la parada más cercana.");
        return;
    }

    // Si encontramos la parada más cercana, calculamos la diferencia de tiempo
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

// Función para cargar las rutas creadas desde el almacenamiento local (localStorage)
function loadRoutes() {
    const routesData = localStorage.getItem('routes');
    if (routesData) {
        selectedRoutes = JSON.parse(routesData);
        displayRoutes();
    }
}

// Función para mostrar las rutas disponibles en el selector
function displayRoutes() {
    const routeSelector = document.getElementById('route-selector');
    routeSelector.innerHTML = ''; // Limpiar el selector antes de llenarlo
    selectedRoutes.forEach((route, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = route.name;
        routeSelector.appendChild(option);
    });
}

// Función para iniciar la navegación con la ruta seleccionada
function startNavigation() {
    const routeSelector = document.getElementById('route-selector');
    const routeIndex = routeSelector.value;

    if (routeIndex !== '') {
        selectedRoute = selectedRoutes[routeIndex];
        document.getElementById("start-button").disabled = true; // Desactivar el botón para evitar reiniciar la navegación

        // Iniciar cálculo de la diferencia de tiempo cada 5 segundos
        setInterval(() => {
            getCurrentLocation(); // Obtener la ubicación y calcular la diferencia de tiempo
        }, 5000);
    }
}

// Función para detener la navegación
function stopNavigation() {
    clearInterval(navigationInterval); // Detener el intervalo
    document.getElementById("start-button").disabled = false; // Rehabilitar el botón
}

// Evento para cargar las rutas al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
    loadRoutes();
    document.getElementById('start-button').addEventListener('click', startNavigation);
    document.getElementById('stop-button').addEventListener('click', stopNavigation);
});
