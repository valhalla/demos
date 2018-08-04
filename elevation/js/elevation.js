var app = angular.module('elevation', []);
var hash_params = L.Hash.parseHash(location.hash);

serviceUrl       = server.prod;
token = prodToken;

//??
app.run(function($rootScope) {
  var hash_loc = hash_params ? hash_params : {
    'center' : {
      'lat' : 47.2200,
      'lng' :  9.3357
    },
    'zoom' : 12
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
app.controller('ElevationController', function($scope, $rootScope, $sce, $http) {

  //map layers & default layer are defined in the index.html
  //leaflet slippy map
  var map = L.map('map', {
    zoom : $rootScope.geobase.zoom,
    zoomControl : true,
    layers : [ (typeof defaultMapLayer != undefined ? defaultMapLayer : outdoors) ],
    center : [ $rootScope.geobase.lat, $rootScope.geobase.lon ]
  });

  // If iframed, we're going to have to disable some of the touch interaction
  // to not hijack page scroll. See Stamen's Checklist for Maps: http://content.stamen.com/stamens-checklist-for-maps
  if (window.self !== window.top) {
    map.scrollWheelZoom.disable();
  }
  
  //??
  $scope.renderHtml = function(html_code) {
    return $sce.trustAsHtml(html_code);
  };
  
  //icon for point on the map
  var resampledPt = function() {
    return {
      color: '#444',
      opacity: 1,
      fill: true,
      fillColor: '#eee',
      fillOpacity: 1
    }
  };

  //allow hash links
  var hash = new L.Hash(map);
  //place to store clicked locations
  var shape = [ ];
  var updateSlider = function() {
    var pathLength = 0;
    shape.forEach(function(e,i,a) {
      if(i != 0) {
        var previous = L.latLng(shape[i - 1].lat, shape[i - 1].lon);
        var current = L.latLng(e.lat, e.lon);
        pathLength += previous.distanceTo(current);
      }
    })
    var low = 10;
    var high = 100;
    if(pathLength > 100 * 10) {
      low = Math.floor(pathLength / 1000) * 10;
      high = Math.ceil(pathLength / 100) * 10;  
    }  
    
    //apply them
    var slider = document.getElementById('resample_distance');
    slider.min = low;
    slider.max = high;  
    document.getElementById('sampling_text').innerHTML = '<h5>Sampling Distance: ' + slider.value + 'm</h5>';
    return slider.value;
  };
  
  var parseHash = function() {
    var hash = window.location.hash;
    if(hash.indexOf('#') === 0)
      hash = hash.substr(1);
    return hash.split('&');
  }
  
  var parseParams = function(pieces) {
    parameters = {};
    pieces.forEach(function(e,i,a) {
      var parts = e.split('=');
      if(parts.length < 2)
        parts.push('');
      parameters[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
    });
    return parameters;
  };
  
  var force = false;
  var update = function(show) {
    //update the sampling limits based on the total length
    var slider_value = updateSlider();
    
    //update the permalink hash
    var pieces = parseHash();
    var extra = '';
    pieces.forEach(function(e,i,a){
      if(e.length && e.slice(0, 'shape='.length) != 'shape=' && e.slice(0, 'resample_distance='.length) != 'resample_distance=')
        extra = extra + (extra.length ? '&' : '') + e;
    });
    var parameter = (extra.length ? '&shape=' : 'shape=') + JSON.stringify(shape) + '&resample_distance=' + slider_value;
    force = show;
    window.location.hash = '#' + extra + parameter;

    document.getElementById('permalink').innerHTML = 
      "<a href='https://valhalla.github.io/demos/elevation/index.html" + window.location.hash + "' target='_top'>permalink</a>";
  };
  
  var hashElevation = function() {
    //something has to have changed for us to request again
    var parameters = parseParams(parseHash());
    if(!force && parameters.shape == JSON.stringify(shape) &&
      parameters.resample_distance == document.getElementById('resample_distance').value)
      return;
    force = false;
    
    //shape
    if(parameters.shape !== undefined)
      shape = JSON.parse(parameters.shape);
    //sampling distance
    if(parameters.resample_distance !== undefined) {
      var slider = document.getElementById('resample_distance');
      slider.min = parameters.resample_distance - 1;
      slider.max = parameters.resample_distance + 1;
      slider.value = parameters.resample_distance;
      updateSlider();
    }

    //show something interesting
    elev.resetChart();
    if(shape.length > 0)
      elev.profile(shape, document.getElementById('resample_distance').value, marker_update);
    document.getElementById('permalink').innerHTML = 
      "<a href='https://valhalla.github.io/demos/elevation/index.html" + window.location.hash + "' target='_top'>permalink</a>";
  };

  //if the hash changes
  L.DomEvent.addListener(window, "hashchange", hashElevation);

  //show something to start with but only if it was requested
  $(window).load(function(e) {
    elev = L.Elevation.widget(token);
    force = true;
    hashElevation();
  });
  
  //place to store results
  var resampled = []
  
  //undraw all the points
  var clear = function() {
    resampled.forEach(function (e,i,a) {
      map.removeLayer(e);
    });
    resampled = [];
  };
  
  //call back for use when a result comes back
  var marker_update = function(elevation) {    
    //undraw everything
    clear();

    //draw interpolations
    for(var i = 0; i < elevation.shape.length; i++) {
      var marker = new L.circle( [elevation.shape[i].lat, elevation.shape[i].lon], 5, resampledPt());
      marker.bindPopup('<pre style="display:inline" class="elv_point">height: ' + elevation.range_height[i][1] + 'm range: ' + elevation.range_height[i][0] + 'm</pre>');
      map.addLayer(marker);
      resampled.push(marker);
    }
  };
  
  //adding a point
  var addPoint = function(e) {
    shape.push({
      'lat' : e.latlng.lat.toFixed(6),
      'lon' : e.latlng.lng.toFixed(6)
    });
    update(true);
  };

  //someone clicked, store the spot and show something
  map.on('click', addPoint);
  map.on('touchEnd', addPoint);
  
  //someone clicked the clear button so reset
  $("#clearbtn").on("click", function() {
    clear();
    shape = [];
    update(false);
    elev.resetChart();
    elev = L.Elevation.widget(token);
  });
  
  //someone changed sampling
  $("#resample_distance").on("change", function() {
    update(true);
  });
  $("#resample_distance").on("input", function() {
    var slider = document.getElementById('resample_distance');
    document.getElementById('sampling_text').innerHTML = '<h5>Sampling Distance: ' + slider.value + 'm</h5>'
  });

  // Resize graph when viewport changes
  $(window).on('resize', function() {
    if (shape.length === 0) {
      elev.resetChart();
      elev = L.Elevation.widget(token);
    } else {
      update(true);
    }
  });
})
