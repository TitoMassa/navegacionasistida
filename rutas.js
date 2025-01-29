document.addEventListener("DOMContentLoaded", function () {
    let map = L.map('map').setView([0, 0], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    let drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    let drawControl = new L.Control.Draw({
        draw: {
            polyline: true,
            polygon: false,
            circle: false,
            rectangle: false,
            marker: true
        },
        edit: {
            featureGroup: drawnItems
        }
    });
    map.addControl(drawControl);

    let route = [];
    let stops = [];

    map.on(L.Draw.Event.CREATED, function (event) {
        let layer = event.layer;
        if (event.layerType === 'polyline') {
            route = layer.getLatLngs();
        } else if (event.layerType === 'marker') {
            let lat = layer.getLatLng().lat;
            let lon = layer.getLatLng().lng;
            let stopName = prompt("Nombre de la parada:");
            let stopTime = prompt("Horario programado (HH:MM:SS):");
            if (stopName && stopTime) {
                stops.push({ name: stopName, lat, lon, time: stopTime });
            }
        }
        drawnItems.addLayer(layer);
    });

    document.getElementById("save-route").addEventListener("click", function () {
        let routeName = prompt("Nombre de la ruta:");
        if (!routeName || route.length === 0 || stops.length === 0) {
            alert("Debes agregar un recorrido y al menos una parada.");
            return;
        }

        let routeData = {
            name: routeName,
            route: route.map(point => ({ lat: point.lat, lon: point.lng })),
            stops: stops
        };

        let savedRoutes = JSON.parse(localStorage.getItem("routes")) || [];
        savedRoutes.push(routeData);
        localStorage.setItem("routes", JSON.stringify(savedRoutes));

        alert("Ruta guardada exitosamente.");
    });

    setTimeout(() => {
        map.invalidateSize();
    }, 500);
});
