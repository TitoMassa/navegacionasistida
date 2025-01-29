// Datos de ejemplo de las paradas y sus horarios programados
const stops = [
    { name: "Parada 1", latitude: -34.6037, longitude: -58.3816, scheduledTime: "08:00" },
    { name: "Parada 2", latitude: -34.6127, longitude: -58.3791, scheduledTime: "08:15" },
    { name: "Parada 3", latitude: -34.6247, longitude: -58.3705, scheduledTime: "08:30" }
];

let currentStopIndex = 0;

// Simulación de la geolocalización del conductor (reemplazar con la API real)
function getLocation() {
    // Simula un movimiento lineal hacia la siguiente parada
    const currentLocation = {
        latitude: stops[currentStopIndex].latitude + Math.random()*0.003-0.0015,
        longitude: stops[currentStopIndex].longitude + Math.random()*0.003-0.0015
    };
    return currentLocation;
}

// Función para calcular la diferencia de tiempo en formato MM:SS
function calculateTimeDifference(scheduledTime, currentTime) {
    const [scheduledHour, scheduledMinute] = scheduledTime.split(":").map(Number);
    const [currentHour, currentMinute] = [currentTime.getHours(), currentTime.getMinutes()];

    const scheduledMinutes = scheduledHour * 60 + scheduledMinute;
    const currentMinutes = currentHour * 60 + currentMinute;

    let difference = currentMinutes - scheduledMinutes;
    const sign = difference >= 0 ? "+" : "-";
    difference = Math.abs(difference);

    const diffMinutes = Math.floor(difference);
    const diffSeconds = Math.round((difference - diffMinutes) * 60);

    return `${sign}${String(diffMinutes).padStart(2, "0")}:${String(diffSeconds).padStart(2, "0")}`;
}


// Función para actualizar la información en la página
function updateBusInfo() {
  const location = getLocation();
  const currentTime = new Date();
  const timeDifference = calculateTimeDifference(stops[currentStopIndex].scheduledTime, currentTime);

  // Actualizar la información en el HTML
    document.getElementById('latitude').textContent = location.latitude.toFixed(4);
    document.getElementById('longitude').textContent = location.longitude.toFixed(4);
    document.getElementById('next-stop').textContent = stops[currentStopIndex].name;
    document.getElementById('time-difference').textContent = timeDifference;

  if (currentStopIndex < stops.length -1) {
    if (Math.random() > 0.9) { // Simula que el bus ha llegado a la parada (probabilidad del 10%)
      currentStopIndex++;
    }
  }
}

// Actualizar la información cada 5 segundos
setInterval(updateBusInfo, 5000);

updateBusInfo()
