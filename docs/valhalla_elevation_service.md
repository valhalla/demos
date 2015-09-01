
## Elevation Service API Reference

The elevation service is a free, open-source web API (and c++ library) that lets you access DEM (digital elevation model) data. This data has many applications in the domain of routing such as computing steepness of edges in the route graph or generating an elevation profile along a computed route. If you find a unique use for it, let us know at [routing@mapzen.com](mailto:routing@mapzen.com) know! This page documents the inputs and outputs to the service.

The elevation service is in active development. You can follow the [Mapzen blog](https://mapzen.com/blog) to get updates. To report software issues or suggest enhancements, open an issue in [Skadi GitHub repository](https://github.com/valhalla/skadi/issues). You can also send a message to [routing@mapzen.com](mailto:routing@mapzen.com).

#### API keys and Service Limits

To use the Elevation service, you must first obtain a free developer API key from Mapzen. Sign in at https://mapzen.com/developers to create and manage your API keys.

This service is a free, shared service. As such, there are limitations on the number of locations to prevent individual users from degrading the overall system performance.

Limits may be increased in the future, but you can contact routing@mapzen.com if you encounter rate limit status messages and need higher limits in the meantime.

### Inputs for the Elevation Service

We currently have a single action, `/height?`, that can be requested from the Elevation Service. As the name implies, this can be to get the height at a specific set of locations. If the parameter `range` is also provided and set to `true` both the cumulative distance as well as the height will be returned for each point. This can be used to generate a graph along a computed route since the returned 2d array is essentially just an x (range) and y (height) for each shape point.  Steepness/gradient can also be easily computed from a profile request. Requests takes the form of `elevation.mapzen.com/height?json={}&api_key=`, where the JSON inputs inside the ``{}`` include location/shape information and the optional range parameter.

Here is an example request of an profile request using shape:

    elevation.dev.mapzen.com/profile?json={"range":true,"shape":[{"lat":40.712431,"lon":-76.504916},{"lat":40.712275,"lon":-76.605259},{"lat":40.712122,"lon":-76.805694},{"lat":40.722431,"lon":-76.884916},{"lat":40.812275,"lon":-76.905259},{"lat":40.912122,"lon":-76.965694}]}&api_key=

This request provides shape points near Pottsville, PA. The resulting profile response displays the input shape, as well as the height and range for each shape point.

Another option when requesting a profile would be to use an encoded polyline.

    elevation.dev.mapzen.com/profile?json={"range":true,"encoded_polyline":"s{cplAfiz{pCa]xBxBx`AhC|gApBrz@{[hBsZhB_c@rFodDbRaG\\ypAfDec@l@mrBnHg|@?}TzAia@dFw^xKqWhNe^hWegBfvAcGpG{dAdy@_`CpoBqGfC_SnI{KrFgx@?ofA_Tus@c[qfAgw@s_Agc@}^}JcF{@_Dz@eFfEsArEs@pHm@pg@wDpkEx\\vjT}Djj@eUppAeKzj@eZpuE_IxaIcF~|@cBngJiMjj@_I`HwXlJuO^kKj@gJkAeaBy`AgNoHwDkAeELwD|@uDfC_i@bq@mOjUaCvDqBrEcAbGWbG|@jVd@rPkAbGsAfDqBvCaIrFsP~RoNjWajBlnD{OtZoNfXyBtE{B~HyAtEsFhL_DvDsGrF_I`HwDpGoH|T_IzLaMzKuOrFqfAbPwCl@_h@fN}OnI"}&api_key=

Note that you must append your own [API key](https://mapzen.com/developers) to the URL, following `&api_key=` at the end.

#### Input Parameters

You must either specify the input locations using the `shape` parameter or the `encoded_polyline` parameter. The `range` parameter is optional and assumed to be `false` if omitted.

The `shape` parameter is specified as an ordered list of two or more lat,lng locations within a JSON array. Locations are visited in the order specified.

A location must include a latitude and longitude in decimal degrees. The coordinates can come from many input sources, such as a GPS location, a point or a click on a map, a geocoding service, and so on. External search services, such as [Pelias](https://github.com/pelias) or [Nominatum](http://wiki.openstreetmap.org/wiki/Nominatim), can be used to find places and geocode addresses, whose coordinates can be used as input to the Elevation service.

| Shape parameters | Description |
| :--------- | :----------- |
| `lat` | Latitude of the location in degrees. |
| `lon` | Longitude of the location in degrees. |

The `encoded_polyline` parameter is simply a string of polyline encoded shape.

| Encoded polyline parameters | Description |
| :--------- | :----------- |
| `encoded_polyline` | A set of encoded lat,lng pairs of a line or shape.|

The `range` parameter is simply a boolean value which controls whether or not the returned array is 1 or 2 dimensional as described below.

| Range parameters | Description |
| :--------- | :----------- |
| `range` | `true` or `false`. Defaulted to `false`.|

### Output

The profile results are returned with the form of shape that was supplied in the request along with a 2D array representing the x and y of each input point in the elevation profile.

| Item | Description |
| :---- | :----------- |
| `shape` | The specified shape coordinates are returned from the input request. |
| `encoded_polyline` | The specified encoded polyline coordinates are returned from the input request. |
| `range_height` | The 2D array of range (x) and height (y) per lat,lng coordinate. |
| `x coordinate` | x is generally range or distance along the path. It is the cumulative distance from the previous lat,lng coordinate in the shape to the current lat,lng coordinate.  x for the first coordinate in the shape will always be 0. |
| `y coordinate` | y is the height or elevation of the associated lat,lng pair. The height will be returned as `null` if no height data exists for a given location. |
| `height` | An array of height for the associated lat,lng coordinates. |


In the future, look for additional elevation services information to enhance navigation applications.
