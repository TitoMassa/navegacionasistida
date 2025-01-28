/* script.js */
document.addEventListener('DOMContentLoaded', () => {
    const startTimeInputStartLocation = document.getElementById('get-current-location-start');
    const startLocationSelect = document.getElementById('start-location');
    const startLocationManualInput = document.getElementById('start-location-manual');
    const destinationLocationSelect = document.getElementById('destination-location');
    const destinationLocationManualInput = document.getElementById('destination-location-manual');
    const arrivalTimeInput = document.getElementById('arrival-time');
    const timeStatusDisplay = document.getElementById('time-status');
    const savedLocationsList = document.getElementById('saved-locations-list');
    const saveLocationButton = document.getElementById('save-location-button');
    const saveLocationNameInput = document.getElementById('save-location-name');

    let currentLocation = null;
    let startLocationCoords = null;
    let destinationLocationCoords = null;
    let scheduledArrivalTime = null;
    let watchId = null;
    let savedLocations = loadLocations();
    let initialStartTime = null;
    let startDistanceCheckActive = false;

    // Initialize saved locations dropdowns and list
    populateSavedLocationsDropdowns();
    renderSavedLocationsList();

    // --- Location functions ---
    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    currentLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    console.log('Ubicación actual obtenida:', currentLocation);
                    if (!startLocationCoords && startLocationSelect.value === 'current') {
                        setStartLocationToCurrent();
                    }
                },
                (error) => {
                    console.error('Error al obtener la ubicación:', error.message);
                    timeStatusDisplay.textContent = 'Error al obtener la ubicación. Asegúrate de activar el GPS.';
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            timeStatusDisplay.textContent = 'Geolocalización no soportada por este navegador.';
        }
    }

    function watchLocation() {
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    currentLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    console.log('Ubicación actual actualizada:', currentLocation);
                    updateTimeDifference();
                    if (startDistanceCheckActive) {
                        checkStartDistance();
                    }
                },
                (error) => {
                    console.error('Error al observar la ubicación:', error.message);
                    timeStatusDisplay.textContent = 'Error al observar la ubicación.';
                    clearInterval(intervalId); // Stop updates if watch fails
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            timeStatusDisplay.textContent = 'Geolocalización no soportada por este navegador.';
        }
    }

    function clearWatchLocation() {
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
            console.log('Observación de ubicación detenida.');
        }
    }

    function setStartLocationToCurrent() {
        if (currentLocation) {
            startLocationCoords = currentLocation;
            startLocationManualInput.value = `${currentLocation.latitude}, ${currentLocation.longitude}`;
            startLocationManualInput.style.display = 'inline-block';
            startLocationSelect.value = 'manual';
            console.log('Ubicación de inicio establecida a ubicación actual:', startLocationCoords);
            if (!initialStartTime) {
                initialStartTime = new Date(); // Capture initial start time
                startDistanceCheckActive = true;
                checkStartDistance(); // Initial check
            }
        } else {
            timeStatusDisplay.textContent = 'Obteniendo ubicación actual...';
            getLocation(); // Try to get location again
        }
    }

    function checkStartDistance() {
        if (!startLocationCoords || !currentLocation || !initialStartTime || !scheduledArrivalTime) return;

        const distance = calculateDistance(startLocationCoords.latitude, startLocationCoords.longitude, currentLocation.latitude, currentLocation.longitude);

        if (distance > 50) {
            console.log("Usuario se ha movido 50m, iniciando ruta.");
            startDistanceCheckActive = false; // Stop distance checking
            updateTimeDifference(); // Start time difference updates
        } else {
            const now = new Date();
            if (now < initialStartTime) {
                const timeLeft = initialStartTime.getTime() - now.getTime();
                const formattedTimeLeft = formatTimeDifference(timeLeft);
                timeStatusDisplay.textContent = `Tiempo para inicio: +${formattedTimeLeft}`;
                timeStatusDisplay.className = 'time-green'; // Default green for time to start
            } else {
                startDistanceCheckActive = false; // Start time passed, start route even if not moved
                updateTimeDifference(); // Start time difference updates
            }
        }
    }

    function getCoordinatesFromInput(inputElement) {
        const value = inputElement.value.trim();
        if (!value) return null;

        const parts = value.split(',').map(p => p.trim());
        if (parts.length !== 2) {
            alert('Formato de coordenadas inválido. Use Latitud, Longitud.');
            return null;
        }

        const latitude = parseFloat(parts[0]);
        const longitude = parseFloat(parts[1]);

        if (isNaN(latitude) || isNaN(longitude)) {
            alert('Latitud y Longitud deben ser números válidos.');
            return null;
        }

        return { latitude, longitude };
    }

    // --- Time Difference Calculation ---
    function updateTimeDifference() {
        if (!currentLocation || !scheduledArrivalTime) {
            timeStatusDisplay.textContent = 'Esperando datos de ubicación y hora de llegada...';
            return;
        }

        const now = new Date();
        if (now < initialStartTime && startDistanceCheckActive) {
            checkStartDistance(); // Continue showing time to start if before start time and not moved
            return;
        }

        const arrivalTime = new Date(now);
        const [hours, minutes] = arrivalTimeInput.value.split(':').map(Number);
        arrivalTime.setHours(hours, minutes, 0, 0);

        if (now > arrivalTime) {
            scheduledArrivalTime = arrivalTime; // If current time is past arrival time, use current time as base for past due.
        } else {
            scheduledArrivalTime = arrivalTime;
        }


        const timeDiffMs = scheduledArrivalTime.getTime() - now.getTime();
        const formattedTimeDiff = formatTimeDifference(timeDiffMs);

        if (timeDiffMs >= 120000) { // >= 2 minutes ahead
            timeStatusDisplay.textContent = `+${formattedTimeDiff}`;
            timeStatusDisplay.className = 'time-blue';
        } else if (timeDiffMs <= -120000) { // <= 2 minutes behind
            timeStatusDisplay.textContent = `-${formattedTimeDiff}`;
            timeStatusDisplay.className = 'time-red';
        } else { // Within +/- 2 minutes
            const sign = timeDiffMs >= 0 ? '+' : '-';
            timeStatusDisplay.textContent = `${sign}${formattedTimeDiff}`;
            timeStatusDisplay.className = 'time-green';
        }
    }

    function formatTimeDifference(timeDiffMs) {
        const totalSeconds = Math.abs(Math.floor(timeDiffMs / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const mm = String(minutes).padStart(2, '0');
        const ss = String(seconds).padStart(2, '0');
        return `${mm}:${ss}`;
    }

    // --- Saved Locations ---
    function saveLocation() {
        if (!currentLocation) {
            alert('Ubicación actual no disponible. Esperando ubicación GPS.');
            return;
        }
        const locationName = saveLocationNameInput.value.trim();
        if (!locationName) {
            alert('Por favor, ingresa un nombre para la ubicación.');
            return;
        }

        const newLocation = {
            name: locationName,
            coords: currentLocation
        };
        savedLocations.push(newLocation);
        localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
        saveLocationNameInput.value = '';
        renderSavedLocationsList();
        populateSavedLocationsDropdowns();
        alert(`Ubicación "${locationName}" guardada.`);
    }

    function deleteLocation(index) {
        savedLocations.splice(index, 1);
        localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
        renderSavedLocationsList();
        populateSavedLocationsDropdowns();
        alert('Ubicación eliminada.');
    }

    function loadLocations() {
        const storedLocations = localStorage.getItem('savedLocations');
        return storedLocations ? JSON.parse(storedLocations) : [];
    }

    function renderSavedLocationsList() {
        savedLocationsList.innerHTML = '';
        if (savedLocations.length === 0) {
            savedLocationsList.innerHTML = '<li>No hay ubicaciones guardadas.</li>';
            return;
        }
        savedLocations.forEach((location, index) => {
            const li = document.createElement('li');
            li.textContent = `${location.name} (${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)})`;
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Eliminar';
            deleteButton.addEventListener('click', () => deleteLocation(index));
            li.appendChild(deleteButton);
            savedLocationsList.appendChild(li);
        });
    }

    function populateSavedLocationsDropdowns() {
        // Clear existing options, keep "Seleccionar ubicación guardada" in destination
        startLocationSelect.innerHTML = '<option value="current">Mi ubicación actual</option>';
        destinationLocationSelect.innerHTML = '<option value="">Seleccionar ubicación guardada</option>';

        savedLocations.forEach(location => {
            const optionStart = document.createElement('option');
            optionStart.value = JSON.stringify(location.coords); // Store coords as string
            optionStart.textContent = location.name;
            startLocationSelect.appendChild(optionStart);

            const optionDest = document.createElement('option');
            optionDest.value = JSON.stringify(location.coords); // Store coords as string
            optionDest.textContent = location.name;
            destinationLocationSelect.appendChild(optionDest);
        });
    }

    // --- Distance Calculation (Haversine formula for accuracy) ---
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI/180; // φ, λ in radians
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        const d = R * c; // in metres
        return d;
    }


    // --- Event Listeners ---
    startTimeInputStartLocation.addEventListener('click', setStartLocationToCurrent);

    startLocationSelect.addEventListener('change', function() {
        if (this.value === 'current') {
            startLocationManualInput.style.display = 'none';
            startLocationManualInput.value = '';
            startLocationCoords = null;
        } else if (this.value === 'manual') {
            startLocationManualInput.style.display = 'inline-block';
            startLocationCoords = getCoordinatesFromInput(startLocationManualInput);
            if (startLocationCoords) {
                if (!initialStartTime) {
                    initialStartTime = new Date(); // Capture initial start time if manual coords are set
                    startDistanceCheckActive = true;
                    checkStartDistance(); // Initial check
                }
            } else {
                startLocationCoords = null; // Reset if invalid manual input
            }
        } else { // Selected a saved location
            startLocationManualInput.style.display = 'inline-block';
            startLocationManualInput.value = this.selectedOptions[0].textContent + ' (ubicación guardada)';
            startLocationCoords = JSON.parse(this.value); // Parse coords from option value string
            if (!initialStartTime) {
                initialStartTime = new Date(); // Capture initial start time if saved location is set
                startDistanceCheckActive = true;
                checkStartDistance(); // Initial check
            }
        }
    });

    startLocationManualInput.addEventListener('blur', () => {
        if (startLocationSelect.value === 'manual') {
            startLocationCoords = getCoordinatesFromInput(startLocationManualInput);
            if (startLocationCoords) {
                 if (!initialStartTime) {
                    initialStartTime = new Date(); // Capture initial start time if manual coords are updated
                    startDistanceCheckActive = true;
                    checkStartDistance(); // Initial check
                }
            } else {
                startLocationCoords = null; // Reset if input becomes invalid
            }
        }
    });


    destinationLocationSelect.addEventListener('change', function() {
        if (this.value) { // If a saved location is selected for destination
            destinationLocationManualInput.value = this.selectedOptions[0].textContent + ' (ubicación guardada)';
            destinationLocationManualInput.disabled = true;
            destinationLocationCoords = JSON.parse(this.value); // Parse coords
        } else {
            destinationLocationManualInput.value = '';
            destinationLocationManualInput.disabled = false;
            destinationLocationCoords = null;
        }
    });

    destinationLocationManualInput.addEventListener('blur', () => {
        if (!destinationLocationSelect.value) { // If not using a saved destination
            destinationLocationCoords = getCoordinatesFromInput(destinationLocationManualInput);
        }
    });

    arrivalTimeInput.addEventListener('change', () => {
        const [hours, minutes] = arrivalTimeInput.value.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
            const now = new Date();
            initialStartTime = new Date(now); // Set initial start time to current time when arrival time is set
            initialStartTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds()); // Keep current time but date will be today.
            scheduledArrivalTime = new Date(now);
            scheduledArrivalTime.setHours(hours, minutes, 0, 0);
            startDistanceCheckActive = true; // Start distance checking when arrival time is set
            checkStartDistance();
        } else {
            scheduledArrivalTime = null;
            timeStatusDisplay.textContent = 'Hora de llegada inválida.';
        }
    });


    saveLocationButton.addEventListener('click', saveLocation);

    // Initial location and start updates
    getLocation(); // Get initial location
    watchLocation(); // Start watching location for updates
    let intervalId = setInterval(updateTimeDifference, 5000); // Update time difference every 5 seconds

    // Stop location watch when page is closed/unloaded (optional, but good practice)
    window.addEventListener('beforeunload', clearWatchLocation);
});
