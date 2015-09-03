var app = angular.module('routing', []);
var hash_params = L.Hash.parseHash(location.hash);

var elevToken;
var elevServiceUrl;
var shape = new Array();
var elev;

app.run(function($rootScope) {
  var hash_loc = hash_params ? hash_params : {
    'center' : {
      'lat' : 22.35,
      'lng' : -14.15
    },
    'zoom' : 3
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

app.controller('RouteController', function($scope, $rootScope, $sce, $http) {
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

  var Locations = [];

  var getElevationServiceUrl = function() {
    elevServiceUrl = elevationServer.prod;
    elevToken = elevAccessToken.prod;
  }

  var displayElevation = function() {
    elev = (typeof Locations != "undefined") ? L.Elevation.blog(elevToken, Locations) : 0;
    elev.resetChart();
    elev.profile(elev._rrshape);
    document.getElementById('graph').style.display = "block";
    $("#clearbtn").show();
  }

  var getElevationPt = function(icon) {
    return L.icon({
      iconUrl : 'resource/startmarker@2x.png',
      iconSize : [ 30, 35 ], // size of the icon
      iconAnchor : [ 12, 22 ]
    });
  };

  // Set up the hash
  var hash = new L.Hash(map);
  var markers = [];
  var remove_markers = function() {
    for (i = 0; i < markers.length; i++) {
      map.removeLayer(markers[i]);
    }
    markers = [];
  };

  // Number of locations
  var locations = 0;

  var reset = function() {
    $('svg').html('');
    $('.leaflet-routing-container').remove();
    $('.leaflet-marker-icon.leaflet-marker-draggable').remove();
    $scope.$emit('resetRouteInstruction');
    remove_markers();
    locations = 0;
  };

  $rootScope.$on('map.setView', function(ev, geo, zoom) {
    map.setView(geo, zoom || 8);
  });

  $rootScope.$on('map.elevationMarker', function(ev, geo) {
    var marker = new L.marker(geo, {
      icon : getElevationPt()
    });
    marker.bindPopup("<a href = http://www.openstreetmap.org/#map=" + $rootScope.geobase.zoom + "/" + $rootScope.geobase.lat + "/" + $rootScope.geobase.lon
        + "&layers=Q target=_blank>Edit POI here<a/>");

    map.addLayer(marker);
    markers.push(marker);
  });

  $scope.renderHtml = function(html_code) {
    return $sce.trustAsHtml(html_code);
  };

  $scope.$on('setRouteInstruction', function(ev, instructions) {
    $scope.$apply(function() {
      $scope.route_instructions = instructions;
    });
  });

  $scope.$on('resetRouteInstruction', function(ev) {
    $scope.$apply(function() {
      $scope.route_instructions = '';
    });
  });

  map.on('click', function(e) {
    var geo = {
      'lat' : e.latlng.lat,
      'lon' : e.latlng.lng
    };

    if (locations == 0) {
      Locations.push({
        lat : geo.lat,
        lon : geo.lon
      })
      $rootScope.$emit('map.elevationMarker', [ geo.lat, geo.lon ]);

      locations++;
    } else if (locations > 1) {
      Locations.push({
        lat : geo.lat,
        lon : geo.lon
      })
      $rootScope.$emit('map.elevationMarker', [ geo.lat, geo.lon ]);
      locations++;
    }

    getElevationServiceUrl();
    displayElevation();

    $scope.$on('setRouteInstruction', function(ev, instructions) {
      $scope.$apply(function() {
        $scope.route_instructions = instructions;
      });
    });

    $scope.$on('resetRouteInstruction', function(ev) {
      $scope.$apply(function() {
        $scope.route_instructions = '';
      });
    });

    var waypoints = [];
    Locations.forEach(function(gLoc) {
      waypoints.push(L.latLng(gLoc.lat, gLoc.lon));
    });

    waypoints.push(L.latLng(geo.lat, geo.lon));

    $rootScope.$emit('map.elevationMarker', [ geo.lat, geo.lon ]);
    locations++;

  });

  $("#clearbtn").on("click", function() {
    remove_markers();
    Locations = [];
    elev.resetChart();
    document.getElementById('graph').style.display = "none";
    $("#clearbtn").hide();
  });

})