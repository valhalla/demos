## Mapzen Elevation - Moving On Up!.....and over and down and up again?

How often have you wanted to go on an outdoor hike or on a mountain biking adventure on a trail/route that you’ve never been on before?  While on this outing, you realized that it’s a lot hillier that you had anticipated.  Wouldn’t it be nice to have a way to be able to calculate or even chart your elevation before your adventure? To avoid this from happening on your next outing, keep reading!

####<insert funny elevation image here>

To help ease your pain, we’ve released an Elevation service!  The service currently offers 2 types of responses containing either distance and height or just height (with respect to sea level). The former is very useful for visualizing changes in elevation along a particular path. All you need to get started is some shape, either in form of a series of lat,lon pairs or a polyline encoded string.

An sample profile request using an encoded polyline:

http://elevation.mapzen.com/height?json={“range”:true,"encoded_polyline":"c|}flAfzf~pCG?o]uc@}n@gx@w]iv@mE{Jso@c{@wDqQnToIeZsPeUuPgS_SaSc[mEoI{t@w`BcoA{gCwg@qnBiHgXaa@_~@{o@cxAkGyLomDo`HmEoH{FqHeZgb@iLiMwfBwjBmtDmaHclCmvF_I}T_DsQgJgm@sFun@M{_@z@os@{@aeA{QqeA{Usz@wb@m|AmTmt@s[_}@}YwX{QaRc_A_|@g`BuwAgS}UiXo]i`AgvAmUk`@iq@}hAoSum@gS}hAwb@cbLT{j@xB_SvDcRxByLnDwNdEgMnD_JbK}T`M}T`R_SbQoT~NiVrFkLbFgNnJwXdJwc@tEgb@xBwYLc[e@iv@e@a\\yG{iA{Aqp@{Fo^{PmhA}DsF_Iun@}E{_@k`@mzCcAkL"}&api_key=YOUR_KEY_HERE

(Note that you would need to substitute your own API key at the end to perform the query.)

The response in this case is a 2D array of cumulative distance, and height values for each point in the requested shape.
You can check it out using our leaflet Route Testing Tool or clone the valhalla demos repository for yourself.  The testing tool allows a user to enter a point-and-click route and then get an elevation chart using the route’s polyline encoded shape.

#### Check it out!
Just zoom in to a desired area and point and click on the map to generate an elevation chart.

<insert demo here> (/docs/blogs/demos/elevation-blog-index.html)

For more detail about the service please read over our [Elevation service documentation](https://github.com/valhalla/valhalla-docs.git) or drop us a line at [routing@mapzen.com] if you have an questions or suggestions!

