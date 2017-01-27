var map;
var markers = [];

function makePoints(event) {
    var text = document.getElementById("inputtext").value;
    var re = /[^0-9,] *(-?[0-9]+\.[0-9]+), *(-?[0-9]+\.[0-9]+) *[^0-9,]/g;
    var array;

    if (markers.length > 0) {
        for (var i = 0; i < markers.length; i++) {
            markers[i].removeFrom(map);
        }
        markers = [];
    }

    var last_idx = 0;
    var new_text = "";
    while ((array = re.exec(text)) !== null) {
        var lat = parseFloat(array[1]);
        var lng = parseFloat(array[2]);
        var idx = array.index;
        var len = array[0].length;

        var match_id = markers.length;

        new_text += text.substr(last_idx, idx - last_idx) + '<span class="rematch" id="match_' + match_id + '">' + array[0] + '</span>';
        last_idx = idx + array[0].length;

        var marker = L.marker([lat, lng]);
        marker.match_id = match_id;
        marker.on('mouseover', function(e) {
            var id = e.target.match_id;
            document.getElementById("match_" + id).className = "rematch active";
        });
        marker.on('mouseout', function(e) {
            var id = e.target.match_id;
            document.getElementById("match_" + id).className = "rematch";
        });
        markers.push(marker.addTo(map));
    }
    new_text += text.substr(last_idx, text.length - last_idx);
    document.getElementById("output").innerHTML = new_text;

    if (markers.length == 1) {
        map.setView(marker[0].getLatLng(), 18);

    } else if (markers.length > 1) {
        var latlngs = [];
        for (var i = 0; i < markers.length; i++) {
            latlngs.push(markers[i].getLatLng());
        }
        map.fitBounds(L.latLngBounds(latlngs));
    }
}

document.addEventListener("DOMContentLoaded", function(event) {
    var form = document.getElementById("inputform");
    form.addEventListener("submit", makePoints);

    map = L.map('map');
    L.tileLayer('http://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://osm.org">OpenStreetMap contributors</a>',
        maxZoom: 19,
    }).addTo(map);
});
