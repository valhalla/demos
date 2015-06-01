
## Valhalla Service Level Interface Description

Valhalla is a free, open-source routing service that lets you integrate routing and navigation into a web or mobile application. This page documents the inputs and outputs to the service.

The Valhalla routing service is in active development. You can follow the [Mapzen blog](https://mapzen.com/blog) to get updates.

To report software issues or suggest enhancements, you can open an issue in GitHub (use the [Thor repository](https://github.com/valhalla/thor) for comments about route paths or [Odin repository](https://github.com/valhalla/odin) for narration). You can also send a message to routing@mapzen.com.

### Get an API key
To use the Valhalla routing service, you must first obtain a free developer API key from Mapzen. Sign in at https://mapzen.com/developers to create and manage your API keys.

TODO - more get started section/links.

### Service limits

Valhalla is a free, shared routing service. As such, there are limitations on requests, maximum distances, and numbers of locations to prevent individual users from degrading the overall system performance.

The following distance limitations are currently in place:

* Pedestrian routes have a limit of 100 kilometers.
* Bicycle routes have a limit of 500 kilometers.
* Automobile routes have a limit of 5,000 kilometers.
* No more than two locations can be provided.

Limits may be increased in the future, but you can contact routing@mapzen.com if you encounter rate limit status messages and need higher limits in the meantime.

### Build a Valhalla route request

The route service request has the following inputs: location information, name and options for the costing model name, and output options. The form of each is JSON, as seen in this example:

  http://valhalla.api.dev.mapzen.com/route?json={"locations":[{"lat":42.358528,"lon":-83.271400,"street":"Appleton"},{"lat":42.996613,"lon":-78.749855,"street":"Ranch Trail"}],"costing": "auto","costing_options":{"auto":{"country_crossing_penalty":2000.0}},"directions_options":{"units":"miles"}}&api_key=

This request provides automobile routing between the Detroit, Michigan area and Buffalo, New York, with an optional street name parameter to improve navigation at the start and end points. It attempts to avoid routing north through Canada by adding a penalty for crossing international borders. The resulting route is displayed in miles. You append your own Valhalla API key to the end of the URL.

#### Locations

You specify locations as an ordered list of two or more locations within a JSON array. Locations are visited in the order specified, with a maximum of two locations currently supported.

A location must include a latitude and longitude in decimal degrees. The coordinates can come from many input sources, such as a GPS location, a point or a click on a map, a geocoding service, and so on. Note that Valhalla is a routing service only, so cannot search for names or addresses or perform geocoding or reverse geocoding. External search services, such as [Pelias](https://github.com/pelias) or [Nominatum](http://wiki.openstreetmap.org/wiki/Nominatim), can be used to find places and geocode addresses, which must be converted to coordinates for input to Valhalla.  

To build a route, you need to specify two `break` locations. In addition, you can include `through` locations to influence the route path.

| Location parameters | Description |
| --------- | ----------- |
| lat | Latitude of the location in degrees. |
| lon | Longitude of the location in degrees. |
| type | Type of location, either `break` or `through`. A `break` is a stop, so the first and last locations must be of type `break`. A `through` location is one that the route path travels through, and is useful to force a route to go through location. The path is not allowed to reverse direction at the through locations. If no type is provided, the type is assumed to be a break. |
| heading | (optional) Preferred direction of travel (`heading`) for the start from the location. This can be useful for mobile routing where a vehicle is traveling in a specific direction along a road, and the route should start in that direction. The heading is indicated in degrees from north in a clockwise direction, where north is 0°, east is 90°, south is 180°, and west is 270°. |
| street | (optional) Street name. The street name may be used to assist finding the correct routing location at the specified latitude,longitude. |

Optionally, you can include the following location information without impacting the routing. This information is carried through the request and returned as a convenience.
* name = Location or business name. The name may be used in the route narration directions, such as "You have arrived at _&lt;business name&gt;_.")
* city = City.
* state = State.
* postal_code = Postal code.
* country = Country.
* phone = Phone.
* url = URL for the place or location.

Future Valhalla development work includes adding location options and information related to time at each location. This will allow routes to specify a start time or an arrive by time at each location. There is also ongoing work to improve support for `through` locations.

#### Costing models

Valhalla uses dynamic, run-time costing to generate the route path. The route request must include the name of the costing model and can include optional parameters available for the chosen costing model.

| Costing model | Description |
| ----------------- | ----------- |
| auto | Standard costing for driving routes by car, motorcycle, truck, and so on that obeys automobile driving rules, such as access and turn restrictions. Auto provides a short time path, which is not guaranteed to be shortest time, and uses intersection costing to minimize turns and maneuvers or road name changes. Routes also tend to favor highways and higher classification roads, such as motorways and trunks. |
| auto_shorter | Alternate costing for driving that provides a short path, which is not guaranteed to be shortest distance, that obeys driving rules for access and turn restrictions. |
| bicycle | A default bicycle costing method has been implemented, but its options are currently being evaluated. |
| bus | Standard costing for bus routes. Bus costing inherits the auto costing behaviors, but checks for bus access on the roads. |
| pedestrian | Standard walking route that excludes roads without pedestrian access. In general, pedestrian routes are shortest distance with the following exceptions: walkways and footpaths are slightly favored, while and steps or stairs and alleys are slightly avoided. |

#### Costing options

Costing methods can have several options that can be adjusted to develop the the route path, as well as for estimating time along the path. Specify costing model options in your request using the format of `costing_options.type`, such as ` costing_options.auto`.

* Cost options are fixed costs in seconds that are added to both the path cost and the estimated time. Examples of costs are `gate_costs` and `toll_booth_costs`, where a fixed amount of time is added. Costs are not generally used to influence the route path; instead, use penalties to do this.
* Penalty options are fixed costs in seconds that are only added to the path cost. Penalties can influence the route path determination but do not add to the estimated time along the path. For example, add a `toll_booth_penalty` to create route paths that tend to avoid toll booths.
* Factor options are used to multiply the cost along an edge or road section in a way that influences the path to favor or avoid a particular attribute. Factor options do not impact estimated time along the path, though. Factors must be in the range 0.25 to 100000.0, where factors of 1.0 have no influence on cost. Use a factor less than 1.0 to attempt to favor paths containing preferred attributes, and a value greater than 1.0 to avoid paths with undesirable attributes. Avoidance factors are more effective than favor factors at influencing a path. A factor's impact also depends on the length of road containing the specified attribute, as longer roads have more impact on the costing than very short roads. For this reason, penalty options tend to be better at influencing paths.

##### Automobile and bus costing options

These options are available for `auto`, `auto_shorter`, and `bus` costing methods.

| Automobile options | Description |
| -------------------------- | ----------- |
| maneuver_penalty | A penalty applied when transitioning between roads that do not have consistent naming–in other words, no road names in common. This penalty can be used to create simpler routes that tend to have fewer maneuvers or narrative guidance instructions. The default maneuver penalty is five seconds. |
| gate_cost | A cost applied when a [gate](http://wiki.openstreetmap.org/wiki/Tag:barrier%3Dgate) is encountered. This cost is added to the estimated time / elapsed time. The default gate cost is 30 seconds. |
| toll_booth_cost | A cost applied when a [toll booth](http://wiki.openstreetmap.org/wiki/Tag:barrier%3Dtoll_booth) is encountered. This cost is added to the estimated and elapsed times. The default cost is 15 seconds. |
| toll_booth_penalty | A penalty applied to the cost when a [toll booth](http://wiki.openstreetmap.org/wiki/Tag:barrier%3Dtoll_booth) is encountered. This penalty can be used to create paths that avoid toll roads. The default toll booth penalty is 0. |
| country_crossing_cost | A cost applied when encountering an international border. This cost is added to the estimated and elapsed times. The default cost is 600 seconds. |
| country_crossing_penalty | A penalty applied for a country crossing. This penalty can be used to create paths that avoid spanning country boundaries. The default penalty is 0. |

##### Bicycle costing options
A default bicycle costing method has been implemented, but its options are currently being evaluated. The default bicycle costing is tuned toward road bicycles with a preference for using [cycleways](http://wiki.openstreetmap.org/wiki/Key:cycleway) or roads with bicycle lanes. Bicycle routes use regular roads where needed or where no direct bicycle lane options exist, but avoid roads without bicycle access. Rough road surfaces and mountain bike trails are currently disallowed for bicycle paths, but future methods may consider the bicycle type and enable their use use by cyclo-cross or mountain bicycles.

##### Pedestrian costing options

These options are available for pedestrian costing methods.

| Pedestrian options | Description |
| -------------------------- | ----------- |
| walking_speed | Walking speed in the units specified by the directions unit. Defaults to 5.1 km/hr (3.1 miles/hour). |
| walkway_factor | A factor that modifies the cost when encountering roads or paths that do not allow vehicles and are set aside for pedestrian use. Pedestrian routes generally attempt to favor using these [walkways and sidewalks](http://wiki.openstreetmap.org/wiki/Sidewalks). The default walkway_factor is 0.9, indicating a slight preference. |
| alley_factor | A factor that modifies (multiplies) the cost when [alleys](http://wiki.openstreetmap.org/wiki/Tag:service%3Dalley) are encountered. Pedestrian routes generally want to avoid alleys or narrow service roads between buildings. The default alley_factor is 2.0. |
| driveway_factor | A factor that modifies (mulitplies) the cost when encountering a [driveway](http://wiki.openstreetmap.org/wiki/Tag:service%3Ddriveway), which is often a private, service road. Pedestrian routes generally want to avoid driveways (private). The default driveway factor is 2.0. |
| step_penalty | A penalty in seconds added to each transition onto a path with [steps or stairs](http://wiki.openstreetmap.org/wiki/Tag:highway%3Dsteps). Higher values apply larger cost penalties to avoid paths that contain flights of steps. |

#### Other request options

| Options | Description |
| ------------------ | ----------- |
| units | Distance units. Allowable unit types are miles (or mi) and kilometers (or km). If no unit type is specified, the units default to kilometers. |
| language | The language of the narration instructions. If no language is specified, United States-based English (en_US) is used. Currently supported languages: en_US. |
|outformat | Output format. Allowable output formats are .json and .pbf (protocol buffer). If no `outformat` is specified, .json is returned. |

### JSON output

The route results are returned as a trip. This is a JSON object that contains details about the trip, including locations, a summary with basic information about the entire trip, and a list of legs. Location information is returned in the same form as it is entered with additional fields to indicate the side of the street.

| Item | Description |
| ---- | ----------- |
| units | The specified units of length are returned, either kilometers or miles. |
| sos | Side of street. Possible values are: `right`, `left`, or `ind` (indeterminant). |
| time | Estimated elapsed time to complete the trip. |
| length | Length (distance) traveled for the entire trip. Units are either miles or kilometers based on the input units specified. |

#### Legs and maneuvers of a trip

A trip may include multiple legs. For `n` number of `break` locations, there are `n-1` legs. `Through` locations do not create separate legs.

Each leg of the trip includes a summary, which is comprised of the same information as a trip summary but applied to the single leg of the trip. It also includes a `shape`, which is an [encoded polyline](https://developers.google.com/maps/documentation/utilities/polylinealgorithm) of the route path, and a list of `maneuvers` as a JSON array.

These maneuvers contain the following items.

| Maneuver items | Description |
| --------- | ---------- |
| type | Type of maneuver. See below for a list. |
| instruction | Written maneuver instruction. Describes the maneuver, such as "Turn right onto Main Street". |
| street_names | List of street names. |
| time | Estimated time along the maneuver in seconds. |
| length | Maneuver length in the units specified. |
| begin_shape_index | Index into the list of shape points for the start of the maneuver. |
| end_shape_index | Index into the list of shape points for the end of the maneuver. |
| toll | True if the maneuver has any toll, or portions of the maneuver are subject to a toll. |
| rough | True if the maneuver is unpaved or rough pavement or has any portions that have rough pavement. |
| gate | True if a gate is encountered on this maneuver. |
| ferry | True if a ferry is encountered on this maneuver. |

The following are the available types of maneuvers:

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

In the future, look for additional maneuver information to enhance navigation applications, including verbal instructions and landmark usage.

#### OSRM Compatibility Mode

Note that OSRM compatibility mode uses:
valhalla.mapzen.com/viaroute?
