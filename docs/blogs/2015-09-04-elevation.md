## Moving On Up! ... and over and down and up again!?

How often have you ended up on a spontaneous hiking/biking adventure on a path/trail that you’ve never been to before? You only live once right? You may never have the chance to take this hike again. Did it go a little something like this maybe?

<figure>
<img src="images/hike.jpg" alt="Spontaneous Hike" width="500" height="225">
<figcaption>Fig 1. Moments from your spontaneous hike. (a) This will be a story for the ages! (b) Holy $h!t will I survive to tell it!?</figcaption>
</figure>

It would have been nice to be able to see what the journey ahead might look like. Maybe even an elevation chart to look at before deciding to plunge into your adventure? We have some tools to help you with that on your next outing, start clicking!

#### What's that Journey Going to Look Like?

Just zoom in to a desired area and point and click on the map to generate an elevation chart.

<div class='multimedia-wrapper'><iframe src='http://valhalla.github.io/demos/elevation/index.html?show_sample#loc=12,47.2204,9.3355' height='600px'></iframe></div>

#### There's an API for that

To help ease your pain, we’ve released an Elevation service! The service currently responds with distance (along the shape optionally), height and the shape used to query the elevation data source. There's also an option to interpolate points at a regular interval along the input shape. Given the distance and height, one can visualizing an elevation profile along a particular path (as shown in the widget above). All you need to get started is some shape, either in form of a series of lat,lons or an encoded polyline (from a [Valhalla route]() perhaps). Checkout the [Elevation service documentation](https://github.com/valhalla/valhalla-docs.git) for sample requests etc. or drop us a line at [routing@mapzen.com] if you have any questions or suggestions!
