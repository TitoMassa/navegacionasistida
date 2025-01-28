let watchId = null;

document.getElementById('useCurrentLocation').addEventListener('change', function(e) {
    const startLat = document.getElementById('startLat');
    const startLon = document.getElementById('startLon');
    
    if (e.target.checked) {
        navigator.geolocation.getCurrentPosition(position => {
            startLat.value = position.coords.latitude;
            startLon.value = position.coords.longitude;
        });
        startLat.disabled = true;
        startLon.disabled = true;
    } else {
        startLat.disabled = false;
        startLon.disabled = false;
    }
});

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2 - lat1) * Math.PI/180;
    const Δλ = (lon2 - lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

function formatTimeDiff(seconds) {
    const sign = seconds >= 0 ? '+' : '-';
    const absSeconds = Math.abs(seconds);
    const minutes = Math.floor(absSeconds / 60);
    const remainingSeconds = absSeconds % 60;
    return `${sign}${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function startNavigation() {
    const startLat = parseFloat(document.getElementById('startLat').value);
    const startLon = parseFloat(document.getElementById('startLon').value);
    const endLat = parseFloat(document.getElementById('endLat').value);
    const endLon = parseFloat(document.getElementById('endLon').value);
    const startTime = new Date(document.getElementById('startTime').value).getTime();
    const arrivalTime = new Date(document.getElementById('arrivalTime').value).getTime();

    if (!startLat || !startLon || !endLat || !endLon || !startTime || !arrivalTime) {
        alert('Por favor complete todos los campos');
        return;
    }

    const totalDistance = calculateDistance(startLat, startLon, endLat, endLon);
    const totalTime = (arrivalTime - startTime) / 1000; // en segundos
    const requiredSpeed = totalDistance / totalTime;

    if (watchId) navigator.geolocation.clearWatch(watchId);

    watchId = navigator.geolocation.watchPosition(position => {
        const currentTime = Date.now();
        const currentLat = position.coords.latitude;
        const currentLon = position.coords.longitude;
        
        const elapsedTime = (currentTime - startTime) / 1000;
        const remainingTime = (arrivalTime - currentTime) / 1000;
        
        let timeDiff = 0;
        let status = '';
        
        if (currentTime < startTime) {
            status = 'El viaje aún no ha comenzado';
        } else if (currentTime > arrivalTime) {
            timeDiff = (currentTime - arrivalTime) / 1000;
            status = `Llegada retrasada: +${formatTimeDiff(timeDiff)}`;
        } else {
            const expectedDistance = elapsedTime * requiredSpeed;
            const actualDistance = calculateDistance(startLat, startLon, currentLat, currentLon);
            timeDiff = (actualDistance - expectedDistance) / requiredSpeed;
            status = `Tiempo: ${formatTimeDiff(timeDiff)}`;
        }

        const resultDiv = document.getElementById('result');
        resultDiv.textContent = status;
        resultDiv.style.color = timeDiff >= 0 ? '#4CAF50' : '#f44336';
    }, null, {enableHighAccuracy: true});
}

// script.js
let watchId = null;
let presets = JSON.parse(localStorage.getItem('presets')) || [];

// Cargar presets al iniciar
function loadPresets() {
    const select = document.getElementById('presets');
    select.innerHTML = '<option value="">Ubicaciones guardadas</option>';
    presets.forEach(preset => {
        const option = document.createElement('option');
        option.value = preset.name;
        option.textContent = `${preset.name} (${preset.type === 'start' ? 'Inicio' : 'Destino'})`;
        select.appendChild(option);
    });
}

function loadPreset(presetName) {
    const preset = presets.find(p => p.name === presetName);
    if (!preset) return;
    
    if (preset.type === 'start') {
        document.getElementById('startLat').value = preset.lat;
        document.getElementById('startLon').value = preset.lon;
    } else {
        document.getElementById('endLat').value = preset.lat;
        document.getElementById('endLon').value = preset.lon;
    }
}

function showSavePresetModal() {
    document.getElementById('presetModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('presetModal').style.display = 'none';
}

function savePreset() {
    const name = document.getElementById('presetName').value;
    const type = document.querySelector('input[name="presetType"]:checked').value;
    const lat = type === 'start' ? document.getElementById('startLat').value : document.getElementById('endLat').value;
    const lon = type === 'start' ? document.getElementById('startLon').value : document.getElementById('endLon').value;
    
    if (!name || !lat || !lon) {
        alert('Complete todos los campos');
        return;
    }
    
    // Eliminar preset existente con mismo nombre
    presets = presets.filter(p => p.name !== name);
    
    presets.push({
        name,
        type,
        lat: parseFloat(lat),
        lon: parseFloat(lon)
    });
    
    localStorage.setItem('presets', JSON.stringify(presets));
    loadPresets();
    closeModal();
}

// Resto del código anterior (geolocalización, cálculos) se mantiene igual...
// ... (Agregar aquí las funciones del código anterior que no se muestran por brevedad)

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', loadPresets);
document.getElementById('useCurrentLocation').addEventListener('change', function(e) {
    // Misma función que antes...
});

// Mantener las funciones calculateDistance, formatTimeDiff y startNavigation del código anterior

// Corregir y mejorar la gestión de ubicaciones guardadas
function loadPresets() {
    const select = document.getElementById('presets');
    select.innerHTML = '<option value="">Ubicaciones guardadas</option>';
    presets = JSON.parse(localStorage.getItem('presets')) || [];
    
    // Ordenar alfabéticamente
    presets.sort((a, b) => a.name.localeCompare(b.name));
    
    presets.forEach(preset => {
        const option = document.createElement('option');
        option.value = preset.name;
        option.dataset.type = preset.type;
        option.textContent = `${preset.name} (${preset.type === 'start' ? '🏁 Inicio' : '🎯 Destino'})`;
        select.appendChild(option);
    });
}

function loadPreset(presetName) {
    const preset = presets.find(p => p.name === presetName);
    if (!preset) return;
    
    const target = preset.type === 'start' ? 'start' : 'end';
    document.getElementById(`${target}Lat`).value = preset.lat.toFixed(6);
    document.getElementById(`${target}Lon`).value = preset.lon.toFixed(6);
}

// Mejorar el guardado de presets
function savePreset() {
    const nameInput = document.getElementById('presetName');
    const name = nameInput.value.trim();
    const type = document.querySelector('input[name="presetType"]:checked').value;
    
    const coords = type === 'start' ? {
        lat: document.getElementById('startLat').value,
        lon: document.getElementById('startLon').value
    } : {
        lat: document.getElementById('endLat').value,
        lon: document.getElementById('endLon').value
    };
    
    if (!name || !coords.lat || !coords.lon) {
        alert('Por favor complete todos los campos');
        return;
    }
    
    // Validar coordenadas
    if (isNaN(coords.lat) || isNaN(coords.lon)) {
        alert('Coordenadas inválidas');
        return;
    }
    
    // Actualizar o crear preset
    const existingIndex = presets.findIndex(p => p.name === name);
    if (existingIndex > -1) {
        presets[existingIndex] = { 
            name, 
            type,
            lat: parseFloat(coords.lat),
            lon: parseFloat(coords.lon)
        };
    } else {
        presets.push({
            name,
            type,
            lat: parseFloat(coords.lat),
            lon: parseFloat(coords.lon)
        });
    }
    
    localStorage.setItem('presets', JSON.stringify(presets));
    loadPresets();
    nameInput.value = '';
    closeModal();
}

// Mejorar seguimiento GPS
let lastPosition = null;

function updateGPSStatus(active = false) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.gps-status span');
    
    statusDot.classList.toggle('active', active);
    statusText.textContent = `GPS: ${active ? 'Activo' : 'Inactivo'}`;
}

function startNavigation() {
    // Validaciones anteriores...
    
    if (!navigator.geolocation) {
        alert('La geolocalización no está disponible en tu dispositivo');
        return;
    }
    
    updateGPSStatus(true);
    
    watchId = navigator.geolocation.watchPosition(position => {
        lastPosition = position;
        // Cálculos actualizados...
        
        // Actualizar coordenadas actuales si está activo el checkbox
        if (document.getElementById('useCurrentLocation').checked) {
            document.getElementById('startLat').value = position.coords.latitude.toFixed(6);
            document.getElementById('startLon').value = position.coords.longitude.toFixed(6);
        }
    }, error => {
        console.error('Error GPS:', error);
        updateGPSStatus(false);
        document.getElementById('result').textContent = 'Error de geolocalización';
    }, {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 27000
    });
    
    // Detener seguimiento al salir de la página
    window.addEventListener('beforeunload', () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
    });
}

// script.js
let watchId = null;
let presets = JSON.parse(localStorage.getItem('presets')) || [];

function loadPresets() {
    const select = document.getElementById('presets');
    select.innerHTML = '<option value="">Ubicaciones guardadas</option>';
    
    presets.sort((a, b) => a.name.localeCompare(b.name));
    
    presets.forEach(preset => {
        const option = document.createElement('option');
        option.value = preset.name;
        option.textContent = `${preset.name} (${preset.coords.lat.toFixed(4)}, ${preset.coords.lon.toFixed(4)})`;
        select.appendChild(option);
    });
}

function loadPreset(presetName) {
    const preset = presets.find(p => p.name === presetName);
    if (!preset) return;
    
    document.getElementById('startLat').value = preset.coords.lat;
    document.getElementById('startLon').value = preset.coords.lon;
    document.getElementById('endLat').value = preset.coords.lat;
    document.getElementById('endLon').value = preset.coords.lon;
}

function saveCurrentLocation() {
    const name = document.getElementById('saveName').value.trim();
    const lat = document.getElementById('startLat').value;
    const lon = document.getElementById('startLon').value;
    
    if (!name || !lat || !lon) {
        alert('Nombre y coordenadas requeridos');
        return;
    }
    
    const existing = presets.findIndex(p => p.name === name);
    if (existing > -1) {
        if (!confirm('¿Sobreescribir ubicación existente?')) return;
        presets.splice(existing, 1);
    }
    
    presets.push({
        name,
        coords: {
            lat: parseFloat(lat),
            lon: parseFloat(lon)
        }
    });
    
    localStorage.setItem('presets', JSON.stringify(presets));
    loadPresets();
    document.getElementById('saveName').value = '';
}

// Función de formato de tiempo actualizada
function formatTimeDiff(seconds) {
    const absSeconds = Math.abs(seconds);
    const minutes = Math.floor(absSeconds / 60);
    const remainingSeconds = absSeconds % 60;
    return `${seconds < 0 ? '-' : '+'}${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Resto de funciones de geolocalización y cálculo se mantienen similares
// ... (igual que en la versión anterior pero usando el nuevo formato)

document.addEventListener('DOMContentLoaded', loadPresets);
document.getElementById('useCurrentLocation').addEventListener('change', function(e) {
    // Implementación similar a versiones anteriores
});

// Implementar startNavigation() con el nuevo formato
