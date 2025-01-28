/* script.js */
document.addEventListener('DOMContentLoaded', () => {
    const startTimeInput = document.getElementById('start-time');
    const arrivalTimeInput = document.getElementById('arrival-time');
    const timeDifferenceDisplay = document.getElementById('time-difference');
    const statusMessageDisplay = document.getElementById('status-message');
    const startLocationSelect = document.getElementById('start-location');
    const destinationLocationSelect = document.getElementById('destination-location');
    const saveLocationButton = document.getElementById('save-location');
    const newLocationNameInput = document.getElementById('new-location-name');
    const newLocationCoordsInput = document.getElementById('new-location-coords');
    const savedLocationsList = document.getElementById('saved-locations-list');
    const useCurrentAsStartButton = document.getElementById('use-current-as-start');

    let scheduledArrivalTime;
    let trackingInterval;
    let predefinedLocations = loadLocations();

    // Initialize predefined locations
    populateLocationDropdowns();
    renderSavedLocationsList();

    function populateLocationDropdowns() {
        startLocationSelect.innerHTML = '<option value="current">Ubicación Actual</option>';
        destinationLocationSelect.innerHTML = ''; // Clear existing options
        predefinedLocations.forEach(location => {
            const optionStart = document.createElement('option');
            optionStart.value = JSON.stringify(location.coords);
            optionStart.textContent = location.name;
            startLocationSelect.appendChild(optionStart);

            const optionDest = document.createElement('option');
            optionDest.value = JSON.stringify(location.coords);
            optionDest.textContent = location.name;
            destinationLocationSelect.appendChild(optionDest);
        });
    }

    function renderSavedLocationsList() {
        savedLocationsList.innerHTML = '';
        predefinedLocations.forEach((location, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span>${location.name} (${location.coords.lat.toFixed(4)}, ${location.coords.lng.toFixed(4)})</span>
                <button data-index="${index}">Eliminar</button>
            `;
            savedLocationsList.appendChild(listItem);
        });

        // Add event listeners to delete buttons
        savedLocationsList.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', function() {
                const indexToDelete = parseInt(this.dataset.index);
                deleteLocation(indexToDelete);
            });
        });
    }

    function saveLocations() {
        localStorage.setItem('predefinedLocations', JSON.stringify(predefinedLocations));
    }

    function loadLocations() {
        const storedLocations = localStorage.getItem('predefinedLocations');
        return storedLocations ? JSON.parse(storedLocations) : [];
    }

    function addLocation(name, coords) {
        predefinedLocations.push({ name, coords });
        saveLocations();
        populateLocationDropdowns();
        renderSavedLocationsList();
    }

    function deleteLocation(index) {
        predefinedLocations.splice(index, 1);
        saveLocations();
        populateLocationDropdowns();
        renderSavedLocationsList();
    }

    function getLocation() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
                    },
                    error => {
                        reject(error);
                    }
                );
            } else {
                reject("Geolocation is not supported by this browser.");
            }
        });
    }

    function formatTimeDifference(differenceInSeconds) {
        const sign = differenceInSeconds > 0 ? '+' : differenceInSeconds < 0 ? '-' : '+';
        const absoluteDifference = Math.abs(differenceInSeconds);
        const minutes = Math.floor(absoluteDifference / 60);
        const seconds = absoluteDifference % 60;
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(seconds).padStart(2, '0');
        return `${sign}${formattedMinutes}:${formattedSeconds}`;
    }

    function updateTimeDifference() {
        const arrivalTimeValue = arrivalTimeInput.value;
        if (!arrivalTimeValue) {
            timeDifferenceDisplay.textContent = "HH:MM";
            timeDifferenceDisplay.className = 'time-green'; // Default class
            statusMessageDisplay.textContent = "Ingrese una hora de llegada.";
            return;
        }

        const now = new Date();
        const arrivalTimeParts = arrivalTimeValue.split(':');
        const arrivalHour = parseInt(arrivalTimeParts[0]);
        const arrivalMinute = parseInt(arrivalTimeParts[1]);

        scheduledArrivalTime = new Date(now);
        scheduledArrivalTime.setHours(arrivalHour, arrivalMinute, 0, 0);

        const timeDifferenceMs = scheduledArrivalTime.getTime() - now.getTime();
        const timeDifferenceSeconds = Math.round(timeDifferenceMs / 1000);
        const formattedDifference = formatTimeDifference(timeDifferenceSeconds);
        timeDifferenceDisplay.textContent = formattedDifference;

        if (timeDifferenceSeconds <= -120) { // -02:00 or more behind
            timeDifferenceDisplay.className = 'time-red';
        } else if (timeDifferenceSeconds >= 120) { // +02:00 or more ahead
            timeDifferenceDisplay.className = 'time-blue';
        } else { // Within tolerance
            timeDifferenceDisplay.className = 'time-green';
        }

        statusMessageDisplay.textContent = "Actualizando cada 5 segundos.";
    }

    saveLocationButton.addEventListener('click', () => {
        const name = newLocationNameInput.value.trim();
        const coordsText = newLocationCoordsInput.value.trim();
        const coordsArray = coordsText.split(',').map(c => parseFloat(c.trim()));

        if (name && coordsArray.length === 2 && !isNaN(coordsArray[0]) && !isNaN(coordsArray[1])) {
            const coords = { lat: coordsArray[0], lng: coordsArray[1] };
            addLocation(name, coords);
            newLocationNameInput.value = '';
            newLocationCoordsInput.value = '';
        } else {
            alert("Por favor, ingrese un nombre válido y coordenadas (Latitud, Longitud) válidas.");
        }
    });

    useCurrentAsStartButton.addEventListener('click', () => {
        getLocation()
            .then(coords => {
                // You can store or display the current location if needed.
                // For now, just setting the start location to 'current' is enough as per requirements.
                startLocationSelect.value = 'current';
                alert(`Ubicación actual seleccionada como inicio: Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}`);
            })
            .catch(error => {
                console.error("Error getting location:", error);
                alert("No se pudo obtener la ubicación actual. Asegúrese de que la geolocalización esté habilitada en su navegador.");
            });
    });


    arrivalTimeInput.addEventListener('change', () => {
        clearInterval(trackingInterval); // Clear previous interval if any
        if (arrivalTimeInput.value) {
            updateTimeDifference(); // Update immediately
            trackingInterval = setInterval(updateTimeDifference, 5000); // Start interval timer
        } else {
            timeDifferenceDisplay.textContent = "HH:MM";
            timeDifferenceDisplay.className = 'time-green';
            statusMessageDisplay.textContent = "Ingrese una hora de llegada.";
        }
    });

    // Initial update if arrival time is already set on page load (optional)
    if (arrivalTimeInput.value) {
        updateTimeDifference();
        trackingInterval = setInterval(updateTimeDifference, 5000);
    }
});
