## Moving On Up! ... and over and down and up again!?

How often have you ended up on a spontaneous hiking/biking adventure on a path/trail that you’ve never been to before? At first you were thinking to yourself...

<div id="main">
<div id="fig1" style="float:left">
<figure>
<img src="images/sure.jpg" alt="Yay!" width="250" height="270">
<figcaption>This will be a story for the ages!</figcaption>
</figure>
</div>
<div id="segway" style="float:center">
But then you quickly realized...
</div>
<div id="fig2" style="float:right">
<figure>
<img src="images/unsure.jpg" alt="Bleh.." width="250" height="270">
<figcaption>Holy $h!t will I survive to tell it!?</figcaption>
</figure>
</div>
</div>

It would have been nice to be able to see what the journey ahead might look like. Maybe even an elevation chart to look at before deciding to plunge into your adventure? We have some tools to help you with that on your next outing, start clicking!

#### What's that Journey Going to Look Like?

Just zoom in to a desired area and point and click on the map to generate an elevation chart.

<iframe src="http://valhalla.github.io/demos/elevation/" style="background-color:#fff; height:600px; width:75%; float:center;"></iframe>

#### There's an API for that

To help ease your pain, we’ve released an Elevation service! The service currently responds with distance (along the shape optionally), height and the shape used to query the elevation data source. There's also an option to interpolate points at a regular interval along the input shape. Given the distance and height, one can visualizing an elevation profile along a particular path (as shown in the widget above). All you need to get started is some shape, either in form of a series of lat,lons or an encoded polyline (from a [Valhalla route]() perhaps). Checkout the [Elevation service documentation](https://github.com/valhalla/valhalla-docs.git) for sample requests etc. or drop us a line at [routing@mapzen.com] if you have any questions or suggestions!
