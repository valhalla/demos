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
      // has [been supported for
      // longer](http://stackoverflow.com/a/9181508/229001).
      if ('onload' in x) {
        x.onload = loaded;
      } else {
        x.onreadystatechange = function readystate() {
          if (x.readyState === 4) {
            loaded();
          }
        };
      }

      // Call the callback with the XMLHttpRequest object as an error and
      // prevent
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

        L.Locate = L.Locate || {};

        L.Locate = L.Class.extend({
          options : {
            serviceUrl : (typeof serviceUrl != "undefined" || serviceUrl != null) ? serviceUrl : locateServer.prod,
            timeout : 10 * 1000
          },

          initialize : function(locToken, options) {
            L.Util.setOptions(this, options);
            this._accessToken = locToken;
          },

          locate : function(ll, result_callback, callback, context) {
            // a timeout?
            var timedOut = false, options = options || {};
            var timer = setTimeout(function() {
              timedOut = true;
              callback.call(context || callback, {
                status : -1,
                message : 'request timed out.'
              });
            }, this.options.timeout);

            // go get the url and do something with the response, when it comes
            // back
            corslite(this.url(ll), L.bind(function(err, resp) {
              clearTimeout(timer);
              if (!timedOut) {
                // it worked
                if (!err) {
                  // parse the json response
                  var locate_result = JSON.parse(resp.responseText);
                  // drop the bubble
                  if (Array.isArray(locate_result) && locate_result.length > 0)
                    result_callback(locate_result[0]);
                  // not a decent result
                  else {
                    callback.call(context || callback, {
                      status : -1,
                      message : 'Unexpected result: ' + resp.responseText
                    });
                  }
                }// didnt work
                else {
                  callback.call(context || callback, {
                    status : -1,
                    message : 'HTTP request failed: ' + err.response
                  });
                }
              }
            }, this), true);

            return this;
          },

          url : function(ll) {
            var params = JSON.stringify({
              locations : [ ll ],
              verbose : true
            });

            // reset service url & access token if environment has changed
            (typeof serviceUrl != 'undefined' || serviceUrl != null) ? this.options.serviceUrl = serviceUrl : this.options.serviceUrl = locateServer.prod;
            (typeof locToken != "undefined" || locToken != null) ? this._accessToken = locToken : this._accessToken = locateToken.prod;
           // this.options.serviceUrl = server.prod;
           // this._accessToken = accessToken.prod;

            console.log(this.options.serviceUrl + 'locate?json=' + params + '&api_key=' + this._accessToken);

            return this.options.serviceUrl + 'locate?json=' + params + '&api_key=' + this._accessToken;
          }
        });

        L.locate = function(locToken, ll, options) {
          return new L.Locate(locToken, ll, options);
        };

        module.exports = L.Locate;
      })();

    }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
  }, {
    "corslite" : 1,
    "polyline" : 2
  } ]
}, {}, [ 3 ]);
