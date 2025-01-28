let watchId = null;
let currentPosition = null;
let startPos = null;
let destPos = null;
let startTime = null;
let arrivalTime = null;
let totalDistance = 0;

// Cargar ubicaciones guardadas al iniciar
let savedLocations = JSON.parse(localStorage.getItem('locations')) || [];
updateLocationSelects();

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

function formatTimeDifference(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(Math.abs(totalSeconds) / 60);
    const seconds = Math.abs(totalSeconds) % 60;
    const sign = totalSeconds >= 0 ? '+' : '-';
    
    return `${sign}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateDisplay(difference) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = formatTimeDifference(difference);
    
    const diffSeconds = Math.floor(difference / 1000);
    statusElement.className = 'time-display ';
    
    if (diffSeconds <= -120) {
        statusElement.classList.add('red');
    } else if (diffSeconds >= 120) {
        statusElement.classList.add('blue');
    } else {
        statusElement.classList.add('green');
    }
}

function updateNavigation() {
    if (!currentPosition || !startPos || !destPos) return;

    const now = Date.now();
    const currentLat = currentPosition.coords.latitude;
    const currentLon = currentPosition.coords.longitude;
    
    // Calcular distancia al destino
    const remainingDistance = calculateDistance(
        currentLat, currentLon,
        destPos.lat, destPos.lon
    );

    // Verificar si el viaje ha comenzado
    const distanceFromStart = calculateDistance(
        currentLat, currentLon,
        startPos.lat, startPos.lon
    );

    const tripStarted = distanceFromStart > 50 || now >= startTime;

    if (!tripStarted && now < startTime) {
        const timeRemaining = startTime - now;
        updateDisplay(-timeRemaining);
        return;
    }

    const totalTime = arrivalTime - startTime;
    const timeNeeded = (remainingDistance / totalDistance) * totalTime;
    const remainingTime = arrivalTime - now;
    const difference = timeNeeded - remainingTime;

    updateDisplay(difference);
}

function startNavigation() {
    const startSelect = document.getElementById('startSelect');
    const destSelect = document.getElementById('destSelect');
    
    startPos = JSON.parse(startSelect.value);
    destPos = JSON.parse(destSelect.value);
    
    startTime = new Date(document.getElementById('startTime').value).getTime();
    arrivalTime = new Date(document.getElementById('arrivalTime').value).getTime();

    if (!startPos || !destPos || !startTime || !arrivalTime) {
        alert('Por favor complete todos los campos');
        return;
    }

    totalDistance = calculateDistance(
        startPos.lat, startPos.lon,
        destPos.lat, destPos.lon
    );

    if (watchId) navigator.geolocation.clearWatch(watchId);
    
    watchId = navigator.geolocation.watchPosition(
        position => {
            currentPosition = position;
            updateNavigation();
        },
        error => console.error(error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    setInterval(updateNavigation, 5000);
}

function saveLocation() {
    const name = document.getElementById('locationName').value.trim();
    if (!name || !currentPosition) {
        alert('Ingrese un nombre y asegúrese de tener ubicación');
        return;
    }

    const newLocation = {
        name: name,
        lat: currentPosition.coords.latitude,
        lon: currentPosition.coords.longitude
    };

    savedLocations.push(newLocation);
    localStorage.setItem('locations', JSON.stringify(savedLocations));
    updateLocationSelects();
    document.getElementById('locationName').value = '';
    updateLocationsList();
}

function deleteLocation(index) {
    savedLocations.splice(index, 1);
    localStorage.setItem('locations', JSON.stringify(savedLocations));
    updateLocationSelects();
    updateLocationsList();
}

function useCurrentLocation(type) {
    navigator.geolocation.getCurrentPosition(position => {
        currentPosition = position;
        const selectElement = document.getElementById(`${type}Select`);
        selectElement.value = JSON.stringify({
            lat: position.coords.latitude,
            lon: position.coords.longitude
        });
    });
}

function updateLocationSelects() {
    const startSelect = document.getElementById('startSelect');
    const destSelect = document.getElementById('destSelect');
    
    const updateSelect = (select) => {
        select.innerHTML = '<option value="">Seleccionar ubicación</option>';
        savedLocations.forEach(location => {
            const option = document.createElement('option');
            option.value = JSON.stringify(location);
            option.textContent = location.name;
            select.appendChild(option);
        });
    };

    updateSelect(startSelect);
    updateSelect(destSelect);
}

function updateLocationsList() {
    const list = document.getElementById('locationsList');
    list.innerHTML = '';
    
    savedLocations.forEach((location, index) => {
        const li = document.createElement('li');
        li.textContent = location.name;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Eliminar';
        deleteBtn.onclick = () => deleteLocation(index);
        
        li.appendChild(deleteBtn);
        list.appendChild(li);
    });
}

// Actualizar lista al cargar
updateLocationsList();
