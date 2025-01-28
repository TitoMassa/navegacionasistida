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

    document.getElementById('ubicaciones-inicio-predefinidas').addEventListener('change', function() {
        if (this.value) {
            const selected = this.options[this.selectedIndex];
            document.getElementById('start-lat').value = selected.dataset.lat;
            document.getElementById('start-lon').value = selected.dataset.lon;
        }
    });

    ubicacionActual.addEventListener('change', () => {
        const inputs = grupoInicio.querySelectorAll('input');
        const select = grupoInicio.querySelector('select');
        inputs.forEach(input => input.disabled = ubicacionActual.checked);
        select.disabled = ubicacionActual.checked;
    });

    document.getElementById('formulario').addEventListener('submit', function(e) {
        e.preventDefault();
        iniciarNavegacionHandler();
    });

    document.getElementById('btn-detener').addEventListener('click', detenerHandler);
});

function cargarUbicacionesGuardadas() {
    const selects = [
        document.getElementById('ubicaciones-predefinidas'),
        document.getElementById('ubicaciones-inicio-predefinidas')
    ];
    
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

// Las funciones restantes (guardarNuevaUbicacion, eliminarUbicacion, iniciarNavegacionHandler, etc.)
// permanecen iguales que en el código original proporcionado
// ... [El resto del código JavaScript permanece sin cambios] ...
