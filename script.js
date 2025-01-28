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
