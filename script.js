let savedLocations = JSON.parse(localStorage.getItem('locations')) || [];
let navigationInterval = null;
let currentPosition = null;
let routeStarted = false;

// Inicializar selects de ubicaciones
updateLocationSelects();

function saveLocation(type) {
    const name = prompt('Nombre de la ubicación:');
    if (!name) return;
    
    const select = type === 'start' ? document.getElementById('startPoint') : document.getElementById('endPoint');
    const position = currentPosition || { coords: { latitude: 0, longitude: 0 } };
    
    const newLocation = {
        name,
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };
    
    savedLocations.push(newLocation);
    localStorage.setItem('locations', JSON.stringify(savedLocations));
    updateLocationSelects();
}

function deleteLocation(index) {
    savedLocations.splice(index, 1);
    localStorage.setItem('locations', JSON.stringify(savedLocations));
    updateLocationSelects();
}

function updateLocationSelects() {
    const startSelect = document.getElementById('startPoint');
    const endSelect = document.getElementById('endPoint');
    const locationList = document.getElementById('locationList');
    
    // Limpiar selects
    startSelect.innerHTML = '<option value="current">Ubicación actual</option>';
    endSelect.innerHTML = '';
    locationList.innerHTML = '';
    
    // Llenar selects y lista
    savedLocations.forEach((loc, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = loc.name;
        
        startSelect.appendChild(option.cloneNode(true));
        endSelect.appendChild(option);
        
        // Agregar a la lista
        const li = document.createElement('li');
        li.innerHTML = `
            ${loc.name} 
            <button onclick="deleteLocation(${index})">Eliminar</button>
        `;
        locationList.appendChild(li);
    });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atn2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

function calculateTimeDifference() {
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const startSelect = document.getElementById('startPoint');
    const endSelect = document.getElementById('endPoint');
    
    if (!startTime || !endTime) return;
    
    const now = new Date();
    const totalTripTime = (new Date(`1970-01-01T${endTime}`) - new Date(`1970-01-01T${startTime}`)) / 1000;
    
    let startPoint;
    if (startSelect.value === 'current') {
        startPoint = currentPosition.coords;
    } else {
        const loc = savedLocations[startSelect.value];
        startPoint = { latitude: loc.lat, longitude: loc.lng };
    }
    
    const endLoc = savedLocations[endSelect.value];
    const totalDistance = calculateDistance(
        startPoint.latitude, startPoint.longitude,
        endLoc.lat, endLoc.lng
    );
    
    const currentDistance = calculateDistance(
        currentPosition.coords.latitude, currentPosition.coords.longitude,
        startPoint.latitude, startPoint.longitude
    );
    
    // Verificar si el viaje ha comenzado
    if (!routeStarted) {
        if (currentDistance > 50) {
            routeStarted = true;
        } else {
            const timeToStart = (new Date(`1970-01-01T${startTime}`) - now) / 1000;
            return { diff: timeToStart, started: false };
        }
    }
    
    const elapsedTime = (now - new Date(`1970-01-01T${startTime}`)) / 1000;
    const expectedProgress = elapsedTime / totalTripTime;
    const expectedDistance = totalDistance * expectedProgress;
    const actualDistance = calculateDistance(
        currentPosition.coords.latitude, currentPosition.coords.longitude,
        startPoint.latitude, startPoint.longitude
    );
    
    const timeDifference = (actualDistance - expectedDistance) / (totalDistance / totalTripTime);
    return { diff: timeDifference, started: true };
}

function updateDisplay() {
    const result = calculateTimeDifference();
    if (!result) return;
    
    const timeDiff = Math.abs(result.diff);
    const minutes = Math.floor(timeDiff / 60);
    const seconds = Math.floor(timeDiff % 60);
    
    let timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    let colorClass = 'green';
    
    if (result.started) {
        if (result.diff < -120) colorClass = 'red';
        else if (result.diff > 120) colorClass = 'blue';
        timeString = (result.diff < 0 ? '-' : '+') + timeString;
    } else {
        timeString = '+' + timeString;
        colorClass = result.diff <= 0 ? 'red' : 'green';
    }
    
    const display = document.getElementById('timeDisplay');
    display.textContent = timeString;
    display.className = colorClass;
}

function startNavigation() {
    if (navigationInterval) clearInterval(navigationInterval);
    routeStarted = false;
    
    navigator.geolocation.watchPosition(position => {
        currentPosition = position;
    }, console.error, { enableHighAccuracy: true });
    
    navigationInterval = setInterval(updateDisplay, 5000);
    updateDisplay();
}

// Solicitar geolocalización al cargar
navigator.geolocation.getCurrentPosition(position => {
    currentPosition = position;
}, console.error);
