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
var locCount = 0;

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
  }), cyclemap = L.tileLayer('http://b.tile.thunderforest.com/cycle/{z}/{x}/{y}.png', {
    attribution : 'Maps &copy; <a href="http://www.thunderforest.com">Thunderforest, </a>;Data &copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }), elevationmap = L.tileLayer('http://b.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png', {
    attribution : 'Maps &copy; <a href="http://www.thunderforest.com">Thunderforest, </a>;Data &copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  });

  var baseMaps = {
    "RoadMap" : roadmap,
    "CycleMap" : cyclemap,
    "ationMap" : elevationmap
  };

  //leaflet slippy map
  var map = L.map('map', {
    zoom : $rootScope.geobase.zoom,
    zoomControl : true,
    layers : [ roadmap ],
    center : [ $rootScope.geobase.lat, $rootScope.geobase.lon ]
  });

  L.control.layers(baseMaps, null).addTo(map);

  // If iframed, we're going to have to disable some of the touch interaction
  // to not hijack page scroll. See Stamen's Checklist for Maps: http://content.stamen.com/stamens-checklist-for-maps
  if (window.self !== window.top) {
    map.scrollWheelZoom.disable();
  }

  var Locations = [];
  var mode = 'auto';

  var mode_icons = {
    'car' : 'js/images/drive.png',
    'foot' : 'js/images/walk.png',
    'bicycle' : 'js/images/bike.png'
  };

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

  function setMode() {
    var modeBtn = document.getElementsByName("modebtn");
    for (var i = 0; i < modeBtn.length; i++) {
      if (modeBtn[i].checked) {
        mode = modeBtn[i].value;
      }
    }
    return mode;
  }

  var reset_form = function() {
    $scope.startPoints = [];
    $scope.endPoints = [];
  };

  var oneToMany = document.getElementById("one_to_many");
  var manyToOne = document.getElementById("many_to_one");
  var manyToMany = document.getElementById("many_to_many");
  var clearBtn = document.getElementById("clear_btn");
  var matrixBtn = document.getElementById("matrix_btn");
  var matrixtype = "";

  $scope.startPoints = [];
  $scope.endPoints = [];
  $scope.oneToManyClick = function(e) {
    $scope.matrixType = 'oneToMany';
    reset_form();
    $scope.startheader = "Starting point";
    $scope.endheader = "Ending points";
    $scope.geocode = "Click on the map to add a starting point";
    getEnvToken();
    var mode = setMode();
    matrixtype = "one_to_many";
    chooseLocations(matrixtype);
  }

  $scope.manyToOneClick = function(e) {
    $scope.matrixType = 'manyToOne';
    reset_form();
    $scope.startheader = "Starting points";
    $scope.geocode = "Click on the map to your a starting points";
    $scope.endheader = "Ending points";
    getEnvToken();
    var mode = setMode();
    matrixtype = "many_to_one";
    chooseLocations(matrixtype);
  };

  $scope.manyToManyClick = function(e) {
    $scope.matrixType = 'manyToMany';
    reset_form();
    $scope.startheader = "Select points";
    $scope.geocode = "Click on the map to add your points";
    getEnvToken();
    var mode = setMode();
    matrixtype = "many_to_many";
    chooseLocations(matrixtype);
  };

  clearBtn.addEventListener('click', function(e) {
    javascript:location.reload(true)
  });

  matrixBtn.addEventListener('click', function(e) {
    var waypoints = [];
    Locations.forEach(function(gLoc) {
      waypoints.push(L.latLng(gLoc.lat, gLoc.lon));
    });

    var  matrix = L.Matrix.widget(envToken, mode, matrixtype);
    matrix.matrix({
      waypoints : waypoints
    });
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

  function chooseLocations(matrixtype) {
    map.on('click', function(e) {

    var geo = {
      'lat' : e.latlng.lat,
      'lon' : e.latlng.lng
    };

    var eventObj = window.event ? event : e.originalEvent;

    if (matrixtype == "one_to_many") {
      if (locations == 0) {
        Locations.push({
          lat : geo.lat,
          lon : geo.lon
        })
        $rootScope.$emit('map.dropOriginMarker', [ geo.lat, geo.lon ], 0);
        locations++;

        document.getElementById('startpt').innerHTML ='<div class = "start marker">'+ locCount + '</div> <span class = "geocode">' + geo.lat + ' , '+ geo.lon + '</span>';
        return;
      } else {

        Locations.push({
          lat : geo.lat,
          lon : geo.lon
        })

        locCount++;

        $rootScope.$emit('map.dropDestMarker', [ geo.lat, geo.lon ], locCount);
        locations++;
        counterText++;
        if( locCount == 1 ) {
          document.getElementById('endpt').innerHTML ='<div class = "end marker">'+ counterText+ '</div> <span class = "geocode">' + geo.lat + ' , '+ geo.lon + '</span>';
          return;
        }

        var newli = document.createElement('li');
        newli.setAttribute('id',counterText);
        newli.innerHTML = '<div class = "end marker">'+ counterText+ '</div> <span class = "geocode">' + geo.lat + ' , '+ geo.lon + '</span>';
        document.getElementById('endPoints').appendChild(newli);

        return;
      }
    } else if (matrixtype == "many_to_one") {
      if (eventObj.shiftKey) {
        Locations.push({
          lat : geo.lat,
          lon : geo.lon
        })
        locCount++;
        $rootScope.$emit('map.dropDestMarker', [ geo.lat, geo.lon ], locCount-1);
        locations++;
        document.getElementById('endpt').innerHTML ='<div class = "end marker">'+ (locCount-1)+ '</div> <span class = "geocode">' + geo.lat + ' , '+ geo.lon + '</span>';
        return;
      } else {
        Locations.push({
          lat : geo.lat,
          lon : geo.lon
        })
        locCount++;
        $rootScope.$emit('map.dropOriginMarker', [ geo.lat, geo.lon ], locCount-1);
        locations++;

        // //counter text is updated in wierd way, using locCount
        // if(locCount == 1) {
        //   document.getElementById('startpt').innerHTML ='<div class = "start marker">'+ (locCount-1) + '</div> <span class = "geocode">' + geo.lat + ' , '+ geo.lon + '</span>';
        //   return;
        // }

        $scope.startPoints.push({index: (locCount-1), lat: geo.lat, lon: geo.lon});
        $scope.$apply();
        counterText++;
        return;
      }
      //many_to_many
    } else {
      Locations.push({
        lat : geo.lat,
        lon : geo.lon
      })
      locCount++;
      $rootScope.$emit('map.dropOriginMarker', [ geo.lat, geo.lon ], locCount-1);
      locations++;

      var lat = geo.lat.toString();
      var lon = geo.lon.toString();

      if( locCount == 1 ) {
        document.getElementById('startpt').innerHTML= '<div class = "start marker">'+ (locCount-1) + '</div> <span class = "geocode">' + geo.lat + ' , '+ geo.lon + '</span>';lat + ' , ' + lon;
        return;
      }

      var newli = document.createElement('li');
      newli.setAttribute('id',counterText);
      newli.innerHTML='<div class = "start marker">'+ (locCount-1) + '</div> <span class = "geocode">' + geo.lat + ' , '+ geo.lon + '</span>';lat + ' , ' + lon;
      document.getElementById('startPoints').appendChild(newli);
      document.getElementById('startform').appendChild(newdiv);
      counterText++;
      return;
    }

    locations++;

    valhalla_mode = mode_mapping[mode];

    var matrixResponse;
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
