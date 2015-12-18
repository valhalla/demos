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

    function sendRequest(rrshape, callback, url) {
      var sent = false;

      if (typeof window.XMLHttpRequest === 'undefined') {
        return callback(Error('Browser not supported'));
      }

      if (typeof url === 'undefined') {
        var m = url.match(/^\s*https?:\/\/[^\/]*/);
        url = m && (m[0] !== location.protocol + '//' + location.domain + (location.port ? ':' + location.port : ''));
      }

      function isSuccessful(status) {
        return status >= 200 && status < 300 || status === 304;
      }

      function loaded() {
        if (
        // ajax POST request
        resp.status === undefined ||
        // modern browsers
        isSuccessful(resp.status)) {
          callback.call(resp, null, resp);
        } else
          callback.call(resp, resp, null);
      }

      // reset service url & access token if environment has changed
      (typeof this.elevServiceUrl != 'undefined' || this.elevServiceUrl != null) ? this.elevServiceUrl = this.elevServiceUrl : this.elevServiceUrl = this.elevationServer.prod;
      (typeof this.elevToken != "undefined" || this.elevToken != null) ? this._accessToken = this.elevToken : this._accessToken = this.elevAccessToken.prod;

      var params = JSON.stringify({
        encoded_polyline : rrshape,
        range : true
      });

      var resp = $.ajax({
        crossDomain : true,
        type : "POST",
        url : this.elevServiceUrl + 'height?api_key=' + this.elevToken,
        data : params,
        success : "success",
        dataType : 'json'
      });

      resp.done(function() {
        if (resp.readyState === 4) {
          if (resp.status >= 200 && resp.status < 400) {
            loaded();
            sent = true;
          } else {
            errback(new Error('Response returned with non-OK status'));
          }
        }
      });
      console.log("Elevation POST Request :: " + this.elevServiceUrl + 'height?api_key=' + this.elevToken + " ,POST DATA :: " + params);
      return resp;
    }
    ;

    if (typeof module !== 'undefined')
      module.exports = sendRequest;
  }, {} ],
  2 : [ function(require, module, exports) {
  }, {} ],
  3 : [ function(require, module, exports) {
    (function(global) {
      (function() {
        'use strict';

        var L = (typeof window !== "undefined" ? window.L : typeof global !== "undefined" ? global.L : null);
        var sendRequest = require('sendRequest');
        var polyline = require('polyline');

        L.Elevation = L.Elevation || {};

        L.Elevation = L.Class.extend({
          options : {
            elevServiceUrl : (typeof elevServiceUrl != "undefined" || elevServiceUrl != null) ? elevServiceUrl : elevationServer.prod,
            timeout : 30 * 1000
          },

          initialize : function(accessToken, rrshape, options) {
            L.Util.setOptions(this, options);
            this._accessToken = accessToken;
            this._rrshape = rrshape;
            this._graphdata = [];
            this._graphoptions = {
              axislabels : {
                show : true
              },
              threshold : {
                below : 0,
                color : "#c00000"
              },
              legend : {
                show : false
              },
              grid : {
                borderWidth : 1,
                minBorderMargin : 20,
                labelMargin : 10,
                backgroundColor : {
                  colors : [ "#fff", "#e4f4f4" ]
                },
                margin : {
                  top : 8,
                  bottom : 25,
                  left : 20
                }
              },
              xaxis : {
                min : 0,
                // axisLabel : 'Range',
                labelWidth : 30,
                axisLabelUseCanvas : true,
                axisLabelFontSizePixels : 14,
                axisLabelFontFamily : 'Verdana, Arial, Helvetica, Tahoma, sans-serif',
                axisLabelPadding : 10
              },
              yaxis : {
                // axisLabel : 'Height',
                labelWidth : 30,
                axisLabelUseCanvas : true,
                axisLabelFontSizePixels : 14,
                axisLabelFontFamily : 'Verdana, Arial, Helvetica, Tahoma, sans-serif',
                axisLabelPadding : 10
              },
              series : {
                stack : true,
                lines : {
                  show : true,
                  fill : true
                },
                points : {
                  radius : 0,
                  show : true,
                  fill : true,
                  fillColor : '#83ce16'
                },
              },
              legend : {
                labelBoxBorderColor : "none",
                position : "right"
              },
              lines : {
                fill : true,
                lineWidth : 3,
              }
            };
            // initilizing placeholder graph so that user knows there is graph
            $.plot($('#graph'), this._graphdata, this._graphoptions);
            var xaxisLabel = $("<div class='axisLabel xaxisLabel'></div>").text("Range (m)").appendTo($('#graph'));
            var yaxisLabel = $("<div class='axisLabel yaxisLabel'></div>").text("Height (m)").appendTo($('#graph'));
            yaxisLabel.css("margin-top", yaxisLabel.width() / 2 - 20);
          },
          resetChart : function() {
            var plot = $.plot($('#graph'), this._graphdata, this._graphoptions);
            plot.destroy();
            $('#graph').empty();
          },

          profile : function(rrshape, callback, context, options) {
            var timedOut = false, options = options || {};

            var timer = setTimeout(function() {
              timedOut = true;
              callback.call(context || callback, {
                status : -1,
                message : 'request timed out.'
              });
            }, this.options.timeout);

            sendRequest(rrshape, L.bind(function(err, resp) {
              var elevresult;
              clearTimeout(timer);
              if (!timedOut) {
                if (!err) {
                  elevresult = JSON.parse(resp.responseText);
                  this._graphdata = [ {
                  //  "label" : "Elevation",
                    "data" : elevresult.range_height,
                    "points" : {
                      "symbol" : "circle",
                      "fillColor" : "#2E2EFE"
                    },
                    "color" : '#2E2EFE'
                  } ];
                  $.plot($('#graph'), this._graphdata, this._graphoptions);
                  var xaxisLabel = $("<div class='axisLabel xaxisLabel'></div>").text("Range (m)").appendTo($('#graph'));
                  var yaxisLabel = $("<div class='axisLabel yaxisLabel'></div>").text("Height (m)").appendTo($('#graph'));
                  yaxisLabel.css("margin-top", yaxisLabel.width() / 2 - 20);
                }
              }
            }, this), true);

            return this;
          },

          getDataPoints : function(elevresult) {
            var dataPoints = [];
            for (var xy = 0; xy < elevresult.range_height.length; xy++) {
              dataPoints.push({
                x : elevresult.range_height[xy][0] != null ? elevresult.range_height[xy][0] : 0,
                y : elevresult.range_height[xy][1] != null ? elevresult.range_height[xy][1] : 0
              });
            }
            return dataPoints;
          },

          showTooltip : function(x, y, contents, z) {
            $('<div id="tooltip">' + contents + '</div>').css({
              position : 'absolute',
              display : 'none',
              'font-weight' : 'bold',
              border : '1px solid rgb(255, 221, 221)',
              padding : '2px',
              'background-color' : z,
              opacity : '0.8'
            }).appendTo("body").show();
          },

          bindEvents : function(plot) {
            $('#graph').on('plothover', function(event, pos, item) {
              if (item) {
                if ((previousPoint != item.dataIndex) || (previousLabel != item.series.label)) {
                  previousPoint = item.dataIndex;
                  previousLabel = item.series.label;

                  $("#flot-tooltip").remove();

                  var x = getDataPoints(item.dataPoints[0]), y = item.dataPoints[1];
                  z = item.series.color;

                  showTooltip(item.pageX, item.pageY, "<b>" + item.series.label + "</b><br /> " + x + " = " + y + "mm", z);
                }
              } else {
                $("#flot-tooltip").remove();
                previousPoint = null;
              }
            });
          },

          _locationKey : function(location) {
            return location[0] + ',' + location[1];
          }
        });

        L.elevation = function(accessToken, shape, options) {
          return new L.Elevation(accessToken, shape, options);
        };

        module.exports = L.Elevation;
      })();

    }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
  }, {
    "sendRequest" : 1,
    "polyline" : 2
  } ]
}, {}, [ 3 ]);
