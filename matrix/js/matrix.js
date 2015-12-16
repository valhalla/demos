var app = angular.module('matrix', []);
var hash_params = L.Hash.parseHash(location.hash);
var mode_mapping = {
  'foot' : 'pedestrian',
  'car' : 'auto',
  'bicycle' : 'bicycle'
};

var serviceUrl = "https://matrix.mapzen.com/";
var envServer = "production";
var envToken = accessToken.prod;
var sentManyToManyEnd = false;

function selectEnv() {
  $("option:selected").each(function() {
    envServer = $(this).text();
    serviceUrl = document.getElementById(envServer).value;
    getEnvToken();
  });
}

function getEnvToken() {
  switch (envServer) {
  case "localhost":
    envToken = accessToken.local;
    break;
  case "development":
    envToken = accessToken.dev;
    break;
  case "production":
    envToken = accessToken.prod;
    break;
  }
}

app.run(function($rootScope) {
  var hash_loc = hash_params ? hash_params : {
    'center' : {
      'lat' : 40.7486,
      'lng' : -73.9690
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

//hooks up to the div whose data-ng-controller attribute matches this name
app.controller('MatrixController', function($scope, $rootScope, $sce, $http) {
  var roadmap = L.tileLayer('http://b.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution : '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributers'
  }), tangramZinc = Tangram.leafletLayer({
    scene: 'https://raw.githubusercontent.com/tangrams/zinc-style-no-labels/gh-pages/zinc-style-no-labels.yaml',
    attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | <a href="http://www.openstreetmap.org/about" target="_blank">&copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>',
  }), cyclemap = L.tileLayer('http://b.tile.thunderforest.com/cycle/{z}/{x}/{y}.png', {
    attribution : 'Maps &copy; <a href="http://www.thunderforest.com">Thunderforest, </a>;Data &copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }), elevationmap = L.tileLayer('http://b.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png', {
    attribution : 'Maps &copy; <a href="http://www.thunderforest.com">Thunderforest, </a>;Data &copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  });
  
  var baseMaps = {
    "RoadMap" : roadmap,
    "TangramZinc" : tangramZinc,
    "CycleMap" : cyclemap,
    "ElevationMap" : elevationmap
  };

  //leaflet slippy map
  var map = L.map('map', {
    zoom : $rootScope.geobase.zoom,
    zoomControl : true,
    layers : [ roadmap ],
    center : [ $rootScope.geobase.lat, $rootScope.geobase.lon ]
  });
  
  // Add geocoding plugin
  var options = {
    layers: 'coarse'
  };

  L.control.geocoder('search-8LtGSDw', options).addTo(map);
  L.control.layers(baseMaps, null).addTo(map);

  // If iframed, we're going to have to disable some of the touch interaction
  // to not hijack page scroll. See Stamen's Checklist for Maps: http://content.stamen.com/stamens-checklist-for-maps
  if (window.self !== window.top) {
    map.scrollWheelZoom.disable();
  }


  var getOriginIcon = function() {
    return new L.Icon({
      iconUrl : '../matrix/resource/matrix_pin_start.png',
      iconSize : [ 30, 36 ],
      shadowUrl: null
    })
  };

  var getDestinationIcon = function() {
    return new L.Icon({
      iconUrl : '../matrix/resource/matrix_pin_end.png',
      iconSize : [ 30, 36 ],
      shadowUrl: null
    });
  };

 //Number of locations
  var locations = 0;
  var markers = [];

  var locateMarkers = [];
  var remove_markers = function() {
    for (i = 0; i < markers.length; i++) {
      map.removeLayer(markers[i]);
    }
    markers = [];
    locateMarkers.forEach(function (element, index, array) {
      map.removeLayer(element);
    });
    locateMarkers = [];
  };

  $rootScope.$on('map.setView', function(ev, geo, zoom) {
    map.setView(geo, zoom || 8);
  });

  $rootScope.$on('map.dropOriginMarker', function(ev, geo, locCount) {

      var marker = new L.marker(geo, {
        icon : getOriginIcon()
      }).bindLabel((locCount).toString(), {
        position: [geo.lat,geo.lon],
        noHide: true,
        offset: [-10,-11]
      });
    map.addLayer(marker);
    markers.push(marker);
  });

  $rootScope.$on('map.dropDestMarker', function(ev, geo, locCount) {

      var marker = new L.marker(geo, {
        icon : getDestinationIcon()
      }).bindLabel((locCount).toString(), {
        position: [geo.lat,geo.lon],
        noHide: true,
        offset: [-10,-11]
      });
    map.addLayer(marker);
    markers.push(marker);
  });

  $scope.renderHtml = function(html_code) {
    return $sce.trustAsHtml(html_code);
  };

  $scope.setMode = function(mode){
    $scope.mode = mode;
  }

  var reset_form = function() {
    $scope.startPoints = [];
    $scope.endPoints = [];
  };

  //set up map events
  chooseLocations();

  var oneToMany = document.getElementById("one_to_many");
  var manyToOne = document.getElementById("many_to_one");
  var manyToMany = document.getElementById("many_to_many");
  var clearBtn = document.getElementById("clear_btn");
  var matrixBtn = document.getElementById("matrix_btn");


  $scope.mode = 'auto';
  $scope.matrixType = '';
  $scope.startPoints = [];
  $scope.endPoints = [];
  $scope.editingFocus = 'start_points'
  $scope.appView = 'control'


  $scope.backToControlView = function(e) {
    $scope.appView = 'control';
    $('#columns').columns('destroy');
  }

  $scope.clearAll = function(e) {
    $scope.matrixType = '';
    $scope.startPoints = [];
    $scope.endPoints = [];
    $scope.appView = 'control'
    $scope.editingFocus = 'start_points'
    sentManyToManyEnd = false
    remove_markers();
    locations = 0;
    counterText = 0;
    markers = [];
    remove_markers();
    $('#columns').columns('destroy');
  }


  $scope.goToEndPoints = function(e) {
    $scope.editingFocus = 'end_points'
  }

  $scope.oneToManyClick = function(e) {
    $scope.matrixType = "one_to_many";
    reset_form();
    $scope.start_mapInstruction = " Click on the map to add a point";
    $scope.end_mapInstruction = " Click on the map to add points";
    $scope.startgeocode = "lat, long";
    $scope.endgeocode = "lat, long";
    getEnvToken();
  }

  $scope.manyToOneClick = function(e) {
    $scope.matrixType = "many_to_one";
    reset_form();
    $scope.start_mapInstruction = " Click on the map to add points";
    $scope.end_mapInstruction = " Click on the map to add a point";
    getEnvToken();
  };

  $scope.manyToManyClick = function(e) {
    $scope.matrixType = "many_to_many";
    reset_form();
    $scope.start_mapInstruction = " Click on the map to add points";
    getEnvToken();
  };

  matrixBtn.addEventListener('click', function(e) {
    var waypoints = [];
    var locationsArray = $scope.startPoints.concat($scope.endPoints);

    locationsArray.forEach(function(gLoc) {
      waypoints.push(L.latLng(gLoc.lat, gLoc.lon));
    });

    var  matrix = L.Matrix.widget(envToken, $scope.mode, $scope.matrixType);
    matrix.matrix({
      waypoints : waypoints
    });
    $scope.appView = 'matrixTable'
    $scope.$apply();
  });

//locate edge snap markers
  var locateEdgeMarkers = function (locate_result) {
    // clear it
    locateMarkers.forEach(function (element, index, array) {
      map.removeLayer(element);
    });
    locateMarkers = []

    //mark from node
    if(locate_result.node != null) {
      var marker = L.circle( [locate_result.node.lat,locate_result.node.lon], 2, { color: '#444', opacity: 1, fill: true, fillColor: '#eee', fillOpacity: 1 });
      map.addLayer(marker);
      var popup = L.popup({maxHeight : 200});
      popup.setContent("<pre id='json'>" + JSON.stringify(locate_result, null, 2) + "</pre>");
      marker.bindPopup(popup).openPopup();
      locateMarkers.push(marker);
    }//mark all the results for that spot
    else if(locate_result.edges != null) {
      locate_result.edges.forEach(function (element, index, array) {
        var marker = L.circle( [element.correlated_lat, element.correlated_lon], 2, { color: '#444', opacity: 1, fill: true, fillColor: '#eee', fillOpacity: 1 });
        map.addLayer(marker);
        var popup = L.popup({maxHeight : 200});
        popup.setContent("<pre id='json'>" + JSON.stringify(element, null, 2) + "</pre>");
        marker.bindPopup(popup).openPopup();
        locateMarkers.push(marker);
      });
    }//no data probably
    else {
      var marker = L.circle( [locate_result.input_lat,locate_result.input_lon], 2, { color: '#444', opacity: 1, fill: true, fillColor: '#eee', fillOpacity: 1 });
      map.addLayer(marker);
      var popup = L.popup({maxHeight : 200});
      popup.setContent("<pre id='json'>" + JSON.stringify(locate_result, null, 2) + "</pre>");
      marker.bindPopup(popup).openPopup();
      locateMarkers.push(marker);
    }
  };

  var counterText = 0;



  function chooseLocations() {
    map.on('click', function(e) {
    if ($scope.matrixType == '')
      alert("Please select a matrix type.");
    
    var geo = {
      'lat' : e.latlng.lat.toFixed(6),
      'lon' : e.latlng.lng.toFixed(6)
    };

    var eventObj = window.event ? event : e.originalEvent;
    var latlon = "";
    if ($scope.matrixType == "one_to_many") {
      if (locations == 0) {
        $scope.editingFocus = 'end_points';
        $rootScope.$emit('map.dropOriginMarker', [ geo.lat, geo.lon ], 0);
        locations++;
        latlon = geo.lat + ' , '+ geo.lon;
        $scope.startPoints.push({index: (counterText), lat:geo.lat, lon: geo.lon, latlon: latlon});
        $scope.$apply();
        return;
      } else {
        counterText++;
        $rootScope.$emit('map.dropDestMarker', [ geo.lat, geo.lon ], counterText);
        locations++;
        latlon = geo.lat + ' , '+ geo.lon;
        $scope.endPoints.push({index: (counterText), lat:geo.lat, lon: geo.lon,latlon: latlon});
        $scope.$apply();
        return;
      }
    } else if ($scope.matrixType == "many_to_one") {
      if ($scope.editingFocus == 'end_points' ) {
        if (sentManyToManyEnd == false) {
        sentManyToManyEnd = true;
        $rootScope.$emit('map.dropDestMarker', [ geo.lat, geo.lon ], counterText);
        locations++;
        
        latlon = geo.lat + ' , '+ geo.lon;
        $scope.endPoints.push({index: (counterText), lat:geo.lat, lon: geo.lon, latlon: latlon});
        $scope.$apply();
        return;
        } else {
          alert("Only 1 end point should be selected for a Many-to-One.");
        }
      } else {

        $rootScope.$emit('map.dropOriginMarker', [ geo.lat, geo.lon ], counterText);
        locations++;

        latlon = geo.lat + ' , '+ geo.lon;
        $scope.startPoints.push({index: (counterText), lat:geo.lat, lon: geo.lon, latlon: latlon});
        $scope.$apply();
        counterText++;
        return;
      }
      //many_to_many
    } else if ($scope.matrixType == "many_to_many") {

      $rootScope.$emit('map.dropOriginMarker', [ geo.lat, geo.lon ], counterText);
      locations++;

      var latlon = geo.lat + ' , '+ geo.lon;
      $scope.startPoints.push({index: (counterText), lat:geo.lat, lon: geo.lon,latlon: latlon});
      $scope.$apply();
      counterText++;
      locations++;
      return;
    }
    });
  };
    // ask the service for information about this location
    map.on("contextmenu", function(e) {
      var ll = {
        lat : e.latlng.lat,
        lon : e.latlng.lng
      };
      getEnvToken();
      var locate = L.locate(envToken);
      locate.locate(ll, locateEdgeMarkers);
    });

})