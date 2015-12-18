(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

function corslite(url, callback, cors) {
    var sent = false;

    if (typeof window.XMLHttpRequest === 'undefined') {
        return callback(Error('Browser not supported'));
    }

    if (typeof cors === 'undefined') {
        var m = url.match(/^\s*https?:\/\/[^\/]*/);
        cors = m && (m[0] !== location.protocol + '//' + location.domain +
                (location.port ? ':' + location.port : ''));
    }

    var x = new window.XMLHttpRequest();

    function isSuccessful(status) {
        return status >= 200 && status < 300 || status === 304;
    }

    if (cors && !('withCredentials' in x)) {
        // IE8-9
        x = new window.XDomainRequest();

        // Ensure callback is never called synchronously, i.e., before
        // x.send() returns (this has been observed in the wild).
        // See https://github.com/mapbox/mapbox.js/issues/472
        var original = callback;
        callback = function() {
            if (sent) {
                original.apply(this, arguments);
            } else {
                var that = this, args = arguments;
                setTimeout(function() {
                    original.apply(that, args);
                }, 0);
            }
        }
    }

    function loaded() {
        if (
            // XDomainRequest
            x.status === undefined ||
            // modern browsers
            isSuccessful(x.status)) callback.call(x, null, x);
        else callback.call(x, x, null);
    }

    // Both `onreadystatechange` and `onload` can fire. `onreadystatechange`
    // has [been supported for longer](http://stackoverflow.com/a/9181508/229001).
    if ('onload' in x) {
        x.onload = loaded;
    } else {
        x.onreadystatechange = function readystate() {
            if (x.readyState === 4) {
                loaded();
            }
        };
    }

    // Call the callback with the XMLHttpRequest object as an error and prevent
    // it from ever being called again by reassigning it to `noop`
    x.onerror = function error(evt) {
        // XDomainRequest provides no evt parameter
        callback.call(this, evt || true, null);
        callback = function() { };
    };

    // IE9 must have onprogress be set to a unique function.
    x.onprogress = function() { };

    x.ontimeout = function(evt) {
        callback.call(this, evt, null);
        callback = function() { };
    };

    x.onabort = function(evt) {
        callback.call(this, evt, null);
        callback = function() { };
    };

    // GET is the only supported HTTP Verb by XDomainRequest and is the
    // only one supported here.
    x.open('GET', url, true);

    // Send the request. Sending data is not supported.
    x.send(null);
    sent = true;

    return x;
}

if (typeof module !== 'undefined') module.exports = corslite;

},{}],2:[function(require,module,exports){
var polyline = {};

// Based off of [the offical Google document](https://developers.google.com/maps/documentation/utilities/polylinealgorithm)
//
// Some parts from [this implementation](http://facstaff.unca.edu/mcmcclur/GoogleMaps/EncodePolyline/PolylineEncoder.js)
// by [Mark McClure](http://facstaff.unca.edu/mcmcclur/)

function encode(coordinate, factor) {
    coordinate = Math.round(coordinate * factor);
    coordinate <<= 1;
    if (coordinate < 0) {
        coordinate = ~coordinate;
    }
    var output = '';
    while (coordinate >= 0x20) {
        output += String.fromCharCode((0x20 | (coordinate & 0x1f)) + 63);
        coordinate >>= 5;
    }
    output += String.fromCharCode(coordinate + 63);
    return output;
}

// This is adapted from the implementation in Project-OSRM
// https://github.com/DennisOSRM/Project-OSRM-Web/blob/master/WebContent/routing/OSRM.RoutingGeometry.js
polyline.decode = function(str, precision) {
    var index = 0,
        lat = 0,
        lng = 0,
        coordinates = [],
        shift = 0,
        result = 0,
        byte = null,
        latitude_change,
        longitude_change,
        factor = Math.pow(10, precision || 5);

    // Coordinates have variable length when encoded, so just keep
    // track of whether we've hit the end of the string. In each
    // loop iteration, a single coordinate is decoded.
    while (index < str.length) {

        // Reset shift, result, and byte
        byte = null;
        shift = 0;
        result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        shift = result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        lat += latitude_change;
        lng += longitude_change;

        coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
};

polyline.encode = function(coordinates, precision) {
    if (!coordinates.length) return '';

    var factor = Math.pow(10, precision || 5),
        output = encode(coordinates[0][0], factor) + encode(coordinates[0][1], factor);

    for (var i = 1; i < coordinates.length; i++) {
        var a = coordinates[i], b = coordinates[i - 1];
        output += encode(a[0] - b[0], factor);
        output += encode(a[1] - b[1], factor);
    }

    return output;
};

if (typeof module !== undefined) module.exports = polyline;

},{}],3:[function(require,module,exports){
(function (global){
(function() {
  'use strict';

  var L = (typeof window !== "undefined" ? window.L : typeof global !== "undefined" ? global.L : null);
  var corslite = require('corslite');
  var polyline = require('polyline');
  
  L.Routing = L.Routing || {};

  L.Routing.Valhalla = L.Class.extend({
    options: {
      serviceUrl: (typeof serviceUrl != "undefined" || serviceUrl != null) ? serviceUrl : server.prod,
      timeout: 30 * 1000,
      transitmode: 'auto'
    },

    initialize: function(accessToken, transitmode, options) {
      L.Util.setOptions(this, options);
      this._accessToken = accessToken;
      this._transitmode = transitmode;
      this._hints = {
        locations: {}
      };
    },
    
    route: function(waypoints, callback, context, options) {
      var timedOut = false,
        wps = [],
        url,
        timer,
        wp,
        i;

      options = options || {};
      url = this.buildRouteUrl(waypoints, options);

      timer = setTimeout(function() {
                timedOut = true;
                callback.call(context || callback, {
                  status: -1,
                  message: 'request timed out.'
                });
              }, this.options.timeout);

      // Create a copy of the waypoints, since they
      // might otherwise be asynchronously modified while
      // the request is being processed.
      for (i = 0; i < waypoints.length; i++) {
        wp = waypoints[i];
        wps.push({
          latLng: wp.latLng,
          name: wp.name,
          options: wp.options
        });
      }

      corslite(url, L.bind(function(err, resp) {
        var data;
        var rrshape;
        clearTimeout(timer);
        if (!timedOut) {
          if (!err) {
            data = JSON.parse(resp.responseText);
            this._rrshape = data.trip.legs[0].shape;
            this._routeDone(data, wps, callback, context);
            if (document.getElementById('graph').style.display==="block") {
              $("#elevation_btn").trigger("click");
            }
          } else {
            callback.call(context || callback, {
              status: -1,
              message: 'HTTP request failed: ' + err.response
            });
            alert("Travel Mode: "+ this._transitmode + ", status code: " + err.status + ", " + err.response);
          }
        }
      }, this), true);

      return this;
    },

    _routeDone: function(response, inputWaypoints, callback, context) {
        var coordinates,
            alts,
            actualWaypoints,
            i;
        context = context || callback;
        if (response.trip.status !== 0) {
          callback.call(context, {
            status: response.status,
            message: response.status_message
          });
          return;
        }

       //if valhalla changes to array of objects
        var insts = [];
        var coordinates = [];
        var shapeIndex =  0;
        for(var i = 0; i<response.trip.legs.length;  i++){
          var coord = polyline.decode(response.trip.legs[i].shape, 6);

          for(var k = 0; k < coord.length; k++){
            coordinates.push(coord[k]);
          }

          for(var j =0; j < response.trip.legs[i].maneuvers.length; j++){
            var res = response.trip.legs[i].maneuvers[j];
            res.distance = response.trip.legs[i].maneuvers[j]["length"];
            res.index = shapeIndex + response.trip.legs[i].maneuvers[j]["begin_shape_index"];
            res.maneuvernum = j+1;
            insts.push(res);
          }

          shapeIndex += response.trip.legs[i].maneuvers[response.trip.legs[i].maneuvers.length-1]["begin_shape_index"];
        }
        actualWaypoints = this._toWaypoints(inputWaypoints, response.trip.locations);


        alts = [{
          ////gotta change
          name: this._trimLocationKey(inputWaypoints[0].latLng) + " </div><div class='dest'> " + this._trimLocationKey(inputWaypoints[1].latLng) ,
          unit: response.trip.units,
          transitmode: this._transitmode,
          rrshape: this._rrshape,
          graphdata: this.graphdata,
          graphoptions: this.graphoptions,
          coordinates: coordinates,
          instructions: insts,//response.route_instructions ? this._convertInstructions(response.route_instructions) : [],
          summary: response.trip.summary ? this._convertSummary(response.trip.summary) : [],
          inputWaypoints: inputWaypoints,
          waypoints: actualWaypoints,
          waypointIndices: this._clampIndices([0,response.trip.legs[0].maneuvers.length], coordinates)
        }];

        // only versions <4.5.0 will support this flag
          if (response.hint_data) {
            this._saveHintData(response.hint_data, inputWaypoints);
          }
        callback.call(context, null, alts);
      },

      _saveHintData: function(hintData, waypoints) {
        var loc;
        this._hints = {
          checksum: hintData.checksum,
          locations: {}
        };
        for (var i = hintData.locations.length - 1; i >= 0; i--) {
          loc = waypoints[i].latLng;
          this._hints.locations[this._locationKey(loc)] = hintData.locations[i];
        }
      },

      _toWaypoints: function(inputWaypoints, vias) {
        var wps = [],
            i;
        for (i = 0; i < vias.length; i++) {
          wps.push(L.Routing.waypoint(L.latLng([vias[i]["lat"],vias[i]["lon"]]),
                                      "name",
                                      {}));
        }

        return wps;
      },
      ///mapzen example
      buildRouteUrl: function(waypoints, options) {
        var locs = [],
            locationKey,
            hint;
        var transitM = options.transitmode || this._transitmode;
        var streetName = options.street;
        this._transitmode = transitM;
        var costing_options = options.costing_options;
        var date_time = (typeof this.options.date_time != 'undefined') ? this.options.date_time :  options.date_time;
        var directions_options = this.options.directions_options;

        for (var i = 0; i < waypoints.length; i++) {
          var loc;
          locationKey = this._locationKey(waypoints[i].latLng).split(',');
          if(i === 0 || i === waypoints.length-1){
            loc = {
              lat: parseFloat(locationKey[0]),
              lon: parseFloat(locationKey[1]),
              type: "break",
              name: waypoints[i].name,
              street: waypoints[i].street,
              city: waypoints[i].city,
              state: waypoints[i].state
            }
          }else{
            loc = {
              lat: parseFloat(locationKey[0]),
              lon: parseFloat(locationKey[1]),
              type: "through",
              name: waypoints[i].name,
              street: waypoints[i].street,
              city: waypoints[i].city,
              state: waypoints[i].state
            }
          }
          locs.push(loc);
        }
          var params = JSON.stringify({
            locations: locs,
            street: streetName,
            costing: transitM,
            costing_options: costing_options,
            //directions_options: directions_options,
            date_time: date_time
          });
        
         //reset service url & access token if environment has changed
         (typeof serviceUrl != 'undefined' || serviceUrl != null) ? this.options.serviceUrl=serviceUrl : this.options.serviceUrl=server.prod;
         (typeof envToken != "undefined" || envToken != null) ? this._accessToken=envToken : this._accessToken=accessToken.prod;

         console.log(this.options.serviceUrl + 'route?json=' +
                params + '&api_key=' + this._accessToken);
         
       /*  document.getElementById('routeResponse').innerHTML =
           "<a href='" + this.options.serviceUrl + 'route?json=' + params + '&api_key=' + this._accessToken + "' target='_blank'>JSON Route Response Link</a>";*/
         
        return this.options.serviceUrl + 'route?json=' +
                params + '&api_key=' + this._accessToken;
      },

      _locationKey: function(location) {
        return location.lat + ',' + location.lng;
      },

      _trimLocationKey: function(location){
        var lat = location.lat;
        var lng = location.lng;

        var nameLat = Math.floor(lat * 1000)/1000;
        var nameLng = Math.floor(lng * 1000)/1000;

        return nameLat + ' , ' + nameLng;

      },

      _convertSummary: function(route) {
        return {
          totalDistance: route.length,
          totalTime: route.time
        };
      },

      _convertInstructions: function(osrmInstructions) {
        var result = [],
            i,
            instr,
            type,
            driveDir;

        for (i = 0; i < osrmInstructions.length; i++) {
          instr = osrmInstructions[i];
          type = this._drivingDirectionType(instr[0]);
          driveDir = instr[0].split('-');
          if (type) {
            result.push({
              type: type,
              distance: instr[2],
              time: instr[4],
              road: instr[1],
              direction: instr[6],
              exit: driveDir.length > 1 ? driveDir[1] : undefined,
              index: instr[3]
            });
          }
        }

        return result;
      },

      _changeURL: function(transitM,startLat,startLng,destLat,destLng){
        window.location.hash = transitM + '/' + startLat + '/' + startLng + '/' + destLat + '/' + destLng;
      },


    _drivingDirectionType: function(d) {
      switch (parseInt(d, 10)) {
      case 1:
        return 'Straight';
      case 2:
        return 'SlightRight';
      case 3:
        return 'Right';
      case 4:
        return 'SharpRight';
      case 5:
        return 'TurnAround';
      case 6:
        return 'SharpLeft';
      case 7:
        return 'Left';
      case 8:
        return 'SlightLeft';
      case 9:
        return 'WaypointReached';
      case 10:
        // TODO: "Head on"
        // https://github.com/DennisOSRM/Project-OSRM/blob/master/DataStructures/TurnInstructions.h#L48
        return 'Straight';
      case 11:
      case 12:
        return 'Roundabout';
      case 15:
        return 'DestinationReached';
      default:
        return null;
      }
    },

    _clampIndices: function(indices, coords) {
      var maxCoordIndex = coords.length - 1,
        i;
      for (i = 0; i < indices.length; i++) {
        indices[i] = Math.min(maxCoordIndex, Math.max(indices[i], 0));
      }
    }
  });

  L.Routing.valhalla = function(accessToken, transitmode, options) {
    return new L.Routing.Valhalla(accessToken, transitmode, options);
  };

  module.exports = L.Routing.Valhalla;
})();

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"corslite":1,"polyline":2}]},{},[3]);