let currentLocation = { lat: 53.544332, lng: 9.914540 }

// make a map using osm tiles
const map = new maplibregl.Map({
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center: currentLocation,
  zoom: 14.3,
  container: 'map'
})

let tooltips = []

function parseContour (s) {
  try {
    const range = n => [...Array(n).keys()]
    const time = parseInt(s.split(' '))
    let values = []
    if (s.includes('increments')) {
      // [time, 2 * time, 3 * time, ...]
      values = range(3).map(i => (i + 1) * time)
    } else {
      values = [time]
    }

    return values.map(t => Object.fromEntries([['time', t]]))
  } catch (e) {
    console.error(e)
  }
}

const marker = new maplibregl.Marker({ draggable: true })
  .setLngLat(currentLocation)
  .addTo(map)

marker.on('dragend', event => {
  onLocationChanged(event.target.getLatLng())
})

function onLocationChanged (coordinates) {
  currentLocation = coordinates
  document.getElementById('latlng').value = `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
  getContours()
}

function onMapClick (e) {
  const coordinates = e.lngLat
  marker.setLngLat(coordinates)
  onLocationChanged(coordinates)
}

function getContours () {
  // isochrone api query parameters
  const json = {
    locations: [{ lat: currentLocation.lat, lon: currentLocation.lng }],
    costing: document.getElementById('costing').value,
    denoise: document.getElementById('denoise').value,
    generalize: document.getElementById('generalize').value,
    contours: parseContour(document.getElementById('contours').value),
    polygons: document.getElementById('polygons_lines').value === 'polygons'
  }

  const url = document.getElementById('baseurl').value + '/isochrone?json=' + JSON.stringify(json)

  fetch(url).then(response => response.json()).then(isochrones => {
    // clear this if its not empty
    if (map.getSource('isochrones')) {
      map.removeLayer('isochrones-layer')
      map.removeSource('isochrones')
    }

    // clear the tooltips
    tooltips.forEach(tooltip => { tooltip.remove() })
    tooltips = []

    // create the geojson object
    map.addSource('isochrones', {
      type: 'geojson',
      data: isochrones
    })

    map.addLayer({
      id: 'isochrones-layer',
      type: 'fill',
      source: 'isochrones',
      paint: {
        'fill-opacity': ['*', ['get', 'opacity'], 2],
        'fill-color': ['get', 'color']
      }
    })

    // Calculate the bounding box of the isochrones
    const bounds = turf.bbox(isochrones)

    // Fit the map to the bounds of the isochrones
    map.fitBounds(bounds, { padding: 20 })

    // Add tooltips
    isochrones.features.forEach(function (feature) {
      let coordinates = feature.geometry.coordinates[0][0]
      if (coordinates.length > 2) {
        coordinates = coordinates[0]
      }
      const description = feature.properties.contour + ' min'

      const popup = new maplibregl.Popup({ closeOnClick: false })
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(map)

      tooltips.push(popup)
    })
  })
}

function onLatLngInputChanged () {
  try {
    const s = document.getElementById('latlng').value
    const values = s.split(',').map(i => parseFloat(i))
    coord = { lat: values[0], lng: values[1] }
    map.panTo(coord)
    onMapClick({ lngLat: coord })
  } catch (e) {
    console.error(e)
  }
}

map.on('click', onMapClick)
// hook up the callback for the text box changing
document.getElementById('latlng').addEventListener('change', onLatLngInputChanged);
['denoise', 'generalize', 'costing', 'polygons_lines', 'contours'].forEach(
  element => document.getElementById(element).addEventListener('change', getContours)
)

map.once('styledata', () => { onMapClick({ lngLat: currentLocation }) })
