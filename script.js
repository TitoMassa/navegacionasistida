let watchId = null;
let intervaloActualizacion = null;
let currentPosition = { lat: null, lon: null };
let savedLocations = JSON.parse(localStorage.getItem('savedLocations')) || [];
let navegacionActiva = false;

// Cargar ubicación predeterminada inicial si no hay guardadas
if (savedLocations.length === 0) {
    savedLocations.push({
        nombre: 'PELLEGRINI 1858',
        lat: -27.466250297959185,
        lon: -58.826945546938774
    });
    localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
}

document.addEventListener('DOMContentLoaded', () => {
    const ubicacionActual = document.getElementById('ubicacion-actual');
    const grupoInicio = document.getElementById('grupo-inicio');
    const saveForm = document.querySelector('.guardar-ubicacion');

    cargarUbicacionesGuardadas();

    document.getElementById('btn-guardar-ubicacion').addEventListener('click', () => {
        saveForm.style.display = saveForm.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('btn-confirmar-guardar').addEventListener('click', guardarNuevaUbicacion);
    document.getElementById('btn-eliminar').addEventListener('click', eliminarUbicacion);

    document.getElementById('ubicaciones-predefinidas').addEventListener('change', function() {
        if (this.value) {
            const selected = this.options[this.selectedIndex];
            document.getElementById('dest-lat').value = selected.dataset.lat;
            document.getElementById('dest-lon').value = selected.dataset.lon;
        }
    });

    ubicacionActual.addEventListener('change', () => {
        const inputs = grupoInicio.querySelectorAll('input');
        inputs.forEach(input => input.disabled = ubicacionActual.checked);
    });

    document.getElementById('formulario').addEventListener('submit', function(e) {
        e.preventDefault();
        iniciarNavegacionHandler();
    });

    document.getElementById('btn-detener').addEventListener('click', detenerHandler);
});

function cargarUbicacionesGuardadas() {
    const select = document.getElementById('ubicaciones-predefinidas');
    select.innerHTML = '<option value="">-- Seleccionar --</option>';
    
    savedLocations.forEach(loc => {
        const option = document.createElement('option');
        option.text = loc.nombre;
        option.dataset.lat = loc.lat;
        option.dataset.lon = loc.lon;
        select.add(option);
    });
}

function guardarNuevaUbicacion() {
    const nombre = document.getElementById('nombre-ubicacion').value.trim();
    const lat = parseFloat(document.getElementById('new-lat').value);
    const lon = parseFloat(document.getElementById('new-lon').value);

    if (!nombre || isNaN(lat) || isNaN(lon)) {
        alert('Complete todos los campos correctamente');
        return;
    }

    if (savedLocations.some(loc => loc.nombre.toLowerCase() === nombre.toLowerCase())) {
        alert('Ya existe una ubicación con ese nombre');
        return;
    }

    savedLocations.push({ nombre, lat, lon });
    localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
    cargarUbicacionesGuardadas();
    
    document.getElementById('nombre-ubicacion').value = '';
    document.getElementById('new-lat').value = '';
    document.getElementById('new-lon').value = '';
    document.querySelector('.guardar-ubicacion').style.display = 'none';
}

function eliminarUbicacion() {
    const select = document.getElementById('ubicaciones-predefinidas');
    const selectedIndex = select.selectedIndex;
    
    if (selectedIndex > 0) {
        if (confirm(`¿Eliminar "${select.options[selectedIndex].text}"?`)) {
            savedLocations.splice(selectedIndex - 1, 1);
            localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
            cargarUbicacionesGuardadas();
        }
    } else {
        alert('Selecciona una ubicación para eliminar');
    }
}

function iniciarNavegacionHandler() {
    if (navegacionActiva) return;
    
    detenerSeguimiento();
    document.getElementById('resultado').textContent = 'Obteniendo ubicación...';
    navegacionActiva = true;

    if (document.getElementById('ubicacion-actual').checked) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                iniciarNavegacion(pos.coords.latitude, pos.coords.longitude);
                document.getElementById('resultado').textContent = 'Calculando...';
            },
            error => {
                alert('Error obteniendo ubicación: ' + error.message);
                navegacionActiva = false;
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    } else {
        const lat = parseFloat(document.getElementById('start-lat').value);
        const lon = parseFloat(document.getElementById('start-lon').value);
        
        if (isNaN(lat) || isNaN(lon)) {
            alert('Ingrese coordenadas de inicio válidas');
            navegacionActiva = false;
            return;
        }
        iniciarNavegacion(lat, lon);
        document.getElementById('resultado').textContent = 'Calculando...';
    }
}

function iniciarNavegacion(startLat, startLon) {
    const destLat = parseFloat(document.getElementById('dest-lat').value);
    const destLon = parseFloat(document.getElementById('dest-lon').value);
    
    if (isNaN(destLat) || isNaN(destLon)) {
        alert('Ingrese coordenadas de destino válidas');
        navegacionActiva = false;
        return;
    }

    const startTime = new Date(document.getElementById('start-time').value);
    const arrivalTime = new Date(document.getElementById('arrival-time').value);
    
    if (arrivalTime <= startTime) {
        alert('La hora de llegada debe ser posterior a la de inicio');
        navegacionActiva = false;
        return;
    }

    const distanciaTotal = calcularDistancia(startLat, startLon, destLat, destLon);
    
    if (distanciaTotal === 0) {
        alert('El punto de inicio y destino no pueden ser iguales');
        navegacionActiva = false;
        return;
    }

    watchId = navigator.geolocation.watchPosition(
        pos => {
            currentPosition = { 
                lat: pos.coords.latitude, 
                lon: pos.coords.longitude,
                accuracy: pos.coords.accuracy
            };
        },
        error => {
            alert('Error en geolocalización: ' + error.message);
            detenerHandler();
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    intervaloActualizacion = setInterval(() => {
        if (!currentPosition.lat || !currentPosition.lon) {
            return;
        }

        const ahora = new Date();
        const distanciaActual = calcularDistancia(startLat, startLon, currentPosition.lat, currentPosition.lon);
        const resultado = document.getElementById('resultado');
        
        let diferenciaTiempo, claseColor;

        if (ahora < startTime && distanciaActual < 50) {
            const restante = startTime - ahora;
            const minutos = Math.floor(restante / 60000);
            const segundos = Math.floor((restante % 60000) / 1000);
            diferenciaTiempo = `+${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
            claseColor = 'blue';
        } else {
            const tiempoEsperado = (distanciaActual / distanciaTotal) * (arrivalTime - startTime);
            const tiempoReal = ahora - startTime;
            const diferencia = tiempoReal - tiempoEsperado;
            
            const absDiferencia = Math.abs(diferencia);
            const minutos = Math.floor(absDiferencia / 60000);
            const segundos = Math.floor((absDiferencia % 60000) / 1000);
            const signo = diferencia >= 0 ? '-' : '+';
            diferenciaTiempo = `${signo}${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

            if (diferencia >= 120000) claseColor = 'red';
            else if (diferencia <= -120000) claseColor = 'blue';
            else claseColor = 'green';
        }

        resultado.textContent = diferenciaTiempo;
        resultado.className = `resultado ${claseColor}`;
    }, 3000);
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
}

function detenerHandler() {
    detenerSeguimiento();
    document.getElementById('resultado').textContent = 'Navegación detenida';
    setTimeout(() => {
        document.getElementById('resultado').textContent = '';
        document.getElementById('resultado').className = 'resultado';
    }, 2000);
}

function detenerSeguimiento() {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    if (intervaloActualizacion) clearInterval(intervaloActualizacion);
    currentPosition = { lat: null, lon: null };
    navegacionActiva = false;
}
