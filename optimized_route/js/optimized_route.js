var app = angular.module('optimized_route', []);
var hash_params = L.Hash.parseHash(location.hash);
var mode_mapping = {
    'foot'    : 'pedestrian',
    'car'     : 'auto',
    'bicycle' : 'bicycle',
    'transit' : 'multimodal'
};

var serviceUrl;
var envServer = "development";
var envToken = accessToken.dev;
var sentManyToManyEnd = false;
var optimized_route = true;
var tspMarkers = [];

function selectEnv() {
  $("option:selected").each(function() {
    var environmentExists = true;
    envServer = $(this).text();
    serviceUrl = document.getElementById(envServer).value;
    getEnvToken();
  });
}

function handleChange(evt) {
  var sel = document.getElementById('selector');
  for (var i = 0; i < sel.options.length; i++) {
    var results = sel.options[i].text + "  " + sel.options[i].value;
    sel.options[i].innerHTML = results;
  }
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
  };
  $(document).on('new-location', function(e) {
    $rootScope.geobase = {
      'zoom' : e.zoom,
      'lat' : e.lat,
      'lon' : e.lon
    };
  });
});

//hooks up to the div whose data-ng-controller attribute matches this name
app.controller('OptimizedRouteController', function($scope, $rootScope, $sce, $http) {
  var road = L.tileLayer('http://b.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution : '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributers'
  }), zinc_transit = Tangram.leafletLayer({
    scene: 'https://raw.githubusercontent.com/valhalla/demos/gh-pages/routing/map_style/zinc-transit.yaml',
    attribution: '<a href="https://mapzen.com/tangram">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/">Mapzen</a>'
  }), cycle = L.tileLayer('http://b.tile.thunderforest.com/cycle/{z}/{x}/{y}.png', {
    attribution : 'Maps &copy; <a href="http://www.thunderforest.com">Thunderforest, </a>;Data &copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }), elevation = L.tileLayer('http://b.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png', {
    attribution : 'Maps &copy; <a href="http://www.thunderforest.com">Thunderforest, </a>;Data &copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  });
  
  var baseMaps = {
      "Road" : road,
      "Zinc Transit" : zinc_transit,
      "Cycle" : cycle,
      "Elevation" : elevation
  };

  //leaflet slippy map
  var map = L.map('map', {
    zoom : $rootScope.geobase.zoom,
    zoomControl : true,
    layers : [ road ],
    center : [ $rootScope.geobase.lat, $rootScope.geobase.lon ]
  });
  

  // If iframed, we're going to have to disable some of the touch interaction
  // to not hijack page scroll. See Stamen's Checklist for Maps: http://content.stamen.com/stamens-checklist-for-maps
  if (window.self !== window.top) {
    map.scrollWheelZoom.disable();
  }

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

  $scope.route_instructions = '';

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
          }).bindLabel((locCount).toString(), (locCount < 10) ? {
          position: [geo.lat,geo.lon],
          noHide: true,
          offset: [-9,-12]
          } : {
          position: [geo.lat,geo.lon],
          noHide: true,
          offset: [-12,-12]
          }
        );
    map.addLayer(marker);
    markers.push(marker);
  });

  $rootScope.$on('map.dropDestMarker', function(ev, geo, locCount) {

      var marker = new L.marker(geo, {
        icon : getDestinationIcon()
      }).bindLabel((locCount).toString(), (locCount < 10) ? {
        position: [geo.lat,geo.lon],
        noHide: true,
        offset: [-9,-12]
      } : {
        position: [geo.lat,geo.lon],
        noHide: true,
        offset: [-13,-12]
        }
      );  
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

  $scope.setMode = function(mode){
    $scope.mode = mode;
  }

  var reset_form = function() {
    $scope.startPoints = [];
    $scope.endPoints = [];
  };

  //set up map events
  chooseLocations();

  var clearBtn = document.getElementById("clear_btn");
  var optimizeBtn = document.getElementById("optimize_btn");

  $scope.mode = 'auto';
  $scope.matrixType = '';
  $scope.startPoints = [];
  $scope.endPoints = [];
  $scope.editingFocus = 'start_points'
  $scope.appView = 'control'


  $scope.backToControlView = function(e) {
    $scope.appView = 'control';
    //$('#columns').columns('destroy');
  }

  $scope.clearAll = function(e) {
    $scope.matrixType = '';
    $scope.startPoints = [];
    $scope.endPoints = [];
    $scope.appView = 'control'
    $scope.editingFocus = 'start_points'
    sentManyToManyEnd = false
    $('.leaflet-marker-icon').remove();
    $('.leaflet-label').remove();
    $('.leaflet-marker-shadow').remove();
    $('svg').html('');
    $('.leaflet-routing-container').remove();
    locations = 0;
    counterText = 0;
    markers = [];
    document.getElementById("end_at_start").checked = false;
    document.getElementById("optimized_routeResponse") == "";
  }


  $scope.goToEndPoints = function(e) {
    $scope.editingFocus = 'end_points'
  }

  $scope.manyToManyClick = function(e) {
    $scope.matrixType = "many_to_many";
    reset_form();
    $scope.start_mapInstruction = " Click on the map to add a point";
    $scope.end_mapInstruction = " Click on the map to add points";
    $scope.startgeocode = "lat, long";
    $scope.endgeocode = "lat, long";
    getEnvToken();
  };

  optimizeBtn.addEventListener('click', function(e) {
    $('svg').html('');
    $('.leaflet-routing-container').remove();
    var waypoints = [];
    var locationsArray = $scope.startPoints.concat($scope.endPoints);

    locationsArray.forEach(function(gLoc) {
      waypoints.push(L.latLng(gLoc.lat, gLoc.lon));
    });

    var end_at_start = false;
    if(document.getElementById("end_at_start").checked == true)
      end_at_start = true;
     else end_at_start = false;
    //if checked, duplicate the origin point and append to the end
    if (end_at_start)
      waypoints.push(waypoints[0]);

    rr = createRouting({waypoints: waypoints, costing: $scope.mode});
    if ($scope.mode == "multimodal"){
      rr.route({
        date_time: {
          type: 1, //depart at
          value: getNextTuesday() + 'T08:00' // For demo we want to be consistent and always use Next
        }
      });
    }
    
    $('.leaflet-marker-icon.leaflet-marker-draggable').remove();
   
    $scope.appView = 'tspTable'
    $scope.$apply();
  });
  
  var rr;

  var createRouting = function(options, createMarkers) {
    tspMarkers = markers;
    var defaultOptions = {
      geocoder : null,
      routeWhileDragging : false,
      router : L.Routing.mapzen(envToken, options, optimized_route, tspMarkers),
      summaryTemplate : '<div class="start">{name}</div><div class="info {costing}">{distance}, {time}</div>',

      formatter : new L.Routing.Mapzen.Formatter(),
      pointMarkerStyle : {
        radius: 6,
        color: '#20345b',
        fillColor: '#fff',
        opacity: 1,
        fillOpacity: 1
      }
    };

    options = options || {};
    for (var k in options) {
        defaultOptions[k] = options[k];
    }
    return L.Routing.control(defaultOptions).addTo(map);
};

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
  
  /**
   * Returns a string of next Tuesday's date based
   * on the current day of the week.  If today is Tuesday,
   * then we use the following Tuesday's date.
   *
   * @returns {string} in format of 'YYYY-MM-DD'
   */
  function getNextTuesday () {
    var today = new Date(), day, tuesday;
    day = today.getDay();
    tuesday = today.getDate() - day + (day === 0 ? -6 : 2);
    tuesday += 7;
    today.setDate(tuesday);
    return today.toISOString().split('T')[0];
  }

  var counterText = 1;

  function chooseLocations() {
    map.on('click', function(e) {
    
    var geo = {
      'lat' : e.latlng.lat.toFixed(6),
      'lon' : e.latlng.lng.toFixed(6)
    };

    var eventObj = window.event ? event : e.originalEvent;
    var latlon = "";
    if ($scope.matrixType == "many_to_many") {
      if (locations == 0) {
        $scope.editingFocus = 'end_points';
        $rootScope.$emit('map.dropOriginMarker', [ geo.lat, geo.lon ], 0);
        locations++;
        latlon = geo.lat + ' , '+ geo.lon;
        $scope.startPoints.push({index: (counterText), lat:geo.lat, lon: geo.lon, latlon: latlon});
        $scope.$apply();
        return;
      } else {
        $rootScope.$emit('map.dropDestMarker', [ geo.lat, geo.lon ], counterText);
        locations++;
  
        var latlon = geo.lat + ' , '+ geo.lon;
        $scope.endPoints.push({index: (counterText), lat:geo.lat, lon: geo.lon,latlon: latlon});
        $scope.$apply();
        counterText++;
        locations++;
        return;
      }
    }
    });
  };
  
  $(document).on('route:time_distance', function(e, td) {
    var instructions = $('.leaflet-routing-container.leaflet-control').html();
    $scope.$emit('setRouteInstruction', instructions);
  });
  
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