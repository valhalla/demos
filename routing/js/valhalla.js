var app = angular.module('routing', []);
var hash_params = L.Hash.parseHash(location.hash);
var mode_mapping = {
  'foot'    : 'pedestrian',
  'car'     : 'auto',
  'bicycle' : 'bicycle',
  'transit' : 'multimodal'
};
var date = new Date();
var isoDateTime = date.toISOString(); // "2015-06-12T15:28:46.493Z"
var serviceUrl = server.prod;
var envToken = accessToken.prod;
var elevToken = elevAccessToken.prod;
var envServer = server.prod;
var elevServiceUrl = elevationServer.prod;
var environmentExists = false; 

function selectEnv() {
  $("option:selected").each(function() {
    environmentExists = true; 
    envServer = $(this).text();
    serviceUrl = document.getElementById(envServer).value;
    getEnvToken();
  });
}

function getEnvToken() {
  switch (envServer) {
  case "localhost":
    envToken = accessToken.local;
    elevServiceUrl = elevationServer.local;
    elevToken = elevAccessToken.local;
    break;
  case "development":
    envToken = accessToken.dev;
    elevServiceUrl = elevationServer.dev;
    elevToken = elevAccessToken.dev;
    break;
  case "production":
    envToken = accessToken.prod;
    elevServiceUrl = elevationServer.prod;
    elevToken = elevAccessToken.prod;
    break;
  }
}

//format needs to be YYYY-MM-DDTHH:MM
function parseIsoDateTime(dtStr) {
  var dt = dtStr.split(".");
  var datestr = "";
  //YYYY-MM-DDTHH:MM:SS
  str = dt[0].split(":");
  datestr = str[0] + ":" + str[1];
  return datestr;
}
var dateStr = parseIsoDateTime(isoDateTime.toString());

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

app.controller('RouteController', function($scope, $rootScope, $sce, $http) {
  var road = L.tileLayer('http://b.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution : '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributers'
  }),/*cinnabar = Tangram.leafletLayer({
    scene: 'https://raw.githubusercontent.com/tangrams/cinnabar-style-more-labels/gh-pages/cinnabar-style-more-labels.yaml',
    attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | <a href="http://www.openstreetmap.org/about" target="_blank">&copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>'
  }),crossHatch = Tangram.leafletLayer({
    scene: 'https://raw.githubusercontent.com/tangrams/tangram-sandbox/gh-pages/styles/crosshatch.yaml',
    attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | <a href="http://www.openstreetmap.org/about" target="_blank">&copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>'
  }),*/zinc = Tangram.leafletLayer({
    scene: 'https://mapzen.com/carto/zinc-style/2.0/zinc-style.yaml',
    attribution: '<a href="https://mapzen.com/tangram">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/">Mapzen</a>'
  }), cycle = L.tileLayer('http://b.tile.thunderforest.com/cycle/{z}/{x}/{y}.png', {
    attribution : 'Maps &copy; <a href="http://www.thunderforest.com">Thunderforest, </a>;Data &copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }), elevation = L.tileLayer('http://b.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png', {
    attribution : 'Maps &copy; <a href="http://www.thunderforest.com">Thunderforest, </a>;Data &copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }), transit = L.tileLayer(' http://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png', {
    attribution : 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>'
  });

  var baseMaps = {
    "Road" : road,
   // "Cinnabar" : cinnabar,
   // "CrossHatch" : crossHatch,
    "Zinc" : zinc,
    "Cycle" : cycle,
    "Elevation" : elevation,
    "Transit" : transit
  };

  var map = L.map('map', {
    zoom : $rootScope.geobase.zoom,
    zoomControl : true,
    layers : [ zinc ],
    center : [ $rootScope.geobase.lat, $rootScope.geobase.lon ]
  });
  
  //mobile narrative display logic
  var mobileRouteEL = document.createElement('div');
    mobileRouteEL.className = 'mobile-route';
    mobileRouteEL.classList.add('list-route');
    mobileRouteEL.addEventListener('click', function (e) {
      e.stopPropagation();
      var routingContainer = document.getElementsByClassName('leaflet-routing-container')[0];
      if(routingContainer.classList.contains('left-align')){
        routingContainer.classList.remove('left-align');
        mobileRouteEL.classList.add('list-route');
        mobileRouteEL.classList.remove('cancel-route');
      }else{
        //if is small hack to load the narrative on the initial mobile load
        if (document.getElementsByClassName('leaflet-routing-container')[0].innerText == ""){
          window.location.reload();
        }
        routingContainer.classList.add('left-align');
        mobileRouteEL.classList.remove('list-route');
        mobileRouteEL.classList.add('cancel-route');
      }
    }, true);
  document.querySelector('.leaflet-top.leaflet-right').appendChild(mobileRouteEL);
  
  // Add geocoding plugin
  var options = {
    layers: 'coarse'
  };

  L.control.geocoder('search-8LtGSDw', options).addTo(map);
  L.control.layers(baseMaps, null).addTo(map);

  $scope.route_instructions = '';

  var Locations = [];
  var mode = 'transit';

  var icon = L.icon({
    iconUrl : 'resource/via_dot.png',

    iconSize : [ 38, 35 ], // size of the icon
    shadowSize : [ 50, 64 ], // size of the shadow
    iconAnchor : [ 22, 34 ], // point of the icon which will correspond to
    // marker's location
    shadowAnchor : [ 4, 62 ], // the same for the shadow
    popupAnchor : [ -3, -76 ]
  // point from which the popup should open relative to the iconAnchor
  });

  var mode_icons = {
    'car' : '../images/drive.png',
    'foot' : '../images/walk.png',
    'bicycle' : '../images/bike.png'
  };

  var getOriginIcon = function(icon) {
    return L.icon({
      iconUrl : 'resource/startmarker@2x.png',
      iconSize : [ 44, 56 ], // size of the icon
      iconAnchor : [ 22, 42 ]
    });
  };

  var getViaIcon = function(icon) {
    return L.icon({
      iconUrl : 'resource/via_dot.png',
      iconSize : [ 30, 30 ]
    });
  };

  var getDestinationIcon = function(icon) {
    return L.icon({
      iconUrl : 'resource/destmarker@2x.png',
      iconSize : [ 44, 56 ], // size of the icon
      iconAnchor : [ 22, 42 ]
    });
  };

 // allow hash links
  var hash = new L.Hash(map);
  var markers = [];

  var locateMarkers = [];
  var remove_markers = function() {
    for (var i = 0; i < markers.length; i++) {
      map.removeLayer(markers[i]);
    }
    markers = [];
    locateMarkers.forEach(function (element, index, array) {
      map.removeLayer(element);
    });
    locateMarkers = [];
  };

  var parseHash = function() {
    var hash = window.location.hash;
    if (hash.indexOf('#') === 0)
      hash = hash.substr(1);
    return hash.split('&');
  };

  var parseParams = function(pieces) {
    var parameters = {};
    pieces.forEach(function(e, i, a) {
      var parts = e.split('=');
      if (parts.length < 2)
        parts.push('');
      parameters[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
    });
    return parameters;
  };

  var force = false;
  var update = function(show, locs, costing) {
    // update the permalink hash
    var pieces = parseHash();
    var extra = '';
    pieces.forEach(function(e, i, a) {
      if (e.length && e.slice(0, 'locations='.length) != 'locations=' && e.slice(0, 'costing='.length) != 'costing=')
        extra = extra + (extra.length ? '&' : '') + e;
    });
    var hash_locs = [];
    locs.forEach(function(locs) {
      hash_locs.push({
        'lat' : locs.lat,
        'lon' : locs.lng
      })
    });
    var parameter = (extra.length ? '&locations=' : 'locations=') + JSON.stringify(hash_locs) + '&costing=' + JSON.stringify(costing);
    force = show;
    window.location.hash = '#' + extra + parameter;
    document.getElementById('permalink').innerHTML = "<a href='http://valhalla.github.io/demos/routing/index.html" + window.location.hash + "' target='_top'>Route Permalink</a>";
  };

  var updateHashCosting = function(costing, costingOptions, dateTime) {
    // update the permalink hash
    var pieces = parseHash();
    if (pieces[2].indexOf('&costing='))
      extra = '&costing=' + JSON.stringify(costing);

    if (costingOptions != null)
      extra = extra + '&costingoptions' + JSON.stringify(costingOptions);

    if (dateTime != null)
      extra = extra + '&datetime=' + JSON.stringify(dateTime);

    window.location.hash = '#' + pieces[0] + '&' + pieces[1] + extra;
    document.getElementById('permalink').innerHTML = "<a href='http://valhalla.github.io/demos/routing/index.html" + window.location.hash + "' target='_top'>Route Permalink</a>";
  };

  var hashRoute = function() {
    // something has to have changed for us to request again
    var parameters = parseParams(parseHash());
    if (!force && parameters.locations == JSON.stringify(locations))
      return;
    force = false;

    // shape
    var waypoints = [];
    if (parameters.locations !== undefined)
      waypoints = JSON.parse(parameters.locations);

    var locs = [];
    waypoints.forEach(function(waypoints) {
      locs.push(L.latLng(waypoints.lat, waypoints.lon));
    });

    if (parameters.costing !== undefined)
      var costing = JSON.parse(parameters.costing);

    if (parameters.costingoptions !== undefined)
      var costing_options = JSON.parse(parameters.costingoptions);

    if (parameters.datetime !== undefined)
      var date_time = JSON.parse(parameters.datetime);

    rr = createRouting({
      waypoints: locs,
      costing : costing,
      costing_options: costing_options,
      date_time : date_time
    }, true);
    
    locations = locs.length;

    document.getElementById('permalink').innerHTML = "<a href='http://valhalla.github.io/demos/routing/index.html" + window.location.hash + "' target='_top'>Route Permalink</a>";
  };

  // Number of locations
  var locations = 0;

  var reset = function() {
    if (rr) {
      rr.removeFrom(map);
      rr = null;
    }
    $scope.$emit('resetRouteInstruction');
    remove_markers();
    locations = 0;
    document.getElementById('permalink').innerHTML = "";
  };

  $rootScope.$on('map.setView', function(ev, geo, zoom) {
    map.setView(geo, zoom || 8);
  });
  $rootScope.$on('map.dropMarker', function(ev, geo, m) {

    if (locations == 0) {
      var marker = new L.marker(geo, {
        icon : getOriginIcon(m || 'transit')
      });
      marker.bindPopup("<a href = http://www.openstreetmap.org/#map=" + $rootScope.geobase.zoom + "/" + $rootScope.geobase.lat + "/" + $rootScope.geobase.lon
          + "&layers=Q target=_blank>Edit POI here<a/>");
    } else {
      var marker = new L.marker(geo, {
        icon : getDestinationIcon(m || 'transit')
      });
      marker.bindPopup("<a href = http://www.openstreetmap.org/#map=" + $rootScope.geobase.zoom + "/" + $rootScope.geobase.lat + "/" + $rootScope.geobase.lon
          + "&layers=Q target=_blank>Edit POI here<a/>");
    }
    map.addLayer(marker);
    markers.push(marker);
  });
  $rootScope.$on('map.dropMultiLocsMarker', function(ev, geo, m) {

    if (locations == 0) {
      var marker = new L.marker(geo, {
        icon : getOriginIcon(m || 'transit')
      });
      marker.bindPopup("<a href = http://www.openstreetmap.org/#map=" + $rootScope.geobase.zoom + "/" + $rootScope.geobase.lat + "/" + $rootScope.geobase.lon
          + "&layers=Q target=_blank>Edit POI here<a/>");
    } else {
      var marker = new L.marker(geo, {
        icon : getViaIcon(m || 'transit')
      });
      marker.bindPopup("<a href = http://www.openstreetmap.org/#map=" + $rootScope.geobase.zoom + "/" + $rootScope.geobase.lat + "/" + $rootScope.geobase.lon
          + "&layers=Q target=_blank>Edit POI here<a/>");
    }
    map.addLayer(marker);
    markers.push(marker);
  });

  // locate edge snap markers
  var locateEdgeMarkers = function (locate_result) {
    // clear it
    locateMarkers.forEach(function (element, index, array) {
      map.removeLayer(element);
    });
    locateMarkers = [];

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

  // if the hash changes
  // L.DomEvent.addListener(window, "hashchange", hashRoute);

  // show something to start with but only if it was requested
  $(window).load(function(e) {
    //rr = L.Routing.mapzen(accessToken);
    force = true;
    hashRoute();
  });

  map.on('click', function(e) {
    var geo = {
      'lat' : e.latlng.lat,
      'lon' : e.latlng.lng
    };

  var eventObj = window.event ? event : e.originalEvent;
    //way to test multi-locations
    if(eventObj.ctrlKey) {
      if (locations == 0) {
        Locations.push({
          lat : geo.lat,
          lon : geo.lon
        });
        $rootScope.$emit('map.dropMultiLocsMarker', [ geo.lat, geo.lon ], mode);
        locations++;
        return;
      } else {
        Locations.push({
          lat : geo.lat,
          lon : geo.lon
        });
        $rootScope.$emit('map.dropMultiLocsMarker', [ geo.lat, geo.lon ], mode);
        locations++;
        return;
      }
    } else if (!eventObj.shiftKey) {
      if (locations == 0) {
        Locations.push({
          lat : geo.lat,
          lon : geo.lon
        });
        $rootScope.$emit('map.dropMarker', [ geo.lat, geo.lon ], mode);
        locations++;
        return;
      } else if (locations > 1) {
        Locations = [];
        reset();

        Locations.push({
          lat : geo.lat,
          lon : geo.lon
        });
        $rootScope.$emit('map.dropMarker', [ geo.lat, geo.lon ], mode);
        locations++;
        return;
      }
    }

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

    $rootScope.$emit('map.dropMarker', [ geo.lat, geo.lon ], mode);
    locations++;

    var valhalla_mode = mode_mapping[mode];

    rr = createRouting({waypoints: waypoints, costing: valhalla_mode});
    update(true, waypoints, valhalla_mode);
  });

    var rr;

    var createRouting = function(options, createMarkers) {
        var defaultOptions = {
          geocoder : null,
          routeWhileDragging : false,
          router : L.Routing.mapzen(envToken, options),
          summaryTemplate : '<div class="start">{name}</div><div class="info {costing}">{distance}, {time}</div>',

          createMarker : function(i, wp, n) {
            var iconV;
            if (i == 0) {
              iconV = L.icon({
                iconUrl : 'resource/via_dot.png',
                iconSize : [ 30, 30 ]
              });
            } else {
              iconV = L.icon({
                iconUrl : 'resource/via_dot.png',
                iconSize : [ 30, 30 ]
              });
            }

            if (createMarkers) {
                if (i == 0) {
                    iconV = getOriginIcon();
                } else if (i == n -1) {
                    iconV = getDestinationIcon();
                }
            }

            var options = {
              draggable : true,
              icon : iconV
            };
            var dot = L.marker(wp.latLng, options);
            markers.push(dot);
            return dot.bindPopup("<a href = http://www.openstreetmap.org/#map=" + $rootScope.geobase.zoom + "/" + $rootScope.geobase.lat + "/" + $rootScope.geobase.lon
                + "&layers=Q target=_blank>Edit POI here<a/>");
          },
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

    var driveBtn = document.getElementById("drive_btn");
    var bikeBtn = document.getElementById("bike_btn");
    var walkBtn = document.getElementById("walk_btn");
    var multiBtn = document.getElementById("multi_btn");
    var elevationBtn = document.getElementById("elevation_btn");
    var routeresponse;

    driveBtn.addEventListener('click', function(e) {
      if (!rr) return;
      getEnvToken();
      var costing = 'auto';
      var calendarInput = document.getElementById("datepicker").value;
      if (calendarInput != "") {
        dateStr = datetimeUpdate(calendarInput);
        var dtoptions = setDateTime(dateStr);
        rr.route({
          costing : costing,
          date_time : dtoptions
        });
      } else {
        rr.route({
          costing : costing
        });
      }
      updateHashCosting(costing,null,dtoptions);
    });

    bikeBtn.addEventListener('click', function(e) {
      if (!rr) return;
      getEnvToken();
      var costing = 'bicycle';
      if (document.getElementById('bikeoptions').style.display == "block") {
        var bikeoptions = setBikeOptions();
        var calendarInput = document.getElementById("datepicker").value;
        if (calendarInput != "") {
          dateStr = datetimeUpdate(calendarInput);
          var dtoptions = setDateTime(dateStr);
          rr.route({
            costing : costing,
            costing_options : bikeoptions,
            date_time : dtoptions
          });
        } else {
          rr.route({
            costing : costing,
            costing_options : bikeoptions
          });
        }
      } else {
        rr.route({
          costing : costing,
        });
      }
      updateHashCosting(costing,bikeoptions,dtoptions);
    });

    walkBtn.addEventListener('click', function(e) {
      if (!rr) return;
      getEnvToken();
      var costing = 'pedestrian';
      var calendarInput = document.getElementById("datepicker").value;
      if (calendarInput != "") {
        dateStr = datetimeUpdate(calendarInput);
        var dtoptions = setDateTime(dateStr); 
        rr.route({
          costing : costing,
          date_time : dtoptions
        });
      } else {
        rr.route({
          costing : costing
        });
      }
      updateHashCosting(costing,null,dtoptions);
    });

    multiBtn.addEventListener('click', function(e) {
      if (!rr) return;
      getEnvToken();
      var costing = 'multimodal';
      var calInput = document.getElementById("datepicker").value;
      var dtoptions = "";
      if (calInput != "undefined") {
        dateStr = datetimeUpdate(calInput);
        dtoptions = setDateTime(dateStr);    
      }
      if (document.getElementById('transitoptions').style.display == "block") {
        var transitoptions = setTransitOptions();
        rr.route({
          costing : costing,
          costing_options : transitoptions,
          date_time : dtoptions
        });
      } else {
        rr.route({
          costing : costing,
          date_time : dtoptions
        });
      }
      updateHashCosting(costing,transitoptions,dtoptions);
    });
    
   
    elevationBtn.addEventListener('click', function(e) {
      if (!rr) return;
      if (environmentExists) 
        selectEnv();
      else getEnvToken();
      
      var elev = (typeof rr._routes[0] != "undefined") ? L.elevation(elevToken, rr._router._rrshape) : 0;
      elev.resetChart();
      elev.profile(elev._rrshape);
      document.getElementById('graph').style.display = "block";
    });

    function setBikeOptions() {
      var btype = document.getElementsByName("btype");
      var bicycle_type = "Road";
      for (var i = 0; i < btype.length; i++) {
        if (btype[i].checked) {
          bicycle_type = btype[i].value;
        }
      }
      var use_roads = document.getElementById("use_roads").value;
      var cycling_speed = document.getElementById("cycle_speed").value;
      var use_hills = document.getElementById("use_hills").value;

      var bikeoptions = {
        "bicycle" : {
          bicycle_type : bicycle_type,
          use_roads : use_roads,
          cycling_speed : cycling_speed,
          use_hills : use_hills
        }
      };
      return bikeoptions;
    }
    
    function setTransitOptions() {
      var use_bus = document.getElementById("use_bus").value;
      var use_rail = document.getElementById("use_rail").value;
      var use_transfers = document.getElementById("use_transfers").value;

      var transitoptions = {
        "transit" : {
          use_bus : use_bus,
          use_rail : use_rail,
          use_transfers : use_transfers
        }
      };
      return transitoptions;
    }
    
    

    function setDateTime(dateStr) {
      var dttype = document.getElementsByName("dttype");
      for (var i = 0; i < dttype.length; i++) {
        if (dttype[i].checked) {
          dt_type = dttype[i].value;
        }
      }
      //if user selects current, then only send type = 0
      if (dt_type == 0) {
        dateStr = parseIsoDateTime(this.date.toISOString().toString());
        var datetimeoptions = {
          type : parseInt(dt_type),
        };
      }
      else {
        dateStr = parseIsoDateTime(dateStr);
        var datetimeoptions = {
          type : parseInt(dt_type),
          value : dateStr.toString()
        };
      }
      return datetimeoptions;
    }

    /*
     * function openWin(id) { var divText =
     * document.getElementById(id).innerHTML;
     * myWindow=window.open('','','height: 100; width:200;'); var doc =
     * myWindow.document; doc.open(); doc.write(divText); doc.close(); }
     */

    function datetimeUpdate(datetime) {
      var changeDt = datetime;
      var inputDate, splitDate, year, month, day, time, hour, minute;
      if (changeDt != null) {
        if (changeDt.length >= 11) {
          inputDate = changeDt.split(" ");
          splitDate = inputDate[0].split("-");
          day = splitDate[0];
          if (day < 10) {
            day = '0' + day;
          }
          month = GetMonthIndex(splitDate[1]) + 1;
          if (month < 10) {
            month = '0' + month;
          }
          year = splitDate[2];

          time = inputDate[1].split(":");
          hour = time[0];
          minute = time[1];

          dateStr = year + "-" + month + "-" + day + "T" + hour + ":" + minute;
        } else {
          dateStr = parseIsoDateTime(isoDateTime.toString());
        }
      }
      return dateStr;
    }

    $(document).on('mode-alert', function(e, m) {
      mode = m;
      reset();
      Locations = [];
    });

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
  
  $scope.clearAll = function(e) {

    $('.leaflet-marker-icon').remove();
    $('.leaflet-label').remove();
    $('.leaflet-marker-shadow').remove();
    $('svg').html('');
    $('.leaflet-routing-container').remove();
    $scope.appView = 'control'
    locations = 0;

    if (typeof elev != "undefined")
      elev.resetChart();
    $('#graph').empty();
    $("[name=btype]").filter("[value='Road']").prop("checked",true);
    $('input#use_roads').val("0.5");
    $('input#cycle_speed').val("25.0");
    $('input#use_hills').val("0.5");
    //reset datetime calendar and type
    this.datetime=[];
    dateStr="";
    $("[name=dttype]").filter("[value='0']").prop("checked",true);
    $('input#datepicker').val("");
    Locations = [];
    document.getElementById('permalink').innerHTML = "";
    window.location.hash = "";
  }

  $("#showbtn").on("click", function() {
    document.getElementById('driveoptions').style.display = "block";
    document.getElementById('bikeoptions').style.display = "block";
    document.getElementById('walkoptions').style.display = "block";
    document.getElementById('transitoptions').style.display = "block";
    document.getElementById('dtoptions').style.display = "block";
  });

  $("#hidebtn").on("click", function() {
    document.getElementById('driveoptions').style.display = "none";
    document.getElementById('bikeoptions').style.display = "none";
    document.getElementById('walkoptions').style.display = "none";
    document.getElementById('transitoptions').style.display = "none";
    document.getElementById('dtoptions').style.display = "none";
  });

  $("#hidechart").on("click", function() {
    document.getElementById('graph').style.display = "none";
  });
});