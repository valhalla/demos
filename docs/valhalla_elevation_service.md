
## Valhalla Elevation Service API Reference

Valhalla also consists of a free, open-source elevation service that lets you access digital elevation model data which is useful in computing steepness of edges in the route graph or generating an elevation profile along a computed route.  This page documents the inputs and outputs to the service.

The Valhalla elevation service is in active development. You can follow the [Mapzen blog](https://mapzen.com/blog) to get updates. To report software issues or suggest enhancements, open an issue in GitHub (use the [Thor repository](https://github.com/valhalla/skadi). You can also send a message to routing@mapzen.com.

#### API keys and Service Limits

To use the Valhalla elevation service, you must first obtain a free developer API key from Mapzen. Sign in at https://mapzen.com/developers to create and manage your API keys.

Valhalla consists of a free, shared elevation service. As such, there are limitations on requests and the number of locations to prevent individual users from degrading the overall system performance.

Limits may be set in the future, but you can contact routing@mapzen.com if you encounter rate limit status messages and need higher limits in the meantime.

### Inputs for the Elevation Service

The elevation request takes the form of `valhalla.dev.mapzen.com/elevation?json={}&api_key=`, where the JSON inputs inside the ``{}`` include location information (shape or an encoded polyline). Here is an example request of an elevation request using shape:

`valhalla.dev.mapzen.com/elevation?json={"shape":[{"lat":40.712431, "lon":-76.504916},{"lat":40.712275, "lon":-76.605259},{"lat":40.712122, "lon":-76.805694}]}&api_key= `

This request provides shape points near Pottsville, PA. The resulting elevation response displays the input shape, as well as the height and range for each shape point.  
**THE ABOVE EXAMPLE WILL CHANGE ONCE WE HAVE THE DEV INSTANCE RUNNING.  RIGHT NOW I CAN ONLY HIT A SMALL SUBSET OF DATA

A second example of requesting elevation would be to use an encoded polyline.  

'valhalla.dev.mapzen.com/elevation?json={"encoded_polyline":"s{cplAfiz{pCa]xBxBx`AhC|gApBrz@{[hBsZhB_c@rFodDbRaG\\ypAfDec@l@mrBnHg|@?}TzAia@dFw^xKqWhNe^hWegBfvAcGpG{dAdy@_`CpoBqGfC_SnI{KrFgx@?ofA_Tus@c[qfAgw@s_Agc@}^}JcF{@_Dz@eFfEsArEs@pHm@pg@wDpkEx\\vjT}Djj@eUppAeKzj@eZpuE_IxaIcF~|@cBngJiMjj@_I`HwXlJuO^kKj@gJkAeaBy`AgNoHwDkAeELwD|@uDfC_i@bq@mOjUaCvDqBrEcAbGWbG|@jVd@rPkAbGsAfDqBvCaIrFsP~RoNjWajBlnD{OtZoNfXyBtE{B~HyAtEsFhL_DvDsGrF_I`HwDpGoH|T_IzLaMzKuOrFqfAbPwCl@_h@fN}OnI"}&api_key= `

Note that you must append your own [Valhalla API key](https://mapzen.com/developers) to the URL, following `&api_key=` at the end.

#### Shape / Encoded Polyline

You specify the shape as an ordered list of two or more lat/lng locations within a JSON array. Locations are visited in the order specified.

A location must include a latitude and longitude in decimal degrees. The coordinates can come from many input sources, such as a GPS location, a point or a click on a map, a geocoding service, and so on. External search services, such as [Pelias](https://github.com/pelias) or [Nominatum](http://wiki.openstreetmap.org/wiki/Nominatim), can be used to find places and geocode addresses, which must be converted to coordinates for input to Valhalla.  

| Shape parameters | Description |
| :--------- | :----------- |
| `lat` | Latitude of the location in degrees. |
| `lon` | Longitude of the location in degrees. |

Optionally, you can use an encoded polyline as input.

| Encoded polyline parameters | Description |
| :--------- | :----------- |
| 'encoded_polyline' | A set of encoded lat/lng pairs of a line or shape.|

### Elevation Output

The elevation results are returned with the form of shape that was input into the request along with a 2D elevation array that contains height and range for each location along the shape. Any status messages will also returned.

| Item | Description |
| :---- | :----------- |
| `input_shape` | The specified shape coordinates are returned from the input request. |
| `input_encoded_polyline` | The specified encoded polyline coordinates are returned from the input request. |
| `elevation` | The 2D array of height and range per lat/lng coordinate. |
| `height` | The height of the associated lat/lng pair. |
| `range` | The calculated distance from the previous lat/lng coordinate in the shape to the current lat/lng coordinate.  The range for the first coordinate in the shape will always be 0.|

The range/distance between each lat/lng coordinate is computed using the DistanceApproximator::DistanceSquared method from midgard.

In the future, look for additional elevation services information to enhance navigation applications.
