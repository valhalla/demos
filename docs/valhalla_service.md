
## Valhalla routing service API reference

Valhalla is a free, open-source routing service that lets you integrate routing and navigation into a web or mobile application. This page documents the inputs and outputs to the service.

The Valhalla routing service is in active development. You can follow the [Mapzen blog](https://mapzen.com/blog) to get updates. To report software issues or suggest enhancements, open an issue in GitHub (use the [Thor repository](https://github.com/valhalla/thor) for comments about route paths or [Odin repository](https://github.com/valhalla/odin) for narration). You can also send a message to routing@mapzen.com.

#### API keys and service limits

To use the Valhalla routing service, you must first obtain a free developer API key from Mapzen. Sign in at https://mapzen.com/developers to create and manage your API keys.

Valhalla is a free, shared routing service. As such, there are limitations on requests, maximum distances, and numbers of locations to prevent individual users from degrading the overall system performance.

The following distance limitations are currently in place:

* Pedestrian routes have a limit of 250 kilometers.
* Bicycle routes have a limit of 500 kilometers.
* Automobile routes have a limit of 5,000 kilometers.
* No more than two locations can be provided.

Limits may be increased in the future, but you can contact routing@mapzen.com if you encounter rate limit status messages and need higher limits in the meantime.

### Inputs of a Valhalla route

The route request takes the form of `valhalla.mapzen.com/route?json={}&api_key=`, where the JSON inputs inside the ``{}`` include location information, name and options for the costing model, and output options. Here is an example request:

`valhalla.mapzen.com/route?json={"locations":[{"lat":42.358528,"lon":-83.271400,"street":"Appleton"},{"lat":42.996613,"lon":-78.749855,"street":"Ranch Trail"}],"costing":"auto","costing_options":{"auto":{"country_crossing_penalty":2000.0}},"directions_options":{"units":"miles"}}&api_key= `

This request provides automobile routing between the Detroit, Michigan area and Buffalo, New York, with an optional street name parameter to improve navigation at the start and end points. It attempts to avoid routing north through Canada by adding a penalty for crossing international borders. The resulting route is displayed in miles.

Note that you must append your own [Valhalla API key](https://mapzen.com/developers) to the URL, following `&api_key=` at the end.

#### Locations

You specify locations as an ordered list of two or more locations within a JSON array. Locations are visited in the order specified, with a maximum of two locations currently supported.

A location must include a latitude and longitude in decimal degrees. The coordinates can come from many input sources, such as a GPS location, a point or a click on a map, a geocoding service, and so on. Note that Valhalla is a routing service only, so cannot search for names or addresses or perform geocoding or reverse geocoding. External search services, such as [Pelias](https://github.com/pelias) or [Nominatum](http://wiki.openstreetmap.org/wiki/Nominatim), can be used to find places and geocode addresses, which must be converted to coordinates for input to Valhalla.  

To build a route, you need to specify two `break` locations. In addition, you can include `through` locations to influence the route path. 

| Location parameters | Description |
| :--------- | :----------- |
| `lat` | Latitude of the location in degrees. |
| `lon` | Longitude of the location in degrees. |
| `type` | Type of location, either `break` or `through`. A `break` is a stop, so the first and last locations must be of type `break`. A `through` location is one that the route path travels through, and is useful to force a route to go through location. The path is not allowed to reverse direction at the through locations. If no type is provided, the type is assumed to be a break. |
| `heading` | (optional) Preferred direction of travel for the start from the location. This can be useful for mobile routing where a vehicle is traveling in a specific direction along a road, and the route should start in that direction. The `heading` is indicated in degrees from north in a clockwise direction, where north is 0°, east is 90°, south is 180°, and west is 270°. |
| `street` | (optional) Street name. The street name may be used to assist finding the correct routing location at the specified latitude, longitude. This is not currently implemented. |
| `way_id` | (optional) OpenStreetMap identification number for a polyline [way] (http://wiki.openstreetmap.org/wiki/Way). The way ID may be used to assist finding the correct routing location at the specified latitude, longitude. This is not currently implemented. |

Optionally, you can include the following location information without impacting the routing. This information is carried through the request and returned as a convenience.
* `name` = Location or business name. The name may be used in the route narration directions, such as "You have arrived at _&lt;business name&gt;_.")
* `city` = City name.
* `state` = State name.
* `postal_code` = Postal code.
* `country` = Country name.
* `phone` = Telephone number.
* `url` = URL for the place or location.

Future Valhalla development work includes adding location options and information related to time at each location. This will allow routes to specify a start time or an arrive by time at each location. There is also ongoing work to improve support for `through` locations.

#### Costing models

Valhalla uses dynamic, run-time costing to generate the route path. The route request must include the name of the costing model and can include optional parameters available for the chosen costing model.

| Costing model | Description |
| :----------------- | :----------- |
| `auto` | Standard costing for driving routes by car, motorcycle, truck, and so on that obeys automobile driving rules, such as access and turn restrictions. `Auto` provides a short time path (though not guaranteed to be shortest time) and uses intersection costing to minimize turns and maneuvers or road name changes. Routes also tend to favor highways and higher classification roads, such as motorways and trunks. |
| `auto_shorter` | Alternate costing for driving that provides a short path (though not guaranteed to be shortest distance) that obeys driving rules for access and turn restrictions. |
| `bicycle` | A default bicycle costing method has been implemented, but its options are currently being evaluated. |
| `bus` | Standard costing for bus routes. Bus costing inherits the auto costing behaviors, but checks for bus access on the roads. |
| `pedestrian` | Standard walking route that excludes roads without pedestrian access. In general, pedestrian routes are shortest distance with the following exceptions: walkways and footpaths are slightly favored, while and steps or stairs and alleys are slightly avoided. |

#### Costing options

Costing methods can have several options that can be adjusted to develop the the route path, as well as for estimating time along the path. Specify costing model options in your request using the format of `costing_options.type`, such as ` costing_options.auto`.

* Cost options are fixed costs in seconds that are added to both the path cost and the estimated time. Examples of costs are `gate_costs` and `toll_booth_costs`, where a fixed amount of time is added. Costs are not generally used to influence the route path; instead, use penalties to do this.
* Penalty options are fixed costs in seconds that are only added to the path cost. Penalties can influence the route path determination but do not add to the estimated time along the path. For example, add a `toll_booth_penalty` to create route paths that tend to avoid toll booths.
* Factor options are used to multiply the cost along an edge or road section in a way that influences the path to favor or avoid a particular attribute. Factor options do not impact estimated time along the path, though. Factors must be in the range 0.25 to 100000.0, where factors of 1.0 have no influence on cost. Use a factor less than 1.0 to attempt to favor paths containing preferred attributes, and a value greater than 1.0 to avoid paths with undesirable attributes. Avoidance factors are more effective than favor factors at influencing a path. A factor's impact also depends on the length of road containing the specified attribute, as longer roads have more impact on the costing than very short roads. For this reason, penalty options tend to be better at influencing paths.

##### Automobile and bus costing options

These options are available for `auto`, `auto_shorter`, and `bus` costing methods.

| Automobile options | Description |
| :-------------------------- | :----------- |
| `maneuver_penalty` | A penalty applied when transitioning between roads that do not have consistent naming–in other words, no road names in common. This penalty can be used to create simpler routes that tend to have fewer maneuvers or narrative guidance instructions. The default maneuver penalty is five seconds. |
| `gate_cost` | A cost applied when a [gate](http://wiki.openstreetmap.org/wiki/Tag:barrier%3Dgate) is encountered. This cost is added to the estimated time / elapsed time. The default gate cost is 30 seconds. |
| `toll_booth_cost` | A cost applied when a [toll booth](http://wiki.openstreetmap.org/wiki/Tag:barrier%3Dtoll_booth) is encountered. This cost is added to the estimated and elapsed times. The default cost is 15 seconds. |
| `toll_booth_penalty` | A penalty applied to the cost when a [toll booth](http://wiki.openstreetmap.org/wiki/Tag:barrier%3Dtoll_booth) is encountered. This penalty can be used to create paths that avoid toll roads. The default toll booth penalty is 0. |
| `country_crossing_cost` | A cost applied when encountering an international border. This cost is added to the estimated and elapsed times. The default cost is 600 seconds. |
| `country_crossing_penalty` | A penalty applied for a country crossing. This penalty can be used to create paths that avoid spanning country boundaries. The default penalty is 0. |

##### Bicycle costing options
The default bicycle costing is tuned toward road bicycles with a slight preference for using [cycleways](http://wiki.openstreetmap.org/wiki/Key:cycleway) or roads with bicycle lanes. Bicycle routes use regular roads where needed or where no direct bicycle lane options exist, but avoid roads without bicycle access. The costing model recognizes several factors unique to bicycle travel and offers several options for tuning bicycle routes. Factors influencing bicycle routes include:
*	The types of roads suitable for bicycling depend on the type of bicycle. Road bicycles (skinny tires) generally are suited to paved roads or perhaps very short sections of compacted gravel. They are not suited for riding on coarse gravel or most paths and tracks through wooded areas or farmland. Mountain bikes on the other hand are able to traverse a wider set of surfaces.
*	Average travel speed can be highly variable and can depend on bicycle type, fitness and experience of the cyclist, road surface, and hilliness. The costing model assumes a default speed on smooth, flat roads for each supported bicycle type. This speed can be overriden by an input option. The "base" speed is modulated by surface type (in conjunction with the bicycle type). Coming Soon: We will soon include logic to modify speed based on the hilliness of a road section.
*	Bicyclists vary in their tolerance for riding on roads. Most novice bicyclists and even other bicyclists want to avoid all but the quietest neighborhood roads and prefer cycleways and dedicated cycling paths. Other cyclists may be experienced riding on roads and prefer to take roadways since they often provide the fastest way to get between two places. The bicycle costing model accounts for this with a `use_roads` factor to indicate a cyclists tolerance for riding on roads.
*	Bicyclists vary in their fitness level and experience level and many wish to avoid hill roads and especially roads with very steep uphill or even downhill sections. Even if the fastest path is over a mountain, many cyclists will prefer a flatter path that avoids the climb and descent up and over the mountain.

The following options are available for bicycle costing methods.

| Bicycle options | Description |
| :-------------------------- | :----------- |
| `bicycle_type` | This is the type of bicycle. Accepted values are `Road` - a road bicycle with narrow tires, `Hybrid` or `City` - a bicycle made mostly for city riding or casual riding on roads and paths with good surfaces, `Cross` - a cyclo-cross bicycle which is similar to a road bicycle but with wider tires suitable to rougher surfaces, and `Mountain` - mountain bike suitable for most surfaces but generally heavier and slower on paved surfaces. |
| `cycling_speed` | Cycling speed is the average travel speed along smooth, flat roads. This is meant to be the speed a rider can comfortably maintain over the desired distance of the route. It can be modified (in the costing method) by surface type in conjuction with bicycle type and (Coming Soon) by hilliness of the road section. Default speeds (when no speed is explicitly provided) depend on the bicycle type and are as follows: Road = 25 KPH (15.5 MPH), Cross = 20 KPH (13 MPH), Hybrid/City = 18 KPH (11.5 MPH), and Mountain = 16 KPH (10 MPH). |
| `use_roads` | A cyclist's propensity to use roads. Range of values from 0 (avoid roads - try to stay on cycleways and paths) to 1 (totally comfortable riding on roads). Based on the useroads factor, roads with certain classifications and above certain speeds are penalized (try to avoid) when finding the best path. |

Coming Soon: we will soon be offering options to avoid hills and tune the bicycle route costing based on elevation change and steepness.

##### Pedestrian costing options

These options are available for pedestrian costing methods.

| Pedestrian options | Description |
| :-------------------------- | :----------- |
| `walking_speed` | Walking speed in kilometers per hour. Defaults to 5.1 km/hr (3.1 miles/hour). |
| `walkway_factor` | A factor that modifies the cost when encountering roads or paths that do not allow vehicles and are set aside for pedestrian use. Pedestrian routes generally attempt to favor using these [walkways and sidewalks](http://wiki.openstreetmap.org/wiki/Sidewalks). The default walkway_factor is 0.9, indicating a slight preference. |
| `alley_factor` | A factor that modifies (multiplies) the cost when [alleys](http://wiki.openstreetmap.org/wiki/Tag:service%3Dalley) are encountered. Pedestrian routes generally want to avoid alleys or narrow service roads between buildings. The default alley_factor is 2.0. |
| `driveway_factor` | A factor that modifies (mulitplies) the cost when encountering a [driveway](http://wiki.openstreetmap.org/wiki/Tag:service%3Ddriveway), which is often a private, service road. Pedestrian routes generally want to avoid driveways (private). The default driveway factor is 5.0. |
| `step_penalty` | A penalty in seconds added to each transition onto a path with [steps or stairs](http://wiki.openstreetmap.org/wiki/Tag:highway%3Dsteps). Higher values apply larger cost penalties to avoid paths that contain flights of steps. |

#### Other request options

| Options | Description |
| :------------------ | :----------- |
| `units` | Distance units for output. Allowable unit types are miles (or mi) and kilometers (or km). If no unit type is specified, the units default to kilometers. |
| `language` | The language of the narration instructions. If no language is specified, United States-based English (en_US) is used. Currently supported languages: en_US. |
| `out_format` | Output format. If no `out_format` is specified, json is returned. Future work includes pbf (protocol buffer) support. |

### Outputs of a Valhalla route

The route results are returned as a `trip`. This is a JSON object that contains details about the trip, including locations, a summary with basic information about the entire trip, and a list of `legs`.

Basic trip information includes:

| Trip Item | Description |
| :---- | :----------- |
| `status` | Status code. |
| `status_message ` | Status message. |
| `units` | The specified units of length are returned, either kilometers or miles. |
| `locations` | Location information is returned in the same form as it is entered with additional fields to indicate the side of the street. |

The summary JSON object includes:

| Summary Item | Description |
| :---- | :----------- |
| `time` | Estimated elapsed time to complete the trip. |
| `length` | Distance traveled for the entire trip. Units are either miles or kilometers based on the input units specified. |

#### Trip legs and maneuvers

A `trip` contains one or more `legs`. For *n* number of `break` locations, there are *n-1* legs. `Through` locations do not create separate legs.

Each leg of the trip includes a summary, which is comprised of the same information as a trip summary but applied to the single leg of the trip. It also includes a `shape`, which is an [encoded polyline](https://developers.google.com/maps/documentation/utilities/polylinealgorithm) of the route path, and a list of `maneuvers` as a JSON array.

Each maneuver includes:

| Maneuver Item | Description |
| :--------- | :---------- |
| `type` | Type of maneuver. See below for a list. |
| `instruction` | Written maneuver instruction. Describes the maneuver, such as "Turn right onto Main Street". |
| `verbal_transition_alert_instruction` | Text suitable for use as a verbal alert in a navigation application. Further details are TBD. |
| `verbal_pre_transition_instruction` | Text suitable for use as a verbal message immediately prior to the maneuver transition. Further details are TBD. |
| `verbal_post_transition_instruction` | Text suitable for use as a verbal message immediately after the maneuver transition. Further details are TBD. |
| `street_names` | List of street names. |
| `begin_street_names` | When present, these are the street names at the beginning of the maneuver (if they are different than the names that are consistent along the entire maneuver). |
| `time` | Estimated time along the maneuver in seconds. |
| `length` | Maneuver length in the units specified. |
| `begin_shape_index` | Index into the list of shape points for the start of the maneuver. |
| `end_shape_index` | Index into the list of shape points for the end of the maneuver. |
| `toll` | True if the maneuver has any toll, or portions of the maneuver are subject to a toll. |
| `rough` | True if the maneuver is unpaved or rough pavement, or has any portions that have rough pavement. |
| `gate` | True if a gate is encountered on this maneuver. |
| `ferry` | True if a ferry is encountered on this maneuver. |

For the maneuver `type`, the following are available:

```
kNone = 0;
kStart = 1;
kStartRight = 2;
kStartLeft = 3;
kDestination = 4;
kDestinationRight = 5;
kDestinationLeft = 6;
kBecomes = 7;
kContinue = 8;
kSlightRight = 9;
kRight = 10;
kSharpRight = 11;
kUturnRight = 12;
kUturnLeft = 13;
kSharpLeft = 14;
kLeft = 15;
kSlightLeft = 16;
kRampStraight = 17;
kRampRight = 18;
kRampLeft = 19;
kExitRight = 20;
kExitLeft = 21;
kStayStraight = 22;
kStayRight = 23;
kStayLeft = 24;
kMerge = 25;
kRoundaboutEnter = 26;
kRoundaboutExit = 27;
kFerryEnter = 28;
kFerryExit = 29;
```
Continuing with the earlier routing example from the Detroit, Michigan area, a maneuver such as this one may be returned with that request: `{"begin_shape_index":0,"length":0.109,"end_shape_index":1,"instruction":"Go south on Appleton.","street_names":["Appleton"],"type":1,"time":0}`

In the future, look for additional maneuver information to enhance navigation applications, including verbal instructions and landmark usage.

#### Return Codes and Conditions

The following is a table of error conditions that may occur for a particular request. In general we follow the http specification. That is to say that `5xx` returns are generally ephemeral server problems that should be resolved shortly or are the result of a bug. `4xx` returns are used to mark requests that cannot be carried out generally due to bad input in the request or problems with the underlying data. A `2xx` return is expected when we have a successful route result or `trip`, as described above.

| Code | Body | Description |
| :--------- | :---------- | :---------- |
| 200 | *your_trip_json* | A happy bit of json describing your `trip` result |
| 400 | Failed to parse json request | You need a valid json request |
| 400 | Failed to parse location | You need a valid location object in your json request |
| 400 | Failed to parse correlated location | There was a problem with the location once correlated to the route network |
| 400 | Insufficiently specified required parameter 'locations' | You forgot the locations parameter |
| 400 | No edge/node costing provided | You forgot the costing parameter |
| 400 | Insufficient number of locations provided | You didn't provide enough locations |
| 400 | Exceeded max route locations of X | You are asking for too many locations |
| 400 | Locations are in unconnected regions. Go check/edit the map at osm.org | You are routing between regions of no connectivity |
| 400 | No costing method found for 'X' | You are asking for a non-existant costing mode |
| 400 | Path distance exceeds the max distance limit | You want to travel further than this mode allows |
| 400 | No suitable edges near location | There were no edges applicable to your mode of travel near the input location |
| 400 | No data found for location | There was no route data tile at the input location |
| 400 | No path could be found for input | There was no path found between the input locations |
| 404 | Try any of: '/route' '/locate' | You asked for an invalid path |
| 405 | Try a POST or GET request instead | We only support GET and POST requests |
| 500 | Failed to parse intermediate request format | Had a problem reading an intermediate request format |
| 500 | Failed to parse TripPath | Had a problem reading the computed path from Protobuf |
| 500 | Could not build directions for TripPath | Had a problem using the trip path to create TripDirections |
| 500 | Failed to parse TripDirections | Had a problem using the trip directions to serialze a json response |
| 501 | Not implemented | Not Implemented |
