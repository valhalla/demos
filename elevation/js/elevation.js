var app = angular.module('elevation', []);
var hash_params = L.Hash.parseHash(location.hash);

serviceUrl = server.prod;
token = accessToken.prod;

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
  //hiking map with terrain
  var cycleMap = L.tileLayer('https://b.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png', {
    attribution : 'Maps &copy; <a href="https://www.thunderforest.com">Thunderforest, </a>;Data &copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  })
  
  //leaflet slippy map
  var map = L.map('map', {
    zoom : $rootScope.geobase.zoom,
    zoomControl : true,
    layers : [ cycleMap ],
    center : [ $rootScope.geobase.lat, $rootScope.geobase.lon ]
  });
  
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
  var locations = [ ];
  var pathLength = 0;
  var updateLength = function() {
    pathLength = 0;
    locations.forEach(function(e,i,a) {
      if(i != 0) {
        var previous = L.latLng(locations[i - 1].lat, locations[i - 1].lon);
        var current = L.latLng(e.lat, e.lon);
        pathLength += previous.distanceTo(current);
      }
    })
    return pathLength;
  };
  
  var updateSlider = function(low, high) {
    var slider = document.getElementById('resample_distance');
    slider.value = Math.max(slider.value, low);
    slider.value = Math.min(slider.value, high);
    slider.min = low;
    slider.max = high;
    document.getElementById('sampling_text').innerHTML = '<h5>Sampling Distance: ' + slider.value + 'm</h5>';
  };
    
  //show something to start with but only if it was requested
  $(window).load(function(e) {
    updateSlider(100, 10, 1000);
    elev = L.Elevation.widget(token);
    var href = window.location.href;
    if(href.contains('?show_sample')) {
      window.location.href = href.slice(0, href.lastIndexOf('?show_sample') + '?show_sample'.length) + '#loc=12,47.2200,9.3357';
      locations = [ {lat: 47.20365107869972, lon: 9.352025985717773 }, {lat: 47.27002789823629, lon: 9.341468811035154} ]
      getElevation();
    }
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
  
  //make the request to get the elevation
  var getElevation = function() {    
    elev.resetChart();
    elev.profile(locations, document.getElementById('resample_distance').value, marker_update);
    $("#clearbtn").show();
  }
  
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
    //update the locations and length along them
    locations.push({
      'lat' : e.latlng.lat,
      'lon' : e.latlng.lng
    });
    updateLength();
    
    //update the sampling limits based on the total length
    var low = 10;
    var high = 1000;
    if(pathLength > 1000 * 10) {
      low = Math.floor(pathLength / 2000) * 10;
      high = Math.ceil(pathLength / 100) * 10;  
    }    
    updateSlider(low, high);
    
    //show it
    getElevation();
  };

  //someone clicked, store the spot and show something
  map.on('click', addPoint);
  map.on('touchEnd', addPoint);
  
  //someone clicked the clear button so reset
  $("#clearbtn").on("click", function() {
    clear();
    locations = [];
    elev.resetChart();
    elev = L.Elevation.widget(token);
  });
  
  //someone clicked to get elevation
  $("#updatebtn").on("click", function() {
    if(locations.length == 0)
      alert("Click a few places on the map first");
    else
      getElevation();
  });
  
  //someone changed sampling
  $("#resample_distance").on("change", function() {
    updateSlider(this.min, this.max);
  });
  $("#resample_distance").on("input", function() {
    updateSlider(this.min, this.max);
  });
  
})
