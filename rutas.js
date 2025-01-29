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
            updateStopsList();
        }
    }

    drawnItems.addLayer(layer);
});

function updateStopsList() {
    let list = document.getElementById("stops-list");
    list.innerHTML = "";
    stops.forEach((stop, index) => {
        let li = document.createElement("li");
        li.textContent = `${stop.name} - ${stop.time} (${stop.lat.toFixed(5)}, ${stop.lon.toFixed(5)})`;
        list.appendChild(li);
    });
}

document.getElementById("save-route").addEventListener("click", function () {
    let routeData = {
        route: route.map(point => ({ lat: point.lat, lon: point.lng })),
        stops: stops
    };

    console.log("Ruta guardada:", JSON.stringify(routeData, null, 2));
    alert("Ruta guardada en la consola.");
});
