const serviceUrl = 'https://valhalla1.openstreetmap.de/trace_attributes'
const currentLocation = { lng: -122.424058, lat: 37.805689 }
let mode = 'auto'
let map
let draw
let geojsonFeatureCollection = { type: 'FeatureCollection', features: [] }

function setMode (m) {
  mode = arguments[0]
  document.querySelectorAll('.vehicleBox button').forEach(button => {
    button.classList.toggle('active', button.getAttribute('name') === m)
  })
  geojsonMatch()
}

document.addEventListener('DOMContentLoaded', () => {
  map = new maplibregl.Map({
    style: 'https://tiles.versatiles.org/assets/styles/graybeard/style.json',
    center: currentLocation,
    zoom: 15.7,
    container: 'map'
  })

  draw = new MapboxDraw({
    displayControlsDefault: false,
    defaultMode: 'draw_line_string'
  })
  map.addControl(draw, 'top-left')
  map.on('draw.create', function (e) {
    document.getElementById('geojson').value = JSON.stringify(e.features[0].geometry)
    geojsonMatch()
  })

  map.once('styledata', () => {
    map.addSource('geojsonSource', {
      type: 'geojson',
      data: geojsonFeatureCollection
    })

    map.addLayer({
      id: 'geojsonLayer',
      type: 'line',
      source: 'geojsonSource',
      layout: {},
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 4
      }
    })
    geojsonMatch()
  })
})

function geojsonMatch () {
  if (document.getElementById('geojson').value === '') { return }

  mapMatcher.geojson = JSON.parse(document.getElementById('geojson').value)
  mapMatcher.mode = mode
  mapMatcher.search_radius = document.getElementById('radius').value
  mapMatcher.serviceUrl = serviceUrl
  mapMatcher.matchedCoordinates = []
  mapMatcher.match()
  draw.deleteAll()
  draw.changeMode('draw_line_string')
}

const mapMatcher = {
  match: function () {
    this.removeLayers()

    geojsonFeatureCollection.features.push({
      type: 'Feature',
      geometry: this.geojson,
      properties: { color: '#ff3400' }
    })
    map.getSource('geojsonSource').setData(geojsonFeatureCollection)

    const bounds = turf.bbox(this.geojson)
    map.fitBounds(bounds, { padding: 20 })

    const _this = this

    fetch(serviceUrl, {
      method: 'POST',
      body: JSON.stringify(this.createJsonPostParams())
    }).then(response => response.json()).then(resp => {
      _this.matchingResponse = resp
      _this.setMatchResult()
      _this.updateGeojsonSource()
    })
  },

  removeLayers: function () {
    geojsonFeatureCollection = { type: 'FeatureCollection', features: [] }
    map.getSource('geojsonSource').setData(geojsonFeatureCollection)
  },

  updateGeojsonSource: function () {
    const _this = this
    const lines = this.geojson.coordinates.map(function (coord, idx) {
      if (_this.matchedCoordinates[idx]) {
        return [coord, _this.matchedCoordinates[idx]]
      }
      return null
    }).filter(function (coord) { return coord !== null })

    const matchingPointsLineFeature = turf.lineStrings(lines, { color: '#0000ff' })

    geojsonFeatureCollection.features = geojsonFeatureCollection.features.concat(matchingPointsLineFeature.features)
    geojsonFeatureCollection.features = geojsonFeatureCollection.features.concat(this.matchResult.features)

    map.getSource('geojsonSource').setData(geojsonFeatureCollection)
  },

  createJsonPostParams: function () {
    return {
      encoded_polyline: polyline.fromGeoJSON(this.geojson, 6),
      costing: this.mode,
      shape_match: 'map_snap',
      trace_options: {
        search_radius: parseFloat(this.search_radius),
        turn_penalty_factor: 300
      },
      filters: {
        attributes: [
          'edge.names',
          'edge.way_id',
          'edge.begin_shape_index',
          'edge.end_shape_index',
          'matched.point',
          'matched.edge_index',
          'matched.begin_route_discontinuity',
          'matched.end_route_discontinuity',
          'shape'
        ],
        action: 'include'
      }
    }
  },

  setMatchResult: function () {
    // decode the shape
    const shape = polyline.decode(this.matchingResponse.shape, 6)
    // turn the continuous runs of shape indicies into multilinestrings
    let multilines = []
    this.matchedCoordinates = []
    let start = 0
    for (const p of this.matchingResponse.matched_points) {
      // keep every matched point
      this.matchedCoordinates.push([p.lon, p.lat])
      if (p.begin_route_discontinuity) {
        // starts a discontinuity so make a linestring up to and including this point
        multilines.push(shape.slice(start, this.matchingResponse.edges[p.edge_index].end_shape_index + 1))
      } else if (p.end_route_discontinuity) {
        // ends a discontinuity so make a linestring start here
        start = this.matchingResponse.edges[p.edge_index].begin_shape_index
      }
    }
    // get the last bit
    if (start < shape.length) {
      multilines.push(shape.slice(start, shape.length))
    }
    // reverse the coordinates because polyline decodes to [lat, lon], but geojson is [lon, lat]
    multilines = multilines.map(function (line) {
      return line.map((coord) => coord.reverse())
    })
    // hand it back as geojson
    this.matchResult = turf.lineStrings(multilines, { color: '#00ff00' })
  }
}