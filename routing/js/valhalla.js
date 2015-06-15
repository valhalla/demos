var app = angular.module('routing', []);
var hash_params = L.Hash.parseHash(location.hash);
var mode_mapping = { 'foot' : 'pedestrian', 'car' : 'auto', 'bicycle' : 'bicycle', 'transit' : 'multimodal'};


app.run(function($rootScope) {
	  var hash_loc = hash_params ? hash_params : {'center': {'lat': 40.7486, 'lng': -73.9690}, 'zoom': 13};
	  $rootScope.geobase = {
	    'zoom': hash_loc.zoom,
	    'lat' : hash_loc.center.lat,
	    'lon' : hash_loc.center.lng
	  }
	  $(document).on('new-location', function(e){
	    $rootScope.geobase = {
	      'zoom': e.zoom,
	      'lat' : e.lat,
	      'lon' : e.lon
	    };
	  })
});

app.controller('RouteController', function($scope, $rootScope, $sce, $http) {
	  
  $scope.route_instructions = '';
  
  var map = L.map('map', {
      zoom: $rootScope.geobase.zoom,
      zoomControl: false,
      center: [$rootScope.geobase.lat, $rootScope.geobase.lon]
  });

  var Locations = [];
  var mode = 'car';

  var icon = L.icon({
	    iconUrl: 'resource/dot.png',

	    iconSize:     [38, 35], // size of the icon
	    shadowSize:   [50, 64], // size of the shadow
	    iconAnchor:   [22, 34], // point of the icon which will correspond to marker's location
	    shadowAnchor: [4, 62],  // the same for the shadow
	    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
		});

	var mode_icons = {
	  'car' : 'js/images/drive.png',
	  'foot': 'js/images/walk.png',
	  'bicycle': 'js/images/bike.png'
	};

	var getStartIcon = function(icon){
	  return L.icon({
	    iconUrl: 'resource/startmarker@2x.png',

	    iconSize:     [44, 56], // size of the icon
	    iconAnchor: [22, 50]

	  });
	};

	var getEndIcon = function(icon){
	  return L.icon({
	    iconUrl: 'resource/destmarker@2x.png',
	    iconSize:   [44, 56], // size of the icon
	    iconAnchor: [22, 50]
	  });
	};



	L.tileLayer('http://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png', {
	    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>',
	    maxZoom: 18
	}).addTo(map);

	// Set up the hash
	  var hash = new L.Hash(map);
	  var markers = [];
	  var remove_markers = function(){
	    for (i=0; i<markers.length; i++) {
	      map.removeLayer(markers[i]);
	    }
	    markers = [];
	  };

	  // Number of locations
	  var locations = 0;
	  
	  var reset = function() {
	    $('svg').html('');
	    $('.leaflet-routing-container').remove();
	    $scope.$emit( 'resetRouteInstruction' );
	    remove_markers();
	    locations = 0;
	  };

	  $rootScope.$on( 'map.setView', function( ev, geo, zoom ){
	    map.setView( geo, zoom || 8 );
	  });
	  $rootScope.$on( 'map.dropMarker', function( ev, geo, m){

	    if (locations == 0) {
	      var marker = new L.marker(geo, {icon: getStartIcon(m || 'car')});
	    }
	    else {
	      var marker = new L.marker(geo, {icon: getEndIcon(m || 'car')});
	    }
	    map.addLayer(marker);
	    markers.push(marker);
	    //marker.openPopup();
	  });
	  
	  $scope.renderHtml = function(html_code){
	    return $sce.trustAsHtml(html_code);
	  };

	  $scope.$on( 'setRouteInstruction', function( ev, instructions ) {
	    $scope.$apply(function(){
	      $scope.route_instructions = instructions;
	    });
	  });

	  $scope.$on( 'resetRouteInstruction', function( ev ) {
	    $scope.$apply(function(){
	      $scope.route_instructions = '';
	    });
	  });

	  map.on('click', function(e) {
	    var geo = {
	      'lat': e.latlng.lat,
	      'lon': e.latlng.lng
	    };
	    
        if (locations == 0) {
	      Locations.push({lat: geo.lat, lon: geo.lon })
	      $rootScope.$emit( 'map.dropMarker', [geo.lat, geo.lon], mode);
	      locations++;
	      return;
	    } else if (locations > 1) {
	      Locations = [];
	      reset();

	      Locations.push({lat: geo.lat, lon: geo.lon })
	      $rootScope.$emit( 'map.dropMarker', [geo.lat, geo.lon], mode);
	      locations++;
	      return;
	    }

	    var waypoints = [];
	    Locations.forEach(function(gLoc) {
	      waypoints.push(L.latLng(gLoc.lat, gLoc.lon));
	    });

	    waypoints.push(L.latLng(geo.lat, geo.lon));

	    $rootScope.$emit( 'map.dropMarker', [geo.lat, geo.lon], mode);
	    locations++;
	    
	    valhalla_mode = mode_mapping[mode];

	var rr = L.Routing.control({
		waypoints: waypoints,
		geocoder: null,
	  transitmode: valhalla_mode,
	  routeWhileDragging: false,
	  router: L.Routing.valhalla('valhalla-T_YY31g','auto'),
	  summaryTemplate:'<div class="start">{name}</div><div class="info {transitmode}">{distance}, {time}</div>',
	    pointMarkerStyle: {radius: 6,color: '#25A5FA',fillColor: '#5E6472',opacity: 1,fillOpacity: 1}
		}).addTo(map);
		  
	  
	//TODO: Want to load this as initial load of page.  Then allow for P&C routing
	//rr.setWaypoints([L.Routing.waypoint(L.latLng(40.713,-74.005)),L.Routing.waypoint( L.latLng(40.749,-73.97))]);
	
	
  var driveBtn = document.getElementById("drive_btn");
  var bikeBtn = document.getElementById("bike_btn");
  var walkBtn = document.getElementById("walk_btn");
  var multiBtn = document.getElementById("multi_btn");
  var timeBtn = document.getElementById("time_btn");
  
  var time = new Date();
  var day = time.getDate();
  if (day < 10) {
    day = '0' + day;
  }
  var month = time.getMonth() + 1;
  if (month < 10) {
    month = '0' + month;
  }
  var year = time.getFullYear();
  var hour = 12;
  var minute = 15;
  dateStr = year + "-" + month + "-" + day + "T" + hour + ":" + minute;
  
driveBtn.addEventListener('click', function (e) {
    // var newWayPoints = new L.Routing.Waypoint([
    //     L.latLng(39.645244,-73.9449975),
    //     L.latLng(39.7590615,-73.969231)
    // ]);
    // rr.setWaypoints(newWayPoints);
  rr.route({transitmode: 'auto'});
});

bikeBtn.addEventListener('click', function (e) {
  rr.route({transitmode: 'bicycle'});
});

walkBtn.addEventListener('click', function (e) {
  rr.route({transitmode: 'pedestrian'});
}); 

multiBtn.addEventListener('click', function (e) {
	  rr.route({transitmode: 'multimodal', date_time: dateStr});
});

timeBtn.addEventListener('click', function (e) {
	  var newTime = prompt("Set time/date to depart (24hr clock), hh:mm MM-DD");
	  if (newTime.length >= 5) {
	    var newHour = newTime.substring(0,2);
	    hour = (newHour <= 24 && newHour >= 0) ? newHour : hour;
	    var newMin = newTime.substring(3,5);
	    minute = (newMin < 60  && newMin >= 0) ? newMin : minute;
	    if (newTime.length === 11) {
	      var mdStr = newTime.substring(6, newTime.length);
	      var newMonth = mdStr.substring(0,2);
	      var newDay = mdStr.substring(3,5);
	      if (newMonth > 0 && newMonth <= 12) {
	        if (newMonth < time.getMonth() + 1) {
	          year++;
	        } else {
	          year = time.getFullYear();
	        }
	        month = newMonth;
	        if (newDay > 0 && newDay <= 31) {
	          day = newDay;
	        }
	      }   
	    }
	  } else if (newTime === "r") {
	    year = time.getFullYear();
	    month = time.getMonth() + 1;
	    if (month < 10) {
	      month = '0' + month;
	    }
	    day = time.getDate();
	    if (day < 10) {
	      day = '0' + day;
	    }
	    hour = 12;
	    minute = 15;
	  } 
	  dateStr = year + "-" + month + "-" + day + "T" + hour + ":" + minute;
	  multiBtn.click();
	});

$(document).on('mode-alert', function(e, m) {
    mode = m;
    reset();
    Locations = [];
  });

  $(document).on('route:time_distance', function(e, td){
    var instructions = $('.leaflet-routing-container.leaflet-control').html();
    $scope.$emit( 'setRouteInstruction', instructions);
  });
	  });
})