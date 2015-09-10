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
  //cycle map with terrain
  var cycleMap = L.tileLayer('http://b.tile.thunderforest.com/cycle/{z}/{x}/{y}.png', {
    attribution : 'Maps &copy; <a href="http://www.thunderforest.com">Thunderforest, </a>;Data &copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  })
  
  //leaflet slippy map
  var map = L.map('map', {
    zoom : $rootScope.geobase.zoom,
    zoomControl : false,
    layers : [ cycleMap ],
    center : [ $rootScope.geobase.lat, $rootScope.geobase.lon ]
  });
  
  //??
  $scope.renderHtml = function(html_code) {
    return $sce.trustAsHtml(html_code);
  };
  
  //icon for point on the map
  var resampledPt = function(icon) {
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
  var locations = [ ]
    
  //show something to start with but only if it was requested
  $(window).load(function(e) {

    document.getElementById('resample_distance').value = "100";
    document.getElementById('sampling_text').innerHTML = '<h5>Sampling Distance: ' + document.getElementById('resample_distance').value + 'm</h5>';
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
      var marker = new L.circle( [elevation.shape[i].lat, elevation.shape[i].lon], 10, resampledPt());
      marker.bindPopup('<pre style="display:inline" class="elv_point">height: ' + elevation.range_height[i][1] + 'm range: ' + elevation.range_height[i][0] + 'm</pre>');
      map.addLayer(marker);
      resampled.push(marker);
    }
  };

  //someone clicked, store the spot and show something
  map.on('click', function(e) {
      locations.push({
        'lat' : e.latlng.lat,
        'lon' : e.latlng.lng
      });
      
      //check the total number to see if its bonkers
      var length = 0.0;
      locations.forEach(function(e,i,a) {
        if(i != 0) {
          var previous = L.latLng(locations[i - 1].lat, locations[i - 1].lon);
          var current = L.latLng(e.lat, e.lon);
          length += previous.distanceTo(current);
        }
      });

      if(length / document.getElementById('resample_distance').value > 2500) {
        alert("You seem to be getting carried away. Try less locations closer together or increase the resampling distance");
        locations.pop();
      }
      else
        getElevation();
  });
  
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
    document.getElementById('sampling_text').innerHTML = '<h5>Sampling Distance: ' + this.value + 'm</h5>';
  });
  $("#resample_distance").on("input", function() {
    document.getElementById('sampling_text').innerHTML = '<h5>Sampling Distance: ' + this.value + 'm</h5>';
  });
  
})