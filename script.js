document.addEventListener('DOMContentLoaded', () => {
    const boton = document.getElementById('btnSaludo');
    const resultado = document.getElementById('resultado');

    boton.addEventListener('click', () => {
        resultado.textContent = '¡Hola Mundo!';
        resultado.style.color = '#4CAF50';
    });

    // Ejemplo de función adicional
    function mostrarHora() {
        const fecha = new Date();
        console.log(`Hora actual: ${fecha.toLocaleTimeString()}`);
    }

    // Llamar a la función cada segundo
    setInterval(mostrarHora, 1000);
});
