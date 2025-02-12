const app = angular.module('matrix', [])

const defaultMode = 'auto'
const serviceUrl = 'https://valhalla1.openstreetmap.de/'

// hooks up to the div whose data-ng-controller attribute matches this name
app.controller('MatrixController', function($scope, $rootScope, $sce, $http) {
  const road = L.tileLayer('http://b.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributers'
  })

  const map = L.map('map', {
    zoom: 13,
    zoomControl: true,
    center: {
      lat: 40.7486,
      lng: -73.9690
    },
    layers: [road]
  })

  const getOriginIcon = function () {
    return new L.Icon({
      iconUrl: '../matrix/resource/matrix_pin_start.png',
      iconSize: [30, 36],
      shadowUrl: null
    })
  }

  const getDestinationIcon = function () {
    return new L.Icon({
      iconUrl: '../matrix/resource/matrix_pin_end.png',
      iconSize: [30, 36],
      shadowUrl: null
    })
  }

  let counterText = 0
  let markers = []

  $rootScope.$on('map.setView', function (ev, geo, zoom) {
    map.setView(geo, zoom || 8)
    map.options.maxZoom = 14
  })

  $rootScope.$on('map.dropMarker', function (ev, geo, locCount, icon) {
    const marker = new L.marker(geo, { icon: icon })
    marker.bindLabel((locCount).toString(), {
      position: [geo.lat, geo.lon],
      noHide: true,
      offset: (locCount < 10) ? [-9, -12] : [-13, -12]
    })
    map.addLayer(marker)
    markers.push(marker)
  })

  $scope.setMode = function (mode) {
    $scope.mode = mode
  }

  $scope.mode = defaultMode
  $scope.startPoints = []
  $scope.endPoints = []
  $scope.matrixResult = []
  $scope.editingFocus = 'start_points'
  $scope.appView = 'control'

  $scope.backToControlView = function (e) {
    $scope.appView = 'control'
  }

  $scope.clearAll = function (e) {
    $scope.startPoints = []
    $scope.endPoints = []
    $scope.matrixResult = []
    $scope.appView = 'control'
    $scope.editingFocus = 'start_points'
    for (let i = 0; i < markers.length; i++) {
      map.removeLayer(markers[i])
    }
    markers = []
    counterText = 0
  }

  $scope.goToEndPoints = function (e) {
    $scope.editingFocus = 'end_points'
    counterText = 0
  }

  map.on('click', function (e) {
    const geo = {
      lat: e.latlng.lat.toFixed(6),
      lon: e.latlng.lng.toFixed(6)
    }
    if ($scope.editingFocus === 'end_points') {
      $rootScope.$emit('map.dropMarker', [geo.lat, geo.lon], counterText, getDestinationIcon())
      $scope.endPoints.push(geo)
    } else {
      $rootScope.$emit('map.dropMarker', [geo.lat, geo.lon], counterText, getOriginIcon())
      $scope.startPoints.push(geo)
    }
    counterText++
    $scope.$apply()
  })

  const matrixBtn = document.getElementById('matrix_btn')
  matrixBtn.addEventListener('click', matrix)

  function matrix () {
    const params = JSON.stringify({
      sources: $scope.startPoints,
      targets: $scope.endPoints,
      costing: $scope.mode,
      units: 'km'
    })

    const url = serviceUrl + 'sources_to_targets?json=' + params
    document.getElementById('matrixResponseLink').href = url

    fetch(url).then(data => data.json()).then(data => {
      $scope.matrixResult = data.sources_to_targets.flat()
      $scope.appView = 'matrixTable'
      $scope.$apply()
    })
  }
})
