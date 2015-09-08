var app = angular.module('elevation', []);
var hash_params = L.Hash.parseHash(location.hash);

serviceUrl = server.prod;
token = accessToken.prod;

app.run(function($rootScope) {
  var hash_loc = hash_params ? hash_params : {
    'center' : {
      'lat' : 47.2200,
      'lng' :  9.3357
    },
    'zoom' : 13
  };
  $rootScope.geobase = {
    'zoom' : hash_loc.zoom,
    'lat' : hash_loc.center.lat,
    'lon' : hash_loc.center.lng
  }
  $(document).on('new-location', function(e) {
    $rootScope.geobase = {
      'zoom' : e.zoom,
      'lat' : e.lat,
      'lon' : e.lon
    };
  })
});

app.controller('ElevationController', function($scope, $rootScope, $sce, $http) {
  var roadmap = L.tileLayer('http://otile3.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
    attribution : 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>'
  }), cyclemap = L.tileLayer('http://b.tile.thunderforest.com/cycle/{z}/{x}/{y}.png', {
    attribution : 'Maps &copy; <a href="http://www.thunderforest.com">Thunderforest, </a>;Data &copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }), transitmap = L.tileLayer(' http://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png', {
    attribution : 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>'
  });

  var baseMaps = {
    "RoadMap" : roadmap,
    "CycleMap" : cyclemap,
    "TransitMap" : transitmap
  };

  var map = L.map('map', {
    zoom : $rootScope.geobase.zoom,
    zoomControl : false,
    layers : [ cyclemap ],
    center : [ $rootScope.geobase.lat, $rootScope.geobase.lon ]
  });

  L.control.layers(baseMaps, null).addTo(map);
  
  var resampledPt = function(icon) {
    return L.icon({
      iconUrl : 'resource/bluedot.png',
      iconSize : [ 10, 10 ], // size of the icon
      iconAnchor : [ 5, 5 ]
    });
  };

  // Set up the hash
  var hash = new L.Hash(map);
  var markers = [];
  var resampled = []
  var remove_markers = function() {
    for (i = 0; i < markers.length; i++) {
      map.removeLayer(markers[i]);
    }
    markers = [];
    for (i = 0; i < resampled.length; i++) {
      map.removeLayer(resampled[i]);
    }
    resampled = [];
  };
  
  var displayElevation = function() {
    //get the locations
    var locations = [];
    markers.forEach(function(e,i,a){
      locations.push({lon: e._latlng.lng, lat: e._latlng.lat})
    });
    
    elev = L.Elevation.demo(token);
    elev.resetChart();
    elev.profile(locations, marker_update);
    document.getElementById('graph').style.display = "block";
    $("#clearbtn").show();
  }

  var locationPt = function(icon) {
    return L.icon({
      iconUrl : 'resource/bluedot.png',
      iconSize : [ 20, 20 ], // size of the icon
      iconAnchor : [ 10, 10]
    });
  };

  $rootScope.$on('map.elevationMarker', function(ev, latlng) {
    var marker = new L.marker(latlng, { icon : locationPt() });
    map.addLayer(marker);
    markers.push(marker);
  });
   
  var marker_update = function(elevation) {
    //get the input locations
    var locations = []
    markers.forEach(function(e,i,a){
      locations.push(e._latlng);
    });
    
    //undraw everything
    remove_markers();
    
    //draw locations
    locations.forEach(function(e,i,a) {
      var marker = new L.marker( e, {icon : locationPt()});
      marker.bindPopup('<pre style="display:inline" class="loc_point">input location</pre>');
      map.addLayer(marker);
      markers.push(marker);
    });

    //draw interpolations
    for(var i = 0; i < elevation.shape.length; i++) {
      var marker = new L.marker( [elevation.shape[i].lat, elevation.shape[i].lon], {icon : resampledPt()});
      marker.bindPopup('<pre style="display:inline" class="elv_point">height: ' + elevation.range_height[i][1] + 'm range: ' + elevation.range_height[i][0] + 'm</pre>');
      map.addLayer(marker);
      resampled.push(marker);
    }
  };

  $scope.renderHtml = function(html_code) {
    return $sce.trustAsHtml(html_code);
  };

  map.on('click', function(e) {
    var geo = {
      'lat' : e.latlng.lat,
      'lon' : e.latlng.lng
    };
    $rootScope.$emit('map.elevationMarker', [ geo.lat, geo.lon ]);
    displayElevation();
  });
  
  //TODO: something with hashing url stuff is makign this not work
  map.on('load', function(e) {
    $rootScope.$emit('map.elevationMarker', [ 47.20365107869972, 9.352025985717773 ]);
    $rootScope.$emit('map.elevationMarker', [ 47.27002789823629, 9.341468811035154 ]);
    displayElevation();
  });  

  $("#clearbtn").on("click", function() {
    remove_markers();
    Locations = [];
    elev.resetChart();
    document.getElementById('graph').style.display = "none";
    $("#clearbtn").hide();
  });

})