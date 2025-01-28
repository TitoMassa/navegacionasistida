let watchId = null;
let intervaloActualizacion = null;
let currentPosition = { lat: null, lon: null };
let savedLocations = JSON.parse(localStorage.getItem('savedLocations')) || [];
let navegacionActiva = false;

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

    document.getElementById('ubicaciones-inicio').addEventListener('change', function() {
        if (this.value) {
            const selected = this.options[this.selectedIndex];
            document.getElementById('start-lat').value = selected.dataset.lat;
            document.getElementById('start-lon').value = selected.dataset.lon;
        }
    });

    ubicacionActual.addEventListener('change', () => {
        const inputs = grupoInicio.querySelectorAll('input');
        const select = grupoInicio.querySelector('select');
        const isDisabled = ubicacionActual.checked;
        inputs.forEach(input => input.disabled = isDisabled);
        select.disabled = isDisabled;
    });
    
    ubicacionActual.dispatchEvent(new Event('change'));

    document.getElementById('formulario').addEventListener('submit', function(e) {
        e.preventDefault();
        iniciarNavegacionHandler();
    });

    document.getElementById('btn-detener').addEventListener('click', detenerHandler);
});

function cargarUbicacionesGuardadas() {
    const selects = ['ubicaciones-predefinidas', 'ubicaciones-inicio'].map(id => document.getElementById(id));
    selects.forEach(select => {
        select.innerHTML = '<option value="">-- Seleccionar --</option>';
        savedLocations.forEach(loc => {
            const option = document.createElement('option');
            option.text = loc.nombre;
            option.dataset.lat = loc.lat;
            option.dataset.lon = loc.lon;
            select.add(option);
        });
    });
}

// Resto del código se mantiene igual...
// [Las funciones guardarNuevaUbicacion, eliminarUbicacion, iniciarNavegacionHandler, 
// iniciarNavegacion, calcularDistancia, detenerHandler, detenerSeguimiento 
// permanecen sin cambios del código original proporcionado]
