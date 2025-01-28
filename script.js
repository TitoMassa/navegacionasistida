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
    let initialLocation = null; // Store initial location
    let tripStarted = false; // Flag to indicate if trip has started

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
        return new Promise((
