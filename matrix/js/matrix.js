var app = angular.module('matrix', []);
var hash_params = L.Hash.parseHash(location.hash);
var mode_mapping = {
  'foot' : 'pedestrian',
  'car' : 'auto',
  'bicycle' : 'bicycle'
};

var serviceUrl = "https://matrix.mapzen.com/";
var envServer = "production";
var token = accessToken.prod;
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
    token = accessToken.local;
    break;
  case "development":
    token = accessToken.dev;
    break;
  case "production":
    token = accessToken.prod;
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
      iconSize : [ 30, 36 ], // size of the icon
    //  iconAnchor : [ 15, 20],
    //  labelAnchor: [5, 5],
      shadowUrl: null
    })
  };

  var getDestinationIcon = function() {
    return new L.Icon({ 
      iconUrl : '../matrix/resource/matrix_pin_end.png',
      iconSize : [ 30, 36 ], // size of the icon
    //  iconAnchor : [ 15, 20],
    //  labelAnchor: [5, 5],
      shadowUrl: null
    });
  };

 //Number of locations
  var locations = 0;
  var markers = [];

  $rootScope.$on('map.setView', function(ev, geo, zoom) {
    map.setView(geo, zoom || 8);
  });
  
  $rootScope.$on('map.dropOriginMarker', function(ev, geo, locCount) {

      var marker = new L.marker(geo, {
        icon : getOriginIcon()
      }).bindLabel((locCount).toString(), {
        position: [geo.lat,geo.lon],
        noHide: true,
        offset: [-9,-12]
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
        offset: [-9,-12]
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
    var modeBtn = document.getElementsByName("mode");
    var transitmode = "auto";
    for (var i = 0; i < modeBtn.length; i++) {
      if (modeBtn[i].checked) {
        transitmode = modeBtn[i].value;
      }
    } 
    return transitmode;
  }  
  
  var reset_form = function() {
    document.getElementById("startp").innerHTML = "";
    document.getElementById("endp").innerHTML = "";
  };
  
  var oneToMany = document.getElementById("one_to_many");
  var manyToOne = document.getElementById("many_to_one");
  var manyToMany = document.getElementById("many_to_many");
  var clearBtn = document.getElementById("clear_btn");
  var matrixBtn = document.getElementById("matrix_btn");
  var matrixtype = "";
  
  oneToMany.addEventListener('click', function(e) {
    reset_form();
    $( '.startheader' ).replaceWith($("<div class=startheader id=startheader><h4><b>Starting point</b></h4></div>" ));
    $( "p#startp" ).prepend( document.createTextNode( "Click on the map to add a start point" ) );
    $( '.endheader' ).replaceWith($("<div class=endheader id=endheader><h4><b>Ending points</b></h4></div>" ));
    $( 'input#endpt').replaceWith($("<input id=endpt type=text name=endpt  style=color:#A4A4A4/>" ));
    $( "p#endp" ).prepend( document.createTextNode( "Click on the map to add your ending points" ) );
    getEnvToken();
    var mode = setMode();
    matrixtype = "one_to_many";
    chooseLocations(matrixtype);
  });
  
  manyToOne.addEventListener('click', function(e) {
    reset_form();
    $( '.startheader' ).replaceWith($("<div class=startheader id=startheader><h4><b>Starting points</b></h4></div>" ));
    $( "p#startp" ).prepend( document.createTextNode( "Click on the map to add your starting points" ) );
    $( '.endheader' ).replaceWith($("<div class=endheader id=endheader><h4><b>Ending point</b></h4></div>" ));
    $( 'input#endpt').replaceWith($("<input id=endpt type=text name=endpt  style=color:#A4A4A4/>" ));
    $( "p#endp" ).prepend( document.createTextNode( "Ctrl + Click on the map to add an ending point" ) );
    getEnvToken();
    var mode = setMode();
    matrixtype = "many_to_one";
    chooseLocations(matrixtype);
  });

  manyToMany.addEventListener('click', function(e) {
    reset_form();
    $( '.startheader' ).replaceWith($("<div class=startheader id=startheader><h4><b>Select points</b></h4></div>" ));
    $( '.endheader' ).replaceWith($("<div class=endheader id=endheader><h4></h4></div>" ));
    $( 'input#endpt').replaceWith($("<input id=endpt type=hidden name=endpt />" ));
    getEnvToken();
    var mode = setMode();
    matrixtype = "many_to_many";
    chooseLocations(matrixtype);
  });
  
  clearBtn.addEventListener('click', function(e) {
    javascript:location.reload(true)
  });
  
  matrixBtn.addEventListener('click', function(e) {
    var waypoints = [];
    Locations.forEach(function(gLoc) {
      waypoints.push(L.latLng(gLoc.lat, gLoc.lon));
    });
    
    var  matrix = L.Matrix.widget(token, mode, matrixtype);
    matrix.matrix({
      waypoints : waypoints
    });
  });
    
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
        $rootScope.$emit('map.dropOriginMarker', [ geo.lat, geo.lon ], locCount);
        locations++;
        document.getElementById('startpt').value=[geo.lat, geo.lon];
        return;
      } else {
        Locations.push({
          lat : geo.lat,
          lon : geo.lon
        })
        locCount++;
        $rootScope.$emit('map.dropDestMarker', [ geo.lat, geo.lon ], locCount);
        locations++;

        document.getElementById("endp").innerHTML = "";
        document.getElementById('endpt').value=[geo.lat, geo.lon];
        var newdiv = document.createElement('endpt'+ counterText);
        newdiv.innerHTML="<input id='endpt'"+counterText +" type=text name='endpt' style=color:#A4A4A4 value="+[geo.lat, geo.lon]+" />";
        document.getElementById('endform').appendChild(newdiv);

        return;
      }
    } else if (matrixtype == "many_to_one") {
      if (eventObj.ctrlKey) {
        Locations.push({
          lat : geo.lat,
          lon : geo.lon
        })
        locCount++;
        $rootScope.$emit('map.dropDestMarker', [ geo.lat, geo.lon ], locCount);
        locations++;
        document.getElementById('endpt').value=[geo.lat, geo.lon];

        return;
      } else {
        Locations.push({
          lat : geo.lat,
          lon : geo.lon
        })
        locCount++;
        $rootScope.$emit('map.dropOriginMarker', [ geo.lat, geo.lon ], locCount);
        locations++;

        document.getElementById("startp").innerHTML = "";
        document.getElementById('startpt').value=[geo.lat, geo.lon];
        var newdiv = document.createElement('startpt'+ counterText);
        newdiv.innerHTML="<input id='startpt'"+counterText +" type=text name='startpt' style=color:#A4A4A4 value="+[geo.lat, geo.lon]+" />";
        document.getElementById('startform').appendChild(newdiv);
        
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
      $rootScope.$emit('map.dropOriginMarker', [ geo.lat, geo.lon ], locCount);
      locations++;

      document.getElementById("startp").innerHTML = "";
      document.getElementById('startpt').value=[geo.lat, geo.lon];
      var newdiv = document.createElement('startpt'+ counterText);
      newdiv.innerHTML="<input id='startpt'"+counterText +" type=text name='endpt' style=color:#A4A4A4 value="+[geo.lat, geo.lon]+" />";
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
      var locate = L.locate(token);
      locate.locate(ll, locateEdgeMarkers);
    });

})

