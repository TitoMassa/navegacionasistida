let predefinedLocations = {};
let routeActive = false;

document.getElementById("save-start").addEventListener("click", () => saveLocation("start"));
document.getElementById("save-end").addEventListener("click", () => saveLocation("end"));
document.getElementById("start-route").addEventListener("click", startRoute);

navigator.geolocation.watchPosition(updateLocation, handleLocationError);

function saveLocation(type) {
  const name = prompt(`Nombre para la ubicación (${type === "start" ? "Inicio" : "Destino"}):`);
  if (!name) return alert("Debe asignar un nombre válido.");
  
  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude, longitude } = position.coords;
    predefinedLocations[name] = { latitude, longitude };
    updateLocationList(type, name);
  }, handleLocationError);
}

function updateLocationList(type, name) {
  const selectElement = type === "start" ? document.getElementById("start-location") : document.getElementById("end-location");
  const option = document.createElement("option");
  option.value = name;
  option.textContent = name;
  selectElement.appendChild(option);
}

function startRoute() {
  if (routeActive) return alert("Ruta ya en progreso.");
  
  const startTime = document.getElementById("start-time").value;
  const endTime = document.getElementById("end-time").value;
  if (!startTime || !endTime) return alert("Por favor, configure horarios válidos.");

  routeActive = true;
  setInterval(updateRouteStatus, 5000);
}

function updateLocation(position) {
  const { latitude, longitude } = position.coords;
  console.log("Ubicación actual:", latitude, longitude);
}

function updateRouteStatus() {
  const now = new Date();
  const startTime = parseTime(document.getElementById("start-time").value);
  const endTime = parseTime(document.getElementById("end-time").value);
  const statusElement = document.getElementById("time-difference");

  if (now < startTime) {
    const diff = calculateTimeDifference(now, startTime);
    statusElement.textContent = `Tiempo restante: +${formatTime(diff)}`;
    statusElement.className = "blue";
  } else {
    const diff = calculateTimeDifference(now, endTime);
    const delay = now > endTime;
    statusElement.textContent = `${delay ? "-" : "+"}${formatTime(diff)}`;
    statusElement.className = delay ? "red" : "green";
  }
}

function calculateTimeDifference(start, end) {
  return Math.abs((end - start) / 1000);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function parseTime(timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  return now;
}

function handleLocationError(error) {
  console.error("Error obteniendo ubicación:", error.message);
}
