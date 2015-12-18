(function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var a = typeof require == "function" && require;
        if (!u && a)
          return a(o, !0);
        if (i)
          return i(o, !0);
        var f = new Error("Cannot find module '" + o + "'");
        throw f.code = "MODULE_NOT_FOUND", f
      }
      var l = n[o] = {
        exports : {}
      };
      t[o][0].call(l.exports, function(e) {
        var n = t[o][1][e];
        return s(n ? n : e)
      }, l, l.exports, e, t, n, r)
    }
    return n[o].exports
  }
  var i = typeof require == "function" && require;
  for (var o = 0; o < r.length; o++)
    s(r[o]);
  return s
})({
  1 : [ function(require, module, exports) {
    function corslite(url, callback, cors) {
      var sent = false;

      if (typeof window.XMLHttpRequest === 'undefined') {
        return callback(Error('Browser not supported'));
      }

      if (typeof cors === 'undefined') {
        var m = url.match(/^\s*https?:\/\/[^\/]*/);
        cors = m && (m[0] !== location.protocol + '//' + location.domain + (location.port ? ':' + location.port : ''));
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
        isSuccessful(x.status))
          callback.call(x, null, x);
        else
          callback.call(x, x, null);
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
        callback = function() {
        };
      };

      // IE9 must have onprogress be set to a unique function.
      x.onprogress = function() {
      };

      x.ontimeout = function(evt) {
        callback.call(this, evt, null);
        callback = function() {
        };
      };

      x.onabort = function(evt) {
        callback.call(this, evt, null);
        callback = function() {
        };
      };

      // GET is the only supported HTTP Verb by XDomainRequest and is the
      // only one supported here.
      x.open('GET', url, true);

      // Send the request. Sending data is not supported.
      x.send(null);
      sent = true;

      return x;
    }

    if (typeof module !== 'undefined')
      module.exports = corslite;
  }, {} ],
  2 : [ function(require, module, exports) {
  }, {} ],
  3 : [ function(require, module, exports) {
    (function(global) {
      (function() {
        'use strict';

        var L = (typeof window !== "undefined" ? window.L : typeof global !== "undefined" ? global.L : null);
        var corslite = require('corslite');
        var polyline = require('polyline');

        L.Matrix = L.Matrix || {};

        L.Matrix.Widget = L.Class.extend({
          options : {
            serviceUrl : (typeof serviceUrl != "undefined" || serviceUrl != null) ? serviceUrl : server.prod,
            timeout : 30 * 1000,
            mode: 'auto'
          },

          initialize : function(accessToken, mode, matrixtype, options) {
            L.Util.setOptions(this, options);
            this._accessToken = accessToken;
            this._mode = mode;
            this._matrixtype = matrixtype;
          },

          matrix: function(waypoints, callback, context, options) {
            var timedOut = false,
              wps = [],
              url,
              timer,
              wp,
              i;
            options = options || {};
            url = this.buildMatrixUrl(waypoints.waypoints, options);

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
            for (i = 0; i < waypoints.waypoints.length; i++) {
              wp = waypoints.waypoints[i];
              wps.push({
                latLng: wp,
                name: wp.name,
                options: wp.options
              });
            }

            corslite(url, L.bind(function(err, resp) {
              var matrixresult;
              clearTimeout(timer);
              if (!timedOut) {
                if (!err) {
                  matrixresult = JSON.parse(resp.responseText);
                  if (matrixresult.one_to_many)
                    this._make_OneToMany_Table(matrixresult, callback, context);
                  else if (matrixresult.many_to_one)
                    this._make_ManyToOne_Table(matrixresult, callback, context);
                  else this._make_ManyToMany_Table(matrixresult, callback, context);
                } else {
                  callback.call(context || callback, {
                    status: -1,
                    message: 'HTTP request failed: ' + err.response
                  });
                alert("Travel Mode: "+ this._mode + ", status code: " + err.status + ", " + err.response);
                }
              }
            }, this), true);

            return this;
          },
          
            ///mapzen example
            buildMatrixUrl: function(waypoints, options) {
              var locs = [];
              var mode = options.mode || this._mode;
              this._mode = mode;
              var costing_options = options.costing_options;

              for (var i = 0; i < waypoints.length; i++) {
                var loc;
                                    
                if(i === 0 || i === waypoints.length-1){
                  loc = {
                    lat: waypoints[i].lat,
                    lon: waypoints[i].lng
                  }
                }else{
                  loc = {
                      lat: waypoints[i].lat,
                      lon: waypoints[i].lng
                  }
                }
                locs.push(loc);
              }
              
              var params = JSON.stringify({
                 locations: locs,
                 costing: mode,
                 costing_options: costing_options,
                 units: "mi"
               });

               //reset service url & access token if environment has changed
               (typeof serviceUrl != 'undefined' || serviceUrl != null) ? this.options.serviceUrl=serviceUrl : this.options.serviceUrl=server.prod;
               (typeof envToken != "undefined" || envToken != null) ? this._accessToken=envToken : this._accessToken=accessToken.prod;

               console.log(this.options.serviceUrl + this._matrixtype + '?json=' +
                      params + '&api_key=' + this._accessToken);
               
               document.getElementById('matrixResponse').innerHTML =
               "<a href='" + this.options.serviceUrl + this._matrixtype + '?json=' + params + '&api_key=' + this._accessToken + "' target='_blank'>JSON Matrix Response Link</a>";

              return this.options.serviceUrl + this._matrixtype + '?json=' +
                      params + '&api_key=' + this._accessToken;
            },
            
           _make_OneToMany_Table: function (response, callback, context) {
             var array = [];
             var data = [];
             $.each(response.one_to_many[0], function(i){
               var from_index = response.one_to_many[0][i].from_index;
               var to_index = response.one_to_many[0][i].to_index;
               var time = response.one_to_many[0][i].time;
               var distance = response.one_to_many[0][i].distance;
               var row = {"from":from_index, "to":to_index, "time":time, "distance":distance };
               if(from_index != to_index) array.push(row);
             })
               $('#columns').columns({
                 data: array,
                 schema:[
                   { "header":"From","key":"from"},
                   { "header":"To","key":"to"},
                   { "header":"Time (secs)","key":"time"},
                   { "header":"Distance (mi)","key":"distance"}
                 ],
                 search: false
               });
           },
           
           _make_ManyToOne_Table: function (response, callback, context) {
             var array = [];
             $.each(response.many_to_one, function(i){
               var from_index = response.many_to_one[i][0].from_index;
               var to_index = response.many_to_one[i][0].to_index;
               var time = response.many_to_one[i][0].time;
               var distance = response.many_to_one[i][0].distance;
               var row = {"from":from_index, "to":to_index, "time":time, "distance":distance };
               if(from_index != to_index) array.push(row);
             })
               $('#columns').columns({
                 data: array,
                 schema:[
                   { "header":"From","key":"from"},
                   { "header":"To","key":"to"},
                   { "header":"Time (secs)","key":"time"},
                   { "header":"Distance (mi)","key":"distance"}
                 ],
                 search: false
               });
           },
                      
           _make_ManyToMany_Table: function (response, callback, context) {
             var array = [];
             var counter = 0;
             $.each(response.many_to_many, function(counter){
               $.each(response.many_to_many, function(i){
                 var from_index = response.many_to_many[counter][i].from_index;
                 var to_index = response.many_to_many[counter][i].to_index;
                 var time = response.many_to_many[counter][i].time;
                 var distance = response.many_to_many[counter][i].distance;
                 var row = {"from":from_index, "to":to_index, "time":time, "distance":distance };
                 if(from_index != to_index) array.push(row);
               })
               counter++;
             })
               $('#columns').columns({
                 data: array,
                 schema:[
                   { "header":"From","key":"from"},
                   { "header":"To","key":"to"},
                   { "header":"Time (secs)","key":"time"},
                   { "header":"Distance (mi)","key":"distance"}
                 ],
                 search: false
               });
           },

            _changeURL: function(mode,startLat,startLng,destLat,destLng){
              window.location.hash = mode + '/' + startLat + '/' + startLng + '/' + destLat + '/' + destLng;
            },

         
        });

        L.Matrix.widget = function(accessToken, mode, options) {
          return new L.Matrix.Widget(accessToken, mode, options);
        };

        module.exports = L.Matrix.Widget;
      })();

    }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
  }, {
    "corslite" : 1,
    "polyline" : 2
  } ]
}, {}, [ 3 ]);
