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

    var encode = function (coordinates) {
        var output = [];
        //handy lambda to turn an integer into an encoded string
        var serialize = function(number) {
            //move the bits left 1 position and flip all the bits if it was a negative number
            number = number < 0 ? ~(number << 1) : (number << 1);
            //write 5 bit chunks of the number
            while (number >= 0x20) {
                var nextValue = (0x20 | (number & 0x1f)) + 63;
                output.push(String.fromCharCode(nextValue));
                number >>= 5;
            }
            //write the last chunk
            number += 63;
            output.push(String.fromCharCode(number));
        };

        //this is an offset encoding so we remember the last point we saw
        var last_lon = 0, last_lat = 0;
        //for each point
        coordinates.forEach(function(p) {
            //shift the decimal point 6 places to the right, floor and cast to int
            var lon = Math.floor(p[0] * 1e6) | 0;
            var lat = Math.floor(p[1] * 1e6) | 0;
            //encode each coordinate, lat first for some reason
            serialize(lat - last_lat);
            serialize(lon - last_lon);
            //remember the last one we encountered
            last_lon = lon;
            last_lat = lat;
        });
        return output.join('');
    };

    function decode(encoded) {
        //six degrees of precision in valhalla
        var inv = 1.0 / 1e6;
        var decoded = [];
        var previous = [0,0];
        var i = 0;
        //for each byte
        while(i < encoded.length) {
            //for each coord (lat, lon)
            var ll = [0,0]
            for(var j = 0; j < 2; j++) {
                var shift = 0;
                var byte = 0x20;
                //keep decoding bytes until you have this coord
                while(byte >= 0x20) {
                    byte = encoded.charCodeAt(i++) - 63;
                    ll[j] |= (byte & 0x1f) << shift;
                    shift += 5;
                }
                //add previous offset to get final value and remember for next one
                ll[j] = previous[j] + (ll[j] & 1 ? ~(ll[j] >> 1) : (ll[j] >> 1));
                previous[j] = ll[j];
            }
            //scale by precision and chop off long coords also flip the positions so
            //its the far more standard lon,lat instead of lat,lon
            decoded.push([ll[1] * inv,ll[0] * inv]);
        }
        //hand back the list of coordinates
        return decoded;
    };

    var geoJsonToTrace = function (geojson, options) {
        //convert to trace format
        var trace = {
            'costing': options.serviceUrlParams.mode,
            'search_radius': parseFloat(options.serviceUrlParams.search_radius),
            'shape_match': 'map_snap',
            'filters':{
                'attributes':['edge.way_id','edge.begin_shape_index','edge.end_shape_index','matched.point','matched.edge_index','matched.begin_route_discontinuity','matched.end_route_discontinuity','shape'],
                'action':'include'
            }
        };
        //dont bother with non numbers
        if(!isFinite(trace.search_radius))
            delete trace['search_radius'];
        //clean up url
        delete options.serviceUrlParams['mode'];
        delete options.serviceUrlParams['search_radius'];
        //encode the coordinates to send
        trace['encoded_polyline'] = encode(geojson['coordinates']);
        return trace;
    };

    var attributesToGeoJson = function (attributes) {
        //decode the shape
        var shape = decode(attributes.shape);
        //turn the continuous runs of shape indicies into multilinestrings
        var multilines = [];
        var matched = [];
        var start = 0;
        for(var p of attributes.matched_points) {
            //keep every matched point
            matched.push([p.lon, p.lat]);
            //starts a discontinuity so make a linestring up to and including this point
            if(p.begin_route_discontinuity)
                multilines.push(shape.slice(start, attributes.edges[p.edge_index].end_shape_index + 1));
            //ends a discontinuity so make a linestring start here
            else if(p.end_route_discontinuity)
                start = attributes.edges[p.edge_index].begin_shape_index;
        }
        //get the last bit
        if(start < shape.length)
          multilines.push(shape.slice(start, shape.length));
        //hand it back as geojson
        return {
            "type": "Feature",
            "geometry": {
                "type": "MultiLineString",
                "coordinates": multilines
            },
            "properties": {
                "matched_coordinates": matched
            }
        };
    };

    L.MapMatching = L.Control.extend({
        options: {
            serviceUrl: 'http://valhalla.mapzen.com/trace_attributes',
            serviceUrlParams: {},
            traceBuilder: defaultTraceBuilder,
            matchLineBuilder: defaultMatchLineBuilder,
            matchPointBuilder: defaultMatchPointBuilder,
            matchRouteBuilder: defaultMatchRouteBuilder
        },

        initialize: function (trace, options) {
            this.trace = geoJsonToTrace(trace, options);
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

                var geoResults = attributesToGeoJson(resp);

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
