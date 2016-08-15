(function () {
    'use strict';

    var coordToLatLng = function (coord) {
        var lng = coord[0], lat = coord[1];
        return L.latLng(lat, lng);
    };

    var readTraceCoords = function (geo) {
        if (geo && geo.coordinates) {
            return geo.coordinates;
        } else if (geo && geo.geometry && geo.geometry.coordinates) {
            return geo.geometry.coordiantes;
        } else {
            return null;
        }
    };

    var defaultTraceBuilder = function (geoTrace, options) {
        var coords = readTraceCoords(geoTrace);
        if (!coords) {
            return null;
        }
        options = options || {draggable: true};
        var circles = L.GeoJSON.coordsToLatLngs(coords).map(function (latlng) {
            return L.marker(latlng, options);
        });
        return L.layerGroup(circles);
    };

    var readMatchCoords = function (geo) {
        try {
            return geo.properties.matched_coordinates;
        } catch (err) {
            return null;
        }
    };

    var defaultMatchPointBuilder = function (geo, options) {
        var matchCoords = readMatchCoords(geo);
        var circles = matchCoords.filter(function (coord) {
            return coord != null;
        }).map(function (coord) {
            return L.circleMarker(coordToLatLng(coord), options);
        });
        return L.layerGroup(circles);
    };

    var defaultMatchLineBuilder = function (geoTrace, geoResults, options) {
        var traceCoords = readTraceCoords(geoTrace);
        if (!traceCoords) {
            return null;
        }

        var matchCoords = readMatchCoords(geoResults);
        if (!matchCoords) {
            return null;
        }

        var lines = traceCoords.map(function (coord, idx) {
            return matchCoords[idx]? [coordToLatLng(coord), coordToLatLng(matchCoords[idx])] : null;
        }).filter(function (coord) { return coord !== null; });

        return L.multiPolyline(lines, options);
    };

    var defaultMatchRouteBuilder = function (geo, options) {
        return L.geoJson(geo, options);
    };

    L.MapMatching = L.Control.extend({
        options: {
            serviceUrl: 'http://mm.mapillary.io/mm/',
            serviceUrlParams: {},
            traceBuilder: defaultTraceBuilder,
            matchLineBuilder: defaultMatchLineBuilder,
            matchPointBuilder: defaultMatchPointBuilder,
            matchRouteBuilder: defaultMatchRouteBuilder
        },

        initialize: function (trace, options) {
            this.trace = trace;
            L.Util.setOptions(this, options);
        },

        onAdd: function (map) {
            if (this.options.externalTraceLayer) {
                this.traceLayer = this.options.externalTraceLayer;
            } else {
                this.traceLayer = this.options.traceBuilder.call(this, this.trace);
                if (this.traceLayer) {
                    this.traceLayer.addTo(map);
                }
            }
            this.match(map);
            return L.DomUtil.create('div', 'my-custom-control');
        },

        match: function (map) {
            this.onRemove(map);

            var control = this, geoTrace = this.trace;

            var urlParams = $.param(this.options.serviceUrlParams),
                url = this.options.serviceUrl + (urlParams? ('?' + urlParams) : ''),
                requestBody = JSON.stringify(geoTrace);

            return $.post(url, requestBody, function (resp) {
                if (control._map !== map) {
                    return;
                }

                var geoResults = resp.data;

                control.matchPointLayer = control.options.matchPointBuilder.call(control, geoResults);
                if (control.matchPointLayer) {
                    control.matchPointLayer.addTo(map);
                }

                control.matchLineLayer = control.options.matchLineBuilder.call(control, geoTrace, geoResults);
                if (control.matchLineLayer) {
                    control.matchLineLayer.addTo(map);
                }

                control.matchRouteLayer = control.options.matchRouteBuilder.call(control, geoResults);
                if (control.matchRouteLayer) {
                    control.matchRouteLayer.addTo(map);
                }
            }, 'json');
        },

        onRemove: function (map) {
            if (this.traceLayer)
                map.removeLayer(this.traceLayer);
            if (this.matchPointLayer)
                map.removeLayer(this.matchPointLayer);
            if (this.matchLineLayer)
                map.removeLayer(this.matchLineLayer);
            if (this.matchRouteLayer)
                map.removeLayer(this.matchRouteLayer);
        }
    });

    L.mapMatching = function(trace, options) {
        return new L.MapMatching(trace, options);
    };
})();
