## Moving On Up! ... and over and down and up again!?

How often have you ended up on a spontaneous hiking/biking adventure on a path/trail that you’ve never been to before? At first you were thinking to yourself...

[]()
Sweet, this is going to be a story for the ages!

But then you quickly realized...

[]()
Holy $h!t will I even survive to tell it!?

It would have been nice to be able to see what the journey ahead might look like. Maybe even an elevation chart to look at before deciding to plunge into your adventure? We have some tools to help you with that on your next outing, start clicking!

#### What's that Journey Going to Look Like?

Just zoom in to a desired area and point and click on the map to generate an elevation chart.

<div>
<link rel="stylesheet" href="http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css">
<link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet-0.7.3/leaflet.css" />
<link rel="stylesheet" href="../../routing/css/valhalla.css" />
<script src="../../routing/conf/env.conf"></script>
<script type="text/javascript" src="https://code.jquery.com/jquery-1.11.3.min.js"></script>
<script src="http://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular.min.js"></script>
<script type = "text/javascript" src="../../routing/js/elevation/flot/jquery.flot.min.js"></script>
<script type = "text/javascript" src="../../routing/js/elevation/flot/jquery.flot.symbol.min.js"></script>
<script type="text/javascript" src="../../routing/js/elevation/flot/jquery.flot.js"></script>
<script type="text/javascript" src="../../routing/js/elevation/flot/jquery.colorhelpers.js"></script>
<script type="text/javascript" src="../../routing/js/elevation/flot/jquery.flot.canvas.js"></script>
<script type="text/javascript" src="../../routing/js/elevation/flot/jquery.flot.stack.js"></script>
<script src="http://cdn.leafletjs.com/leaflet-0.7.3/leaflet.js"></script>
<script type="text/javascript" src="../../routing/js/leaflet-hash.js"></script>
<script src="js/elevation-blog-demo.js"></script>
<script src="js/L.Elevation.Blog.js"></script>

<div class="container-fluid" data-ng-controller="RouteController">
<div id="graph" style= "display:none; height:225 	px; width: 50%; float:center;"></div>
<button id="clearbtn" class = "transparent_btn" type="button">clear</button>
<div id="map"></div>
</div>

<script type="text/javascript">
window.addEventListener("hashchange",function(){parent.postMessage(window.location.hash, "*")});
</script>
</div>

#### There's an API for that

To help ease your pain, we’ve released an Elevation service! The service currently responds with distance (along the shape optionally), height and the shape used to query the elevation data source. There's also an option to interpolate points at a regular interval along the input shape. Given the distance and height, one can visualizing an elevation profile along a particular path (as shown in the widget above). All you need to get started is some shape, either in form of a series of lat,lons or an encoded polyline (from a [Valhalla route]() perhaps). Checkout the [Elevation service documentation](https://github.com/valhalla/valhalla-docs.git) for sample requests etc. or drop us a line at [routing@mapzen.com] if you have any questions or suggestions!





