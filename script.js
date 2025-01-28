let watchId = null;
let intervaloActualizacion = null;
let currentPosition = { lat: null, lon: null };

document.addEventListener('DOMContentLoaded', () => {
    const ubicacionActual = document.getElementById('ubicacion-actual');
    const grupoInicio = document.getElementById('grupo-inicio');

    // Manejar ubicaciones predefinidas
    document.getElementById('ubicaciones-predefinidas').addEventListener('change', function() {
        if (this.value) {
            const selected = this.options[this.selectedIndex];
            document.getElementById('dest-lat').value = selected.dataset.lat;
            document.getElementById('dest-lon').value = selected.dataset.lon;
        }
    });

    // Habilitar/deshabilitar coordenadas de inicio
    ubicacionActual.addEventListener('change', () => {
        const inputs = grupoInicio.querySelectorAll('input');
        inputs.forEach(input => input.disabled = ubicacionActual.checked);
    });

    // Manejar envío del formulario
    document.getElementById('formulario').addEventListener('submit', function(e) {
        e.preventDefault();
        detenerSeguimiento();
        document.getElementById('resultado').textContent = 'Calculando...';
        
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

function detenerSeguimiento() {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    if (intervaloActualizacion) clearInterval(intervaloActualizacion);
    currentPosition = { lat: null, lon: null };
}

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

    // Iniciar seguimiento de posición
    watchId = navigator.geolocation.watchPosition(
        pos => {
            currentPosition.lat = pos.coords.latitude;
            currentPosition.lon = pos.coords.longitude;
        },
        error => alert('Error obteniendo ubicación: ' + error.message),
        { enableHighAccuracy: true }
    );

    // Actualizar cada 5 segundos
    intervaloActualizacion = setInterval(() => {
        if (!currentPosition.lat || !currentPosition.lon) return;
        
        const ahora = new Date();
        const distanciaActual = calcularDistancia(startLat, startLon, currentPosition.lat, currentPosition.lon);
        
        let diferenciaTiempo;

        if (ahora < startTime && distanciaActual < 50) {
            // Tiempo restante para inicio
            const restante = startTime - ahora;
            const minutos = Math.floor(restante / 60000);
            const segundos = Math.floor((restante % 60000) / 1000);
            diferenciaTiempo = `+${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
        } else {
            // Calcular diferencia de tiempo
            const tiempoEsperado = (distanciaActual / distanciaTotal) * (arrivalTime - startTime);
            const tiempoRealTranscurrido = ahora - startTime;
            const diferencia = tiempoRealTranscurrido - tiempoEsperado;
            
            const absDiferencia = Math.abs(diferencia);
            const minutos = Math.floor(absDiferencia / 60000);
            const segundos = Math.floor((absDiferencia % 60000) / 1000);
            const signo = diferencia >= 0 ? '-' : '+';
            
            diferenciaTiempo = `${signo}${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
        }

        document.getElementById('resultado').textContent = diferenciaTiempo;
    }, 5000);
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
