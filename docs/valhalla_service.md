
## Valhalla Service Level Interface Description

**NOTE: This document is IN PROGRESS and documents a service which is NOT YET PUBLICLY AVAILABLE. STAY TUNED!**

Welcome to Valhalla open source routing. By now you have perhaps seen our demo page and maybe even checked out our open source software at https://github.com/valhalla. If you are here you are likely interested in accessing the Valhalla routing service at Mapzen to integrate routing and navigation into a Web or mobile application. This page documents the inputs and ouptuts to our service.

Your first step is to get a developer key from Mapzen. This does great things for you! Baldur/Mike please elaborate and provide instructions!

Valhalla will accept json input for routes:

valhalla.mapzen.com/route?json=

### Basic Parts of a Route Request

The route service request supports the following inputs: location information, name and options for the costing model name, and output options. The form of each is JSON.

#### Locations

Valhalla can be considered a **Bring Your Own Search** service. Valhalla does not search for locations given a name or address and does not do any geocoding or reverse geocoding. External services like Pelias or Nominatum must be used to find places and geocode addresses. A location must include a latitude, longitude. This can be from a GPS or other locator, point and click on a map, a geocode service, etc. The Valhalla routing service will not perform any external service calls to generate a latitude,longitude (i.e., geocoding). The routing service will not perform any external service calls to fill in other location information given a latitude,longitude (i.e. reverse geocoding).

Locations are provided as an ordered list of two or more locations within a JSON array. Locations are visited in the route in the provided order. A maximum of **TBD** locations is supported. Each location includes the following information:

The location information shall consist of two or more `break` locations. Also, 0 to n `through` locations may be supplied to influence the route path.
* lat = Latitude of the location in degrees.
* lon = Longitude of the location in degrees.
* type = Type of location. There are two location types: `break` and `through`. Break forms a stop - the first and last locations must be type = break. Through locations form a location that the route path goes through - the path is not allowed to reverse direction at the through locations. Through locations are useful to force a route to go through locations. If no type is provided, the type is assumed to be a break.
* heading = (Optional) A preferred direction of travel (heading) for the start from the location. This can be useful for mobile routing where a vehicle is traveling in a specific direction along a road and the route should start out in that direction. heading is indicated in degrees from north in a clockwise direction. North is 0°, east is 90°, south is 180°, and west is 270°.
* street = (Optional) Street name. The street name may be used to assist finding the correct routing location at the specified latitude,longitude.

The following, optional location information may be provided but does not impact routing. This information is simply carried through the request and returned as a convenience.
* name = Location name (e.g. Roburrito). May be used in the guidance/textual directions (for example: "You have arrived at Roburrito")
* city = City.
* state = State.
* postal_code = Postal Code.
* country = Country.
* phone = Phone.
* url = URL for the place/location.

FUTURE: look for additional location options and information related to time at each location. This will allow routes to specify a start time or an arrive by time at each location.

#### Costing Model

Valhalla uses dynamic, run-time costing to form the route path. The route request must include the name of the costing model and can include optional parameters accepted by the costing mode.

Costing models currently supported include:

* costing = auto. Standard costing for driving routes (using car, motorcycle, truck, etc.) that obeys automobile driving rules (access, turn restrictions, etc.) that provides a short time path (not guaranteed to be shortest time) that also uses intersection costing to help minimize turns and maneuvers or road name changes. Routes also tend to favor highways (higher classification roads: motorways, trunk).
* costing = auto_shorter. Alternate costing for driving that is intended to provide a short 
*  path (though not guaranteed to be shortest distance) that obeys driving rules (access, turn restr)
* costing = pedestrian. Standard walking route that does not allow roads with no pedestrian access. In general, pedestrian routes are shortest distance with the following exceptions: walkways/foot-paths are slightly favored and steps/stairs and alleys are slightly avoided. At this time, pedestrian routes are not allowed for locations that are more than **TBD** kilometers apart due to performance limitations. 

##### Costing Model Options 

Costing methods can have several options that can be adjusted to modify costing (used for finding the route path) as well as for estmating time along the path. Options for each costing model are specified under costing_options.type (e.g. costing_options.auto).

The following terms are used in these options:

* Cost = Cost options are fixed costs (seconds) that are added to both the path cost and the estimated time. Examples of costs are gate_costs and toll_booth_costs where a fixed amount of time is added. Costs are not generally used to influence the route path - use `penalties` instead.
* Penalty = Penalty options are fixed costs (seconds) that are only added to the path cost. These add extra cost in a way that can influence the route path detemrination but do not add to the estimated time along the path. Examples are toll_booth_penalty which can be added to create route paths that tend to avoid toll booths.
* Factor - Factor options are used to multiply the cost along an edge (road section) in a way that influences the path. Factor options do not impact estimated time along the path. Factors of 1.0 do not influence cost. Factors less than 1.0 are used to favor paths with the favored attribute. Factors greater than 1.0 are used to avoid paths with the avoided attribute. Factors must be in the range 0.25 to 100000.0. Note that avoidance factors are more effective than favor factors at influencing a path. The effectiveness of a factor also depends on the length of road that has the attribution being impacted: long roads lead to more impact n the costing than very short roads. For this reason, penalty options tend to be better at influencing paths.

##### Auto/Vehicle Costing Options

The auto and auto_shorter costing methods support the following options:
* maneuver_penalty = A penalty in seconds that is applied when transitioning between roads that do not have consistent naming (no road names in common). This penalty can be used to create simpler routes that tend to have less maneuvers or guidance instructions. The default maneuver penalty is 5 seconds.
* gate_cost = A cost in seconds that is applied when a gate is encountered. This cost is added to the estimated time / elapsed time. The default gate cost is 30 seconds.
* toll_booth_cost = A cost that is applied when a toll booth is encountered. This cost is added to the estimated time / elapsed time. The default cost is 15 seconds. 
* toll_booth_penalty = A penalty that is applied to the cost when a toll booth is encountered. This penalty can be used to create paths that avoid tolls. The default toll booth penalty is 0.
* country_crossing_cost = A cost that is applied when a country crossing is encountered. This cost is added to the estimated time / elapsed time. The default cost is 600 seconds.
* country_crossing_penalty = A penalty that is applied to the cost when a country crossing is encountered. This penalty can be used to create paths that avoid country crossings. The default penalty is 0.

#####Pedestrian Costing Options

The following options are supported for pedestrian routes (using the standard pedestrian costing model):
* walking_speed = Walking speed in the units specified within the units option. Defaults to 5.1 km/hr (3.1 miles/hour).
* walkway_factor = A factor that modifies the cost when footpaths/sidewalks/walkways (roads or paths that do not allow vehicles) are encountered. Pedestrian routes generally want to favr using walkways. The default walkway_factor is 0.9, which slightly favors walkways.
* alley_factor = A factor that modifies (multiplies) the cost when alleys are encountered. Pedestrian routes generally want to avoid alleys. The default alley_factor is 2.0.
* driveway_factor = A factor that modifies (mulitplies) the cost to try when driveways are encountered. Pedestrian routes generally want to avoid driveways (private). The default driveway factor is 2.0.
* step_penalty = A penalty in seconds to add to each transition onto a path marked as having steps/stairs. Higher values apply larger cost penalties to avoid paths that contain steps/stairs.

**Bicycle costing will soon be available.**

#### Directions Options

* units = Distance units. Allowable unit types are miles (or mi) and kilometers (or km). If no unit type is specified, kilometers is selected.
* language = The langauge the instructions will use. If no language is specified, United States based English (en_US) will be used. The current list of supported languages: en_US.

#### Output Options

* outformat = Output Format. Allowable output formats are json and pbf (protocol buffer). If no outformat is specified, JSON is selected.
* TODO - add example that shows a simple request and response.

### JSON Output

The selected units of length are returned:

units = "kilometers" (or "miles").

#### Trip

The route results are returned as a **trip**. This is a JSON object that contains details about the trip, including locations, a summary, and a list of **legs**.

##### Locations
Location information is returned in the same form as it is entered with additional fields:

* sos = Side of street. Possible values are: **right**, **left**, or **ind** (indeterminant).

##### Summary

The trip summary includes basic details about the entire trip including:

* time = Estimated elapsed time to complete the trip.
* length = Length (distance) traveled for the entire trip. Units are either miles or kilometers based on the input units specified.

##### Legs

A trip may include multiple legs. For n break locations there are n-1 legs. Through locations do not create a separate legs.

Each leg of the trip includes a summary (comprised of the same information as a trip summary but applied to the single leg of the trip). It also includes the following:

* shape = Encoded shape (using Google polyline encoding - ADD LINK) of the route path.
* maneuvers = A list (JSON array) of manuevers

###### Manuever

Each maneuver includes the following:

* type = Type (TBD - what are the possible types)
* instruction = Written maneuver instruction. Describes the maneuver (e.g., "Turn right onto Main Street").
* street_names = List of street names.
* time = Estimated time along the maneuver in seconds.
* length = Maneuver length in the units specified.
* begin_shape_index = Index into the list of shape points for the start of the maneuver.
* end_shape_index = Index into the list of shape points for the end of the maneuver.
* toll = True if the maneuver has any toll or portions of the maneuver are subject to a toll.
* rough = True if the maneuver is unpaved/rough pavement or has any portions that have rough pavement.
* gate = True if a gate is encountered on this maneuver.
* ferry = True if a ferry is encountered on this maneuver.

FUTURE: Look for additional maneuver information to enhance navigation applications - features like verbal instructions and landmark usage.

#### OSRM Compatibility Mode

Note that OSRM compatibility mode uses:
valhalla.mapzen.com/viaroute?

Example:



