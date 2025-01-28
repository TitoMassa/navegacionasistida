let watchId = null;
let intervaloActualizacion = null;
let currentPosition = { lat: null, lon: null };
let savedLocations = JSON.parse(localStorage.getItem('savedLocations')) || [];

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

    // Cargar ubicaciones guardadas
    cargarUbicacionesGuardadas();

    // Mostrar/ocultar formulario para guardar
    document.getElementById('btn-guardar-ubicacion').addEventListener('click', () => {
        saveForm.style.display = saveForm.style.display === 'none' ? 'block' : 'none';
    });

    // Confirmar guardado de ubicación
    document.getElementById('btn-confirmar-guardar').addEventListener('click', guardarNuevaUbicacion);

    // Eliminar ubicación
    document.getElementById('btn-eliminar').addEventListener('click', eliminarUbicacion);

    // Selección de ubicaciones predefinidas
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

    // Manejar envío del formulario principal
    document.getElementById('formulario').addEventListener('submit', function(e) {
        e.preventDefault();
        iniciarNavegacionHandler();
    });

    // Botón de detener
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
    
    // Resetear formulario
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
    detenerSeguimiento();
    document.getElementById('resultado').textContent = 'Calculando...';
    
    if (document.getElementById('ubicacion-actual').checked) {
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
}

// Resto de las funciones (iniciarNavegacion, calcularDistancia) se mantienen igual que en tu código original
// ... [El resto del código JavaScript permanece sin cambios] ...
