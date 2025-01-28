document.addEventListener('DOMContentLoaded', () => {
    const ubicacionActual = document.getElementById('ubicacion-actual');
    const grupoInicio = document.getElementById('grupo-inicio');

    ubicacionActual.addEventListener('change', () => {
        const inputs = grupoInicio.querySelectorAll('input');
        inputs.forEach(input => input.disabled = ubicacionActual.checked);
    });

    document.getElementById('formulario').addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (ubicacionActual.checked) {
            navigator.geolocation.getCurrentPosition(
                pos => iniciarNavegacion(pos.coords.latitude, pos.coords.longitude),
                error => alert('Error obteniendo ubicación: ' + error.message)
            );
        } else {
            const lat = parseFloat(document.getElementById('start-lat').value);
            const lon = parseFloat(document.getElementById('start-lon').value);
            
            if (isNaN(lat) || isNaN(lon)) {
                alert('Ingrese coordenadas de inicio válidas');
                return;
            }
            iniciarNavegacion(lat, lon);
        }
    });
});

function iniciarNavegacion(startLat, startLon) {
    const destLat = parseFloat(document.getElementById('dest-lat').value);
    const destLon = parseFloat(document.getElementById('dest-lon').value);
    
    if (isNaN(destLat) || isNaN(destLon)) {
        alert('Ingrese coordenadas de destino válidas');
        return;
    }

    const startTime = new Date(document.getElementById('start-time').value);
    const arrivalTime = new Date(document.getElementById('arrival-time').value);
    
    if (arrivalTime <= startTime) {
        alert('La hora de llegada debe ser posterior a la de inicio');
        return;
    }

    const distanciaTotal = calcularDistancia(startLat, startLon, destLat, destLon);
    
    if (distanciaTotal === 0) {
        alert('El punto de inicio y destino no pueden ser iguales');
        return;
    }

    const tiempoTotal = arrivalTime - startTime;
    let watchId;

    watchId = navigator.geolocation.watchPosition(
        pos => actualizarTiempo(pos, startLat, startLon, distanciaTotal, startTime, tiempoTotal),
        error => alert('Error obteniendo ubicación: ' + error.message)
    );
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
}

function actualizarTiempo(pos, startLat, startLon, distanciaTotal, startTime, tiempoTotal) {
    const ahora = new Date();
    const distanciaActual = calcularDistancia(startLat, startLon, pos.coords.latitude, pos.coords.longitude);
    
    if (ahora < startTime) {
        document.getElementById('resultado').textContent = 'Viaje no iniciado';
        return;
    }

    const tiempoTranscurrido = ahora - startTime;
    const tiempoEsperado = (distanciaActual / distanciaTotal) * tiempoTotal;
    const diferencia = tiempoTranscurrido - tiempoEsperado;

    const minutos = Math.floor(Math.abs(diferencia) / 60000);
    const segundos = Math.floor((Math.abs(diferencia) % 60000) / 1000);
    const signo = diferencia >= 0 ? '-' : '+';

    document.getElementById('resultado').textContent = 
        `${signo}${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}
